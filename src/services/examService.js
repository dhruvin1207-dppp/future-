import api from './api';

/**
 * Add a new exam schedule entry
 * @param {Object} entryData - Exam entry fields
 * @returns {Promise<Object>} API Response
 */
export const addExamEntry = async (entryData) => {
  const response = await api.post('/api/exam', entryData);
  return response.data;
};

/**
 * Update an existing exam schedule entry
 * @param {string|number} rowId - Row index of the entry
 * @param {Object} entryData - Exam entry fields to update
 * @returns {Promise<Object>} API Response
 */
export const updateExamEntry = async (rowId, entryData) => {
  const response = await api.put(`/api/exam/${rowId}`, entryData);
  return response.data;
};

/**
 * Delete one or more exam schedule entries
 * @param {string|number|Array<string|number>} rowIds - Single row ID or array of row IDs
 * @returns {Promise<Object>} API Response
 */
export const deleteExamEntries = async (rowIds) => {
  const idsParam = Array.isArray(rowIds) ? rowIds.join(',') : rowIds;
  const response = await api.delete(`/api/exam/${idsParam}`);
  return response.data;
};
