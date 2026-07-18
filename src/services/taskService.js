import api from './api';

export const addTask = async (taskData) => {
  const response = await api.post('/api/tasks', taskData);
  return response.data;
};

export const updateTask = async (rowId, taskData) => {
  const response = await api.put(`/api/tasks/${rowId}`, taskData);
  return response.data;
};

export const deleteTasks = async (rowIds) => {
  const idsParam = Array.isArray(rowIds) ? rowIds.join(',') : rowIds;
  const response = await api.delete(`/api/tasks/${idsParam}`);
  return response.data;
};

export const deleteTaskEntries = deleteTasks;
