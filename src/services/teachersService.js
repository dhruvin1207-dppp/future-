import api from './api';

export const addTeacher = async (teacher) => {
  const response = await api.post('/api/teachers', teacher);
  return response.data;
};

export const updateTeacher = async (rowId, teacher) => {
  const response = await api.put(`/api/teachers/${rowId}`, teacher);
  return response.data;
};

export const deleteTeachers = async (rowIds) => {
  const response = await api.delete(`/api/teachers/${rowIds.join(',')}`);
  return response.data;
};
