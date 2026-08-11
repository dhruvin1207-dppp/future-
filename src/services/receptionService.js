import api from './api';

/**
 * Add a new reception record
 * @param {Object} data - Reception record details
 * @returns {Promise<Object>} API Response
 */
export const addReception = async (data) => {
  const response = await api.post('/api/reception', data);
  return response.data;
};

/**
 * Update an existing reception record
 * @param {string|number} rowId - Row index of the record
 * @param {Object} data - Reception fields to update
 * @returns {Promise<Object>} API Response
 */
export const updateReception = async (rowId, data) => {
  const response = await api.put(`/api/reception/${rowId}`, data);
  return response.data;
};

/**
 * Delete one or more reception records
 * @param {string|number|Array<string|number>} rowIds - Row ID or array of row IDs
 * @returns {Promise<Object>} API Response
 */
export const deleteReception = async (rowIds) => {
  const idsParam = Array.isArray(rowIds) ? rowIds.join(',') : rowIds;
  const response = await api.delete(`/api/reception/${idsParam}`);
  return response.data;
};
