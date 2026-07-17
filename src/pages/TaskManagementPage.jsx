import { useLiveTaskData } from '../hooks/useLiveTaskData';
import TaskStats from '../components/ui/TaskStats';
import TaskTable from '../components/tables/TaskTable';

/**
 * Task Management Page
 * Shows task statistics and live task list with real-time refresh
 */
export default function TaskManagementPage() {
  const { tasks, stats, loading, error, lastUpdated, isConfigured } = useLiveTaskData();

  if (!isConfigured) {
    return (
      <div className="rounded-xl border border-amber-200 bg-amber-50 p-6 dark:border-amber-900/50 dark:bg-amber-950/30 sm:p-8">
        <h2 className="text-lg font-semibold text-amber-900 dark:text-amber-200">Task Sheet Not Configured</h2>
        <p className="mt-2 text-sm text-amber-800 dark:text-amber-300/90">
          Task management requires Google Sheets configuration in .env
        </p>
      </div>
    );
  }

  if (loading && !tasks.length) {
    return (
      <div className="flex min-h-[40vh] items-center justify-center">
        <div className="text-center">
          <div className="mx-auto h-10 w-10 animate-spin rounded-full border-4 border-brand-blue border-t-transparent" />
          <p className="mt-4 text-sm text-slate-500 dark:text-slate-400">Loading tasks…</p>
        </div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="rounded-xl border border-red-200 bg-red-50 p-6 dark:border-red-900/50 dark:bg-red-950/30 sm:p-8">
        <h2 className="text-lg font-semibold text-red-900 dark:text-red-200">Error Loading Tasks</h2>
        <p className="mt-2 text-sm text-red-800 dark:text-red-300/90">{error}</p>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* Task Statistics */}
      <div>
        <h2 className="mb-4 text-lg font-semibold text-slate-900 dark:text-white">Task Overview</h2>
        <TaskStats stats={stats} />
      </div>

      {/* Task List */}
      <div className="rounded-xl border border-slate-100 bg-white shadow-card dark:border-slate-800 dark:bg-slate-900 dark:shadow-card-dark">
        <div className="border-b border-slate-100 px-4 py-4 sm:px-6 dark:border-slate-800">
          <div className="flex flex-wrap items-center justify-between gap-2">
            <div>
              <h3 className="text-lg font-semibold text-slate-900 dark:text-white">All Tasks</h3>
              <p className="mt-1 text-sm text-slate-500 dark:text-slate-400">
                🔴 Live data from Google Sheets · {tasks.length} tasks
              </p>
            </div>
            {lastUpdated && (
              <span className="text-xs text-slate-400 dark:text-slate-500">
                Updated {new Date(lastUpdated).toLocaleTimeString()}
              </span>
            )}
          </div>
        </div>

        <div className="px-4 py-4 sm:px-6">
          <TaskTable tasks={tasks} />
        </div>
      </div>
    </div>
  );
}
