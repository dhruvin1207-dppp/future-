import { useMemo, useState } from 'react';
import StatCard from '../components/ui/StatCard';
import ChartCard from '../components/ui/ChartCard';
import StudentIdFilter from '../components/ui/StudentIdFilter';
import AttendanceDonutChart from '../components/charts/AttendanceDonutChart';
import MarksBySubjectPieChart from '../components/charts/MarksBySubjectPieChart';
import StudentVsClassAverageChart from '../components/charts/StudentVsClassAverageChart';
import { normalizeStudentId } from '../utils/studentId';
import { groupMarksBySubject } from '../utils/marksParser';

const StatIcons = {
  attendance: (
    <svg className="h-6 w-6" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1.75}>
      <path strokeLinecap="round" d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z" />
    </svg>
  ),
  marks: (
    <svg className="h-6 w-6" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1.75}>
      <path strokeLinecap="round" d="M11 3.055A9.001 9.001 0 1020.945 13H11V3.055z" />
    </svg>
  ),
  rating: (
    <svg className="h-6 w-6" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1.75}>
      <path strokeLinecap="round" strokeLinejoin="round" d="M11.049 2.927c.3-.921 1.603-.921 1.902 0l1.519 4.674a1 1 0 00.95.69h4.907c.969 0 1.371 1.24.588 1.81l-3.97 2.883a1 1 0 00-.364 1.118l1.518 4.674c.3.922-.755 1.688-1.538 1.118l-3.971-2.883a1 1 0 00-1.175 0l-3.97 2.883c-.783.57-1.838-.197-1.538-1.118l1.518-4.674a1 1 0 00-.364-1.118L2.98 10.1c-.783-.57-.38-1.81.588-1.81h4.907a1 1 0 00.95-.69l1.519-4.674z" />
    </svg>
  ),
};

