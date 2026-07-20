import { useState, useEffect } from 'react';

// Helper: Pick a value from an object based on multiple possible keys
const pick = (obj, ...keys) => {
  if (!obj) return '';
  const objKeys = Object.keys(obj);
  for (const k of keys) {
    const normK = k.toLowerCase().replace(/[\s_-]+/g, '');
    const matchedKey = objKeys.find(
      (ok) => ok.toLowerCase().replace(/[\s_-]+/g, '') === normK
    );
    if (matchedKey !== undefined && obj[matchedKey] !== undefined && obj[matchedKey] !== null && obj[matchedKey] !== '') {
      return obj[matchedKey];
    }
  }
  return '';
};

export default function InquiryModals({
  isOpen,
  mode, // 'add' | 'edit' | 'delete'
  inquiryData, // selected inquiry data for edit/delete
  selectedRows = [], // for batch delete
  onClose,
  onSave, // (data) => Promise
  loading,
}) {
  const [formData, setFormData] = useState({
    name: '',
    board: 'GSEB',
    medium: 'English',
    standard: '11th',
    group: 'A Group',
    phone: '',
  });

  const [errors, setErrors] = useState({});

  useEffect(() => {
    if (isOpen) {
      setErrors({});
      if (mode === 'edit' && inquiryData) {
        setFormData({
          name: pick(inquiryData, 'Student Name', 'name', 'studentName'),
          board: pick(inquiryData, 'Board', 'board') || 'GSEB',
          medium: pick(inquiryData, 'Medium', 'medium') || 'English',
          standard: pick(inquiryData, 'Standard', 'standard') || '11th',
          group: pick(inquiryData, 'Group', 'group') || 'A Group',
          phone: pick(inquiryData, 'Phone Number', 'phone', 'phoneNumber'),
        });
      } else {
        setFormData({
          name: '',
          board: 'GSEB',
          medium: 'English',
          standard: '11th',
          group: 'A Group',
          phone: '',
        });
      }
    }
  }, [isOpen, mode, inquiryData]);

  // Keyboard listener: Escape -> Close
  useEffect(() => {
    const handleKeyDown = (e) => {
      if (!isOpen) return;
      if (e.key === 'Escape') onClose();
    };
    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [isOpen, onClose]);

  if (!isOpen) return null;

  const handleChange = (e) => {
    const { name, value } = e.target;
    setFormData((prev) => ({ ...prev, [name]: value }));
    if (errors[name]) {
      setErrors((prev) => {
        const next = { ...prev };
        delete next[name];
        return next;
      });
    }
  };

  const validate = () => {
    const tempErrors = {};
    if (!formData.name.trim()) tempErrors.name = 'Student Name is required.';
    if (!formData.phone.trim()) tempErrors.phone = 'Phone number is required.';
    setErrors(tempErrors);
    return Object.keys(tempErrors).length === 0;
  };

  const handleSubmit = (e) => {
    if (e) e.preventDefault();
    if (mode === 'delete') {
      onSave(formData);
      return;
    }
    if (validate()) {
      onSave(formData);
    }
  };

  if (mode === 'delete') {
    const recordsToDelete = selectedRows.length > 0 ? selectedRows : [inquiryData].filter(Boolean);
    return (
      <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/45 backdrop-blur-sm" onClick={onClose}>
        <div 
          className="w-full max-w-md rounded-2xl bg-white p-6 shadow-2xl transition-all dark:bg-slate-900 border border-slate-100 dark:border-slate-800"
          onClick={(e) => e.stopPropagation()}
        >
          <div className="flex h-12 w-12 items-center justify-center rounded-full bg-rose-50 dark:bg-rose-950/30 text-rose-600 dark:text-rose-400">
            <svg className="h-6 w-6" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
              <path strokeLinecap="round" strokeLinejoin="round" d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16" />
            </svg>
          </div>
          <h3 className="mt-4 text-lg font-bold text-slate-900 dark:text-white">Delete Inquiry Record(s)</h3>
          <p className="mt-2 text-sm text-slate-500 dark:text-slate-400">
            Are you sure you want to delete {recordsToDelete.length} record(s)? This action cannot be undone.
          </p>
          <div className="mt-6 flex justify-end gap-3">
            <button
              type="button"
              onClick={onClose}
              disabled={loading}
              className="rounded-lg border border-slate-200 bg-white px-4 py-2 text-sm font-semibold text-slate-700 transition hover:bg-slate-50 dark:border-slate-700 dark:bg-slate-800 dark:text-slate-300 dark:hover:bg-slate-700"
            >
              Cancel
            </button>
            <button
              type="button"
              onClick={handleSubmit}
              disabled={loading}
              className="inline-flex items-center justify-center gap-1.5 rounded-lg bg-rose-600 px-4 py-2 text-sm font-semibold text-white transition hover:bg-rose-500 active:scale-95 disabled:opacity-50"
            >
              {loading ? 'Deleting...' : 'Delete'}
            </button>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/45 backdrop-blur-sm" onClick={onClose}>
      <div 
        className="w-full max-w-lg rounded-2xl bg-white shadow-2xl transition-all dark:bg-slate-900 border border-slate-100 dark:border-slate-800 overflow-hidden"
        onClick={(e) => e.stopPropagation()}
      >
        <div className="flex items-center justify-between border-b border-slate-100 p-4 dark:border-slate-800">
          <h3 className="text-lg font-bold text-slate-900 dark:text-white">
            {mode === 'add' ? 'Add Student Inquiry' : 'Edit Student Inquiry'}
          </h3>
          <button 
            type="button" 
            onClick={onClose}
            className="rounded-lg p-1.5 text-slate-400 hover:bg-slate-50 dark:hover:bg-slate-800 transition"
          >
            <svg className="h-5 w-5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
              <path strokeLinecap="round" strokeLinejoin="round" d="M6 18L18 6M6 6l12 12" />
            </svg>
          </button>
        </div>

        <form onSubmit={handleSubmit} className="space-y-4 p-6">
          <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
            <div>
              <label className="text-xs font-semibold text-slate-500 dark:text-slate-400">Student Name</label>
              <input
                type="text"
                name="name"
                value={formData.name}
                onChange={handleChange}
                disabled={loading}
                placeholder="Student Full Name"
                className={`mt-1.5 w-full rounded-lg border px-3 py-2 text-sm outline-none transition focus:ring-2 focus:ring-brand-blue/20 dark:bg-slate-800 dark:text-white ${
                  errors.name ? 'border-rose-500 focus:border-rose-500' : 'border-slate-200 focus:border-brand-blue dark:border-slate-700'
                }`}
              />
              {errors.name && <p className="mt-1 text-xs text-rose-500">{errors.name}</p>}
            </div>

            <div>
              <label className="text-xs font-semibold text-slate-500 dark:text-slate-400">Board</label>
              <select
                name="board"
                value={formData.board}
                onChange={handleChange}
                disabled={loading}
                className="mt-1.5 w-full rounded-lg border border-slate-200 bg-white px-3 py-2 text-sm text-slate-900 outline-none focus:border-brand-blue dark:border-slate-700 dark:bg-slate-800 dark:text-white"
              >
                <option value="GSEB">GSEB</option>
                <option value="CBSE">CBSE</option>
                <option value="ICSE">ICSE</option>
                <option value="IB">IB</option>
                <option value="Other">Other</option>
              </select>
            </div>

            <div>
              <label className="text-xs font-semibold text-slate-500 dark:text-slate-400">Medium</label>
              <select
                name="medium"
                value={formData.medium}
                onChange={handleChange}
                disabled={loading}
                className="mt-1.5 w-full rounded-lg border border-slate-200 bg-white px-3 py-2 text-sm text-slate-900 outline-none focus:border-brand-blue dark:border-slate-700 dark:bg-slate-800 dark:text-white"
              >
                <option value="English">English</option>
                <option value="Gujarati">Gujarati</option>
                <option value="Hindi">Hindi</option>
                <option value="Other">Other</option>
              </select>
            </div>

            <div>
              <label className="text-xs font-semibold text-slate-500 dark:text-slate-400">Standard</label>
              <select
                name="standard"
                value={formData.standard}
                onChange={handleChange}
                disabled={loading}
                className="mt-1.5 w-full rounded-lg border border-slate-200 bg-white px-3 py-2 text-sm text-slate-900 outline-none focus:border-brand-blue dark:border-slate-700 dark:bg-slate-800 dark:text-white"
              >
                <option value="11th">11th</option>
                <option value="12th">12th</option>
                <option value="Other">Other</option>
              </select>
            </div>

            <div>
              <label className="text-xs font-semibold text-slate-500 dark:text-slate-400">Group</label>
              <select
                name="group"
                value={formData.group}
                onChange={handleChange}
                disabled={loading}
                className="mt-1.5 w-full rounded-lg border border-slate-200 bg-white px-3 py-2 text-sm text-slate-900 outline-none focus:border-brand-blue dark:border-slate-700 dark:bg-slate-800 dark:text-white"
              >
                <option value="A Group">A Group</option>
                <option value="B Group">B Group</option>
                <option value="AB Group">AB Group</option>
                <option value="Commerce">Commerce</option>
                <option value="Arts">Arts</option>
                <option value="Other">Other</option>
              </select>
            </div>

            <div>
              <label className="text-xs font-semibold text-slate-500 dark:text-slate-400">Phone Number</label>
              <input
                type="text"
                name="phone"
                value={formData.phone}
                onChange={handleChange}
                disabled={loading}
                placeholder="Mobile number"
                className={`mt-1.5 w-full rounded-lg border px-3 py-2 text-sm outline-none transition focus:ring-2 focus:ring-brand-blue/20 dark:bg-slate-800 dark:text-white ${
                  errors.phone ? 'border-rose-500 focus:border-rose-500' : 'border-slate-200 focus:border-brand-blue dark:border-slate-700'
                }`}
              />
              {errors.phone && <p className="mt-1 text-xs text-rose-500">{errors.phone}</p>}
            </div>
          </div>

          <div className="flex justify-end gap-3 pt-4 border-t border-slate-100 dark:border-slate-800">
            <button
              type="button"
              onClick={onClose}
              disabled={loading}
              className="rounded-lg border border-slate-200 bg-white px-4 py-2 text-sm font-semibold text-slate-700 transition hover:bg-slate-50 dark:border-slate-700 dark:bg-slate-800 dark:text-slate-300 dark:hover:bg-slate-700"
            >
              Cancel
            </button>
            <button
              type="submit"
              disabled={loading}
              className="inline-flex items-center justify-center gap-1.5 rounded-lg bg-brand-blue px-5 py-2 text-sm font-semibold text-white transition hover:bg-brand-blue/90 shadow-sm active:scale-95 disabled:opacity-50"
            >
              {loading ? (
                <>
                  <div className="h-3.5 w-3.5 animate-spin rounded-full border-2 border-white border-t-transparent" />
                  Saving...
                </>
              ) : mode === 'add' ? (
                'Save Inquiry'
              ) : (
                'Update Inquiry'
              )}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}
