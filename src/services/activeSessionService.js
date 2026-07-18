import api from './api';

/**
 * Add a new active session record
 * @param {Object} sessionData - Session fields
 * @returns {Promise<Object>} API Response
 */
export const addActiveSession = async (sessionData) => {
  const response = await api.post('/api/activeSession', sessionData);
  return response.data;
};

export const addActiveSessionEntry = addActiveSession;

/**
 * Update an existing active session record
 * @param {string|number} rowId - Row ID to update
 * @param {Object} sessionData - Session fields to update
 * @returns {Promise<Object>} API Response
 */
export const updateActiveSession = async (rowId, sessionData) => {
  const response = await api.put(`/api/activeSession/${rowId}`, sessionData);
  return response.data;
};

export const updateActiveSessionEntry = updateActiveSession;

/**
 * Delete one or more active session records
 * @param {string|number|Array<string|number>} rowIds - Single ID or array of IDs
 * @returns {Promise<Object>} API Response
 */
export const deleteActiveSessions = async (rowIds) => {
  const idsParam = Array.isArray(rowIds) ? rowIds.join(',') : rowIds;
  const response = await api.delete(`/api/activeSession/${idsParam}`);
  return response.data;
};

export const deleteActiveSessionEntries = deleteActiveSessions;
