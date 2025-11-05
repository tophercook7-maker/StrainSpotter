import React, { useState, useEffect, useRef } from 'react';
import { View, StyleSheet, Image, ScrollView, ImageBackground } from 'react-native';
import { Button, Text, Card, ActivityIndicator, Snackbar } from 'react-native-paper';
import { CameraView, useCameraPermissions } from 'expo-camera';
import * as ImagePicker from 'expo-image-picker';
import { supabase } from '../config/supabase';
import { API_BASE_URL, API_ENDPOINTS } from '../config/api';
import { theme, spacing } from '../config/theme';

export default function ScanScreen({ navigation }) {
  const [permission, requestPermission] = useCameraPermissions();
  const [cameraActive, setCameraActive] = useState(false);
  const [imageUri, setImageUri] = useState(null);
  const [scanning, setScanning] = useState(false);
  const [result, setResult] = useState(null);
  const [snackbarVisible, setSnackbarVisible] = useState(false);
  const [snackbarMessage, setSnackbarMessage] = useState('');
  const [flashMode, setFlashMode] = useState('off');
  const [zoom, setZoom] = useState(0);
  const cameraRef = useRef(null);

  const showMessage = (message) => {
    setSnackbarMessage(message);
    setSnackbarVisible(true);
  };

  const handleTakePhoto = async () => {
    if (!permission?.granted) {
      const { granted } = await requestPermission();
      if (!granted) {
        showMessage('Camera permission is required');
        return;
      }
    }
    setCameraActive(true);
  };

  const handleCapture = async () => {
    if (cameraRef.current) {
      const photo = await cameraRef.current.takePictureAsync({
        quality: 0.9,
        base64: true,
      });
      setImageUri(photo.uri);
      setCameraActive(false);
      await processScan(photo.uri, photo.base64);
    }
  };

  const handlePickImage = async () => {
    const result = await ImagePicker.launchImageLibraryAsync({
      mediaTypes: ImagePicker.MediaTypeOptions.Images,
      allowsEditing: true,
      aspect: [4, 3],
      quality: 0.9,
      base64: true,
    });

    if (!result.canceled) {
      setImageUri(result.assets[0].uri);
      await processScan(result.assets[0].uri, result.assets[0].base64);
    }
  };

  const processScan = async (uri, base64) => {
    setScanning(true);
    setResult(null);

    try {
      const { data: { session } } = await supabase.auth.getSession();
      if (!session) {
        showMessage('Please sign in to scan');
        return;
      }

      // Step 1: Create scan
      const createResponse = await fetch(`${API_BASE_URL}${API_ENDPOINTS.createScan}`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${session.access_token}`,
        },
        body: JSON.stringify({
          imageData: `data:image/jpeg;base64,${base64}`,
        }),
      });

      if (!createResponse.ok) {
        const error = await createResponse.json();
        throw new Error(error.message || 'Failed to create scan');
      }

      const { scanId } = await createResponse.json();

      // Step 2: Process scan
      const processResponse = await fetch(
        `${API_BASE_URL}${API_ENDPOINTS.processScan(scanId)}`,
        {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
          },
        }
      );

      if (processResponse.status === 402) {
        const error = await processResponse.json();
        showMessage(error.message || 'Insufficient credits');
        navigation.navigate('Credits');
        return;
      }

      if (!processResponse.ok) {
        throw new Error('Failed to process scan');
      }

      const processData = await processResponse.json();

      // Step 3: Match strain
      try {
        const matchResponse = await fetch(`${API_BASE_URL}${API_ENDPOINTS.visualMatch}`, {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
          },
          body: JSON.stringify({
            visionResult: processData.result,
          }),
        });

        if (matchResponse.ok) {
          const matchData = await matchResponse.json();
          setResult(matchData);
          showMessage('Scan complete!');
        } else {
          // Visual match failed, but scan was processed
          setResult({
            success: true,
            matches: [],
            message: 'Scan processed! Visual matching temporarily unavailable.'
          });
          showMessage('Scan processed successfully!');
        }
      } catch (matchError) {
        // Visual match error, but scan was still processed
        console.warn('Visual match error:', matchError);
        setResult({
          success: true,
          matches: [],
          message: 'Scan processed! Visual matching temporarily unavailable.'
        });
        showMessage('Scan processed successfully!');
      }
    } catch (error) {
      console.error('Scan error:', error);
      showMessage(error.message || 'Scan failed');
    } finally {
      setScanning(false);
    }
  };

  const handleReset = () => {
    setImageUri(null);
    setResult(null);
    setScanning(false);
  };

  const toggleFlash = () => {
    setFlashMode(current => {
      if (current === 'off') return 'on';
      if (current === 'on') return 'auto';
      return 'off';
    });
  };

  const getFlashIcon = () => {
    if (flashMode === 'on') return 'flash';
    if (flashMode === 'auto') return 'flash-auto';
    return 'flash-off';
  };

  if (cameraActive) {
    return (
      <View style={styles.cameraContainer}>
        <CameraView
          ref={cameraRef}
          style={styles.camera}
          facing="back"
          flash={flashMode}
          zoom={zoom}
        >
          <View style={styles.cameraOverlay}>
            {/* Top Controls */}
            <View style={styles.cameraTopControls}>
              <Button
                mode="contained-tonal"
                onPress={toggleFlash}
                icon={getFlashIcon()}
                style={styles.flashButton}
              >
                {flashMode.toUpperCase()}
              </Button>
            </View>

            {/* Camera Frame */}
            <View style={styles.cameraFrame} />

            {/* Zoom Slider */}
            <View style={styles.zoomContainer}>
              <Text style={styles.zoomText}>Zoom: {Math.round(zoom * 100)}%</Text>
              <View style={styles.zoomSlider}>
                <Button
                  mode="text"
                  onPress={() => setZoom(Math.max(0, zoom - 0.1))}
                  textColor="#fff"
                >
                  -
                </Button>
                <View style={styles.zoomBar}>
                  <View style={[styles.zoomFill, { width: `${zoom * 100}%` }]} />
                </View>
                <Button
                  mode="text"
                  onPress={() => setZoom(Math.min(1, zoom + 0.1))}
                  textColor="#fff"
                >
                  +
                </Button>
              </View>
            </View>

            {/* Bottom Controls */}
            <View style={styles.cameraControls}>
              <Button
                mode="contained"
                onPress={handleCapture}
                style={styles.captureButton}
                icon="camera"
              >
                Capture
              </Button>
              <Button
                mode="outlined"
                onPress={() => setCameraActive(false)}
                style={styles.cancelButton}
              >
                Cancel
              </Button>
            </View>
          </View>
        </CameraView>
      </View>
    );
  }

  return (
    <ImageBackground
      source={require('../../assets/strainspotter-bg.jpg')}
      style={styles.backgroundImage}
      resizeMode="cover"
    >
      <ScrollView style={styles.container} contentContainerStyle={styles.scrollContent}>
        <Text variant="headlineSmall" style={styles.title}>
          AI Strain Scanner
        </Text>
        <Text variant="bodyMedium" style={styles.subtitle}>
          Take a photo or upload an image to identify the strain
        </Text>

      {!imageUri ? (
        <View style={styles.actionContainer}>
          <Button
            mode="contained"
            onPress={handleTakePhoto}
            style={styles.button}
            contentStyle={styles.buttonContent}
            icon="camera"
          >
            Take Photo
          </Button>
          <Button
            mode="outlined"
            onPress={handlePickImage}
            style={styles.button}
            contentStyle={styles.buttonContent}
            icon="image"
          >
            Choose from Gallery
          </Button>
        </View>
      ) : (
        <View>
          <Image source={{ uri: imageUri }} style={styles.image} resizeMode="contain" />
          
          {scanning && (
            <View style={styles.loadingContainer}>
              <ActivityIndicator size="large" color={theme.colors.primary} />
              <Text variant="bodyLarge" style={styles.loadingText}>
                Analyzing strain...
              </Text>
            </View>
          )}

          {result && (
            <Card style={styles.resultCard}>
              <Card.Content>
                <Text variant="headlineSmall" style={styles.resultTitle}>
                  {result.topMatch?.name || 'Unknown Strain'}
                </Text>
                <Text variant="bodyMedium" style={styles.resultConfidence}>
                  Confidence: {Math.round((result.topMatch?.score || 0) * 100)}%
                </Text>
                <Text variant="bodyMedium" style={styles.resultType}>
                  Type: {result.topMatch?.type || 'Unknown'}
                </Text>
                {result.topMatch?.description && (
                  <Text variant="bodySmall" style={styles.resultDescription}>
                    {result.topMatch.description}
                  </Text>
                )}
              </Card.Content>
              <Card.Actions>
                <Button onPress={() => navigation.navigate('StrainDetail', { strain: result.topMatch })}>
                  View Details
                </Button>
              </Card.Actions>
            </Card>
          )}

          <Button
            mode="outlined"
            onPress={handleReset}
            style={styles.resetButton}
            icon="refresh"
          >
            Scan Another
          </Button>
        </View>
      )}

        <Snackbar
          visible={snackbarVisible}
          onDismiss={() => setSnackbarVisible(false)}
          duration={3000}
        >
          {snackbarMessage}
        </Snackbar>
      </ScrollView>
    </ImageBackground>
  );
}

const styles = StyleSheet.create({
  backgroundImage: {
    flex: 1,
    width: '100%',
    height: '100%',
  },
  container: {
    flex: 1,
    backgroundColor: 'transparent',
  },
  scrollContent: {
    padding: spacing.lg,
  },
  title: {
    color: theme.colors.primary,
    fontWeight: 'bold',
    marginBottom: spacing.sm,
    textAlign: 'center',
  },
  subtitle: {
    color: theme.colors.onSurface,
    opacity: 0.8,
    marginBottom: spacing.xl,
    textAlign: 'center',
  },
  actionContainer: {
    marginTop: spacing.xl,
  },
  button: {
    marginBottom: spacing.md,
  },
  buttonContent: {
    paddingVertical: spacing.sm,
  },
  cameraContainer: {
    flex: 1,
  },
  camera: {
    flex: 1,
  },
  cameraOverlay: {
    flex: 1,
    backgroundColor: 'transparent',
    justifyContent: 'space-between',
    padding: spacing.lg,
  },
  cameraTopControls: {
    flexDirection: 'row',
    justifyContent: 'flex-end',
    paddingTop: spacing.xl,
  },
  flashButton: {
    backgroundColor: 'rgba(0, 0, 0, 0.5)',
  },
  cameraFrame: {
    flex: 1,
    borderWidth: 2,
    borderColor: theme.colors.primary,
    borderRadius: 12,
    margin: spacing.xl,
  },
  zoomContainer: {
    paddingHorizontal: spacing.lg,
    marginBottom: spacing.md,
  },
  zoomText: {
    color: '#fff',
    textAlign: 'center',
    marginBottom: spacing.sm,
    fontSize: 12,
    fontWeight: 'bold',
    textShadowColor: 'rgba(0, 0, 0, 0.75)',
    textShadowOffset: { width: -1, height: 1 },
    textShadowRadius: 10,
  },
  zoomSlider: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  zoomBar: {
    flex: 1,
    height: 4,
    backgroundColor: 'rgba(255, 255, 255, 0.3)',
    borderRadius: 2,
    marginHorizontal: spacing.sm,
  },
  zoomFill: {
    height: '100%',
    backgroundColor: theme.colors.primary,
    borderRadius: 2,
  },
  cameraControls: {
    paddingBottom: spacing.xl,
  },
  captureButton: {
    marginBottom: spacing.md,
  },
  cancelButton: {
    borderColor: theme.colors.error,
  },
  image: {
    width: '100%',
    height: 300,
    borderRadius: 12,
    marginBottom: spacing.lg,
  },
  loadingContainer: {
    alignItems: 'center',
    marginVertical: spacing.xl,
  },
  loadingText: {
    color: theme.colors.primary,
    marginTop: spacing.md,
  },
  resultCard: {
    backgroundColor: theme.colors.surface,
    marginBottom: spacing.lg,
  },
  resultTitle: {
    color: theme.colors.primary,
    fontWeight: 'bold',
    marginBottom: spacing.sm,
  },
  resultConfidence: {
    color: theme.colors.secondary,
    marginBottom: spacing.xs,
  },
  resultType: {
    color: theme.colors.onSurface,
    marginBottom: spacing.md,
  },
  resultDescription: {
    color: theme.colors.onSurface,
    opacity: 0.8,
  },
  resetButton: {
    borderColor: theme.colors.primary,
  },
});

