import StatCard from '../components/ui/StatCard';
import TaskStats from '../components/ui/TaskStats';
import { useLiveTaskData } from '../hooks/useLiveTaskData';

const StatIcons = {
  students: (
    <svg className="h-6 w-6" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1.75}>
      <path strokeLinecap="round" d="M17 20h5v-2a4 4 0 00-5-3.87M9 20H4v-2a4 4 0 015-3.87M16 7a4 4 0 11-8 0 4 4 0 018 0z" />
    </svg>
  ),
  teachers: (
    <svg className="h-6 w-6" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1.75}>
      <path strokeLinecap="round" d="M19 21V5a2 2 0 00-2-2H7a2 2 0 00-2 2v16m14 0H5m14 0h2m-16 0H3m2-16h10" />
    </svg>
  ),
  inquiry: (
    <svg className="h-6 w-6" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1.75}>
      <path strokeLinecap="round" d="M3 8l7.89 5.26a2 2 0 002.22 0L21 8M5 19h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v10a2 2 0 002 2z" />
    </svg>
  ),
  exam: (
    <svg className="h-6 w-6" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1.75}>
      <path strokeLinecap="round" d="M9 5H7a2 2 0 00-2 2v12a2 2 0 002 2h10a2 2 0 002-2V7a2 2 0 00-2-2h-2" />
    </svg>
  ),
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
};

export default function DashboardPage({ data, onNavigate }) {
  const { stats } = data;
  const { stats: taskStats } = useLiveTaskData();

  const taskIcon = (
    <svg className="h-6 w-6" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1.75}>
      <path strokeLinecap="round" d="M9 5H7a2 2 0 00-2 2v12a2 2 0 002 2h10a2 2 0 002-2V7a2 2 0 00-2-2h-2M9 5a2 2 0 002 2h2a2 2 0 002-2M9 5a2 2 0 012-2h2a2 2 0 012 2" />
    </svg>
  );

  return (
    <div className="space-y-6">
      {/* Admin/Teacher Overview Cards */}
      <div className="grid grid-cols-2 gap-3 sm:gap-4 xl:grid-cols-4">
        <StatCard 
          title="Total Students" 
          value={stats.totalStudents} 
          icon={StatIcons.students} 
          accent="blue" 
          onClick={() => onNavigate('studentDashboard')}
        />
        <StatCard 
          title="Teachers" 
          value={stats.totalTeachers} 
          icon={StatIcons.teachers} 
          accent="green" 
          onClick={() => onNavigate('teachers')}
        />
        <StatCard 
          title="New Inquiries" 
          value={stats.newInquiries} 
          icon={StatIcons.inquiry} 
          accent="purple" 
          onClick={() => onNavigate('newStudentInquiry')}
        />
        <StatCard 
          title="Total Tasks" 
          value={taskStats?.total || 0} 
          icon={taskIcon} 
          accent="indigo" 
          onClick={() => onNavigate('tasks')}
        />
      </div>

      {/* Task Management Section */}
      <div className="rounded-xl border border-slate-100 bg-white shadow-card dark:border-slate-800 dark:bg-slate-900 dark:shadow-card-dark">
        <div className="border-b border-slate-100 px-4 py-4 sm:px-6 dark:border-slate-800">
          <h2 className="text-lg font-semibold text-slate-900 dark:text-white">Task Overview</h2>
          <p className="mt-1 text-sm text-slate-500 dark:text-slate-400">
            Live task management statistics · auto-refreshes every 5 seconds
          </p>
        </div>
        <div className="p-4 sm:p-6">
          {taskStats ? (
            <TaskStats stats={taskStats} />
          ) : (
            <p className="text-center text-sm text-slate-500 dark:text-slate-400">
              No task data available. Configure task sheet in settings.
            </p>
          )}
        </div>
      </div>

      {/* Exam Section */}
      <div className="rounded-xl border border-slate-100 bg-white shadow-card dark:border-slate-800 dark:bg-slate-900 dark:shadow-card-dark">
        <div className="border-b border-slate-100 px-4 py-4 sm:px-6 dark:border-slate-800">
          <h2 className="text-lg font-semibold text-slate-900 dark:text-white">Exam Management</h2>
          <p className="mt-1 text-sm text-slate-500 dark:text-slate-400">
            Total exams scheduled: <span className="font-semibold text-slate-900 dark:text-white">{stats.totalExams}</span>
          </p>
        </div>
        <div className="flex items-center justify-center p-8 sm:p-12">
          <p className="text-center text-slate-500 dark:text-slate-400">
            Go to <span className="font-medium text-slate-700 dark:text-slate-300">Exam</span> section to manage exams
          </p>
        </div>
      </div>
    </div>
  );
}
