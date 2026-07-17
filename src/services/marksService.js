import axios from 'axios';

/**
 * Add new marks records (single or multiple)
 * @param {Array<Object>|Object} marksData - Array of marks entries or a single entry
 * @returns {Promise<Object>} API Response
 */
export const addMarksEntries = async (marksData) => {
  const response = await axios.post('/api/marks', marksData);
  return response.data;
};

/**
 * Update an existing marks record
 * @param {string|number} rowId - The sequential row index
 * @param {Object} marksData - Marks fields to update
 * @returns {Promise<Object>} API Response
 */
export const updateMarksEntry = async (rowId, marksData) => {
  const response = await axios.put(`/api/marks/${rowId}`, marksData);
  return response.data;
};

/**
 * Delete one or more marks records
 * @param {string|number|Array<string|number>} rowIds - Single row ID or array of row IDs
 * @returns {Promise<Object>} API Response
 */
export const deleteMarksEntries = async (rowIds) => {
  const idsParam = Array.isArray(rowIds) ? rowIds.join(',') : rowIds;
  const response = await axios.delete(`/api/marks/${idsParam}`);
  return response.data;
};
