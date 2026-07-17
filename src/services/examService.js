import axios from 'axios';

/**
 * Add a new exam schedule entry
 * @param {Object} entryData - Exam fields
 * @returns {Promise<Object>} API Response
 */
export const addExamEntry = async (entryData) => {
  const response = await axios.post('/api/exam', entryData);
  return response.data;
};

/**
 * Update an existing exam schedule entry
 * @param {string|number} rowId - The sequential row index
 * @param {Object} entryData - Exam fields to update
 * @returns {Promise<Object>} API Response
 */
export const updateExamEntry = async (rowId, entryData) => {
  const response = await axios.put(`/api/exam/${rowId}`, entryData);
  return response.data;
};

/**
 * Delete one or more exam schedule entries
 * @param {string|number|Array<string|number>} rowIds - Single row ID or array of row IDs
 * @returns {Promise<Object>} API Response
 */
export const deleteExamEntries = async (rowIds) => {
  const idsParam = Array.isArray(rowIds) ? rowIds.join(',') : rowIds;
  const response = await axios.delete(`/api/exam/${idsParam}`);
  return response.data;
};
