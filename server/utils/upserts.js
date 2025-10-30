// Utility functions for performing UPSERT operations
const db = require('./pool');
const { logEvent } = require('./logs');

/**
 * Performs an upsert (insert or update) operation on a table
 * @param {string} table - The table name
 * @param {Object} data - The data to insert/update
 * @param {string[]} conflictColumns - Columns to check for conflicts
 * @param {string[]} updateColumns - Columns to update on conflict (if empty, updates all columns)
 * @returns {Promise<Object>} - The result of the operation
 */
async function upsert(table, data, conflictColumns, updateColumns = []) {
  try {
    if (!table || !data || !Array.isArray(conflictColumns) || conflictColumns.length === 0) {
      throw new Error('Invalid parameters for upsert operation');
    }

    const conflictClause = conflictColumns.join(', ');
    const updateClause = updateColumns.length > 0
      ? updateColumns.map(col => `${col} = EXCLUDED.${col}`).join(', ')
      : Object.keys(data)
          .filter(key => !conflictColumns.includes(key) && key !== 'created_at')
          .map(key => `${key} = EXCLUDED.${key}`)
          .join(', ');

    const query = `
      INSERT INTO ${table} (${Object.keys(data).join(', ')})
      VALUES (${Object.keys(data).map((_, i) => `$${i + 1}`).join(', ')})
      ON CONFLICT (${conflictClause}) 
      DO UPDATE SET ${updateClause}
      RETURNING *
    `;

    const values = Object.values(data);
    const result = await db.pool.raw(query, values);
    
    return result.rows[0];
  } catch (error) {
    await logEvent('error', 'Upsert operation failed', {
      table,
      error: error.message,
      query: error.query,
      params: error.bindings
    });
    throw error;
  }
}

/**
 * Performs a batch upsert operation
 * @param {string} table - The table name
 * @param {Array<Object>} items - Array of items to upsert
 * @param {string[]} conflictColumns - Columns to check for conflicts
 * @param {string[]} updateColumns - Columns to update on conflict
 * @returns {Promise<Array<Object>>} - Array of upserted/updated items
 */
async function batchUpsert(table, items, conflictColumns, updateColumns = []) {
  if (!Array.isArray(items) || items.length === 0) {
    return [];
  }

  const results = [];
  const batchSize = 100; // Process in batches to avoid too many placeholders
  
  for (let i = 0; i < items.length; i += batchSize) {
    const batch = items.slice(i, i + batchSize);
    const batchResults = await Promise.all(
      batch.map(item => upsert(table, item, conflictColumns, updateColumns))
    );
    results.push(...batchResults);
  }
  
  return results;
}

/**
 * Performs an upsert with custom conflict resolution
 * @param {string} table - The table name
 * @param {Object} data - The data to insert/update
 * @param {string} conflictClause - Custom SQL for ON CONFLICT clause
 * @param {string} updateClause - Custom SQL for DO UPDATE SET clause
 * @returns {Promise<Object>} - The result of the operation
 */
async function customUpsert(table, data, conflictClause, updateClause) {
  try {
    const query = `
      INSERT INTO ${table} (${Object.keys(data).join(', ')})
      VALUES (${Object.keys(data).map((_, i) => `$${i + 1}`).join(', ')})
      ON CONFLICT ${conflictClause}
      DO UPDATE SET ${updateClause}
      RETURNING *
    `;

    const values = Object.values(data);
    const result = await db.pool.raw(query, values);
    
    return result.rows[0];
  } catch (error) {
    await logEvent('error', 'Custom upsert failed', {
      table,
      error: error.message,
      query: error.query,
      conflictClause,
      updateClause
    });
    throw error;
  }
}

module.exports = {
  upsert,
  batchUpsert,
  customUpsert
};
