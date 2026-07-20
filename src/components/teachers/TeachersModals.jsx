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

export default function TeachersModals({
  isOpen,
  mode, // 'add' | 'edit' | 'delete'
  teacherData, // selected teacher data for edit/delete
  selectedRows = [], // for batch delete
  existingTeacherIds = [], // list of taken teacher IDs to check duplicates
  onClose,
  onSave, // (data) => Promise
  loading,
}) {
  const [formData, setFormData] = useState({
    teacherId: '',
    name: '',
    subject: '',
    phone: '',
    email: '',
    joiningDate: '',
  });

  const [errors, setErrors] = useState({});

  useEffect(() => {
    if (isOpen) {
      setErrors({});
      if (mode === 'edit' && teacherData) {
        setFormData({
          teacherId: pick(teacherData, 'teacher_id', 'teacherId'),
          name: pick(teacherData, 'teacher_name', 'name', 'teacherName'),
          subject: pick(teacherData, 'Subject', 'subject'),
          phone: pick(teacherData, 'Phone number', 'phone', 'phoneNumber'),
          email: pick(teacherData, 'Email', 'email'),
          joiningDate: pick(teacherData, 'Joining date', 'joiningDate', 'date'),
        });
      } else {
        // Auto-calculate the next sequential ID
        let maxIdNum = 1000;
        existingTeacherIds.forEach(idStr => {
          const numPart = parseInt(idStr.replace(/^FT/i, ''));
          if (!isNaN(numPart) && numPart > maxIdNum) {
            maxIdNum = numPart;
          }
        });
        const nextTeacherId = `FT${maxIdNum + 1}`;

        setFormData({
          teacherId: nextTeacherId,
          name: '',
          subject: '',
          phone: '',
          email: '',
          joiningDate: new Date().toISOString().split('T')[0].split('-').reverse().join('/'), // DD/MM/YYYY
        });
      }
    }
  }, [isOpen, mode, teacherData, existingTeacherIds]);

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
    if (!formData.teacherId.trim()) {
      tempErrors.teacherId = 'Teacher ID is required.';
    } else if (mode === 'add' && existingTeacherIds.includes(formData.teacherId.trim())) {
      tempErrors.teacherId = 'Teacher ID already exists.';
    }
    if (!formData.name.trim()) tempErrors.name = 'Name is required.';
    if (!formData.subject.trim()) tempErrors.subject = 'Subject is required.';
    if (!formData.phone.trim()) tempErrors.phone = 'Phone number is required.';
    if (formData.email.trim() && !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(formData.email.trim())) {
      tempErrors.email = 'Please enter a valid email address.';
    }
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
    const recordsToDelete = selectedRows.length > 0 ? selectedRows : [teacherData].filter(Boolean);
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
          <h3 className="mt-4 text-lg font-bold text-slate-900 dark:text-white">Delete Teacher Record(s)</h3>
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
            {mode === 'add' ? 'Add Teacher' : 'Edit Teacher'}
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
              <label className="text-xs font-semibold text-slate-500 dark:text-slate-400">Teacher ID</label>
              <input
                type="text"
                name="teacherId"
                value={formData.teacherId}
                onChange={handleChange}
                disabled={loading}
                placeholder="e.g. FT1005"
                className={`mt-1.5 w-full rounded-lg border px-3 py-2 text-sm outline-none transition focus:ring-2 focus:ring-brand-blue/20 dark:bg-slate-800 dark:text-white ${
                  errors.teacherId ? 'border-rose-500 focus:border-rose-500' : 'border-slate-200 focus:border-brand-blue dark:border-slate-700'
                }`}
              />
              {errors.teacherId && <p className="mt-1 text-xs text-rose-500">{errors.teacherId}</p>}
            </div>

            <div>
              <label className="text-xs font-semibold text-slate-500 dark:text-slate-400">Teacher Name</label>
              <input
                type="text"
                name="name"
                value={formData.name}
                onChange={handleChange}
                disabled={loading}
                placeholder="Full Name"
                className={`mt-1.5 w-full rounded-lg border px-3 py-2 text-sm outline-none transition focus:ring-2 focus:ring-brand-blue/20 dark:bg-slate-800 dark:text-white ${
                  errors.name ? 'border-rose-500 focus:border-rose-500' : 'border-slate-200 focus:border-brand-blue dark:border-slate-700'
                }`}
              />
              {errors.name && <p className="mt-1 text-xs text-rose-500">{errors.name}</p>}
            </div>

            <div>
              <label className="text-xs font-semibold text-slate-500 dark:text-slate-400">Subject</label>
              <input
                type="text"
                name="subject"
                value={formData.subject}
                onChange={handleChange}
                disabled={loading}
                placeholder="e.g. CHEMISTRY"
                className={`mt-1.5 w-full rounded-lg border px-3 py-2 text-sm outline-none transition focus:ring-2 focus:ring-brand-blue/20 dark:bg-slate-800 dark:text-white ${
                  errors.subject ? 'border-rose-500 focus:border-rose-500' : 'border-slate-200 focus:border-brand-blue dark:border-slate-700'
                }`}
              />
              {errors.subject && <p className="mt-1 text-xs text-rose-500">{errors.subject}</p>}
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

            <div>
              <label className="text-xs font-semibold text-slate-500 dark:text-slate-400">Email Address</label>
              <input
                type="text"
                name="email"
                value={formData.email}
                onChange={handleChange}
                disabled={loading}
                placeholder="Email ID"
                className={`mt-1.5 w-full rounded-lg border px-3 py-2 text-sm outline-none transition focus:ring-2 focus:ring-brand-blue/20 dark:bg-slate-800 dark:text-white ${
                  errors.email ? 'border-rose-500 focus:border-rose-500' : 'border-slate-200 focus:border-brand-blue dark:border-slate-700'
                }`}
              />
              {errors.email && <p className="mt-1 text-xs text-rose-500">{errors.email}</p>}
            </div>

            <div>
              <label className="text-xs font-semibold text-slate-500 dark:text-slate-400">Joining Date</label>
              <input
                type="text"
                name="joiningDate"
                value={formData.joiningDate}
                onChange={handleChange}
                disabled={loading}
                placeholder="DD/MM/YYYY"
                className="mt-1.5 w-full rounded-lg border border-slate-200 px-3 py-2 text-sm outline-none transition focus:border-brand-blue focus:ring-2 focus:ring-brand-blue/20 dark:border-slate-700 dark:bg-slate-800 dark:text-white"
              />
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
                'Save Teacher'
              ) : (
                'Update Teacher'
              )}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}
