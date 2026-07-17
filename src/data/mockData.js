export const mockDashboardData = {
  stats: {
    totalStudents: 4,
    activeStudents: 4,
    totalTeachers: 6,
    newInquiries: 3,
    totalExams: 5,
    attendancePercentage: 82,
    averageMarks: 74,
  },
  recentStudents: [
    { id: 1, studentId: 'st101', name: 'Het', className: '11', section: 'G', joiningDate: '—', active: true },
    { id: 2, studentId: 'st102', name: 'Student 2', className: '11', section: 'G', joiningDate: '—', active: true },
    { id: 3, studentId: 'st103', name: 'Student 3', className: '11', section: 'G', joiningDate: '—', active: true },
    { id: 4, studentId: 'st104', name: 'Student 4', className: '12', section: 'A', joiningDate: '—', active: true },
  ],
  charts: {
    attendancePercentage: 82,
    attendanceByStudent: [
      { studentId: 'st101', value: 75, present: 6, total: 8 },
      { studentId: 'st102', value: 88, present: 7, total: 8 },
      { studentId: 'st103', value: 88, present: 7, total: 8 },
      { studentId: 'st104', value: 75, present: 6, total: 8 },
    ],
    marksByStudent: [
      { studentId: 'st101', value: 78, examCount: 3, averageObtained: 78 },
      { studentId: 'st102', value: 65, examCount: 3, averageObtained: 54 },
    ],
    marksRecords: [
      { studentId: 'st101', displayId: 'st101', subject: 'physics', percent: 79, obtained: 79, total: 100 },
      { studentId: 'st101', displayId: 'st101', subject: 'chemistry', percent: 90, obtained: 90, total: 100 },
      { studentId: 'st101', displayId: 'st101', subject: 'physics', percent: 65, obtained: 52, total: 80 },
      { studentId: 'st102', displayId: 'st102', subject: 'maths', percent: 84, obtained: 84, total: 100 },
      { studentId: 'st102', displayId: 'st102', subject: 'English', percent: 56, obtained: 45, total: 80 },
      { studentId: 'st102', displayId: 'st102', subject: 'maths', percent: 80, obtained: 32, total: 40 },
    ],
  },
  classFilters: ['All Classes', '11', '12'],
  lastUpdated: new Date().toISOString(),
  source: 'mock',
};
