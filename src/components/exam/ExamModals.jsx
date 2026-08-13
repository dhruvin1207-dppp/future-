import { useState, useEffect } from 'react';

const EXAM_TYPES = ['weekly', 'Board', 'JEE/NEET', 'monthly', 'Session', 'prelim'];

export default function ExamModals({
  isOpen,
  mode, // 'add' | 'edit' | 'delete'
  examData, // selected exam data for edit
  onClose,
  onSave, // (data) => Promise
  loading,
}) {
  const [formData, setFormData] = useState({
    examDate: '',
    day: '',
    time: '',
    subject: '',
    examType: 'weekly',
    totalMarks: '',
    className: '',
    section: '',
  });

  const [errors, setErrors] = useState({});

  // Helper: Get Day of the week from DD-MM-YYYY string
  const getDayFromDate = (dateStr) => {
    if (!dateStr) return '';
    const parts = dateStr.trim().split('-');
    if (parts.length !== 3) return '';
    const dayVal = parseInt(parts[0], 10);
    const monthVal = parseInt(parts[1], 10) - 1;
    const yearVal = parseInt(parts[2], 10);
    const dateObj = new Date(yearVal, monthVal, dayVal);
    if (isNaN(dateObj.getTime())) return '';
    const days = ['Sunday', 'Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday', 'Saturday'];
    return days[dateObj.getDay()];
  };

  // Reset form when modal opens or mode/examData changes
  useEffect(() => {
    if (isOpen) {
      setErrors({});
      if (mode === 'edit' && examData) {
        setFormData({
          examDate: examData.examDate || examData['exam_date'] || examData['Exam Date'] || '',
          day: examData.day || examData['Day'] || '',
          time: examData.time || examData['Time'] || '',
          subject: examData.subject || examData['subject'] || '',
          examType: examData.examType || examData['exam Type'] || 'weekly',
          totalMarks: examData.totalMarks || examData['total Marks'] || '',
          className: examData.className || examData['Class'] || examData.class || '',
          section: examData.section || examData['section'] || '',
        });
      } else {
        setFormData({
          examDate: new Date().toLocaleDateString('en-GB').replace(/\//g, '-'), // DD-MM-YYYY
          day: getDayFromDate(new Date().toLocaleDateString('en-GB').replace(/\//g, '-')),
          time: '',
          subject: '',
          examType: 'weekly',
          totalMarks: '',
          className: '',
          section: '',
        });
      }
    }
  }, [isOpen, mode, examData]);

  // Keyboard listener: Escape -> Close
  useEffect(() => {
    const handleKeyDown = (e) => {
      if (!isOpen) return;
      if (e.key === 'Escape') {
        onClose();
      }
    };
    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [isOpen, onClose]);

  if (!isOpen) return null;

  const handleChange = (e) => {
    const { name, value } = e.target;
    
    // Auto detect Day if Date changes
    if (name === 'examDate') {
      const autoDay = getDayFromDate(value);
      setFormData((prev) => ({
        ...prev,
        [name]: value,
        day: autoDay || prev.day,
      }));
    } else {
      setFormData((prev) => ({ ...prev, [name]: value }));
    }

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
    
    // Required fields check
    const required = ['examDate', 'day', 'time', 'subject', 'examType', 'totalMarks', 'className', 'section'];
    required.forEach((field) => {
      if (!formData[field] || !String(formData[field]).trim()) {
        tempErrors[field] = 'This field is required.';
      }
    });

    // Date format validation (DD-MM-YYYY)
    const dateRegex = /^\d{2}-\d{2}-\d{4}$/;
    if (formData.examDate && !dateRegex.test(formData.examDate)) {
      tempErrors.examDate = 'Format must be DD-MM-YYYY (e.g. 28-05-2026).';
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

  // 1. DELETE CONFIRMATION MODAL
  if (mode === 'delete') {
    return (
      <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/40 backdrop-blur-sm">
        <div
          className="w-full max-w-md rounded-2xl border border-slate-100 bg-white p-6 shadow-xl dark:border-slate-800 dark:bg-slate-900 animate-in fade-in-50 zoom-in-95 duration-200"
          onClick={(e) => e.stopPropagation()}
        >
          <div className="flex h-12 w-12 items-center justify-center rounded-full bg-rose-50 text-rose-600 dark:bg-rose-950/30 dark:text-rose-400">
            <svg className="h-6 w-6" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
              <path strokeLinecap="round" strokeLinejoin="round" d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16" />
            </svg>
          </div>
          <div className="mt-4">
            <h3 className="text-lg font-semibold text-slate-900 dark:text-white">Delete Exam Entry</h3>
            <p className="mt-2 text-sm text-slate-500 dark:text-slate-400">
              Are you sure you want to delete the selected exam schedule entry/entries? This action cannot be undone.
            </p>
          </div>
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
              {loading ? (
                <>
                  <div className="h-3.5 w-3.5 animate-spin rounded-full border-2 border-white border-t-transparent" />
                  Deleting...
                </>
              ) : (
                'Delete'
              )}
            </button>
          </div>
        </div>
      </div>
    );
  }

  // 2. ADD & EDIT MODAL
  return (
    <div
      className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/45 backdrop-blur-sm overflow-y-auto"
      onClick={onClose}
    >
      <div
        className="w-full max-w-lg rounded-2xl border border-slate-100 bg-white shadow-xl dark:border-slate-800 dark:bg-slate-900 my-8 animate-in fade-in-50 zoom-in-95 duration-200"
        onClick={(e) => e.stopPropagation()}
      >
        {/* Header */}
        <div className="flex items-center justify-between border-b border-slate-100 px-6 py-4 dark:border-slate-800">
          <h3 className="text-lg font-bold text-slate-900 dark:text-white">
            {mode === 'add' ? 'Add Exam Entry' : 'Edit Exam Entry'}
          </h3>
          <button
            type="button"
            onClick={onClose}
            className="rounded-lg p-1.5 text-slate-400 hover:bg-slate-100 dark:hover:bg-slate-800"
          >
            <svg className="h-5 w-5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
              <path strokeLinecap="round" strokeLinejoin="round" d="M6 18L18 6M6 6l12 12" />
            </svg>
          </button>
        </div>

        {/* Form Body */}
        <form onSubmit={handleSubmit} className="p-6 space-y-4">
          <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
            {/* Exam Date */}
            <div>
              <label className="text-xs font-semibold text-slate-500 dark:text-slate-400">Exam Date *</label>
              <input
                type="text"
                name="examDate"
                value={formData.examDate}
                onChange={handleChange}
                disabled={loading}
                placeholder="DD-MM-YYYY"
                className={`mt-1.5 w-full rounded-lg border px-3 py-2 text-sm outline-none transition focus:ring-2 focus:ring-brand-blue/20 dark:bg-slate-800 dark:text-white ${
                  errors.examDate
                    ? 'border-rose-500 focus:border-rose-500'
                    : 'border-slate-200 focus:border-brand-blue dark:border-slate-700'
                }`}
              />
              {errors.examDate && <p className="mt-1 text-xs text-rose-500">{errors.examDate}</p>}
            </div>

            {/* Day */}
            <div>
              <label className="text-xs font-semibold text-slate-500 dark:text-slate-400">Day of Week *</label>
              <input
                type="text"
                name="day"
                value={formData.day}
                onChange={handleChange}
                disabled={loading}
                placeholder="e.g. Thursday (Auto-detected)"
                className={`mt-1.5 w-full rounded-lg border px-3 py-2 text-sm outline-none transition focus:ring-2 focus:ring-brand-blue/20 dark:bg-slate-800 dark:text-white ${
                  errors.day
                    ? 'border-rose-500 focus:border-rose-500'
                    : 'border-slate-200 focus:border-brand-blue dark:border-slate-700'
                }`}
              />
              {errors.day && <p className="mt-1 text-xs text-rose-500">{errors.day}</p>}
            </div>

            {/* Subject */}
            <div>
              <label className="text-xs font-semibold text-slate-500 dark:text-slate-400">Subject *</label>
              <input
                type="text"
                name="subject"
                value={formData.subject}
                onChange={handleChange}
                disabled={loading}
                placeholder="e.g. Physics"
                className={`mt-1.5 w-full rounded-lg border px-3 py-2 text-sm outline-none transition focus:ring-2 focus:ring-brand-blue/20 dark:bg-slate-800 dark:text-white ${
                  errors.subject
                    ? 'border-rose-500 focus:border-rose-500'
                    : 'border-slate-200 focus:border-brand-blue dark:border-slate-700'
                }`}
              />
              {errors.subject && <p className="mt-1 text-xs text-rose-500">{errors.subject}</p>}
            </div>

            {/* Exam Type */}
            <div>
              <label className="text-xs font-semibold text-slate-500 dark:text-slate-400">Exam Type *</label>
              <select
                name="examType"
                value={formData.examType}
                onChange={handleChange}
                disabled={loading}
                className="mt-1.5 w-full rounded-lg border border-slate-200 px-3 py-2 text-sm outline-none transition focus:border-brand-blue focus:ring-2 focus:ring-brand-blue/20 dark:border-slate-700 dark:bg-slate-800 dark:text-white"
              >
                {EXAM_TYPES.map((t) => (
                  <option key={t} value={t}>{t}</option>
                ))}
              </select>
            </div>

            {/* Time */}
            <div>
              <label className="text-xs font-semibold text-slate-500 dark:text-slate-400">Time *</label>
              <input
                type="text"
                name="time"
                value={formData.time}
                onChange={handleChange}
                disabled={loading}
                placeholder="e.g. 4:00 PM - 5:30 PM"
                className={`mt-1.5 w-full rounded-lg border px-3 py-2 text-sm outline-none transition focus:ring-2 focus:ring-brand-blue/20 dark:bg-slate-800 dark:text-white ${
                  errors.time
                    ? 'border-rose-500 focus:border-rose-500'
                    : 'border-slate-200 focus:border-brand-blue dark:border-slate-700'
                }`}
              />
              {errors.time && <p className="mt-1 text-xs text-rose-500">{errors.time}</p>}
            </div>

            {/* Total Marks */}
            <div>
              <label className="text-xs font-semibold text-slate-500 dark:text-slate-400">Total Marks *</label>
              <input
                type="text"
                name="totalMarks"
                value={formData.totalMarks}
                onChange={handleChange}
                disabled={loading}
                placeholder="e.g. 50"
                className={`mt-1.5 w-full rounded-lg border px-3 py-2 text-sm outline-none transition focus:ring-2 focus:ring-brand-blue/20 dark:bg-slate-800 dark:text-white ${
                  errors.totalMarks
                    ? 'border-rose-500 focus:border-rose-500'
                    : 'border-slate-200 focus:border-brand-blue dark:border-slate-700'
                }`}
              />
              {errors.totalMarks && <p className="mt-1 text-xs text-rose-500">{errors.totalMarks}</p>}
            </div>

            {/* Class */}
            <div>
              <label className="text-xs font-semibold text-slate-500 dark:text-slate-400">Class *</label>
              <input
                type="text"
                name="className"
                value={formData.className}
                onChange={handleChange}
                disabled={loading}
                placeholder="e.g. 11E"
                className={`mt-1.5 w-full rounded-lg border px-3 py-2 text-sm outline-none transition focus:ring-2 focus:ring-brand-blue/20 dark:bg-slate-800 dark:text-white ${
                  errors.className
                    ? 'border-rose-500 focus:border-rose-500'
                    : 'border-slate-200 focus:border-brand-blue dark:border-slate-700'
                }`}
              />
              {errors.className && <p className="mt-1 text-xs text-rose-500">{errors.className}</p>}
            </div>

            {/* Section */}
            <div>
              <label className="text-xs font-semibold text-slate-500 dark:text-slate-400">Section *</label>
              <input
                type="text"
                name="section"
                value={formData.section}
                onChange={handleChange}
                disabled={loading}
                placeholder="e.g. English Medium"
                className={`mt-1.5 w-full rounded-lg border px-3 py-2 text-sm outline-none transition focus:ring-2 focus:ring-brand-blue/20 dark:bg-slate-800 dark:text-white ${
                  errors.section
                    ? 'border-rose-500 focus:border-rose-500'
                    : 'border-slate-200 focus:border-brand-blue dark:border-slate-700'
                }`}
              />
              {errors.section && <p className="mt-1 text-xs text-rose-500">{errors.section}</p>}
            </div>
          </div>

          {/* Footer Buttons */}
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
                'Save Entry'
              ) : (
                'Update Entry'
              )}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}
