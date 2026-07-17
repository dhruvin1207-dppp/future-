import axios from 'axios';

/**
 * Add a new active session entry
 * @param {Object} sessionData - Session fields
 * @returns {Promise<Object>} API Response
 */
export const addActiveSessionEntry = async (sessionData) => {
  const response = await axios.post('/api/activeSession', sessionData);
  return response.data;
};

/**
 * Update an existing active session entry
 * @param {string|number} rowId - The sequential row index
 * @param {Object} sessionData - Session fields to update
 * @returns {Promise<Object>} API Response
 */
export const updateActiveSessionEntry = async (rowId, sessionData) => {
  const response = await axios.put(`/api/activeSession/${rowId}`, sessionData);
  return response.data;
};

/**
 * Delete one or more active session entries
 * @param {string|number|Array<string|number>} rowIds - Single row ID or array of row IDs
 * @returns {Promise<Object>} API Response
 */
export const deleteActiveSessionEntries = async (rowIds) => {
  const idsParam = Array.isArray(rowIds) ? rowIds.join(',') : rowIds;
  const response = await axios.delete(`/api/activeSession/${idsParam}`);
  return response.data;
};
