import api from './api';

export const addInquiry = async (inquiry) => {
  const response = await api.post('/api/inquiry', inquiry);
  return response.data;
};

export const updateInquiry = async (rowId, inquiry) => {
  const response = await api.put(`/api/inquiry/${rowId}`, inquiry);
  return response.data;
};

export const deleteInquiries = async (rowIds) => {
  const response = await api.delete(`/api/inquiry/${rowIds.join(',')}`);
  return response.data;
};
