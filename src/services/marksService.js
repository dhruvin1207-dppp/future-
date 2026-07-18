import api from './api';

/**
 * Add new marks records (single or multiple)
 * @param {Array<Object>|Object} marksData - Array of marks entries or a single entry
 * @returns {Promise<Object>} API Response
 */
export const addMarksEntries = async (marksData) => {
  const response = await api.post('/api/marks', marksData);
  return response.data;
};

/**
 * Update an existing marks record
 * @param {string|number} rowId - The sequential row index
 * @param {Object} marksData - Marks fields to update
 * @returns {Promise<Object>} API Response
 */
export const updateMarksEntry = async (rowId, marksData) => {
  const response = await api.put(`/api/marks/${rowId}`, marksData);
  return response.data;
};

/**
 * Delete one or more marks records
 * @param {string|number|Array<string|number>} rowIds - Single row ID or array of row IDs
 * @returns {Promise<Object>} API Response
 */
export const deleteMarksEntries = async (rowIds) => {
  const idsParam = Array.isArray(rowIds) ? rowIds.join(',') : rowIds;
  const response = await api.delete(`/api/marks/${idsParam}`);
  return response.data;
};
