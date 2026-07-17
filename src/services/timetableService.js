import axios from 'axios';

/**
 * Add a new timetable entry
 * @param {Object} entryData - Timetable fields
 * @returns {Promise<Object>} API Response
 */
export const addTimetableEntry = async (entryData) => {
  const response = await axios.post('/api/timetable', entryData);
  return response.data;
};

/**
 * Update an existing timetable entry
 * @param {string|number} rowId - The sequential row index
 * @param {Object} entryData - Timetable fields to update
 * @returns {Promise<Object>} API Response
 */
export const updateTimetableEntry = async (rowId, entryData) => {
  const response = await axios.put(`/api/timetable/${rowId}`, entryData);
  return response.data;
};

/**
 * Delete one or more timetable entries
 * @param {string|number|Array<string|number>} rowIds - Single row ID or array of row IDs
 * @returns {Promise<Object>} API Response
 */
export const deleteTimetableEntries = async (rowIds) => {
  const idsParam = Array.isArray(rowIds) ? rowIds.join(',') : rowIds;
  const response = await axios.delete(`/api/timetable/${idsParam}`);
  return response.data;
};
