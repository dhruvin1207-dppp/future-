import axios from 'axios';

/**
 * Add a new fees record
 * @param {Object} feesData - Fees fields
 * @returns {Promise<Object>} API Response
 */
export const addFeesEntry = async (feesData) => {
  const response = await axios.post('/api/fees', feesData);
  return response.data;
};

/**
 * Update an existing fees record
 * @param {string|number} rowId - The actual spreadsheet row number
 * @param {Object} feesData - Fields to update
 * @returns {Promise<Object>} API Response
 */
export const updateFeesEntry = async (rowId, feesData) => {
  const response = await axios.put(`/api/fees/${rowId}`, feesData);
  return response.data;
};

/**
 * Delete one or more fees records
 * @param {string|number|Array} rowIds - Single or array of row IDs
 * @returns {Promise<Object>} API Response
 */
export const deleteFeesEntries = async (rowIds) => {
  const idsParam = Array.isArray(rowIds) ? rowIds.join(',') : rowIds;
  const response = await axios.delete(`/api/fees/${idsParam}`);
  return response.data;
};
