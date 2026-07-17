import axios from 'axios';

/**
 * Add a new task
 */
export const addTask = async (taskData) => {
  const response = await axios.post('/api/tasks', taskData);
  return response.data;
};

/**
 * Update an existing task by row ID
 */
export const updateTask = async (rowId, taskData) => {
  const response = await axios.put(`/api/tasks/${rowId}`, taskData);
  return response.data;
};

/**
 * Delete one or more tasks
 */
export const deleteTaskEntries = async (rowIds) => {
  const idsParam = Array.isArray(rowIds) ? rowIds.join(',') : rowIds;
  const response = await axios.delete(`/api/tasks/${idsParam}`);
  return response.data;
};
