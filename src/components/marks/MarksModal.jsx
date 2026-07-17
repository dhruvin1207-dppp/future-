import { useState, useEffect, useMemo } from 'react';
import { fetchSectionData } from '../../services/sectionService';

// ---- helpers ----
const pick = (obj, keys) => {
  if (!obj) return undefined;
  for (const k of keys) {
    if (obj[k] !== undefined && obj[k] !== null && obj[k] !== '') return obj[k];
  }
  return undefined;
};

/** Normalize raw Google Sheet student row into consistent shape */
const normalizeStudentRow = (row) => ({
  id: row.id,
  studentId: pick(row, ['student_id', 'Student ID', 'Student id', 'roll_no', 'Roll No']) || '',
  name: pick(row, ['student_name', 'Student Name', 'Name', 'name']) || '',
  className: pick(row, ['class', 'Class', 'course', 'Course']) || '',
  section: pick(row, ['section', 'Section']) || '',
});

/** Normalize raw Google Sheet exam row into consistent shape */
const normalizeExamRow = (row) => ({
  id: row.id,
  exam_date: pick(row, ['exam_date', 'Date', 'date', 'Exam Date']) || '',
  subject: pick(row, ['subject', 'Subject']) || '',
  examType: pick(row, ['exam Type', 'exam_type', 'Exam Type', 'examType', 'type', 'Type']) || '',
  totalMarks: pick(row, ['total Marks', 'total_marks', 'Total Marks', 'totalMarks', 'marks', 'Marks']) || '',
  className: pick(row, ['class', 'Class', 'course', 'Course']) || '',
  section: pick(row, ['section', 'Section']) || '',
});

const getStudentId = (student) => student.studentId || '';
const getStudentName = (student) => student.name || '';

