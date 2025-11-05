import * as SQLite from 'expo-sqlite';
import AsyncStorage from '@react-native-async-storage/async-storage';

let db = null;

/**
 * Initialize the offline database
 */
export async function initializeDatabase() {
  try {
    // Open database
    db = await SQLite.openDatabaseAsync('strainspotter.db');

    // Create strains table
    await db.execAsync(`
      CREATE TABLE IF NOT EXISTS strains (
        id INTEGER PRIMARY KEY,
        name TEXT NOT NULL,
        type TEXT,
        description TEXT,
        effects TEXT,
        flavors TEXT,
        thc_content TEXT,
        cbd_content TEXT,
        cached_at INTEGER,
        UNIQUE(id)
      );
    `);

    // Create scans table
    await db.execAsync(`
      CREATE TABLE IF NOT EXISTS scans (
        id TEXT PRIMARY KEY,
        user_id TEXT,
        image_url TEXT,
        result TEXT,
        status TEXT,
        created_at INTEGER,
        synced INTEGER DEFAULT 0
      );
    `);

    // Create favorites table
    await db.execAsync(`
      CREATE TABLE IF NOT EXISTS favorites (
        strain_id INTEGER PRIMARY KEY,
        added_at INTEGER
      );
    `);

    console.log('Offline database initialized');
  } catch (error) {
    console.error('Failed to initialize database:', error);
  }
}

/**
 * Get database instance
 */
function getDb() {
  if (!db) {
    throw new Error('Database not initialized. Call initializeDatabase() first.');
  }
  return db;
}

/**
 * Cache strains for offline access
 */
export async function cacheStrains(strains) {
  try {
    const db = getDb();
    const timestamp = Date.now();

    for (const strain of strains) {
      await db.runAsync(
        `INSERT OR REPLACE INTO strains 
        (id, name, type, description, effects, flavors, thc_content, cbd_content, cached_at) 
        VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?)`,
        [
          strain.id,
          strain.name,
          strain.type,
          strain.description,
          strain.effects,
          strain.flavors,
          strain.thc_content,
          strain.cbd_content,
          timestamp,
        ]
      );
    }
    
    console.log(`Cached ${strains.length} strains`);
  } catch (error) {
    console.error('Failed to cache strains:', error);
  }
}

/**
 * Get cached strains
 */
export async function getCachedStrains() {
  try {
    const db = getDb();
    const result = await db.getAllAsync('SELECT * FROM strains ORDER BY name');
    return result;
  } catch (error) {
    console.error('Failed to get cached strains:', error);
    return [];
  }
}

/**
 * Search cached strains
 */
export async function searchCachedStrains(query) {
  try {
    const db = getDb();
    const result = await db.getAllAsync(
      'SELECT * FROM strains WHERE name LIKE ? ORDER BY name',
      [`%${query}%`]
    );
    return result;
  } catch (error) {
    console.error('Failed to search cached strains:', error);
    return [];
  }
}

/**
 * Save scan offline
 */
export async function saveScanOffline(scan) {
  try {
    const db = getDb();
    await db.runAsync(
      `INSERT OR REPLACE INTO scans 
      (id, user_id, image_url, result, status, created_at, synced) 
      VALUES (?, ?, ?, ?, ?, ?, ?)`,
      [
        scan.id,
        scan.user_id,
        scan.image_url,
        JSON.stringify(scan.result),
        scan.status,
        Date.now(),
        0,
      ]
    );
    
    console.log('Scan saved offline');
  } catch (error) {
    console.error('Failed to save scan offline:', error);
  }
}

/**
 * Get unsynced scans
 */
export async function getUnsyncedScans() {
  try {
    const db = getDb();
    const result = await db.getAllAsync('SELECT * FROM scans WHERE synced = 0');
    return result.map(scan => ({
      ...scan,
      result: JSON.parse(scan.result),
    }));
  } catch (error) {
    console.error('Failed to get unsynced scans:', error);
    return [];
  }
}

/**
 * Mark scan as synced
 */
export async function markScanAsSynced(scanId) {
  try {
    const db = getDb();
    await db.runAsync('UPDATE scans SET synced = 1 WHERE id = ?', [scanId]);
  } catch (error) {
    console.error('Failed to mark scan as synced:', error);
  }
}

/**
 * Add strain to favorites
 */
export async function addToFavorites(strainId) {
  try {
    const db = getDb();
    await db.runAsync(
      'INSERT OR REPLACE INTO favorites (strain_id, added_at) VALUES (?, ?)',
      [strainId, Date.now()]
    );
    console.log('Added to favorites');
  } catch (error) {
    console.error('Failed to add to favorites:', error);
  }
}

/**
 * Remove strain from favorites
 */
export async function removeFromFavorites(strainId) {
  try {
    const db = getDb();
    await db.runAsync('DELETE FROM favorites WHERE strain_id = ?', [strainId]);
    console.log('Removed from favorites');
  } catch (error) {
    console.error('Failed to remove from favorites:', error);
  }
}

/**
 * Get favorite strains
 */
export async function getFavoriteStrains() {
  try {
    const db = getDb();
    const result = await db.getAllAsync(`
      SELECT s.* FROM strains s
      INNER JOIN favorites f ON s.id = f.strain_id
      ORDER BY f.added_at DESC
    `);
    return result;
  } catch (error) {
    console.error('Failed to get favorite strains:', error);
    return [];
  }
}

/**
 * Check if strain is favorited
 */
export async function isStrainFavorited(strainId) {
  try {
    const db = getDb();
    const result = await db.getFirstAsync(
      'SELECT * FROM favorites WHERE strain_id = ?',
      [strainId]
    );
    return !!result;
  } catch (error) {
    console.error('Failed to check if favorited:', error);
    return false;
  }
}

/**
 * Clear all cached data
 */
export async function clearAllCache() {
  try {
    const db = getDb();
    await db.execAsync('DELETE FROM strains');
    await db.execAsync('DELETE FROM scans');
    await db.execAsync('DELETE FROM favorites');
    console.log('All cache cleared');
  } catch (error) {
    console.error('Failed to clear cache:', error);
  }
}

/**
 * Get cache statistics
 */
export async function getCacheStats() {
  try {
    const db = getDb();
    const strainCount = await db.getFirstAsync('SELECT COUNT(*) as count FROM strains');
    const scanCount = await db.getFirstAsync('SELECT COUNT(*) as count FROM scans');
    const favoriteCount = await db.getFirstAsync('SELECT COUNT(*) as count FROM favorites');

    return {
      strains: strainCount.count,
      scans: scanCount.count,
      favorites: favoriteCount.count,
    };
  } catch (error) {
    console.error('Failed to get cache stats:', error);
    return { strains: 0, scans: 0, favorites: 0 };
  }
}

