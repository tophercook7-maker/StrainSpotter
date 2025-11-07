import { useState, useRef, useEffect } from 'react';
import {
  Box,
  Button,
  Container,
  Typography,
  Card,
  CardContent,
  CircularProgress,
  Alert,
  AppBar,
  Toolbar,
  IconButton,
  Dialog,
  DialogTitle,
  DialogContent,
  Chip,
  Stack,
  Divider,
  Grid,
  TextField,
  Rating
} from '@mui/material';
import { CameraAlt, History, Close, CheckCircle } from '@mui/icons-material';
import { API_BASE, FUNCTIONS_BASE } from '../config';
import CannabisLeafIcon from './CannabisLeafIcon';
import { supabase, SUPABASE_ANON_KEY } from '../supabaseClient';
import { useAuth } from '../hooks/useAuth';

function Scanner({ onViewHistory, onBack }) {
  const [showGuide, setShowGuide] = useState(true);
  const [images, setImages] = useState([]); // Array<File>
  const [imagePreviews, setImagePreviews] = useState([]); // Array<objectURL>
  const [loading, setLoading] = useState(false);
  const [loadingStatus, setLoadingStatus] = useState(''); // Progress feedback for user
  const [error, setError] = useState(null);
  const [matchedStrain, setMatchedStrain] = useState(null);
  const [suggestedStrains, setSuggestedStrains] = useState([]);
  const [detectedTextPreview, setDetectedTextPreview] = useState('');
  const [showResult, setShowResult] = useState(false);
  const [showTips, setShowTips] = useState(false);
  const [lastScanId, setLastScanId] = useState(null);
  const [reviews, setReviews] = useState([]);
  const [avgRating, setAvgRating] = useState(null);
  const [myRating, setMyRating] = useState(0);
  const [myComment, setMyComment] = useState('');
  const [submittingReview, setSubmittingReview] = useState(false);
  const [vendors, setVendors] = useState([]);
  const [dispensaries, setDispensaries] = useState([]);
  const [loadingVendors, setLoadingVendors] = useState(false);
  const [loadingDispensaries, setLoadingDispensaries] = useState(false);
  const [userLocation, setUserLocation] = useState(null);
  const fileInputRef = useRef(null);

  const { user: authUser } = useAuth();
  const currentUserId = authUser?.id || null;

  // Session helper used for anon uploads when no auth session exists
  const getSessionId = () => {
    let sid = localStorage.getItem('ss-session-id');
    if (!sid) {
      sid = `session-${Date.now()}-${Math.random().toString(36).substr(2, 9)}`;
      localStorage.setItem('ss-session-id', sid);
    }
    return sid;
  };

  // Get user's location for dispensary search
  useEffect(() => {
    if (navigator.geolocation) {
      navigator.geolocation.getCurrentPosition(
        (position) => {
          setUserLocation({
            lat: position.coords.latitude,
            lng: position.coords.longitude
          });
        },
        (error) => {
          console.log('[Scanner] Geolocation not available:', error.message);
        }
      );
    }
  }, []);

  // Fetch vendors for a strain
  const fetchVendorsForStrain = async (strainName) => {
    setLoadingVendors(true);
    try {
      const response = await fetch(`${API_BASE}/api/seeds-live?strain=${encodeURIComponent(strainName)}&limit=20`);
      const data = await response.json();

      // Transform results to match expected format
      const transformedVendors = (data.results || []).map(vendor => ({
        name: vendor.name,
        website: vendor.website,
        country: vendor.country,
        rating: vendor.rating || 0,
        verified: vendor.verified || false,
        price: vendor.price || 'N/A',
        seed_count: vendor.seed_count || 10,
        in_stock: vendor.in_stock !== false
      }));

      setVendors(transformedVendors);
    } catch (error) {
      console.error('[Scanner] Error fetching vendors:', error);
      setVendors([]);
    } finally {
      setLoadingVendors(false);
    }
  };

  // Fetch dispensaries near user
  const fetchDispensariesForStrain = async () => {
    if (!userLocation) {
      setDispensaries([]);
      return;
    }

    setLoadingDispensaries(true);
    try {
      const response = await fetch(
        `${API_BASE}/api/dispensaries-live?lat=${userLocation.lat}&lng=${userLocation.lng}&radius=100&limit=20`
      );
      const data = await response.json();

      setDispensaries(data.results || []);
    } catch (error) {
      console.error('[Scanner] Error fetching dispensaries:', error);
      setDispensaries([]);
    } finally {
      setLoadingDispensaries(false);
    }
  };

  const handleImageCapture = async (event) => {
    console.log('[Scanner] handleImageCapture called');
    const files = Array.from(event.target.files || []);
    console.log('[Scanner] Files selected:', files.length);
    if (!files.length) return;

    try {
      const nextImages = [...images, ...files].slice(0, 3);
      console.log('[Scanner] Processing images:', nextImages.length);

      // Convert files to data URLs instead of blob URLs for better iOS compatibility
      const newPreviews = await Promise.all(
        files.map((file, idx) => new Promise((resolve, reject) => {
          console.log(`[Scanner] Reading file ${idx + 1}:`, file.name, file.type, file.size);
          const reader = new FileReader();
          reader.onload = (e) => {
            console.log(`[Scanner] File ${idx + 1} loaded successfully`);
            resolve(e.target.result);
          };
          reader.onerror = (e) => {
            console.error(`[Scanner] Failed to read file ${idx + 1}:`, e);
            reject(new Error(`Failed to read image file ${idx + 1}`));
          };
          reader.readAsDataURL(file);
        }))
      );

      const nextPreviews = [...imagePreviews, ...newPreviews].slice(0, 3);
      console.log('[Scanner] All files converted to data URLs');

      setImages(nextImages);
      setImagePreviews(nextPreviews);
      setError(null);
      console.log('[Scanner] Image capture complete');
    } catch (err) {
      console.error('[Scanner] Error loading image:', err);
      console.error('[Scanner] Error stack:', err.stack);
      setError(`Failed to load image: ${err.message}. Please try again with a different photo.`);
      alert(`Image Load Error:\n${err.message}`);
    }
  };

  // Function to match detected text with strain names using visual features
  const findMatchingStrain = async (visionResult) => {
    if (!visionResult) return null;

    try {
      const matchResponse = await fetch(`${API_BASE}/api/visual-match`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ visionResult })
      });

      if (!matchResponse.ok) {
        return null;
      }

      const matchData = await matchResponse.json();
      if (matchData.matches && matchData.matches.length > 0) {
        const topMatch = matchData.matches[0];
        return {
          ...topMatch.strain,
          matchScore: topMatch.score,
          matchConfidence: topMatch.confidence,
          matchReasoning: topMatch.reasoning,
          allMatches: matchData.matches.slice(0, 5)
        };
      }
      return null;
    } catch (err) {
      console.error('[Scanner] Error in visual matching:', err);
      return null;
    }
  };

  const MAX_UPLOAD_BYTES = 3.3 * 1024 * 1024; // legacy fallback limit for JSON uploads
  const canUseEdgeUploads = typeof FUNCTIONS_BASE === 'string' && FUNCTIONS_BASE.length > 0 && FUNCTIONS_BASE !== `${API_BASE}/api`;

  const uploadViaEdgeFunction = async ({ base64, filename, contentType }) => {
    if (!canUseEdgeUploads || !base64) return null;
    try {
      const headers = { 'Content-Type': 'application/json' };
      if (SUPABASE_ANON_KEY) {
        headers.Authorization = `Bearer ${SUPABASE_ANON_KEY}`;
        headers.apikey = SUPABASE_ANON_KEY;
      }
      const resp = await fetch(`${FUNCTIONS_BASE}/uploads`, {
        method: 'POST',
        headers,
        body: JSON.stringify({ filename, base64, contentType, user_id: currentUserId })
      });
      if (!resp.ok) {
        const text = await resp.text().catch(() => '');
        console.warn('[Scanner] Edge upload failed:', resp.status, text);
        return null;
      }
      const data = await resp.json();
      if (data?.id) {
        return data;
      }
    } catch (err) {
      console.warn('[Scanner] Edge upload exception:', err);
    }
    return null;
  };

  const compressImageToBlob = async (file, targetBytes = Infinity, initialMaxDim = 2048, initialQuality = 0.92) => {
    let workingFile = file;
    let maxDim = initialMaxDim;
    let quality = initialQuality;
    let lastBlob = null;

    for (let attempt = 0; attempt < 6; attempt++) {
      lastBlob = await new Promise((resolve, reject) => {
        const img = new Image();
        const url = URL.createObjectURL(workingFile);
        img.onload = () => {
          const canvas = document.createElement('canvas');
          let { width, height } = img;
          if (width > height) {
            if (width > maxDim) {
              height = Math.round((height * maxDim) / width);
              width = maxDim;
            }
          } else if (height > maxDim) {
            width = Math.round((width * maxDim) / height);
            height = maxDim;
          }
          canvas.width = width;
          canvas.height = height;
          const ctx = canvas.getContext('2d');
          ctx.drawImage(img, 0, 0, width, height);
          canvas.toBlob(
            (blob) => {
              URL.revokeObjectURL(url);
              if (blob) {
                resolve(blob);
              } else {
                reject(new Error('Failed to compress image'));
              }
            },
            'image/jpeg',
            quality
          );
        };
        img.onerror = (e) => {
          URL.revokeObjectURL(url);
          reject(e);
        };
        img.src = url;
      });

      const sizeMb = (lastBlob.size / (1024 * 1024)).toFixed(2);
      console.log(
        `[Scanner] Compression attempt ${attempt + 1}: ${sizeMb} MB @ q=${quality.toFixed(2)} maxDim=${maxDim}`
      );

      if (lastBlob.size <= targetBytes) {
        break;
      }

      if (quality > 0.5) {
        quality = Math.max(0.5, quality - 0.1);
      } else {
        maxDim = Math.max(720, Math.floor(maxDim * 0.8));
      }

      workingFile = new File([lastBlob], workingFile.name || file.name || 'upload.jpg', {
        type: 'image/jpeg'
      });
    }

    return lastBlob ?? file;
  };

  const blobToBase64 = async (blob) =>
    new Promise((resolve, reject) => {
      const reader = new FileReader();
      reader.onload = () => resolve(String(reader.result).split(',')[1]);
      reader.onerror = reject;
      reader.readAsDataURL(blob);
    });

  const parseErrorResponse = async (res) => {
    try {
      const data = await res.json();
      const base = data?.error || `HTTP ${res.status}`;
      const hint = data?.hint ? ` Hint: ${data.hint}` : '';
      return `${base}${hint}`;
    } catch {
      try {
        const text = await res.text();
        return text || `HTTP ${res.status}`;
      } catch {
        return `HTTP ${res.status}`;
      }
    }
  };

  const handleScan = async () => {
    if (images.length === 0) {
      setError('Please select an image first');
      return;
    }

    if (!currentUserId) {
      setError('Sign in to use AI scans. Join or log in to continue.');
      setShowResult(false);
      return;
    }

    setLoading(true);
    setLoadingStatus('Preparing images...');
    setError(null);

    try {
      // Helper to process a single image (upload + Vision)
      const processOne = async (file, index) => {
        setLoadingStatus(`Preparing image ${index + 1} of ${images.length}...`);
        const compressedBlob = await compressImageToBlob(file, 12 * 1024 * 1024);
        const sessionId = currentUserId || getSessionId();
        const safeFileName = String(file.name || 'upload.jpg');

        let useLegacyUploader = false;
        let signedData = null;

        if (supabase && typeof supabase.storage?.from === 'function') {
          const preflightUrl = `${API_BASE}/api/uploads/signed-url`;
          console.log('[Scanner] Requesting signed URL from:', preflightUrl);
          const preflight = await fetch(preflightUrl, {
            method: 'POST',
            headers: { 'Content-Type': 'application/json', 'x-session-id': sessionId },
            credentials: 'include',
            body: JSON.stringify({
              filename: safeFileName,
              contentType: compressedBlob.type || 'image/jpeg',
              user_id: currentUserId || null
            })
          });

          console.log('[Scanner] Preflight response:', preflight.status, preflight.statusText);
          if (preflight.status === 501) {
            useLegacyUploader = true;
          } else if (!preflight.ok) {
            const msg = await parseErrorResponse(preflight);
            throw new Error(`Upload prep failed: ${msg}`);
          } else {
            signedData = await preflight.json();
            if (!signedData?.bucket || !signedData?.path || !signedData?.token) {
              console.warn('[Scanner] Signed upload data incomplete, falling back to legacy uploader');
              useLegacyUploader = true;
            }
          }
        } else {
          useLegacyUploader = true;
        }

        let scanId = null;

        if (!useLegacyUploader && signedData) {
          setLoadingStatus(`Uploading image ${index + 1} of ${images.length}...`);
          const uploadResult = await supabase.storage
            .from(signedData.bucket)
            .uploadToSignedUrl(signedData.path, signedData.token, compressedBlob, {
              contentType: compressedBlob.type || 'image/jpeg'
            });
          if (uploadResult.error) {
            console.error('[Scanner] Signed upload failed:', uploadResult.error);
            throw new Error(`Cloud upload failed: ${uploadResult.error.message}`);
          }

          const finalizeResponse = await fetch(`${API_BASE}/api/uploads/complete`, {
            method: 'POST',
            headers: { 'Content-Type': 'application/json', 'x-session-id': sessionId },
            credentials: 'include',
            body: JSON.stringify({
              path: signedData.path,
              bucket: signedData.bucket,
              user_id: currentUserId || null
            })
          });
          if (!finalizeResponse.ok) {
            const msg = await parseErrorResponse(finalizeResponse);
            throw new Error(`Upload finalize failed: ${msg}`);
          }
          const finalizeData = await finalizeResponse.json();
          scanId = finalizeData.id;
          console.log('[Scanner] Signed upload complete, scan ID:', scanId);
        } else {
          let legacyBlob = compressedBlob;
          let approxBytes = legacyBlob.size * (4 / 3); // rough base64 expansion estimate
          let tightenAttempts = 0;

          while (approxBytes > MAX_UPLOAD_BYTES && tightenAttempts < 6) {
            legacyBlob = await compressImageToBlob(
              new File([legacyBlob], safeFileName, { type: 'image/jpeg' }),
              MAX_UPLOAD_BYTES * 0.55,
              Math.max(640, Math.floor(1600 / (tightenAttempts + 1))),
              Math.max(0.45, 0.85 - tightenAttempts * 0.1)
            );
            approxBytes = legacyBlob.size * (4 / 3);
            tightenAttempts += 1;
          }

          if (approxBytes > MAX_UPLOAD_BYTES) {
            throw new Error(
              'Image is still too large after automatic compression. Please retake the photo a little closer so we can process it.'
            );
          }

          const legacyBase64 = await blobToBase64(legacyBlob);

          let edgeResult = null;
          if (canUseEdgeUploads) {
            setLoadingStatus(`Uploading image ${index + 1} of ${images.length} to Supabase...`);
            edgeResult = await uploadViaEdgeFunction({
              base64: legacyBase64,
              filename: safeFileName,
              contentType: legacyBlob.type || file.type || 'image/jpeg'
            });
          }

          if (edgeResult?.id) {
            scanId = edgeResult.id;
            console.log('[Scanner] Uploaded via Supabase Edge function, scan ID:', scanId);
          } else {
            setLoadingStatus(`Uploading image ${index + 1} of ${images.length}...`);
            const uploadResponse = await fetch(`${API_BASE}/api/uploads`, {
              method: 'POST',
              headers: { 'Content-Type': 'application/json', 'x-session-id': sessionId },
              credentials: 'include',
              body: JSON.stringify({
                filename: safeFileName,
                contentType: legacyBlob.type || file.type || 'image/jpeg',
                base64: legacyBase64,
                user_id: currentUserId || null
              })
            });
            if (!uploadResponse.ok) {
              const msg = await parseErrorResponse(uploadResponse);
              console.error('[Scanner] Upload failed:', msg);
              throw new Error(`Upload failed: ${msg}`);
            }
            const uploadData = await uploadResponse.json();
            scanId = uploadData.id;
            console.log('[Scanner] Uploaded via legacy path (compressed), scan ID:', scanId);
          }
        }

        setLoadingStatus(`Analyzing image ${index + 1} with AI (this may take 30-60 seconds)...`);
        
        // Try Express backend processing (Edge Functions not deployed yet)
        try {
          console.log('[Scanner] Processing via:', `${API_BASE}/api/scans/${scanId}/process`);
          
          // Add timeout to prevent hanging
          const controller = new AbortController();
          const timeoutId = setTimeout(() => controller.abort(), 60000); // 60 second timeout
          
          const processResponse = await fetch(`${API_BASE}/api/scans/${scanId}/process`, { 
            method: 'POST',
            headers: { 'Content-Type': 'application/json', 'x-session-id': getSessionId() },
            credentials: 'include',
            signal: controller.signal
          });
          
          clearTimeout(timeoutId);
          
          if (processResponse.ok) {
            const processData = await processResponse.json();
            console.log('[Scanner] Process succeeded:', processData);
            const payload = processData?.result ?? processData ?? {};
            if (payload && !payload.id) {
              payload.id = scanId;
            }
            return payload;
          } else {
            const errText = await processResponse.text();
            console.error('[Scanner] Process failed:', errText);
            throw new Error(`Processing failed: ${errText || processResponse.status}`);
          }
        } catch (e) {
          if (e.name === 'AbortError') {
            console.error('[Scanner] Process timeout - AI analysis took too long');
            throw new Error('AI analysis timed out after 60 seconds. Please try again with a clearer image or check your connection.');
          }
          console.error('[Scanner] Process error:', e);
          throw new Error(`AI processing failed: ${e.message}`);
        }
      };

      // Sequentially process up to 3 images to avoid rate spikes
      const results = [];
      let lastId = null;
      for (let i = 0; i < images.length; i++) {
        const r = await processOne(images[i], i);
        if (r?.id) lastId = r.id;
        results.push(r?.result || r);
      }
      if (lastId) setLastScanId(lastId);

      setLoadingStatus('Matching results to strain database...');

      // Text preview from first result (UX)
      const firstText = results[0]?.textAnnotations?.[0]?.description || '';
      setDetectedTextPreview(firstText.substring(0, 200));

      // Merge Vision results across photos
      const merged = mergeVisionResults(results);

      // Step 3: Visual matching with merged Vision results
      const matchResult = await findMatchingStrain(merged);

      if (matchResult) {
        setMatchedStrain(matchResult);
        // Set suggestions from alternative matches
        if (matchResult.allMatches && matchResult.allMatches.length > 1) {
          setSuggestedStrains(matchResult.allMatches.slice(1).map(m => m.strain));
        } else {
          setSuggestedStrains([]);
        }

        // Fetch vendors and dispensaries for the matched strain
        if (matchResult.name) {
          fetchVendorsForStrain(matchResult.name);
          fetchDispensariesForStrain();
        }

        // Save the selected match to the scan record
        if (lastId && matchResult.slug) {
          try {
            console.log('[Scanner] Saving match:', lastId, matchResult.slug);
            const saveResponse = await fetch(`${API_BASE}/api/scans/${lastId}/save-match`, {
              method: 'POST',
              headers: { 'Content-Type': 'application/json', 'x-session-id': getSessionId() },
              credentials: 'include',
              body: JSON.stringify({ matched_strain_slug: matchResult.slug, user_id: currentUserId || null })
            });
            if (saveResponse.ok) {
              console.log('[Scanner] Match saved successfully');
            } else {
              console.error('[Scanner] Failed to save match:', await saveResponse.text());
            }
          } catch (e) {
            console.error('[Scanner] Failed to save match:', e);
          }
        } else {
          console.warn('[Scanner] Cannot save match - missing lastId or slug:', { lastId, slug: matchResult.slug });
        }
      } else {
        // Fallback: get top search results as suggestions
        const detectedText = merged?.textAnnotations?.[0]?.description || firstText || '';
        const cleanText = detectedText.replace(/\n/g, ' ').replace(/[^\w\s'-]/g, ' ').trim();
        const words = cleanText.split(/\s+/).filter(w => w.length > 3);
        const topWord = words[0] || '';
        
        if (topWord) {
          try {
            const suggestResponse = await fetch(`${API_BASE}/api/search?q=${encodeURIComponent(topWord)}&limit=5`, {
              headers: { 'x-session-id': getSessionId() },
              credentials: 'include'
            });
            const suggestions = await suggestResponse.json();
            setSuggestedStrains(Array.isArray(suggestions) ? suggestions : []);
          } catch (e) {
            console.error('Failed to fetch suggestions:', e);
          }
        }
        
        // Show what text was detected to help user understand
        const preview = detectedText ? detectedText.substring(0, 100) : '(no text detected)';
        setError(
          `No exact match found. Detected text: "${preview}${detectedText.length > 100 ? '...' : ''}". ` +
          `${suggestedStrains.length > 0 ? 'Check suggested strains below or ' : ''}Try a clearer image with the strain name visible.`
        );
      }

      setShowResult(true);

    } catch (err) {
      console.error('[Scanner] Scan error:', err);
      console.error('[Scanner] Error stack:', err.stack);
      console.error('[Scanner] Error details:', JSON.stringify(err, Object.getOwnPropertyNames(err)));

      // Show detailed error message
      const errorMsg = err.message || 'Scan failed. Please try again.';
      setError(`Scan failed: ${errorMsg}`);

      // Also show an alert for debugging
      alert(`Scan Error:\n${errorMsg}\n\nCheck console for details.`);
    } finally {
      setLoading(false);
    }
  };

  const handleReset = () => {
    imagePreviews.forEach((u) => URL.revokeObjectURL(u));
    setImages([]);
    setImagePreviews([]);
    setMatchedStrain(null);
    setSuggestedStrains([]);
    setDetectedTextPreview('');
    setShowResult(false);
    setError(null);
    setLastScanId(null);
    setVendors([]);
    setDispensaries([]);
    if (fileInputRef.current) {
      fileInputRef.current.value = '';
    }
  };

  // Merge multiple Vision results into a single composite result
  function mergeVisionResults(results) {
    if (!Array.isArray(results) || results.length === 0) return {};
    const out = { labelAnnotations: [], webDetection: { webEntities: [] }, textAnnotations: [] };

    // Labels: average score and lightly boost repeated labels
    const labelMap = new Map();
    for (const r of results) {
      for (const l of (r?.labelAnnotations || [])) {
        const key = (l.description || '').toLowerCase();
        if (!key) continue;
        const prev = labelMap.get(key) || { description: l.description, scoreSum: 0, count: 0 };
        prev.scoreSum += l.score || 0;
        prev.count += 1;
        labelMap.set(key, prev);
      }
    }
    out.labelAnnotations = Array.from(labelMap.values())
      .map((v) => ({ description: v.description, score: Math.min(1, (v.scoreSum / v.count) * (1 + 0.15 * (v.count - 1))) }))
      .sort((a, b) => (b.score || 0) - (a.score || 0));

    // Web entities
    const webMap = new Map();
    for (const r of results) {
      for (const w of (r?.webDetection?.webEntities || [])) {
        const key = (w.description || '').toLowerCase();
        if (!key) continue;
        const prev = webMap.get(key) || { description: w.description, scoreSum: 0, count: 0 };
        prev.scoreSum += w.score || 0;
        prev.count += 1;
        webMap.set(key, prev);
      }
    }
    out.webDetection.webEntities = Array.from(webMap.values())
      .map((v) => ({ description: v.description, score: Math.min(1, (v.scoreSum / v.count) * (1 + 0.15 * (v.count - 1))) }))
      .sort((a, b) => (b.score || 0) - (a.score || 0));

    // Text: combine distinct blocks (first-level annotation only)
    const textSet = new Set();
    for (const r of results) {
      const t = r?.textAnnotations?.[0]?.description;
      if (t) textSet.add(t);
    }
    if (textSet.size > 0) {
      const combined = Array.from(textSet).join('\n');
      out.textAnnotations = [{ description: combined }];
    }

    // retain other fields from first result for compatibility
    return { ...results[0], ...out };
  }

  const TipsContent = () => (
    <Stack spacing={1.2} sx={{ mt: 1 }}>
      <Typography variant="subtitle2" color="primary.light">Pro tips for best results</Typography>
      <Typography variant="body2" color="text.secondary">• Frame the whole bud (cola), not extreme macro of sugar leaves.</Typography>
      <Typography variant="body2" color="text.secondary">• Use even, diffused lighting. Avoid harsh glare or deep shadows.</Typography>
      <Typography variant="body2" color="text.secondary">• Neutral, uncluttered background. Hold steady to avoid blur.</Typography>
      <Typography variant="body2" color="text.secondary">• Take 2–3 angles of the same bud (top and side) for richer features.</Typography>
      <Typography variant="body2" color="text.secondary">• If you have packaging, include the label or strain name when possible.</Typography>
      <Typography variant="body2" color="text.secondary">• Avoid filters/heavy compression; high-res, natural color is best.</Typography>
    </Stack>
  );

  const handleSelectSuggestion = async (slug) => {
    try {
      const response = await fetch(`${API_BASE}/api/strains/${slug}`);
      if (response.ok) {
        const strain = await response.json();
        setMatchedStrain(strain);
        setSuggestedStrains([]);
        setError(null);

        // Fetch vendors and dispensaries for the selected strain
        if (strain.name) {
          fetchVendorsForStrain(strain.name);
          fetchDispensariesForStrain();
        }

        // Save the selected suggestion to the scan
        if (lastScanId && slug) {
          try {
            await fetch(`${API_BASE}/api/scans/${lastScanId}/save-match`, {
              method: 'POST',
              headers: { 'Content-Type': 'application/json' },
              body: JSON.stringify({ matched_strain_slug: slug, user_id: currentUserId })
            });
          } catch (e) {
            console.error('Failed to save suggestion selection:', e);
          }
        }
      }
    } catch (e) {
      console.error('Failed to load suggested strain:', e);
    }
  };

  // Load reviews when a strain is identified/selected
  useEffect(() => {
    const load = async () => {
      if (!matchedStrain?.slug) {
        setReviews([]);
        setAvgRating(null);
        return;
      }
      try {
        const resp = await fetch(`${API_BASE}/api/reviews?strain_slug=${encodeURIComponent(matchedStrain.slug)}`);
        if (!resp.ok) return;
        const data = await resp.json();
        setReviews(Array.isArray(data) ? data : []);
        if (Array.isArray(data) && data.length) {
          const avg = data.reduce((s, r) => s + (r.rating || 0), 0) / data.length;
          setAvgRating(Math.round(avg * 10) / 10);
        } else {
          setAvgRating(null);
        }
      } catch (e) {
        console.debug('[Scanner] load reviews failed', e);
      }
    };
    load();
  }, [matchedStrain?.slug]);

  const submitReview = async () => {
    if (!currentUserId) {
      alert('Please sign in to leave a review.');
      return;
    }
    if (!matchedStrain?.slug) return;
    if (!(myRating >= 1 && myRating <= 5)) {
      alert('Please select a rating from 1 to 5 stars.');
      return;
    }
    setSubmittingReview(true);
    try {
      const resp = await fetch(`${API_BASE}/api/reviews`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          user_id: currentUserId,
          strain_slug: matchedStrain.slug,
          rating: myRating,
          comment: myComment?.trim() || null,
        })
      });
      if (!resp.ok) {
        const txt = await resp.text();
        alert(`Failed to submit review: ${txt}`);
        return;
      }
      // Refresh list
      setMyComment('');
      const data = await fetch(`${API_BASE}/api/reviews?strain_slug=${encodeURIComponent(matchedStrain.slug)}`).then(r => r.json()).catch(() => []);
      setReviews(Array.isArray(data) ? data : []);
      if (Array.isArray(data) && data.length) {
        const avg = data.reduce((s, r) => s + (r.rating || 0), 0) / data.length;
        setAvgRating(Math.round(avg * 10) / 10);
      } else {
        setAvgRating(null);
      }
    } catch (e) {
      console.error('Submit review failed', e);
      alert('Submit failed. Please try again.');
    } finally {
      setSubmittingReview(false);
    }
  };

  return (
    <Box sx={{ minHeight: '100vh' }}>
      {/* Back to Home button */}
      {onBack && (
        <Box sx={{ position: 'fixed', top: 60, left: 16, zIndex: 1000 }}>
          <Button
            onClick={onBack}
            size="small"
            variant="contained"
            sx={{
              bgcolor: 'white',
              color: 'black',
              textTransform: 'none',
              fontWeight: 700,
              borderRadius: 999,
              px: 1.5,
              minWidth: 0,
              '&:hover': { bgcolor: 'grey.100' }
            }}
          >
            Home
          </Button>
        </Box>
      )}

      <Container maxWidth="sm" sx={{ py: 2, px: 2 }}>
        {/* Compact Hero Card */}
        <Card
          sx={{
            mb: 2,
            overflow: 'hidden',
            border: '1.5px solid #4caf50',
            bgcolor: 'rgba(0,0,0,0.7)',
            backdropFilter: 'blur(10px)'
          }}
        >
          <CardContent sx={{ p: 2, background: 'linear-gradient(135deg, #2d5a2d 0%, #1f3a1f 100%)' }}>
            <Stack direction="row" alignItems="center" spacing={1} sx={{ mb: 1 }}>
              <CannabisLeafIcon />
              <Typography variant="h6" fontWeight="bold" color="primary.light">
                Identify Your Strain
              </Typography>
            </Stack>
            <Typography variant="caption" color="text.secondary" sx={{ display: 'block', mb: 1 }}>
              Snap a photo and let AI identify the strain.
            </Typography>
            <Alert severity="info" icon={false} sx={{ py: 0.5, px: 1, bgcolor: 'rgba(76, 175, 80, 0.1)' }}>
              <Typography variant="caption" fontWeight="bold" color="primary.light" sx={{ fontSize: '0.7rem' }}>
                How It Works:
              </Typography>
              <Typography variant="caption" display="block" color="text.secondary" sx={{ mt: 0.25, fontSize: '0.65rem' }}>
                Our AI analyzes visual characteristics (colors, structure, labels, text) and matches 
                them against 35,000+ strains. For best results, photograph buds in good lighting 
                or include product labels with strain names.
              </Typography>
              <Button size="small" variant="outlined" sx={{ mt: 1 }} onClick={() => setShowTips(true)}>
                Photo Tips
              </Button>
            </Alert>
          </CardContent>
        </Card>

        {!currentUserId && (
          <Alert severity="warning" sx={{ mb: 3 }}>
            Sign in to use AI scans. Uploads require an account so we can track your starter credits.
          </Alert>
        )}

        {error && (
          <Alert severity="error" sx={{ mb: 3 }} onClose={() => setError(null)}>
            {error}
          </Alert>
        )}

        {/* Image Preview(s) with framing guide overlay */}
        {imagePreviews.length > 0 && (
          <Card sx={{ mb: 3, p: 1, position: 'relative' }}>
            <Grid container spacing={1}>
              {imagePreviews.map((src, idx) => (
                <Grid item xs={12} sm={imagePreviews.length > 1 ? 6 : 12} key={idx} sx={{ position: 'relative' }}>
                  <Box sx={{ position: 'relative' }}>
                    <Box
                      component="img"
                      src={src}
                      alt={`Preview ${idx + 1}`}
                      onError={(e) => {
                        console.error('[Scanner] Image preview failed to load:', e);
                        setError('Failed to display image preview. Please try a different photo.');
                      }}
                      sx={{ width: '100%', maxHeight: 320, objectFit: 'cover', bgcolor: 'rgba(0,0,0,0)', borderRadius: 1 }}
                    />
                    {showGuide && (
                      <Box
                        sx={{
                          position: 'absolute',
                          top: 0,
                          left: 0,
                          width: '100%',
                          height: '100%',
                          pointerEvents: 'none',
                          display: 'flex',
                          alignItems: 'center',
                          justifyContent: 'center',
                        }}
                      >
                        <Box
                          sx={{
                            border: '3px dashed #ffeb3b',
                            borderRadius: '50%',
                            width: '70%',
                            height: '70%',
                            opacity: 0.5,
                            boxShadow: '0 0 0 2px #4caf50',
                            background: 'rgba(255,255,0,0.07)',
                            zIndex: 2,
                          }}
                        />
                        <Typography
                          variant="caption"
                          sx={{
                            position: 'absolute',
                            bottom: 8,
                            left: '50%',
                            transform: 'translateX(-50%)',
                            color: '#ffeb3b',
                            bgcolor: 'rgba(44,44,44,0.7)',
                            px: 1.5,
                            py: 0.5,
                            borderRadius: 1,
                            fontWeight: 'bold',
                            zIndex: 3,
                          }}
                        >
                          Frame the whole bud inside the circle
                        </Typography>
                      </Box>
                    )}
                  </Box>
                </Grid>
              ))}
            </Grid>
            <Button
              variant="text"
              size="small"
              sx={{ mt: 1, color: showGuide ? 'warning.main' : 'primary.light' }}
              onClick={() => setShowGuide((v) => !v)}
            >
              {showGuide ? 'Hide Framing Guide' : 'Show Framing Guide'}
            </Button>
          </Card>
        )}

        {/* Action Buttons */}
        <Stack spacing={2}>
          <input
            ref={fileInputRef}
            type="file"
            accept="image/*"
            multiple
            style={{ display: 'none' }}
            onChange={handleImageCapture}
          />
          
          {imagePreviews.length === 0 ? (
            <Button
              variant="contained"
              size="large"
              fullWidth
              startIcon={<CameraAlt />}
              onClick={() => fileInputRef.current?.click()}
              sx={{ 
                py: 3,
                fontSize: '1.2rem',
                background: 'linear-gradient(45deg, #4caf50 30%, #66bb6a 90%)',
                '&:hover': {
                  background: 'linear-gradient(45deg, #388e3c 30%, #4caf50 90%)',
                }
              }}
            >
              📸 Take or Upload Photo
            </Button>
          ) : (
            <>
              <Button
                variant="contained"
                size="medium"
                fullWidth
                onClick={handleScan}
                disabled={loading || !currentUserId}
                sx={{
                  py: 1.5,
                  fontSize: '0.9rem',
                  background: 'linear-gradient(45deg, #4caf50 30%, #66bb6a 90%)',
                }}
              >
                {loading ? (
                  <Stack direction="row" spacing={1} alignItems="center">
                    <CircularProgress size={20} color="inherit" />
                    <Box component="span" sx={{ fontSize: '0.85rem' }}>{loadingStatus || 'Processing...'}</Box>
                  </Stack>
                ) : (
                  '🔬 Scan & Identify'
                )}
              </Button>
              <Stack direction="row" spacing={1}>
                <Button
                  variant="text"
                  size="small"
                  fullWidth
                  onClick={() => fileInputRef.current?.click()}
                  disabled={loading}
                  sx={{ color: 'primary.light', fontSize: '0.8rem' }}
                >
                  Add Photo
                </Button>
                <Button
                  variant="outlined"
                  size="small"
                  fullWidth
                  onClick={handleReset}
                  disabled={loading}
                  sx={{ borderColor: '#4caf50', color: '#4caf50', fontSize: '0.8rem' }}
                >
                  Reset
                </Button>
              </Stack>
            </>
          )}
        </Stack>

        {/* Compact How it Works */}
        {imagePreviews.length === 0 && (
          <Card sx={{ mt: 2, bgcolor: 'background.paper' }}>
            <CardContent sx={{ p: 2 }}>
              <Typography variant="subtitle2" gutterBottom color="primary.light" sx={{ fontSize: '0.875rem' }}>
                📋 How It Works
              </Typography>
              <Stack spacing={1}>
                <Box>
                  <Typography variant="caption" fontWeight="bold" color="text.primary" sx={{ fontSize: '0.75rem' }}>
                    1. Capture • 2. AI Analysis • 3. Match
                  </Typography>
                  <Typography variant="caption" color="text.secondary" sx={{ display: 'block', fontSize: '0.7rem', mt: 0.5 }}>
                    Photo → AI analyzes colors, structure, text → Matches against 35K+ strains
                  </Typography>
                </Box>
              </Stack>
              <Alert severity="warning" sx={{ mt: 1, py: 0.5, px: 1 }}>
                <Typography variant="caption" sx={{ fontSize: '0.65rem' }}>
                  <strong>Tip:</strong> Images with visible strain names/labels produce best results.
                </Typography>
              </Alert>
            </CardContent>
          </Card>
        )}
      </Container>

      {/* Results Dialog */}
      <Dialog 
        open={showResult} 
        onClose={() => setShowResult(false)}
        maxWidth="sm"
        fullWidth
        PaperProps={{
          sx: {
            background: 'linear-gradient(135deg, #2c2c2c 0%, #1f3a1f 100%)',
            border: '2px solid #4caf50'
          }
        }}
      >
        <DialogTitle sx={{ borderBottom: '1px solid #4caf50' }}>
          <Stack direction="row" alignItems="center" justifyContent="space-between">
            <Stack direction="row" spacing={1} alignItems="center">
              <CannabisLeafIcon />
              <Typography variant="h5" fontWeight="bold" color="primary.light">
                Strain Identified
              </Typography>
            </Stack>
            <IconButton onClick={() => setShowResult(false)} sx={{ color: '#4caf50' }}>
              <Close />
            </IconButton>
          </Stack>
        </DialogTitle>
        <DialogContent sx={{ pt: 3 }}>
          {/* Show detected text preview */}
          {detectedTextPreview && !matchedStrain && (
            <Alert severity="info" sx={{ mb: 2 }}>
              <Typography variant="caption" sx={{ fontWeight: 'bold' }}>Detected Text:</Typography>
              <Typography variant="body2" sx={{ fontStyle: 'italic', mt: 0.5 }}>
                "{detectedTextPreview}{detectedTextPreview.length >= 200 ? '...' : ''}"
              </Typography>
            </Alert>
          )}

          {matchedStrain ? (
            <>
              {/* Saved confirmation */}
              <Alert severity="success" icon={<CheckCircle />} sx={{ mb: 2 }}>
                <Typography variant="body2" fontWeight="bold">
                  ✓ Scan saved to your history!
                </Typography>
              </Alert>

              {/* Show scanned image */}
              {imagePreviews[0] && (
                <Box sx={{ mb: 2, textAlign: 'center' }}>
                  <img 
                    src={imagePreviews[0]} 
                    alt="Scanned" 
                    style={{ 
                      maxWidth: '100%', 
                      maxHeight: 200, 
                      borderRadius: 8,
                      objectFit: 'contain',
                      border: '2px solid #4caf50'
                    }} 
                  />
                </Box>
              )}

              {/* Strain Name */}
              <Typography variant="h4" gutterBottom fontWeight="bold" color="primary.main">
                {matchedStrain.name}
              </Typography>

              {/* Confidence Score */}
              {matchedStrain.matchConfidence && (
                <Alert 
                  severity={matchedStrain.matchConfidence >= 70 ? 'success' : matchedStrain.matchConfidence >= 50 ? 'info' : 'warning'}
                  sx={{ mb: 2 }}
                >
                  <Stack direction="row" alignItems="center" spacing={1}>
                    <Typography variant="body1" fontWeight="bold">
                      {matchedStrain.matchConfidence}% Confidence Match
                    </Typography>
                  </Stack>
                  {matchedStrain.matchReasoning && (
                    <Typography variant="caption" sx={{ display: 'block', mt: 0.5 }}>
                      {matchedStrain.matchReasoning}
                    </Typography>
                  )}
                  {matchedStrain.matchConfidence < 40 && (
                    <Stack spacing={1} sx={{ mt: 1 }}>
                      <Typography variant="caption" color="text.secondary">
                        Confidence is low. Try retaking the photo with these tips:
                      </Typography>
                      <TipsContent />
                      <Button size="small" variant="outlined" onClick={() => setShowTips(true)}>Open Photo Tips</Button>
                    </Stack>
                  )}
                </Alert>
              )}

              {/* Type Badge */}
              {matchedStrain.type && (
                <Chip
                  label={matchedStrain.type}
                  size="large"
                  sx={{
                    mb: 2,
                    bgcolor: matchedStrain.type === 'Indica' ? '#7b1fa2' :
                             matchedStrain.type === 'Sativa' ? '#f57c00' : '#00897b',
                    color: 'white',
                    fontWeight: 'bold',
                    fontSize: '1rem'
                  }}
                />
              )}

              {/* Description */}
              {matchedStrain.description && (
                <Typography variant="body1" paragraph color="text.primary" sx={{ my: 2 }}>
                  {matchedStrain.description}
                </Typography>
              )}

              <Divider sx={{ my: 2, bgcolor: 'rgba(76, 175, 80, 0.3)' }} />

              {/* THC/CBD Info */}
              <Grid container spacing={2} sx={{ mb: 2 }}>
                {matchedStrain.thc !== null && matchedStrain.thc > 0 && (
                  <Grid item xs={6}>
                    <Card sx={{ bgcolor: 'rgba(76, 175, 80, 0.1)', border: '1px solid #4caf50' }}>
                      <CardContent>
                        <Typography variant="caption" color="text.secondary">THC Content</Typography>
                        <Typography variant="h4" fontWeight="bold" color="primary.main">
                          {matchedStrain.thc}%
                        </Typography>
                      </CardContent>
                    </Card>
                  </Grid>
                )}
                {matchedStrain.cbd !== null && matchedStrain.cbd > 0 && (
                  <Grid item xs={6}>
                    <Card sx={{ bgcolor: 'rgba(76, 175, 80, 0.1)', border: '1px solid #4caf50' }}>
                      <CardContent>
                        <Typography variant="caption" color="text.secondary">CBD Content</Typography>
                        <Typography variant="h4" fontWeight="bold" color="primary.main">
                          {matchedStrain.cbd}%
                        </Typography>
                      </CardContent>
                    </Card>
                  </Grid>
                )}
              </Grid>

              {/* Effects */}
              {matchedStrain.effects && matchedStrain.effects.length > 0 && (
                <Box sx={{ mb: 2 }}>
                  <Typography variant="h6" gutterBottom color="primary.light">
                    Effects
                  </Typography>
                  <Stack direction="row" spacing={1} flexWrap="wrap" useFlexGap>
                    {matchedStrain.effects.map((effect, idx) => (
                      <Chip 
                        key={idx} 
                        label={effect}
                        sx={{ 
                          bgcolor: 'rgba(139, 195, 74, 0.2)', 
                          color: '#8bc34a',
                          border: '1px solid #8bc34a'
                        }}
                      />
                    ))}
                  </Stack>
                </Box>
              )}

              {/* Flavors/Terpenes */}
              {matchedStrain.flavors && matchedStrain.flavors.length > 0 && (
                <Box sx={{ mb: 2 }}>
                  <Typography variant="h6" gutterBottom color="primary.light">
                    Flavors & Terpenes
                  </Typography>
                  <Stack direction="row" spacing={1} flexWrap="wrap" useFlexGap>
                    {matchedStrain.flavors.map((flavor, idx) => (
                      <Chip 
                        key={idx} 
                        label={flavor}
                        variant="outlined"
                        sx={{ borderColor: '#66bb6a', color: '#66bb6a' }}
                      />
                    ))}
                  </Stack>
                </Box>
              )}

              {/* Lineage */}
              {matchedStrain.lineage && matchedStrain.lineage.length > 0 && (
                <Box>
                  <Typography variant="h6" gutterBottom color="primary.light">
                    Genetics
                  </Typography>
                  <Typography variant="body1" color="text.secondary">
                    {matchedStrain.lineage.join(' × ')}
                  </Typography>
                </Box>
              )}

              {/* Reviews Section */}
              <Divider sx={{ my: 2, bgcolor: 'rgba(76, 175, 80, 0.3)' }} />
              <Box sx={{ mb: 2 }}>
                <Typography variant="h6" gutterBottom color="primary.light">
                  Community Reviews
                </Typography>
                {avgRating !== null ? (
                  <Stack direction="row" alignItems="center" spacing={1} sx={{ mb: 1 }}>
                    <Rating value={avgRating} readOnly precision={0.5} />
                    <Typography variant="body2" color="text.secondary">
                      {avgRating} average • {reviews.length} {reviews.length === 1 ? 'review' : 'reviews'}
                    </Typography>
                  </Stack>
                ) : (
                  <Typography variant="body2" color="text.secondary" sx={{ mb: 1 }}>
                    No reviews yet. Be the first to rate this strain.
                  </Typography>
                )}

                {/* Leave a review */}
                <Card sx={{ mb: 2, bgcolor: 'rgba(76, 175, 80, 0.06)', border: '1px solid rgba(76, 175, 80, 0.3)' }}>
                  <CardContent>
                    <Typography variant="subtitle2" color="text.secondary" gutterBottom>
                      Leave a review
                    </Typography>
                    <Stack direction={{ xs: 'column', sm: 'row' }} spacing={2} alignItems={{ xs: 'flex-start', sm: 'center' }}>
                      <Rating value={myRating} onChange={(_e, v) => setMyRating(v || 0)} />
                      <TextField
                        placeholder="Share your experience (optional)"
                        fullWidth
                        size="small"
                        value={myComment}
                        onChange={(e) => setMyComment(e.target.value)}
                        inputProps={{ maxLength: 400 }}
                      />
                      <Button
                        variant="contained"
                        onClick={submitReview}
                        disabled={submittingReview}
                        sx={{ whiteSpace: 'nowrap' }}
                      >
                        {submittingReview ? 'Submitting…' : 'Submit'}
                      </Button>
                    </Stack>
                    {!currentUserId && (
                      <Typography variant="caption" color="text.secondary" sx={{ mt: 1, display: 'block' }}>
                        Sign in to post a review.
                      </Typography>
                    )}
                  </CardContent>
                </Card>

                {/* Recent reviews - upgraded visual */}
                {reviews.slice(0, 5).map((r) => (
                  <Card key={r.id} sx={{ mb: 1.5, background: 'rgba(255,255,255,0.15)', backdropFilter: 'blur(8px)', border: '2px solid #4caf50', boxShadow: '0 2px 12px rgba(76,175,80,0.08)' }}>
                    <CardContent sx={{ py: 1.5 }}>
                      <Stack direction="row" alignItems="center" spacing={2}>
                        <Avatar sx={{ bgcolor: 'primary.main', width: 36, height: 36, fontWeight: 700 }}>
                          {r.user_id ? r.user_id.substring(0,2).toUpperCase() : '??'}
                        </Avatar>
                        <Stack>
                          <Rating value={r.rating || 0} readOnly size="small" />
                          <Typography variant="caption" color="text.secondary">
                            {new Date(r.created_at).toLocaleDateString()}
                          </Typography>
                        </Stack>
                      </Stack>
                      {r.comment && (
                        <Typography variant="body2" color="text.primary" sx={{ mt: 1, fontSize: '1.08rem' }}>
                          {r.comment}
                        </Typography>
                      )}
                    </CardContent>
                  </Card>
                ))}
              </Box>

              {/* Seed Vendors Section */}
              <Divider sx={{ my: 2, bgcolor: 'rgba(76, 175, 80, 0.3)' }} />
              <Box sx={{ mb: 2 }}>
                <Typography variant="h6" gutterBottom color="primary.light">
                  🌱 Where to Buy Seeds
                </Typography>
                {loadingVendors ? (
                  <Typography variant="body2" color="text.secondary">Loading vendors...</Typography>
                ) : vendors.length > 0 ? (
                  <Stack spacing={1}>
                    {vendors.slice(0, 5).map((vendor, idx) => (
                      <Card key={idx} sx={{ bgcolor: 'rgba(76, 175, 80, 0.05)', border: '1px solid rgba(76, 175, 80, 0.3)' }}>
                        <CardContent sx={{ py: 1.5 }}>
                          <Stack direction="row" justifyContent="space-between" alignItems="center">
                            <Box>
                              <Typography variant="body1" fontWeight="bold" color="primary.main">
                                {vendor.name}
                                {vendor.verified && <Chip label="✓ Verified" size="small" sx={{ ml: 1, height: 20, fontSize: '0.7rem', bgcolor: '#4caf50', color: 'white' }} />}
                              </Typography>
                              <Typography variant="caption" color="text.secondary">
                                {vendor.country} • {vendor.seed_count} seeds • ${vendor.price}
                              </Typography>
                            </Box>
                            {vendor.website && (
                              <Button
                                size="small"
                                variant="outlined"
                                href={vendor.website}
                                target="_blank"
                                rel="noopener noreferrer"
                                sx={{ borderColor: '#4caf50', color: '#4caf50' }}
                              >
                                Visit
                              </Button>
                            )}
                          </Stack>
                        </CardContent>
                      </Card>
                    ))}
                  </Stack>
                ) : (
                  <Typography variant="body2" color="text.secondary">
                    No seed vendors found for this strain.
                  </Typography>
                )}
              </Box>

              {/* Dispensaries Section */}
              <Divider sx={{ my: 2, bgcolor: 'rgba(76, 175, 80, 0.3)' }} />
              <Box sx={{ mb: 2 }}>
                <Typography variant="h6" gutterBottom color="primary.light">
                  🏪 Nearby Dispensaries
                </Typography>
                {!userLocation ? (
                  <Alert severity="info" sx={{ mb: 1 }}>
                    Enable location to find nearby dispensaries
                  </Alert>
                ) : loadingDispensaries ? (
                  <Typography variant="body2" color="text.secondary">Loading dispensaries...</Typography>
                ) : dispensaries.length > 0 ? (
                  <Stack spacing={1}>
                    {dispensaries.slice(0, 5).map((dispensary, idx) => (
                      <Card key={idx} sx={{ bgcolor: 'rgba(76, 175, 80, 0.05)', border: '1px solid rgba(76, 175, 80, 0.3)' }}>
                        <CardContent sx={{ py: 1.5 }}>
                          <Typography variant="body1" fontWeight="bold" color="primary.main">
                            {dispensary.name}
                          </Typography>
                          <Typography variant="caption" color="text.secondary">
                            {dispensary.address && `${dispensary.address}, `}
                            {dispensary.city}, {dispensary.state}
                            {dispensary.distance && ` • ${dispensary.distance.toFixed(1)} mi away`}
                          </Typography>
                          {dispensary.phone && (
                            <Typography variant="caption" color="text.secondary" sx={{ display: 'block' }}>
                              📞 {dispensary.phone}
                            </Typography>
                          )}
                        </CardContent>
                      </Card>
                    ))}
                  </Stack>
                ) : (
                  <Typography variant="body2" color="text.secondary">
                    No dispensaries found nearby.
                  </Typography>
                )}
              </Box>

              <Button
                variant="contained"
                fullWidth
                onClick={handleReset}
                sx={{
                  mt: 3,
                  py: 1.5,
                  background: 'linear-gradient(45deg, #4caf50 30%, #66bb6a 90%)',
                }}
              >
                Scan Another Strain
              </Button>
            </>
          ) : (
            <>
              <Alert severity="warning" sx={{ mb: 2 }}>
                No exact match found. The image may not contain a clear strain name.
              </Alert>

              {/* Tips when no match */}
              <Alert severity="info" sx={{ mb: 2 }}>
                <Typography variant="body2" color="text.secondary">
                  Retake with better framing and lighting for stronger matches.
                </Typography>
                <TipsContent />
                <Button size="small" variant="outlined" sx={{ mt: 1 }} onClick={() => setShowTips(true)}>
                  Open Photo Tips
                </Button>
              </Alert>

              {/* Show suggested strains if available */}
              {suggestedStrains.length > 0 && (
                <Box sx={{ mt: 2 }}>
                  <Typography variant="h6" gutterBottom color="primary.light">
                    💡 Possible Matches
                  </Typography>
                  <Typography variant="body2" color="text.secondary" sx={{ mb: 2 }}>
                    Tap a strain below if it matches what you're looking for:
                  </Typography>
                  <Stack spacing={1}>
                    {suggestedStrains.map((strain) => (
                      <Card
                        key={strain.slug}
                        sx={{
                          cursor: 'pointer',
                          bgcolor: 'rgba(76, 175, 80, 0.05)',
                          border: '1px solid rgba(76, 175, 80, 0.3)',
                          transition: 'all 0.2s',
                          '&:hover': {
                            bgcolor: 'rgba(76, 175, 80, 0.15)',
                            border: '1px solid #4caf50',
                          }
                        }}
                        onClick={() => handleSelectSuggestion(strain.slug)}
                      >
                        <CardContent sx={{ py: 1.5 }}>
                          <Typography variant="body1" fontWeight="bold" color="primary.main">
                            {strain.name}
                          </Typography>
                          {strain.type && (
                            <Chip
                              label={strain.type}
                              size="small"
                              sx={{
                                mt: 0.5,
                                height: 20,
                                fontSize: '0.7rem',
                                bgcolor: strain.type === 'Indica' ? '#7b1fa2' :
                                         strain.type === 'Sativa' ? '#f57c00' : '#00897b',
                                color: 'white'
                              }}
                            />
                          )}
                        </CardContent>
                      </Card>
                    ))}
                  </Stack>
                </Box>
              )}

              {/* Action Buttons */}
              <Stack direction="row" spacing={2} sx={{ mt: 3 }}>
                <Button
                  variant="contained"
                  fullWidth
                  startIcon={<CheckCircle />}
                  onClick={() => {
                    setShowResult(false);
                    onViewHistory?.();
                  }}
                  sx={{ 
                    background: 'linear-gradient(45deg, #4caf50 30%, #66bb6a 90%)',
                  }}
                >
                  View in History
                </Button>
                <Button
                  variant="outlined"
                  fullWidth
                  onClick={handleReset}
                  sx={{ 
                    borderColor: '#4caf50',
                    color: '#4caf50'
                  }}
                >
                  Scan Again
                </Button>
              </Stack>
            </>
          )}
        </DialogContent>
      </Dialog>

      {/* Tips Dialog */}
      <Dialog open={showTips} onClose={() => setShowTips(false)} maxWidth="sm" fullWidth>
        <DialogTitle>
          <Stack direction="row" alignItems="center" justifyContent="space-between">
            <Typography variant="h6">Photo Tips for Best Results</Typography>
            <IconButton onClick={() => setShowTips(false)}><Close /></IconButton>
          </Stack>
        </DialogTitle>
        <DialogContent>
          <TipsContent />
          <Alert severity="info" sx={{ mt: 2 }}>
            Try 2–3 shots from different angles. Include a label if available.
          </Alert>
        </DialogContent>
      </Dialog>
    </Box>
  );
}

export default Scanner;