export default function MarksModal({
  isOpen,
  mode, // 'add' | 'edit' | 'delete'
  selectedRows = [], // selected rows for edit/delete
  onClose,
  onSave, // callback for saving data
  loading = false,
}) {
  // Add mode state
  const [loadingData, setLoadingData] = useState(false);
  const [exams, setExams] = useState([]);
  const [allStudents, setAllStudents] = useState([]);
  const [selectedExamId, setSelectedExamId] = useState('');
  const [studentMarks, setStudentMarks] = useState({}); // studentId -> obtainedMarks

  // Edit mode state
  const [editForm, setEditForm] = useState({
    date: '',
    subject: '',
    examType: '',
    studentId: '',
    name: '',
    totalMarks: '',
    obtainMarks: '',
  });

  const [errors, setErrors] = useState({});

  // Reset/Load data on modal open
  useEffect(() => {
    if (isOpen) {
      setErrors({});
      if (mode === 'add') {
        setSelectedExamId('');
        setStudentMarks({});
        
        const loadInitialData = async () => {
          setLoadingData(true);
          try {
            const examResult = await fetchSectionData('exam');
            const studentResult = await fetchSectionData('students');
            
            // Normalize raw sheet rows into consistent shape
            const examRows = (examResult.rows || []).map(normalizeExamRow);
            const studentRows = (studentResult.rows || []).map(normalizeStudentRow);
            setExams(examRows);
            setAllStudents(studentRows);
          } catch (err) {
            console.error('Failed to load exam/student data:', err);
          } finally {
            setLoadingData(false);
          }
        };
        loadInitialData();
      } else if (mode === 'edit' && selectedRows.length > 0) {
        const row = selectedRows[0];
        setEditForm({
          date: row['date'] || row['Date'] || '',
          subject: row['subject'] || row['Subject'] || '',
          examType: row['exam type'] || row['Exam Type'] || row['examType'] || '',
          studentId: row['Student id'] || row['Student ID'] || row['student_id'] || row['studentId'] || '',
          name: row['Name'] || row['student_name'] || row['Student Name'] || row['name'] || '',
          totalMarks: row['total makrs'] || row['total_marks'] || row['Total Marks'] || row['total marks'] || '',
          obtainMarks: row['obtain marks'] || row['obtained_marks'] || row['Obtained Marks'] || row['obtain marks'] || '',
        });
      }
    }
  }, [isOpen, mode, selectedRows]);

  // Keyboard listener: Escape -> Close
  useEffect(() => {
    const handleKeyDown = (e) => {
      if (!isOpen) return;
      if (e.key === 'Escape') onClose();
    };
    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [isOpen, onClose]);

  // Find currently selected exam object
  const selectedExam = useMemo(() => {
    if (!selectedExamId || exams.length === 0) return null;
    return exams.find((e) => String(e.id) === String(selectedExamId));
  }, [selectedExamId, exams]);

  // Match students to the selected exam's class/section
  const matchedStudents = useMemo(() => {
    if (!selectedExam || allStudents.length === 0) return [];

    // Now that rows are normalized, use .className directly
    const examClass = String(selectedExam.className || '').trim().toLowerCase();

    return allStudents.filter((student) => {
      const studentClass = String(student.className || '').trim().toLowerCase();

      // Match if exam class contains or equals the student's class
      // e.g. exam class "12G" matches student class "12"
      return (
        studentClass === examClass ||
        examClass.includes(studentClass) ||
        studentClass.includes(examClass)
      );
    });
  }, [selectedExam, allStudents]);

  if (!isOpen) return null;

  // Handles text input for obtained marks (add mode)
  const handleMarkChange = (studentId, val) => {
    setStudentMarks((prev) => ({
      ...prev,
      [studentId]: val,
    }));

    // Clear specific error
    if (errors[studentId]) {
      setErrors((prev) => {
        const next = { ...prev };
        delete next[studentId];
        return next;
      });
    }
  };

  // Handles inputs for edit form
  const handleEditChange = (e) => {
    const { name, value } = e.target;
    setEditForm((prev) => ({ ...prev, [name]: value }));
    if (errors[name]) {
      setErrors((prev) => {
        const next = { ...prev };
        delete next[name];
        return next;
      });
    }
  };

  // Validation & Save for Add Mode
  const handleAddSubmit = (e) => {
    e.preventDefault();
    if (!selectedExam) return;

    const tempErrors = {};
    const examTotalMarks = Number(selectedExam.totalMarks || 100);

    const entriesToSave = [];

    matchedStudents.forEach((student) => {
      const sId = getStudentId(student);
      const sName = getStudentName(student);
      const markVal = String(studentMarks[sId] || '').trim();
      if (!markVal) return; // Skip students with blank marks input

      const markUpper = markVal.toUpperCase();
      if (markUpper !== 'AB' && markUpper !== 'NA' && markUpper !== '-') {
        const num = Number(markVal);
        if (isNaN(num)) {
          tempErrors[sId] = 'Must be a number or AB/NA';
        } else if (num < 0) {
          tempErrors[sId] = 'Cannot be negative';
        } else if (num > examTotalMarks) {
          tempErrors[sId] = `Max marks is ${examTotalMarks}`;
        }
      }

      if (!tempErrors[sId]) {
        entriesToSave.push({
          date: selectedExam.exam_date,
          subject: selectedExam.subject,
          examType: selectedExam.examType,
          studentId: sId,
          name: sName,
          totalMarks: String(examTotalMarks),
          obtainMarks: markUpper,
        });
      }
    });

    if (Object.keys(tempErrors).length > 0) {
      setErrors(tempErrors);
      return;
    }

    if (entriesToSave.length === 0) {
      alert('Please enter marks for at least one student.');
      return;
    }

    onSave(entriesToSave);
  };

  // Validation & Save for Edit Mode
  const handleEditSubmit = (e) => {
    e.preventDefault();
    const tempErrors = {};
    
    if (!editForm.date) tempErrors.date = 'Required';
    if (!editForm.subject) tempErrors.subject = 'Required';
    if (!editForm.examType) tempErrors.examType = 'Required';
    if (!editForm.totalMarks) tempErrors.totalMarks = 'Required';
    if (!editForm.obtainMarks) tempErrors.obtainMarks = 'Required';

    const maxMarks = Number(editForm.totalMarks);
    const obtVal = String(editForm.obtainMarks).trim().toUpperCase();

    if (obtVal !== 'AB' && obtVal !== 'NA' && obtVal !== '-') {
      const num = Number(obtVal);
      if (isNaN(num)) {
        tempErrors.obtainMarks = 'Must be a number or AB/NA';
      } else if (num < 0) {
        tempErrors.obtainMarks = 'Cannot be negative';
      } else if (!isNaN(maxMarks) && num > maxMarks) {
        tempErrors.obtainMarks = `Cannot exceed total marks (${maxMarks})`;
      }
    }

    if (Object.keys(tempErrors).length > 0) {
      setErrors(tempErrors);
      return;
    }

    onSave(editForm);
  };

  // Handle Delete Confirmation
  const handleDeleteSubmit = () => {
    onSave(null);
  };

  // 1. DELETE CONFIRMATION VIEW
  if (mode === 'delete') {
    return (
      <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/45 backdrop-blur-sm" onClick={onClose}>
        <div className="w-full max-w-md rounded-2xl border border-slate-100 bg-white p-6 shadow-xl dark:border-slate-800 dark:bg-slate-900 animate-in fade-in-50 zoom-in-95 duration-200" onClick={(e) => e.stopPropagation()}>
          <h3 className="text-lg font-bold text-slate-900 dark:text-white">Delete Marks Record(s)</h3>
          <p className="mt-2 text-sm text-slate-500 dark:text-slate-400">
            Are you sure you want to delete {selectedRows.length} selected marks record(s)? This action cannot be undone.
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
              onClick={handleDeleteSubmit}
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

  // 2. EDIT MARKS VIEW
  if (mode === 'edit') {
    return (
      <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/45 backdrop-blur-sm overflow-y-auto" onClick={onClose}>
        <div className="w-full max-w-lg rounded-2xl border border-slate-100 bg-white shadow-xl dark:border-slate-800 dark:bg-slate-900 animate-in fade-in-50 zoom-in-95 duration-200" onClick={(e) => e.stopPropagation()}>
          {/* Header */}
          <div className="flex items-center justify-between border-b border-slate-100 px-6 py-4 dark:border-slate-800">
            <h3 className="text-lg font-bold text-slate-900 dark:text-white">Edit Student Marks</h3>
            <button type="button" onClick={onClose} className="rounded-lg p-1.5 text-slate-400 hover:bg-slate-100 dark:hover:bg-slate-800">
              <svg className="h-5 w-5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                <path strokeLinecap="round" strokeLinejoin="round" d="M6 18L18 6M6 6l12 12" />
              </svg>
            </button>
          </div>

          <form onSubmit={handleEditSubmit} className="p-6 space-y-4">
            <div className="grid grid-cols-2 gap-4">
              <div>
                <label className="text-xs font-semibold text-slate-500">Student ID</label>
                <input
                  type="text"
                  value={editForm.studentId}
                  disabled
                  className="mt-1.5 w-full rounded-lg border border-slate-200 bg-slate-50 px-3 py-2 text-sm text-slate-400 dark:bg-slate-800/40"
                />
              </div>
              <div>
                <label className="text-xs font-semibold text-slate-500">Student Name</label>
                <input
                  type="text"
                  value={editForm.name}
                  disabled
                  className="mt-1.5 w-full rounded-lg border border-slate-200 bg-slate-50 px-3 py-2 text-sm text-slate-400 dark:bg-slate-800/40"
                />
              </div>
            </div>

            <div className="grid grid-cols-3 gap-4">
              <div>
                <label className="text-xs font-semibold text-slate-500 dark:text-slate-400">Date *</label>
                <input
                  type="text"
                  name="date"
                  value={editForm.date}
                  onChange={handleEditChange}
                  className="mt-1.5 w-full rounded-lg border border-slate-200 px-3 py-2 text-sm dark:bg-slate-800 dark:text-white"
                />
                {errors.date && <p className="mt-1 text-xs text-rose-500">{errors.date}</p>}
              </div>

              <div>
                <label className="text-xs font-semibold text-slate-500 dark:text-slate-400">Subject *</label>
                <input
                  type="text"
                  name="subject"
                  value={editForm.subject}
                  onChange={handleEditChange}
                  className="mt-1.5 w-full rounded-lg border border-slate-200 px-3 py-2 text-sm dark:bg-slate-800 dark:text-white"
                />
                {errors.subject && <p className="mt-1 text-xs text-rose-500">{errors.subject}</p>}
              </div>

              <div>
                <label className="text-xs font-semibold text-slate-500 dark:text-slate-400">Exam Type *</label>
                <input
                  type="text"
                  name="examType"
                  value={editForm.examType}
                  onChange={handleEditChange}
                  className="mt-1.5 w-full rounded-lg border border-slate-200 px-3 py-2 text-sm dark:bg-slate-800 dark:text-white"
                />
                {errors.examType && <p className="mt-1 text-xs text-rose-500">{errors.examType}</p>}
              </div>
            </div>

            <div className="grid grid-cols-2 gap-4">
              <div>
                <label className="text-xs font-semibold text-slate-500 dark:text-slate-400">Total Marks *</label>
                <input
                  type="text"
                  name="totalMarks"
                  value={editForm.totalMarks}
                  onChange={handleEditChange}
                  className="mt-1.5 w-full rounded-lg border border-slate-200 px-3 py-2 text-sm dark:bg-slate-800 dark:text-white"
                />
                {errors.totalMarks && <p className="mt-1 text-xs text-rose-500">{errors.totalMarks}</p>}
              </div>

              <div>
                <label className="text-xs font-semibold text-slate-500 dark:text-slate-400">Obtained Marks *</label>
                <input
                  type="text"
                  name="obtainMarks"
                  value={editForm.obtainMarks}
                  onChange={handleEditChange}
                  placeholder="e.g. 74 or AB"
                  className="mt-1.5 w-full rounded-lg border border-slate-200 px-3 py-2 text-sm dark:bg-slate-800 dark:text-white"
                />
                {errors.obtainMarks && <p className="mt-1 text-xs text-rose-500">{errors.obtainMarks}</p>}
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
                className="inline-flex items-center justify-center gap-1.5 rounded-lg bg-brand-blue px-5 py-2 text-sm font-semibold text-white shadow-sm active:scale-95 disabled:opacity-50"
              >
                {loading ? 'Saving...' : 'Save Changes'}
              </button>
            </div>
          </form>
        </div>
      </div>
    );
  }

  // 3. ADD MARKS VIEW
  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/45 backdrop-blur-sm overflow-y-auto" onClick={onClose}>
      <div className="w-full max-w-3xl rounded-2xl border border-slate-100 bg-white shadow-xl dark:border-slate-800 dark:bg-slate-900 my-8 animate-in fade-in-50 zoom-in-95 duration-200" onClick={(e) => e.stopPropagation()}>
        {/* Header */}
        <div className="flex items-center justify-between border-b border-slate-100 px-6 py-4 dark:border-slate-800">
          <h3 className="text-lg font-bold text-slate-900 dark:text-white">Add Student Marks</h3>
          <button type="button" onClick={onClose} className="rounded-lg p-1.5 text-slate-400 hover:bg-slate-100 dark:hover:bg-slate-800">
            <svg className="h-5 w-5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
              <path strokeLinecap="round" strokeLinejoin="round" d="M6 18L18 6M6 6l12 12" />
            </svg>
          </button>
        </div>

        {loadingData ? (
          <div className="p-12 flex flex-col items-center justify-center space-y-3">
            <div className="h-8 w-8 animate-spin rounded-full border-4 border-brand-blue border-t-transparent" />
            <p className="text-sm text-slate-500">Loading exams and student lists...</p>
          </div>
        ) : !selectedExam ? (
          /* PHASE 1: CHOOSE EXAM */
          <div className="p-6 space-y-6">
            <div className="space-y-2">
              <label className="text-sm font-semibold text-slate-700 dark:text-slate-300">Choose Exam Schedule</label>
              <select
                value={selectedExamId}
                onChange={(e) => setSelectedExamId(e.target.value)}
                className="w-full rounded-lg border border-slate-200 bg-white px-3 py-2.5 text-sm text-slate-900 outline-none focus:border-brand-blue focus:ring-2 focus:ring-brand-blue/20 dark:border-slate-700 dark:bg-slate-800 dark:text-white"
              >
                <option value="">-- Choose Scheduled Exam --</option>
                {exams.map((exam) => (
                  <option key={exam.id} value={exam.id}>
                    {exam.exam_date} · {exam.subject} ({exam.examType}) · Class: {exam.className} ({exam.section}) · Max: {exam.totalMarks}
                  </option>
                ))}
              </select>
              <p className="text-xs text-slate-400">
                Select an exam to load student profiles matching the target class/section.
              </p>
            </div>
            
            <div className="flex justify-end gap-3 pt-4 border-t border-slate-100 dark:border-slate-800">
              <button
                type="button"
                onClick={onClose}
                className="rounded-lg border border-slate-200 bg-white px-4 py-2 text-sm font-semibold text-slate-700 transition hover:bg-slate-50 dark:border-slate-700 dark:bg-slate-800"
              >
                Cancel
              </button>
            </div>
          </div>
        ) : (
          /* PHASE 2: ENTER STUDENT MARKS */
          <form onSubmit={handleAddSubmit} className="flex flex-col">
            {/* Selected Exam Information Panel */}
            <div className="mx-6 mt-4 p-4 rounded-xl bg-slate-50 dark:bg-slate-800/40 border border-slate-100 dark:border-slate-800 flex flex-wrap items-center justify-between gap-4">
              <div className="space-y-1">
                <div className="text-xs font-semibold uppercase tracking-wider text-slate-400">Selected Exam</div>
                <div className="text-sm font-bold text-slate-800 dark:text-white">
                  {selectedExam.subject} · {selectedExam.examType}
                </div>
                <div className="text-xs text-slate-500 dark:text-slate-400">
                  Class: <span className="font-semibold">{selectedExam.className}</span> ({selectedExam.section}) · Date: {selectedExam.exam_date} · Max Marks: <span className="font-semibold">{selectedExam.totalMarks}</span>
                </div>
              </div>
              <button
                type="button"
                onClick={() => setSelectedExamId('')}
                className="text-xs font-semibold text-brand-blue hover:underline bg-white dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-lg px-3 py-1.5"
              >
                Change Exam
              </button>
            </div>

            {/* Students List with inputs */}
            <div className="p-6 space-y-4 max-h-[50vh] overflow-y-auto">
              <div className="text-xs font-bold text-slate-500 dark:text-slate-400 mb-2">
                ENTERING MARKS FOR CLASS STUDENTS ({matchedStudents.length} FOUND)
              </div>

              {matchedStudents.length === 0 ? (
                <p className="py-8 text-center text-sm text-slate-500 dark:text-slate-400">
                  No students found matching class &quot;{selectedExam.className}&quot; and section &quot;{selectedExam.section}&quot;.
                </p>
              ) : (
                <div className="border border-slate-100 rounded-xl overflow-hidden dark:border-slate-800">
                  <table className="w-full text-left text-sm">
                    <thead className="bg-slate-50 dark:bg-slate-800 border-b border-slate-100 dark:border-slate-700">
                      <tr>
                        <th className="px-4 py-2 font-semibold text-xs text-slate-500 uppercase">Student ID</th>
                        <th className="px-4 py-2 font-semibold text-xs text-slate-500 uppercase">Student Name</th>
                        <th className="px-4 py-2 font-semibold text-xs text-slate-500 uppercase w-48 text-right">Obtained Marks</th>
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-slate-50 dark:divide-slate-800/80">
                      {matchedStudents.map((student) => {
                        const sId = getStudentId(student);
                        const sName = getStudentName(student);
                        const hasError = errors[sId];
                        return (
                          <tr key={sId} className="hover:bg-slate-50/50 dark:hover:bg-slate-800/30">
                            <td className="px-4 py-3 text-slate-600 dark:text-slate-400 font-mono text-xs">
                              {sId}
                            </td>
                            <td className="px-4 py-3 font-medium text-slate-900 dark:text-white">
                              {sName}
                            </td>
                            <td className="px-4 py-2 text-right">
                              <input
                                type="text"
                                value={studentMarks[sId] || ''}
                                onChange={(e) => handleMarkChange(sId, e.target.value)}
                                disabled={loading}
                                placeholder={`e.g. 74 or AB`}
                                className={`w-32 rounded-lg border px-3 py-1 text-sm outline-none transition text-right focus:ring-2 focus:ring-brand-blue/20 dark:bg-slate-800 dark:text-white ${
                                  hasError
                                    ? 'border-rose-500 focus:border-rose-500'
                                    : 'border-slate-200 focus:border-brand-blue dark:border-slate-700'
                                }`}
                              />
                              {hasError && (
                                <p className="text-[10px] text-rose-500 mt-0.5 text-right font-medium">
                                  {hasError}
                                </p>
                              )}
                            </td>
                          </tr>
                        );
                      })}
                    </tbody>
                  </table>
                </div>
              )}
            </div>

            {/* Footer */}
            <div className="flex justify-end gap-3 p-6 border-t border-slate-100 dark:border-slate-800 bg-slate-50/50 dark:bg-slate-900/35">
              <button
                type="button"
                onClick={onClose}
                disabled={loading}
                className="rounded-lg border border-slate-200 bg-white px-4 py-2 text-sm font-semibold text-slate-700 transition hover:bg-slate-50 dark:border-slate-700 dark:bg-slate-800"
              >
                Cancel
              </button>
              <button
                type="submit"
                disabled={loading || matchedStudents.length === 0}
                className="inline-flex items-center justify-center gap-1.5 rounded-lg bg-brand-blue px-5 py-2 text-sm font-semibold text-white shadow-sm active:scale-95 disabled:opacity-50"
              >
                {loading ? 'Saving...' : 'Save Marks'}
              </button>
            </div>
          </form>
        )}
      </div>
    </div>
  );
}