export default function StudentDashboardPage({ data }) {
  const [selectedStudentId, setSelectedStudentId] = useState('');

  const { charts, allStudents, recentStudents } = data;
  const students = allStudents || recentStudents || [];

  // Get all student IDs from students list
  const allStudentIds = useMemo(
    () => students.map((s) => s.studentId) || [],
    [students]
  );

  // Set default student on first load
  const effectiveStudentId = useMemo(() => {
    if (selectedStudentId) return selectedStudentId;
    return allStudentIds[0] || '';
  }, [selectedStudentId, allStudentIds]);

  // Get selected student info
  const selectedStudent = useMemo(() => {
    return students.find((s) => normalizeStudentId(s.studentId) === normalizeStudentId(effectiveStudentId));
  }, [effectiveStudentId, students]);

  // Filter attendance data for selected student
  const filteredAttendance = useMemo(() => {
    const match = charts.attendanceByStudent?.find(
      (s) =>
        normalizeStudentId(s.studentId) === normalizeStudentId(effectiveStudentId) ||
        (selectedStudent?.name &&
          s.studentName &&
          (String(s.studentName).toLowerCase().includes(String(selectedStudent.name).toLowerCase().trim()) ||
           String(selectedStudent.name).toLowerCase().includes(String(s.studentName).toLowerCase().trim())))
    );
    if (match) {
      return {
        percentage: match.value,
        centerLabel: selectedStudent?.studentId || match.studentId,
        subtitle: `${match.present} present / ${match.total} classes`,
        studentName: selectedStudent?.name || match.studentName || match.studentId,
      };
    }
    return {
      percentage: 0,
      centerLabel: effectiveStudentId,
      subtitle: 'No attendance data',
      studentName: selectedStudent?.name || effectiveStudentId,
    };
  }, [effectiveStudentId, charts, selectedStudent]);

  // Get student's marks by subject as array for pie chart
  const studentMarksBySubject = useMemo(() => {
    if (!charts.marksRecords) {
      console.log('❌ No marksRecords in charts');
      return [];
    }
    return groupMarksBySubject(charts.marksRecords, effectiveStudentId);
  }, [charts.marksRecords, effectiveStudentId]);

  // Get entire class average marks by subject for comparison chart
  const classMarksBySubject = useMemo(() => {
    if (!charts.marksRecords) return [];
    return groupMarksBySubject(charts.marksRecords, 'all');
  }, [charts.marksRecords]);

  // Calculate selected student's average marks (across all subjects)
  const selectedStudentAvgMarks = useMemo(() => {
    if (!charts.marksRecords) return 0;
    const studentRecords = charts.marksRecords.filter(
      (m) =>
        normalizeStudentId(m.studentId) === normalizeStudentId(effectiveStudentId) ||
        (selectedStudent?.name &&
          m.studentName &&
          String(m.studentName).toLowerCase().includes(String(selectedStudent.name).toLowerCase().trim()))
    );
    if (studentRecords.length === 0) return 0;
    const avgPercent = studentRecords.reduce((acc, m) => acc + (m.percent || 0), 0) / studentRecords.length;
    return Math.round(avgPercent);
  }, [effectiveStudentId, charts.marksRecords, selectedStudent]);

  // Determine performance rating label and card accent
  const performanceRating = useMemo(() => {
    if (!selectedStudentAvgMarks) return { label: 'No Data', accent: 'blue' };
    const avg = Number(selectedStudentAvgMarks);
    if (avg >= 85) return { label: 'Excellent', accent: 'green' };
    if (avg >= 70) return { label: 'Good', accent: 'indigo' };
    if (avg >= 50) return { label: 'Average', accent: 'amber' };
    return { label: 'Needs Attention', accent: 'rose' };
  }, [selectedStudentAvgMarks]);

  return (
    <div className="space-y-6">
      {/* Student Selector */}
      <div className="rounded-xl border border-slate-100 bg-white shadow-card dark:border-slate-800 dark:bg-slate-900 dark:shadow-card-dark">
        <div className="border-b border-slate-100 px-4 py-4 sm:px-6 dark:border-slate-800">
          <h2 className="text-lg font-semibold text-slate-900 dark:text-white">Select Student</h2>
          <p className="mt-1 text-sm text-slate-500 dark:text-slate-400">
            Choose a student to view their performance data
          </p>
          <div className="mt-4 w-full max-w-xs">
            <StudentIdFilter
              label="Student ID"
              value={effectiveStudentId}
              onChange={setSelectedStudentId}
              students={students}
              studentIds={allStudentIds}
            />
          </div>
        </div>
      </div>

      {/* Student Metrics Cards */}
      {selectedStudent && (
        <div className="rounded-xl border border-slate-100 bg-white shadow-card dark:border-slate-800 dark:bg-slate-900 dark:shadow-card-dark">
          <div className="border-b border-slate-100 px-4 py-4 sm:px-6 dark:border-slate-800">
            <h2 className="text-lg font-semibold text-slate-900 dark:text-white">
              {selectedStudent.name} - {selectedStudent.studentId}
            </h2>
            <p className="mt-1 text-sm text-slate-500 dark:text-slate-400">
              Class: <span className="font-medium text-slate-900 dark:text-white">{selectedStudent.className}</span>
            </p>
          </div>
          <div className="grid grid-cols-2 gap-3 p-3 sm:gap-4 sm:p-6 lg:grid-cols-3">
            <StatCard
              title="Attendance %"
              value={filteredAttendance.percentage}
              icon={StatIcons.attendance}
              accent="blue"
            />
            <StatCard
              title="Average Marks %"
              value={selectedStudentAvgMarks}
              icon={StatIcons.marks}
              accent="amber"
            />
            <StatCard
              title="Performance Rating"
              value={performanceRating.label}
              icon={StatIcons.rating}
              accent={performanceRating.accent}
            />
          </div>
        </div>
      )}

      {/* Performance Charts */}
      <div className="grid grid-cols-1 gap-4 lg:grid-cols-2">
        <ChartCard
          title="Attendance"
          subtitle={filteredAttendance.subtitle}
        >
          <AttendanceDonutChart
            percentage={filteredAttendance.percentage}
            centerLabel={filteredAttendance.centerLabel}
          />
        </ChartCard>

        <ChartCard
          title="Marks by Subject"
          subtitle={`Subject scores for ${selectedStudent?.name || effectiveStudentId}`}
        >
          {studentMarksBySubject.length > 0 ? (
            <MarksBySubjectPieChart data={studentMarksBySubject} />
          ) : (
            <p className="flex h-full items-center justify-center text-sm text-slate-500">
              No marks data available for this student.
            </p>
          )}
        </ChartCard>
      </div>

      {/* Comparison Chart */}
      {studentMarksBySubject.length > 0 && (
        <div className="mt-6">
          <ChartCard
            title="Student vs. Class Average"
            subtitle={`Comparison of scores for ${selectedStudent?.name || effectiveStudentId} against the class average per subject`}
          >
            <StudentVsClassAverageChart
              studentData={studentMarksBySubject}
              classData={classMarksBySubject}
            />
          </ChartCard>
        </div>
      )}

    </div>
  );
}
