/** Sidebar sections (excluding Dashboard overview) */
export const tableSections = [
  { id: 'students', label: 'Students', icon: 'users' },
  { id: 'attendance', label: 'Attendance', icon: 'check' },
  { id: 'marks', label: 'Marks', icon: 'marks' },
  { id: 'timetable', label: 'Timetable', icon: 'calendar' },
  { id: 'teachers', label: 'Teachers', icon: 'teacher' },
  { id: 'newStudentInquiry', label: 'New Student Inquiry', icon: 'inquiry' },
  { id: 'exam', label: 'Exam', icon: 'exam' },
  { id: 'tasks', label: 'Tasks', icon: 'tasks' },
  { id: 'activeSession', label: 'Active Session', icon: 'session' },
];

export const menuItems = [
  { id: 'dashboard', label: 'Dashboard', icon: 'grid' },
  { id: 'studentDashboard', label: 'Student Dashboard', icon: 'users' },
  ...tableSections,
];

export const pageTitles = {
  dashboard: { title: 'Dashboard', subtitle: 'Admin & Teacher Overview' },
  studentDashboard: { title: 'Student Dashboard', subtitle: 'Student Performance & Analytics' },
  students: { title: 'Students', subtitle: 'Student records' },
  attendance: { title: 'Attendance', subtitle: 'Class attendance (e.g. class 11G)' },
  marks: { title: 'Marks', subtitle: 'Exam marks by student' },
  timetable: { title: 'Timetable', subtitle: 'Class timetable' },
  teachers: { title: 'Teachers', subtitle: 'Faculty records' },
  newStudentInquiry: { title: 'New Student Inquiry', subtitle: 'Incoming student inquiries' },
  exam: { title: 'Exam', subtitle: 'Exam schedules and records' },
  tasks: { title: 'Tasks', subtitle: 'Task management and tracking' },
  activeSession: { title: 'Active Session', subtitle: 'Active user login roles & sessions' },
};
