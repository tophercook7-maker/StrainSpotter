import React, { useState, useEffect } from 'react';
import { View, StyleSheet, FlatList } from 'react-native';
import { Searchbar, Card, Text, Chip, ActivityIndicator } from 'react-native-paper';
import { API_BASE_URL, API_ENDPOINTS } from '../config/api';
import { theme, spacing } from '../config/theme';

export default function StrainBrowserScreen({ navigation }) {
  const [strains, setStrains] = useState([]);
  const [loading, setLoading] = useState(true);
  const [searchQuery, setSearchQuery] = useState('');

  useEffect(() => {
    fetchStrains();
  }, []);

  const fetchStrains = async () => {
    try {
      const response = await fetch(`${API_BASE_URL}${API_ENDPOINTS.getStrains}`);
      if (response.ok) {
        const data = await response.json();
        // Ensure data is an array
        setStrains(Array.isArray(data) ? data : []);
      }
    } catch (error) {
      console.error('Failed to fetch strains:', error);
      setStrains([]);
    } finally {
      setLoading(false);
    }
  };

  const filteredStrains = Array.isArray(strains)
    ? strains.filter(strain =>
        strain.name.toLowerCase().includes(searchQuery.toLowerCase())
      )
    : [];

  const renderStrain = ({ item }) => (
    <Card
      style={styles.card}
      onPress={() => navigation.navigate('StrainDetail', { strain: item })}
    >
      <Card.Content>
        <Text variant="titleMedium" style={styles.strainName}>
          {item.name}
        </Text>
        <Chip
          mode="outlined"
          style={[styles.typeChip, { borderColor: getTypeColor(item.type) }]}
          textStyle={{ color: getTypeColor(item.type) }}
        >
          {item.type}
        </Chip>
        <Text variant="bodySmall" style={styles.description} numberOfLines={2}>
          {item.description}
        </Text>
      </Card.Content>
    </Card>
  );

  const getTypeColor = (type) => {
    switch (type?.toLowerCase()) {
      case 'indica':
        return '#9C27B0';
      case 'sativa':
        return '#FF9800';
      case 'hybrid':
        return '#4CAF50';
      default:
        return theme.colors.primary;
    }
  };

  if (loading) {
    return (
      <View style={styles.loadingContainer}>
        <ActivityIndicator size="large" color={theme.colors.primary} />
      </View>
    );
  }

  return (
    <View style={styles.container}>
      <Searchbar
        placeholder="Search strains..."
        onChangeText={setSearchQuery}
        value={searchQuery}
        style={styles.searchbar}
      />
      <FlatList
        data={filteredStrains}
        renderItem={renderStrain}
        keyExtractor={(item) => item.id.toString()}
        contentContainerStyle={styles.list}
      />
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: theme.colors.background,
  },
  loadingContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    backgroundColor: theme.colors.background,
  },
  searchbar: {
    margin: spacing.md,
    backgroundColor: theme.colors.surface,
  },
  list: {
    padding: spacing.md,
  },
  card: {
    marginBottom: spacing.md,
    backgroundColor: theme.colors.surface,
  },
  strainName: {
    color: theme.colors.primary,
    fontWeight: 'bold',
    marginBottom: spacing.sm,
  },
  typeChip: {
    alignSelf: 'flex-start',
    marginBottom: spacing.sm,
  },
  description: {
    color: theme.colors.onSurface,
    opacity: 0.8,
  },
});

