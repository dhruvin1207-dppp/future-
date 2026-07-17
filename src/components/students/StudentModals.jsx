import { useState, useEffect } from 'react';

export default function StudentModals({
  isOpen,
  mode, // 'add' | 'edit' | 'delete'
  studentData, // selected student data for edit
  existingStudentIds = [],
  onClose,
  onSave, // (data) => Promise
  loading,
}) {
  const [formData, setFormData] = useState({
    studentId: '',
    academicYear: '26-27',
    rollNumber: '',
    studentName: '',
    fatherName: '',
    surname: '',
    motherName: '',
    dateOfBirth: '',
    gender: 'M',
    class: '',
    section: '',
    group: '',
    mobileNumber: '',
    parentMobile: '',
    address: '',
    admissionDate: '',
    status: 'Active',
  });

  const [errors, setErrors] = useState({});

  // Reset form when modal opens or mode/studentData changes
  useEffect(() => {
    if (isOpen) {
      setErrors({});
      if (mode === 'edit' && studentData) {
        // Map studentData properties to form properties
        setFormData({
          studentId: studentData.studentId || studentData.student_id || studentData['student_id'] || '',
          academicYear: studentData.academicYear || studentData['Academic Year'] || '26-27',
          rollNumber: studentData.rollNumber || studentData['Roll Number'] || '',
          studentName: studentData.name || studentData.studentName || studentData['student_name'] || '',
          fatherName: studentData.fatherName || studentData['father name'] || '',
          surname: studentData.surname || studentData['Surname'] || '',
          motherName: studentData.motherName || studentData['mother name'] || '',
          dateOfBirth: studentData.dateOfBirth || studentData['date of birth'] || '',
          gender: studentData.gender || studentData['gender'] || 'M',
          class: studentData.className || studentData.class || studentData['class'] || '',
          section: studentData.section || studentData['section'] || '',
          group: studentData.group || studentData.course || studentData['Course'] || '',
          mobileNumber: studentData.mobileNumber || studentData.studentPhone || studentData['Student_Phone'] || '',
          parentMobile: studentData.parentMobile || studentData.parentPhone || studentData['parent_phone'] || '',
          address: studentData.address || studentData['address'] || '',
          admissionDate: studentData.admissionDate || studentData['Admission Date'] || '',
          status: studentData.status || (studentData.active !== false && studentData['Active'] !== false ? 'Active' : 'Inactive'),
        });
      } else {
        // Default values for add mode
        setFormData({
          studentId: '',
          academicYear: '26-27',
          rollNumber: '',
          studentName: '',
          fatherName: '',
          surname: '',
          motherName: '',
          dateOfBirth: '',
          gender: 'M',
          class: '',
          section: '',
          group: '',
          mobileNumber: '',
          parentMobile: '',
          address: '',
          admissionDate: new Date().toISOString().split('T')[0],
          status: 'Active',
        });
      }
    }
  }, [isOpen, mode, studentData]);

  // Keyboard listener: Escape -> Close, Enter -> Submit
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
    setFormData((prev) => ({ ...prev, [name]: value }));
    // Clear error
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
    const required = [
      'studentId',
      'academicYear',
      'rollNumber',
      'studentName',
      'fatherName',
      'surname',
      'motherName',
      'class',
      'section',
    ];

    required.forEach((field) => {
      if (!formData[field] || !String(formData[field]).trim()) {
        tempErrors[field] = 'This field is required.';
      }
    });

    // Roll number check
    if (formData.rollNumber && isNaN(Number(formData.rollNumber))) {
      tempErrors.rollNumber = 'Roll number must be numeric.';
    }

    // Phone numbers check
    const phoneRegex = /^[0-9+ ]{8,15}$/;
    if (formData.mobileNumber && !phoneRegex.test(formData.mobileNumber)) {
      tempErrors.mobileNumber = 'Please enter a valid phone number.';
    }
    if (formData.parentMobile && !phoneRegex.test(formData.parentMobile)) {
      tempErrors.parentMobile = 'Please enter a valid parent phone number.';
    }

    // Duplicate studentId check (only for add mode)
    if (
      mode === 'add' &&
      formData.studentId &&
      existingStudentIds.some(
        (id) => String(id).trim().toLowerCase() === String(formData.studentId).trim().toLowerCase()
      )
    ) {
      tempErrors.studentId = 'This Student ID already exists.';
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
            <h3 className="text-lg font-semibold text-slate-900 dark:text-white">Delete Student</h3>
            <p className="mt-2 text-sm text-slate-500 dark:text-slate-400">
              Are you sure you want to delete the selected student record(s)? This action cannot be undone.
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
        className="w-full max-w-3xl rounded-2xl border border-slate-100 bg-white shadow-xl dark:border-slate-800 dark:bg-slate-900 my-8 animate-in fade-in-50 zoom-in-95 duration-200"
        onClick={(e) => e.stopPropagation()}
      >
        {/* Header */}
        <div className="flex items-center justify-between border-b border-slate-100 px-6 py-4 dark:border-slate-800">
          <h3 className="text-lg font-bold text-slate-900 dark:text-white">
            {mode === 'add' ? 'Add New Student' : 'Edit Student'}
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
        <form onSubmit={handleSubmit} className="p-6 space-y-4 max-h-[75vh] overflow-y-auto">
          <div className="grid grid-cols-1 gap-4 sm:grid-cols-3">
            {/* Student ID */}
            <div>
              <label className="text-xs font-semibold text-slate-500 dark:text-slate-400">Student ID *</label>
              <input
                type="text"
                name="studentId"
                value={formData.studentId}
                onChange={handleChange}
                disabled={mode === 'edit' || loading}
                placeholder="e.g. F2627122010"
                className={`mt-1.5 w-full rounded-lg border px-3 py-2 text-sm outline-none transition focus:ring-2 focus:ring-brand-blue/20 dark:bg-slate-800 dark:text-white ${
                  errors.studentId
                    ? 'border-rose-500 focus:border-rose-500'
                    : 'border-slate-200 focus:border-brand-blue dark:border-slate-700'
                } disabled:bg-slate-50 disabled:text-slate-400 dark:disabled:bg-slate-800/40`}
              />
              {errors.studentId && <p className="mt-1 text-xs text-rose-500">{errors.studentId}</p>}
            </div>

            {/* Academic Year */}
            <div>
              <label className="text-xs font-semibold text-slate-500 dark:text-slate-400">Academic Year *</label>
              <input
                type="text"
                name="academicYear"
                value={formData.academicYear}
                onChange={handleChange}
                disabled={loading}
                placeholder="e.g. 26-27"
                className={`mt-1.5 w-full rounded-lg border px-3 py-2 text-sm outline-none transition focus:ring-2 focus:ring-brand-blue/20 dark:bg-slate-800 dark:text-white ${
                  errors.academicYear
                    ? 'border-rose-500 focus:border-rose-500'
                    : 'border-slate-200 focus:border-brand-blue dark:border-slate-700'
                }`}
              />
              {errors.academicYear && <p className="mt-1 text-xs text-rose-500">{errors.academicYear}</p>}
            </div>

            {/* Roll Number */}
            <div>
              <label className="text-xs font-semibold text-slate-500 dark:text-slate-400">Roll Number *</label>
              <input
                type="text"
                name="rollNumber"
                value={formData.rollNumber}
                onChange={handleChange}
                disabled={loading}
                placeholder="e.g. 15"
                className={`mt-1.5 w-full rounded-lg border px-3 py-2 text-sm outline-none transition focus:ring-2 focus:ring-brand-blue/20 dark:bg-slate-800 dark:text-white ${
                  errors.rollNumber
                    ? 'border-rose-500 focus:border-rose-500'
                    : 'border-slate-200 focus:border-brand-blue dark:border-slate-700'
                }`}
              />
              {errors.rollNumber && <p className="mt-1 text-xs text-rose-500">{errors.rollNumber}</p>}
            </div>

            {/* Student Name */}
            <div>
              <label className="text-xs font-semibold text-slate-500 dark:text-slate-400">Student Name *</label>
              <input
                type="text"
                name="studentName"
                value={formData.studentName}
                onChange={handleChange}
                disabled={loading}
                placeholder="First Name"
                className={`mt-1.5 w-full rounded-lg border px-3 py-2 text-sm outline-none transition focus:ring-2 focus:ring-brand-blue/20 dark:bg-slate-800 dark:text-white ${
                  errors.studentName
                    ? 'border-rose-500 focus:border-rose-500'
                    : 'border-slate-200 focus:border-brand-blue dark:border-slate-700'
                }`}
              />
              {errors.studentName && <p className="mt-1 text-xs text-rose-500">{errors.studentName}</p>}
            </div>

            {/* Father Name */}
            <div>
              <label className="text-xs font-semibold text-slate-500 dark:text-slate-400">Father Name *</label>
              <input
                type="text"
                name="fatherName"
                value={formData.fatherName}
                onChange={handleChange}
                disabled={loading}
                placeholder="Middle Name"
                className={`mt-1.5 w-full rounded-lg border px-3 py-2 text-sm outline-none transition focus:ring-2 focus:ring-brand-blue/20 dark:bg-slate-800 dark:text-white ${
                  errors.fatherName
                    ? 'border-rose-500 focus:border-rose-500'
                    : 'border-slate-200 focus:border-brand-blue dark:border-slate-700'
                }`}
              />
              {errors.fatherName && <p className="mt-1 text-xs text-rose-500">{errors.fatherName}</p>}
            </div>

            {/* Surname */}
            <div>
              <label className="text-xs font-semibold text-slate-500 dark:text-slate-400">Surname *</label>
              <input
                type="text"
                name="surname"
                value={formData.surname}
                onChange={handleChange}
                disabled={loading}
                placeholder="Last Name"
                className={`mt-1.5 w-full rounded-lg border px-3 py-2 text-sm outline-none transition focus:ring-2 focus:ring-brand-blue/20 dark:bg-slate-800 dark:text-white ${
                  errors.surname
                    ? 'border-rose-500 focus:border-rose-500'
                    : 'border-slate-200 focus:border-brand-blue dark:border-slate-700'
                }`}
              />
              {errors.surname && <p className="mt-1 text-xs text-rose-500">{errors.surname}</p>}
            </div>

            {/* Mother Name */}
            <div>
              <label className="text-xs font-semibold text-slate-500 dark:text-slate-400">Mother Name *</label>
              <input
                type="text"
                name="motherName"
                value={formData.motherName}
                onChange={handleChange}
                disabled={loading}
                placeholder="Mother's Name"
                className={`mt-1.5 w-full rounded-lg border px-3 py-2 text-sm outline-none transition focus:ring-2 focus:ring-brand-blue/20 dark:bg-slate-800 dark:text-white ${
                  errors.motherName
                    ? 'border-rose-500 focus:border-rose-500'
                    : 'border-slate-200 focus:border-brand-blue dark:border-slate-700'
                }`}
              />
              {errors.motherName && <p className="mt-1 text-xs text-rose-500">{errors.motherName}</p>}
            </div>

            {/* Date Of Birth */}
            <div>
              <label className="text-xs font-semibold text-slate-500 dark:text-slate-400">Date Of Birth</label>
              <input
                type="text"
                name="dateOfBirth"
                value={formData.dateOfBirth}
                onChange={handleChange}
                disabled={loading}
                placeholder="DD-MM-YYYY"
                className="mt-1.5 w-full rounded-lg border border-slate-200 px-3 py-2 text-sm outline-none transition focus:border-brand-blue focus:ring-2 focus:ring-brand-blue/20 dark:border-slate-700 dark:bg-slate-800 dark:text-white"
              />
            </div>

            {/* Gender */}
            <div>
              <label className="text-xs font-semibold text-slate-500 dark:text-slate-400">Gender</label>
              <select
                name="gender"
                value={formData.gender}
                onChange={handleChange}
                disabled={loading}
                className="mt-1.5 w-full rounded-lg border border-slate-200 px-3 py-2 text-sm outline-none transition focus:border-brand-blue focus:ring-2 focus:ring-brand-blue/20 dark:border-slate-700 dark:bg-slate-800 dark:text-white"
              >
                <option value="M">Male (M)</option>
                <option value="F">Female (F)</option>
              </select>
            </div>

            {/* Class */}
            <div>
              <label className="text-xs font-semibold text-slate-500 dark:text-slate-400">Class *</label>
              <input
                type="text"
                name="class"
                value={formData.class}
                onChange={handleChange}
                disabled={loading}
                placeholder="e.g. 11G"
                className={`mt-1.5 w-full rounded-lg border px-3 py-2 text-sm outline-none transition focus:ring-2 focus:ring-brand-blue/20 dark:bg-slate-800 dark:text-white ${
                  errors.class
                    ? 'border-rose-500 focus:border-rose-500'
                    : 'border-slate-200 focus:border-brand-blue dark:border-slate-700'
                }`}
              />
              {errors.class && <p className="mt-1 text-xs text-rose-500">{errors.class}</p>}
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
                placeholder="e.g. GM"
                className={`mt-1.5 w-full rounded-lg border px-3 py-2 text-sm outline-none transition focus:ring-2 focus:ring-brand-blue/20 dark:bg-slate-800 dark:text-white ${
                  errors.section
                    ? 'border-rose-500 focus:border-rose-500'
                    : 'border-slate-200 focus:border-brand-blue dark:border-slate-700'
                }`}
              />
              {errors.section && <p className="mt-1 text-xs text-rose-500">{errors.section}</p>}
            </div>

            {/* Group (Course) */}
            <div>
              <label className="text-xs font-semibold text-slate-500 dark:text-slate-400">Group / Course</label>
              <input
                type="text"
                name="group"
                value={formData.group}
                onChange={handleChange}
                disabled={loading}
                placeholder="e.g. PCB / PCM"
                className="mt-1.5 w-full rounded-lg border border-slate-200 px-3 py-2 text-sm outline-none transition focus:border-brand-blue focus:ring-2 focus:ring-brand-blue/20 dark:border-slate-700 dark:bg-slate-800 dark:text-white"
              />
            </div>

            {/* Mobile Number */}
            <div>
              <label className="text-xs font-semibold text-slate-500 dark:text-slate-400">Mobile Number</label>
              <input
                type="text"
                name="mobileNumber"
                value={formData.mobileNumber}
                onChange={handleChange}
                disabled={loading}
                placeholder="Student Mobile"
                className={`mt-1.5 w-full rounded-lg border px-3 py-2 text-sm outline-none transition focus:ring-2 focus:ring-brand-blue/20 dark:bg-slate-800 dark:text-white ${
                  errors.mobileNumber
                    ? 'border-rose-500 focus:border-rose-500'
                    : 'border-slate-200 focus:border-brand-blue dark:border-slate-700'
                }`}
              />
              {errors.mobileNumber && <p className="mt-1 text-xs text-rose-500">{errors.mobileNumber}</p>}
            </div>

            {/* Parent Mobile */}
            <div>
              <label className="text-xs font-semibold text-slate-500 dark:text-slate-400">Parent Mobile</label>
              <input
                type="text"
                name="parentMobile"
                value={formData.parentMobile}
                onChange={handleChange}
                disabled={loading}
                placeholder="Parent Mobile"
                className={`mt-1.5 w-full rounded-lg border px-3 py-2 text-sm outline-none transition focus:ring-2 focus:ring-brand-blue/20 dark:bg-slate-800 dark:text-white ${
                  errors.parentMobile
                    ? 'border-rose-500 focus:border-rose-500'
                    : 'border-slate-200 focus:border-brand-blue dark:border-slate-700'
                }`}
              />
              {errors.parentMobile && <p className="mt-1 text-xs text-rose-500">{errors.parentMobile}</p>}
            </div>

            {/* Admission Date */}
            <div>
              <label className="text-xs font-semibold text-slate-500 dark:text-slate-400">Admission Date</label>
              <input
                type="text"
                name="admissionDate"
                value={formData.admissionDate}
                onChange={handleChange}
                disabled={loading}
                placeholder="YYYY-MM-DD"
                className="mt-1.5 w-full rounded-lg border border-slate-200 px-3 py-2 text-sm outline-none transition focus:border-brand-blue focus:ring-2 focus:ring-brand-blue/20 dark:border-slate-700 dark:bg-slate-800 dark:text-white"
              />
            </div>

            {/* Status */}
            <div>
              <label className="text-xs font-semibold text-slate-500 dark:text-slate-400">Status</label>
              <select
                name="status"
                value={formData.status}
                onChange={handleChange}
                disabled={loading}
                className="mt-1.5 w-full rounded-lg border border-slate-200 px-3 py-2 text-sm outline-none transition focus:border-brand-blue focus:ring-2 focus:ring-brand-blue/20 dark:border-slate-700 dark:bg-slate-800 dark:text-white"
              >
                <option value="Active">Active</option>
                <option value="Inactive">Inactive</option>
              </select>
            </div>
          </div>

          {/* Address */}
          <div>
            <label className="text-xs font-semibold text-slate-500 dark:text-slate-400">Address</label>
            <textarea
              name="address"
              value={formData.address}
              onChange={handleChange}
              disabled={loading}
              placeholder="Residential Address"
              rows={2}
              className="mt-1.5 w-full rounded-lg border border-slate-200 px-3 py-2 text-sm outline-none transition focus:border-brand-blue focus:ring-2 focus:ring-brand-blue/20 dark:border-slate-700 dark:bg-slate-800 dark:text-white resize-none"
            />
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
                'Save Student'
              ) : (
                'Update Student'
              )}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}
