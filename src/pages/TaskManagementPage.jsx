import { useState, useCallback } from 'react';
import { useLiveTaskData } from '../hooks/useLiveTaskData';
import { clearSheetCache } from '../services/googleSheetsClient';
import { addTask, updateTask, deleteTaskEntries } from '../services/taskService';
import TaskStats from '../components/ui/TaskStats';
import TaskTable from '../components/tables/TaskTable';
import TaskModals from '../components/tasks/TaskModals';
import Toast from '../components/ui/Toast';

/**
 * Task Management Page — with Add / Edit / Delete
 */
export default function TaskManagementPage() {
  const { tasks, stats, loading, error, lastUpdated, isConfigured, refresh } = useLiveTaskData();

  const [selectedTask, setSelectedTask] = useState(null);
  const [modalOpen, setModalOpen]       = useState(false);
  const [modalMode, setModalMode]       = useState('add');
  const [crudLoading, setCrudLoading]   = useState(false);
  const [toast, setToast]               = useState(null);

  const openAdd    = () => { setSelectedTask(null); setModalMode('add');    setModalOpen(true); };
  const openEdit   = (task) => { setSelectedTask(task); setModalMode('edit');   setModalOpen(true); };
  const openDelete = (task) => { setSelectedTask(task); setModalMode('delete'); setModalOpen(true); };
  const closeModal = () => { setModalOpen(false); setSelectedTask(null); };

  const handleSave = useCallback(async (formData) => {
    setCrudLoading(true);
    try {
      if (modalMode === 'add') {
        await addTask(formData);
        setToast({ message: 'Task Added Successfully', type: 'success' });
      } else if (modalMode === 'edit') {
        await updateTask(selectedTask.id, formData);
        setToast({ message: 'Task Updated Successfully', type: 'success' });
      } else if (modalMode === 'delete') {
        await deleteTaskEntries([selectedTask.id]);
        setToast({ message: 'Task Deleted Successfully', type: 'success' });
      }
      clearSheetCache(); // bust cache
      refresh();         // re-fetch immediately
      closeModal();
    } catch (err) {
      setToast({ message: err.response?.data?.message || 'Failed. Please try again.', type: 'error' });
    } finally {
      setCrudLoading(false);
    }
  }, [modalMode, selectedTask, refresh]);

  // ── Error / Not-configured states ──
  if (!isConfigured) {
    return (
      <div className="rounded-xl border border-amber-200 bg-amber-50 p-6 dark:border-amber-900/50 dark:bg-amber-950/30 sm:p-8">
        <h2 className="text-lg font-semibold text-amber-900 dark:text-amber-200">Task Sheet Not Configured</h2>
        <p className="mt-2 text-sm text-amber-800 dark:text-amber-300/90">Task management requires Google Sheets configuration in .env</p>
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
      {/* Stats */}
      <div>
        <h2 className="mb-4 text-lg font-semibold text-slate-900 dark:text-white">Task Overview</h2>
        <TaskStats stats={stats} />
      </div>

      {/* Task List */}
      <div className="rounded-xl border border-slate-100 bg-white shadow-card dark:border-slate-800 dark:bg-slate-900 dark:shadow-card-dark">
        <div className="border-b border-slate-100 px-4 py-4 sm:px-6 dark:border-slate-800">
          <div className="flex flex-wrap items-center justify-between gap-3">
            <div className="min-w-0">
              <h3 className="text-base font-semibold text-slate-900 dark:text-white sm:text-lg">All Tasks</h3>
              <p className="mt-0.5 text-xs text-slate-500 dark:text-slate-400 sm:mt-1 sm:text-sm">
                🔴 Live · {tasks.length} tasks
              </p>
            </div>
            <div className="flex items-center gap-2">
              {lastUpdated && (
                <span className="hidden text-xs text-slate-400 dark:text-slate-500 sm:inline">
                  Updated {new Date(lastUpdated).toLocaleTimeString()}
                </span>
              )}
              {/* Add Task Button */}
              <button
                type="button" onClick={openAdd} disabled={crudLoading}
                className="inline-flex items-center gap-1.5 rounded-lg bg-emerald-600 px-3 py-2 text-sm font-semibold text-white hover:bg-emerald-500 shadow-sm active:scale-95 disabled:opacity-50"
              >
                <svg className="h-4 w-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2.5}>
                  <path strokeLinecap="round" strokeLinejoin="round" d="M12 4v16m8-8H4" />
                </svg>
                <span>Add Task</span>
              </button>
            </div>
          </div>
        </div>

        <div className="px-4 py-4 sm:px-6">
          <TaskTable tasks={tasks} onEdit={openEdit} onDelete={openDelete} />
        </div>
      </div>

      {/* Modals */}
      <TaskModals
        isOpen={modalOpen}
        mode={modalMode}
        taskData={selectedTask}
        onClose={closeModal}
        onSave={handleSave}
        loading={crudLoading}
      />

      {/* Toast */}
      {toast && (
        <Toast
          message={toast.message}
          type={toast.type}
          onClose={() => setToast(null)}
        />
      )}
    </div>
  );
}
