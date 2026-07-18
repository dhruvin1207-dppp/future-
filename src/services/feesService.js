import api from './api';

/**
 * Add a new fee record
 * @param {Object} feesData - Fee entry fields
 * @returns {Promise<Object>} API Response
 */
export const addFeeEntry = async (feesData) => {
  const response = await api.post('/api/fees', feesData);
  return response.data;
};

export const addFeesEntry = addFeeEntry;

/**
 * Update an existing fee record
 * @param {string|number} rowId - Row index of the entry
 * @param {Object} feesData - Fee fields to update
 * @returns {Promise<Object>} API Response
 */
export const updateFeeEntry = async (rowId, feesData) => {
  const response = await api.put(`/api/fees/${rowId}`, feesData);
  return response.data;
};

export const updateFeesEntry = updateFeeEntry;

/**
 * Delete one or more fee records
 * @param {string|number|Array<string|number>} rowIds - Single row ID or array of row IDs
 * @returns {Promise<Object>} API Response
 */
export const deleteFeeEntries = async (rowIds) => {
  const idsParam = Array.isArray(rowIds) ? rowIds.join(',') : rowIds;
  const response = await api.delete(`/api/fees/${idsParam}`);
  return response.data;
};

export const deleteFeesEntries = deleteFeeEntries;
