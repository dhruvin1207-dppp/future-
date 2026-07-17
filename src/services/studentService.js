import axios from 'axios';

/**
 * Add a new student record
 * @param {Object} studentData - Student fields
 * @returns {Promise<Object>} API Response
 */
export const addStudent = async (studentData) => {
  const response = await axios.post('/api/students', studentData);
  return response.data;
};

/**
 * Update an existing student record
 * @param {string} studentId - Student ID to update
 * @param {Object} studentData - Student fields to update
 * @returns {Promise<Object>} API Response
 */
export const updateStudent = async (studentId, studentData) => {
  const response = await axios.put(`/api/students/${studentId}`, studentData);
  return response.data;
};

/**
 * Delete one or more student records
 * @param {string|Array<string>} studentIds - Single ID or array of IDs
 * @returns {Promise<Object>} API Response
 */
export const deleteStudents = async (studentIds) => {
  const idsParam = Array.isArray(studentIds) ? studentIds.join(',') : studentIds;
  const response = await axios.delete(`/api/students/${idsParam}`);
  return response.data;
};
