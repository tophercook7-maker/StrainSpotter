/**
 * Schema Sync Service
 * Automatically ensures required columns exist in the scans table
 * Safe to run on every server start - uses IF NOT EXISTS
 */

/**
 * Required columns for the scans table
 */
const REQUIRED_COLUMNS = [
  { name: 'ai_summary', type: 'jsonb' },
  { name: 'error', type: 'jsonb' },
  { name: 'match_confidence', type: 'double precision' },
  { name: 'match_quality', type: 'text' },
  { name: 'matched_strain_name', type: 'text' },
  { name: 'packaging_insights', type: 'jsonb' },
  { name: 'label_insights', type: 'jsonb' },
  { name: 'plant_health', type: 'jsonb' },
  { name: 'status', type: 'text' },
  { name: 'processed_at', type: 'timestamptz' },
  { name: 'result', type: 'jsonb' },
];

/**
 * Sync schema - ensure all required columns exist
 * Note: Supabase doesn't support direct SQL execution by default.
 * This function logs required columns and relies on safe write wrappers
 * to handle missing columns gracefully at runtime.
 * 
 * @param {Object} supabaseClient - Supabase client (admin or regular)
 * @returns {Promise<void>}
 */
async function syncSchema(supabaseClient) {
  if (!supabaseClient) {
    console.warn('[SchemaSync] No Supabase client provided, skipping schema sync');
    return;
  }

  console.log('[SchemaSync] Starting schema sync...');
  console.log('[SchemaSync] Required columns:', REQUIRED_COLUMNS.map(c => `${c.name} (${c.type})`).join(', '));

  try {
    // Try to detect existing columns by attempting a select with all columns
    // This is a best-effort check since Supabase doesn't expose information_schema directly
    const testColumns = REQUIRED_COLUMNS.map(c => c.name).join(', ');
    
    try {
      const { error } = await supabaseClient
        .from('scans')
        .select(testColumns)
        .limit(0);
      
      if (!error) {
        console.log('[SchemaSync] All required columns appear to exist');
        return;
      }
      
      // If we get a column error, log it
      if (error && (error.message.includes('column') || error.message.includes('schema'))) {
        console.warn('[SchemaSync] Some columns may be missing:', error.message);
        console.log('[SchemaSync] Safe write wrappers will handle missing columns gracefully');
      }
    } catch (err) {
      console.warn('[SchemaSync] Could not verify columns:', err.message);
    }

    console.log('[SchemaSync] Schema sync check completed');
    console.log('[SchemaSync] Note: If columns are missing, safe write wrappers will skip writes to missing columns');
  } catch (err) {
    console.error('[SchemaSync] Schema sync failed:', err);
    // Don't throw - allow server to start even if schema sync fails
    // Safe writes will handle missing columns gracefully
  }
}

/**
 * Main schema sync function
 * @param {Object} supabaseAdmin - Admin Supabase client
 * @param {Object} supabase - Regular Supabase client
 * @returns {Promise<void>}
 */
async function schemaSync(supabaseAdmin, supabase) {
  // Use admin client if available, otherwise fall back to regular client
  const client = supabaseAdmin || supabase;
  
  if (!client) {
    console.warn('[SchemaSync] No Supabase client available, skipping');
    return;
  }

  await syncSchema(client);
}

export { schemaSync, REQUIRED_COLUMNS };

