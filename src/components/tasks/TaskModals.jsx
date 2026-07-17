import { useState, useEffect } from 'react';
import axios from 'axios';

const EMPTY_FORM = {
  name: '',
  assigneeId: '',
  dueDate: '',
  priority: 'Normal',
  status: 'Pending',
};

const PRIORITY_OPTIONS = ['Normal', 'Low', 'Medium', 'High', 'Urgent_important'];
const STATUS_OPTIONS   = ['Pending', 'In Progress', 'Completed', 'On Hold'];

export default function TaskModals({ isOpen, mode, taskData, onClose, onSave, loading }) {
  const [formData, setFormData]   = useState(EMPTY_FORM);
  const [teachers, setTeachers]   = useState([]);
  const [teachersLoading, setTeachersLoading] = useState(false);
  const [errors, setErrors]       = useState({});

  // Populate form when editing
  useEffect(() => {
    if (!isOpen) return;
    setErrors({});
    if (mode === 'edit' && taskData) {
      setFormData({
        name:       taskData.name        || '',
        assigneeId: taskData.assigneeId  || '',
        dueDate:    taskData.dueDate     || '',
        priority:   taskData.rawPriority || taskData.priority || 'Normal',
        status:     taskData.rawStatus   || taskData.status   || 'Pending',
      });
    } else {
      setFormData(EMPTY_FORM);
    }
  }, [isOpen, mode, taskData]);

  // Load teachers list for assignee dropdown
  useEffect(() => {
    if (!isOpen || mode === 'delete') return;
    setTeachersLoading(true);
    axios.get('/api/teachers-list')
      .then(res => setTeachers(res.data.teachers || []))
      .catch(() => setTeachers([]))
      .finally(() => setTeachersLoading(false));
  }, [isOpen, mode]);

  // Escape to close
  useEffect(() => {
    const handleKey = (e) => { if (isOpen && e.key === 'Escape') onClose(); };
    window.addEventListener('keydown', handleKey);
    return () => window.removeEventListener('keydown', handleKey);
  }, [isOpen, onClose]);

  if (!isOpen) return null;

  const handleChange = (e) => {
    const { name, value } = e.target;
    setFormData(prev => ({ ...prev, [name]: value }));
    if (errors[name]) setErrors(prev => { const n = { ...prev }; delete n[name]; return n; });
  };

  const validate = () => {
    const errs = {};
    if (!formData.name.trim()) errs.name = 'Task name is required.';
    setErrors(errs);
    return Object.keys(errs).length === 0;
  };

  const handleSubmit = (e) => {
    if (e) e.preventDefault();
    if (mode === 'delete') { onSave(formData); return; }
    if (validate()) onSave(formData);
  };

  // ── DELETE ──────────────────────────────────────────────────
  if (mode === 'delete') {
    return (
      <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/40 backdrop-blur-sm">
        <div className="w-full max-w-md rounded-2xl border border-slate-100 bg-white p-6 shadow-xl dark:border-slate-800 dark:bg-slate-900 animate-in fade-in-50 zoom-in-95 duration-200"
          onClick={e => e.stopPropagation()}>
          <div className="flex h-12 w-12 items-center justify-center rounded-full bg-rose-50 text-rose-600 dark:bg-rose-950/30 dark:text-rose-400">
            <svg className="h-6 w-6" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
              <path strokeLinecap="round" strokeLinejoin="round" d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16" />
            </svg>
          </div>
          <div className="mt-4">
            <h3 className="text-lg font-semibold text-slate-900 dark:text-white">Delete Task</h3>
            <p className="mt-2 text-sm text-slate-500 dark:text-slate-400">
              Are you sure you want to delete <strong className="text-slate-700 dark:text-slate-200">"{taskData?.name}"</strong>? This cannot be undone.
            </p>
          </div>
          <div className="mt-6 flex justify-end gap-3">
            <button type="button" onClick={onClose} disabled={loading}
              className="rounded-lg border border-slate-200 bg-white px-4 py-2 text-sm font-semibold text-slate-700 hover:bg-slate-50 dark:border-slate-700 dark:bg-slate-800 dark:text-slate-300">
              Cancel
            </button>
            <button type="button" onClick={handleSubmit} disabled={loading}
              className="inline-flex items-center gap-1.5 rounded-lg bg-rose-600 px-4 py-2 text-sm font-semibold text-white hover:bg-rose-500 active:scale-95 disabled:opacity-50">
              {loading ? <><Spinner />Deleting...</> : 'Delete'}
            </button>
          </div>
        </div>
      </div>
    );
  }

  // ── ADD / EDIT ──────────────────────────────────────────────
  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/45 backdrop-blur-sm overflow-y-auto" onClick={onClose}>
      <div className="w-full max-w-lg rounded-2xl border border-slate-100 bg-white shadow-xl dark:border-slate-800 dark:bg-slate-900 my-8 animate-in fade-in-50 zoom-in-95 duration-200"
        onClick={e => e.stopPropagation()}>

        {/* Header */}
        <div className="flex items-center justify-between border-b border-slate-100 px-6 py-4 dark:border-slate-800">
          <h3 className="text-lg font-bold text-slate-900 dark:text-white">
            {mode === 'add' ? '📋 Add Task' : '✏️ Edit Task'}
          </h3>
          <button type="button" onClick={onClose}
            className="rounded-lg p-1.5 text-slate-400 hover:bg-slate-100 dark:hover:bg-slate-800">
            <svg className="h-5 w-5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
              <path strokeLinecap="round" strokeLinejoin="round" d="M6 18L18 6M6 6l12 12" />
            </svg>
          </button>
        </div>

        {/* Form */}
        <form onSubmit={handleSubmit} className="p-6 space-y-4">

          {/* Task Name */}
          <div>
            <label className="text-xs font-semibold text-slate-500 dark:text-slate-400">Task Name *</label>
            <input
              type="text" name="name" value={formData.name} onChange={handleChange} disabled={loading}
              placeholder="Describe the task..."
              className={`mt-1.5 w-full rounded-lg border px-3 py-2 text-sm outline-none transition focus:ring-2 focus:ring-brand-blue/20 dark:bg-slate-800 dark:text-white ${
                errors.name ? 'border-rose-500' : 'border-slate-200 focus:border-brand-blue dark:border-slate-700'
              }`}
            />
            {errors.name && <p className="mt-1 text-xs text-rose-500">{errors.name}</p>}
          </div>

          {/* Assignee — teacher dropdown */}
          <div>
            <label className="text-xs font-semibold text-slate-500 dark:text-slate-400">
              Assign To (Teacher)
              {teachersLoading && <span className="ml-2 text-brand-blue">Loading…</span>}
            </label>
            <select
              name="assigneeId" value={formData.assigneeId} onChange={handleChange} disabled={loading || teachersLoading}
              className="mt-1.5 w-full rounded-lg border border-slate-200 px-3 py-2 text-sm outline-none transition focus:border-brand-blue focus:ring-2 focus:ring-brand-blue/20 dark:border-slate-700 dark:bg-slate-800 dark:text-white"
            >
              <option value="">— Select Teacher —</option>
              {teachers.map(t => (
                <option key={t.id} value={t.id}>
                  {t.id}{t.name ? ` — ${t.name}` : ''}
                </option>
              ))}
              {/* Keep existing value if not in list */}
              {formData.assigneeId && !teachers.find(t => t.id === formData.assigneeId) && (
                <option value={formData.assigneeId}>{formData.assigneeId} (current)</option>
              )}
            </select>
          </div>

          {/* Due Date */}
          <div>
            <label className="text-xs font-semibold text-slate-500 dark:text-slate-400">Due Date</label>
            <input
              type="date" name="dueDate" value={formData.dueDate} onChange={handleChange} disabled={loading}
              className="mt-1.5 w-full rounded-lg border border-slate-200 px-3 py-2 text-sm outline-none transition focus:border-brand-blue focus:ring-2 focus:ring-brand-blue/20 dark:border-slate-700 dark:bg-slate-800 dark:text-white"
            />
          </div>

          {/* Priority & Status */}
          <div className="grid grid-cols-2 gap-4">
            <div>
              <label className="text-xs font-semibold text-slate-500 dark:text-slate-400">Priority</label>
              <select
                name="priority" value={formData.priority} onChange={handleChange} disabled={loading}
                className="mt-1.5 w-full rounded-lg border border-slate-200 px-3 py-2 text-sm outline-none transition focus:border-brand-blue dark:border-slate-700 dark:bg-slate-800 dark:text-white"
              >
                {PRIORITY_OPTIONS.map(p => <option key={p} value={p}>{p}</option>)}
              </select>
            </div>
            <div>
              <label className="text-xs font-semibold text-slate-500 dark:text-slate-400">Status</label>
              <select
                name="status" value={formData.status} onChange={handleChange} disabled={loading}
                className="mt-1.5 w-full rounded-lg border border-slate-200 px-3 py-2 text-sm outline-none transition focus:border-brand-blue dark:border-slate-700 dark:bg-slate-800 dark:text-white"
              >
                {STATUS_OPTIONS.map(s => <option key={s} value={s}>{s}</option>)}
              </select>
            </div>
          </div>

          {/* Footer */}
          <div className="flex justify-end gap-3 pt-4 border-t border-slate-100 dark:border-slate-800">
            <button type="button" onClick={onClose} disabled={loading}
              className="rounded-lg border border-slate-200 bg-white px-4 py-2 text-sm font-semibold text-slate-700 hover:bg-slate-50 dark:border-slate-700 dark:bg-slate-800 dark:text-slate-300">
              Cancel
            </button>
            <button type="submit" disabled={loading}
              className="inline-flex items-center gap-1.5 rounded-lg bg-brand-blue px-5 py-2 text-sm font-semibold text-white hover:bg-brand-blue/90 shadow-sm active:scale-95 disabled:opacity-50">
              {loading ? <><Spinner />{mode === 'add' ? 'Adding…' : 'Saving…'}</> : mode === 'add' ? 'Add Task' : 'Save Changes'}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}

function Spinner() {
  return <div className="h-3.5 w-3.5 animate-spin rounded-full border-2 border-white border-t-transparent" />;
}
