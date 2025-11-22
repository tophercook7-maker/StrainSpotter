/**
 * Safe Write Helpers
 * Wraps database writes to gracefully handle missing columns
 * Prevents 500 errors from schema mismatches
 */

/**
 * Check if an error is a schema/column error
 * @param {Error|Object} error - Error object
 * @returns {boolean}
 */
export function isSchemaError(error) {
  if (!error) return false;
  const message = error.message || String(error) || '';
  const lowerMessage = message.toLowerCase();
  
  return (
    lowerMessage.includes('schema') ||
    lowerMessage.includes('column') ||
    lowerMessage.includes('could not find') ||
    lowerMessage.includes('does not exist') ||
    lowerMessage.includes('ai_summary') ||
    lowerMessage.includes('match_confidence') ||
    lowerMessage.includes('error column') ||
    lowerMessage.includes('packaging_insights') ||
    lowerMessage.includes('label_insights') ||
    lowerMessage.includes('plant_health') ||
    lowerMessage.includes('cache')
  );
}

/**
 * Safely update a scan record
 * Skips writes to missing columns with a warning instead of throwing
 * 
 * @param {Object} writeClient - Supabase write client
 * @param {string} scanId - Scan ID
 * @param {Object} updateData - Data to update
 * @param {string} context - Context for logging (e.g., 'scan-process')
 * @returns {Promise<{success: boolean, skippedFields: string[], error?: Error}>}
 */
export async function safeUpdateScan(writeClient, scanId, updateData, context = 'unknown') {
  if (!writeClient || !scanId) {
    return { success: false, skippedFields: [], error: new Error('Missing required parameters') };
  }

  try {
    const { error } = await writeClient
      .from('scans')
      .update(updateData)
      .eq('id', scanId);

    if (error) {
      if (isSchemaError(error)) {
        // Schema error - try updating without problematic fields
        const skippedFields = [];
        const safeData = {};
        
        // Check each field individually
        for (const [key, value] of Object.entries(updateData)) {
          // Skip fields that might be missing
          if (['ai_summary', 'error', 'match_confidence', 'match_quality', 
               'matched_strain_name', 'packaging_insights', 'label_insights', 
               'plant_health'].includes(key)) {
            skippedFields.push(key);
            console.warn(`[SafeWrite:${context}] Skipping write to potentially missing column: ${key}`, {
              scanId,
              column: key,
            });
          } else {
            safeData[key] = value;
          }
        }

        // Try update with only safe fields
        if (Object.keys(safeData).length > 0) {
          const { error: safeError } = await writeClient
            .from('scans')
            .update(safeData)
            .eq('id', scanId);
          
          if (safeError && !isSchemaError(safeError)) {
            // Real error, not schema
            return { success: false, skippedFields, error: safeError };
          }
        }

        return { success: true, skippedFields };
      }

      // Real error, not schema
      return { success: false, skippedFields: [], error };
    }

    return { success: true, skippedFields: [] };
  } catch (err) {
    if (isSchemaError(err)) {
      console.warn(`[SafeWrite:${context}] Schema error caught, skipping write`, {
        scanId,
        error: err.message,
      });
      return { success: true, skippedFields: Object.keys(updateData) };
    }
    return { success: false, skippedFields: [], error: err };
  }
}


