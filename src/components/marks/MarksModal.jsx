import { useState, useEffect, useMemo } from 'react';
import { fetchSectionData } from '../../services/sectionService';

// Mock Exams as a fallback if Google Sheets is not configured or fails
const MOCK_EXAMS = [
  { id: 1, examDate: '20-07-2026', day: 'Monday', time: '10:00 AM', subject: 'Physics', examType: 'weekly', totalMarks: '50', className: '11', section: 'G' },
  { id: 2, examDate: '21-07-2026', day: 'Tuesday', time: '10:00 AM', subject: 'Chemistry', examType: 'weekly', totalMarks: '50', className: '11', section: 'G' },
  { id: 3, examDate: '22-07-2026', day: 'Wednesday', time: '10:00 AM', subject: 'Maths', examType: 'weekly', totalMarks: '100', className: '12', section: 'A' },
  { id: 4, examDate: '23-07-2026', day: 'Thursday', time: '11:00 AM', subject: 'English', examType: 'monthly', totalMarks: '80', className: '11', section: 'E' },
];

// Mock Students as a fallback if Google Sheets is not configured or fails
const MOCK_STUDENTS = [
  { id: 101, studentId: 'st101', name: 'Het', className: '11', section: 'G', active: true },
  { id: 102, studentId: 'st102', name: 'Student 2', className: '11', section: 'G', active: true },
  { id: 103, studentId: 'st103', name: 'Student 3', className: '11', section: 'G', active: true },
  { id: 104, studentId: 'st104', name: 'Student 4', className: '12', section: 'A', active: true },
];

// Helper: Pick a value from an object based on multiple possible keys (resilient to casing/spaces/symbols)
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

// Helper: Normalize string to make comparisons more robust
const normalizeString = (str) => String(str || '').toLowerCase().trim().replace(/[\s_-]+/g, '');

export default function MarksModal({
  isOpen,
  mode, // 'add' | 'edit' | 'delete'
  selectedRows = [],
  onClose,
  onSave, // maps to handleSaveMarks
  loading,
}) {
  // Wizard flow states (Add mode only)
  const [currentStep, setCurrentStep] = useState(1); // 1: Select Exam, 2: Enter Marks
  const [exams, setExams] = useState([]);
  const [students, setStudents] = useState([]);
  const [loadingData, setLoadingData] = useState(false);
  const [errorMsg, setErrorMsg] = useState('');
  const [selectedExam, setSelectedExam] = useState(null);
  const [examSearchQuery, setExamSearchQuery] = useState('');

  // Obtained marks map: studentId -> score string (number or 'AB')
  const [obtainedMarks, setObtainedMarks] = useState({});

  // Single record Edit states (Edit mode only)
  const [editForm, setEditForm] = useState({
    date: '',
    subject: '',
    examType: '',
    studentId: '',
    name: '',
    totalMarks: '',
    obtainMarks: '',
  });

  const [validationErrors, setValidationErrors] = useState({});

  // Reset states on open/close or mode change
  useEffect(() => {
    if (isOpen) {
      setErrorMsg('');
      setValidationErrors({});
      if (mode === 'add') {
        setCurrentStep(1);
        setSelectedExam(null);
        setObtainedMarks({});
        setExamSearchQuery('');
        
        // Fetch exams and students
        const loadResources = async () => {
          setLoadingData(true);
          try {
            const [examsRes, studentsRes] = await Promise.all([
              fetchSectionData('exam'),
              fetchSectionData('students')
            ]);
            
            // If they returned empty but status OK, it might be mock mode or empty sheet
            const fetchedExams = examsRes.rows && examsRes.rows.length > 0 ? examsRes.rows : MOCK_EXAMS;
            const fetchedStudents = studentsRes.rows && studentsRes.rows.length > 0 ? studentsRes.rows : MOCK_STUDENTS;
            
            setExams(fetchedExams);
            setStudents(fetchedStudents);
          } catch (err) {
            console.error('Failed to load resources for Marks CRUD:', err);
            // Graceful fallback to mock data
            setExams(MOCK_EXAMS);
            setStudents(MOCK_STUDENTS);
          } finally {
            setLoadingData(false);
          }
        };
        loadResources();
      } else if (mode === 'edit' && selectedRows.length > 0) {
        const row = selectedRows[0];
        setEditForm({
          date: pick(row, 'Date', 'date', 'DATE'),
          subject: pick(row, 'Subject', 'subject', 'SUBJECT'),
          examType: pick(row, 'Exam Type', 'examType', 'exam_type', 'EXAM TYPE'),
          studentId: pick(row, 'Student ID', 'studentId', 'student_id', 'STUDENT ID', 'roll_no', 'Roll No'),
          name: pick(row, 'Name', 'name', 'studentName', 'Student Name', 'student_name'),
          totalMarks: pick(row, 'Total Marks', 'totalMarks', 'total_marks', 'TOTAL MARKS'),
          obtainMarks: pick(row, 'Obtain Marks', 'obtainMarks', 'obtain_marks', 'obtained_marks', 'Obtained Marks', 'obtained marks', 'OBTAIN MARKS'),
        });
      }
    }
  }, [isOpen, mode, selectedRows]);

  // Handle Escape key to close
  useEffect(() => {
    const handleKeyDown = (e) => {
      if (isOpen && e.key === 'Escape') onClose();
    };
    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [isOpen, onClose]);

  // Normalize student properties
  const normalizedStudents = useMemo(() => {
    return students.map((s) => ({
      id: s.id,
      studentId: pick(s, 'student_id', 'Student ID', 'roll_no', 'Roll No') || '',
      name: pick(s, 'student_name', 'Student Name', 'name', 'Name') || 'Unknown Student',
      className: pick(s, 'class', 'Class', 'className', 'course', 'Course') || '',
      section: pick(s, 'section', 'Section') || '',
      active: pick(s, 'active', 'Active', 'is_active') !== false && String(pick(s, 'status', 'Status')).toLowerCase() !== 'inactive',
    }));
  }, [students]);

  // Filter students matching the selected exam's class and section
  const matchingStudents = useMemo(() => {
    if (!selectedExam) return [];

    const examClassRaw = String(pick(selectedExam, 'className', 'Class', 'class', 'course', 'Course')).trim();
    const examSectionRaw = String(pick(selectedExam, 'section', 'Section')).trim();

    const examClassLower = examClassRaw.toLowerCase();
    const examSectionLower = examSectionRaw.toLowerCase();

    return normalizedStudents.filter((student) => {
      if (!student.active) return false;

      const sClass = student.className.toLowerCase().trim();
      const sSection = student.section.toLowerCase().trim();

      // Combined representations
      const sCombined = `${sClass}${sSection}`.replace(/[^a-z0-9]/g, '');
      const eClassClean = examClassLower.replace(/[^a-z0-9]/g, '');

      // 1. Check if student's combined class + section (e.g. "11g") is exactly equal to the exam's clean class (e.g. "11g")
      if (sCombined === eClassClean) return true;

      // 2. Check if student's combined class + section (e.g. "11g") is contained in the exam's clean class (e.g. exam class is "11g" or "11g-gujaratimedium")
      if (sCombined && eClassClean.includes(sCombined)) return true;

      // 3. Check if exam class contains student's class (e.g. exam class is "11g", student class is "11") and student's section matches (e.g. student section "g" is in exam class "11g")
      if (eClassClean.includes(sClass)) {
        if (!sSection || sSection === '—') return true;
        if (eClassClean.includes(sSection)) return true;
      }

      // 4. Exact matching of both separate fields (e.g., student class "11", section "g"; exam class "11", section "g")
      if (sClass === examClassLower && sSection === examSectionLower) return true;

      // 5. If exam class matches student class and exam section is a medium descriptor (Gujarati/English) rather than a group letter
      if (sClass === examClassLower && (examSectionLower.includes('medium') || examSectionLower === '—' || examSectionLower === 'all')) return true;

      return false;
    }).sort((a, b) => a.studentId.localeCompare(b.studentId, undefined, { numeric: true }));
  }, [selectedExam, normalizedStudents]);

  // Filter exams based on search query (by subject, class, or type)
  const filteredExams = useMemo(() => {
    const q = examSearchQuery.trim().toLowerCase();
    if (!q) return exams;

    return exams.filter((e) => {
      const subject = String(pick(e, 'subject', 'Subject')).toLowerCase();
      const examClass = String(pick(e, 'className', 'Class', 'class', 'course', 'Course')).toLowerCase();
      const section = String(pick(e, 'section', 'Section')).toLowerCase();
      const examType = String(pick(e, 'examType', 'examType', 'exam Type')).toLowerCase();

      return (
        subject.includes(q) ||
        examClass.includes(q) ||
        section.includes(q) ||
        examType.includes(q)
      );
    });
  }, [exams, examSearchQuery]);

  // Calculate wizard stats
  const filledCount = useMemo(() => {
    return matchingStudents.filter((s) => {
      const val = obtainedMarks[s.studentId];
      return val !== undefined && val !== null && String(val).trim() !== '';
    }).length;
  }, [matchingStudents, obtainedMarks]);

  if (!isOpen) return null;

  // Single Edit inputs change handler
  const handleEditChange = (e) => {
    const { name, value } = e.target;
    setEditForm((prev) => ({ ...prev, [name]: value }));

    // Reset validations
    if (validationErrors[name]) {
      setValidationErrors((prev) => {
        const next = { ...prev };
        delete next[name];
        return next;
      });
    }
  };

  // obtained mark input change handler (Add wizard mode)
  const handleObtainedMarkChange = (studentId, value) => {
    setObtainedMarks((prev) => ({
      ...prev,
      [studentId]: value,
    }));

    // Reset student specific validation
    if (validationErrors[studentId]) {
      setValidationErrors((prev) => {
        const next = { ...prev };
        delete next[studentId];
        return next;
      });
    }
  };

  // Quick Action: Set all empty inputs to Absent ('AB')
  const handleBulkSetAbsent = () => {
    const nextMarks = { ...obtainedMarks };
    matchingStudents.forEach((student) => {
      const val = nextMarks[student.studentId];
      if (val === undefined || val === null || String(val).trim() === '') {
        nextMarks[student.studentId] = 'AB';
      }
    });
    setObtainedMarks(nextMarks);
  };

  // Quick Action: Clear all entries
  const handleClearAll = () => {
    setObtainedMarks({});
    setValidationErrors({});
  };

  // Validate Edit Form inputs
  const validateEdit = () => {
    const errs = {};
    if (!editForm.date.trim()) errs.date = 'Date is required.';
    if (!editForm.subject.trim()) errs.subject = 'Subject is required.';
    if (!editForm.examType.trim()) errs.examType = 'Exam Type is required.';
    if (!editForm.totalMarks.trim() || isNaN(Number(editForm.totalMarks))) {
      errs.totalMarks = 'Provide a valid total marks number.';
    }
    
    const ob = String(editForm.obtainMarks).trim().toUpperCase();
    if (!ob) {
      errs.obtainMarks = 'Obtained marks or "AB" is required.';
    } else if (ob !== 'AB') {
      const numVal = Number(ob);
      if (isNaN(numVal) || numVal < 0) {
        errs.obtainMarks = 'Must be a positive number or "AB".';
      } else if (numVal > Number(editForm.totalMarks)) {
        errs.obtainMarks = `Cannot exceed total marks (${editForm.totalMarks}).`;
      }
    }

    setValidationErrors(errs);
    return Object.keys(errs).length === 0;
  };

  // Validate Add Wizard entries
  const validateAdd = () => {
    const errs = {};
    const totalMax = Number(pick(selectedExam, 'totalMarks', 'total_marks', 'Total Marks', 'total marks', 'total makrs', 'total') || 100);
    let hasAtLeastOne = false;

    matchingStudents.forEach((student) => {
      const markStr = String(obtainedMarks[student.studentId] || '').trim().toUpperCase();
      
      // If it is empty, we do NOT trigger error - we just skip validation and skip saving it
      if (markStr !== '') {
        hasAtLeastOne = true;
        if (markStr !== 'AB') {
          const numVal = Number(markStr);
          if (isNaN(numVal) || numVal < 0) {
            errs[student.studentId] = 'Must be a positive number or "AB".';
          } else if (numVal > totalMax) {
            errs[student.studentId] = `Max marks is ${totalMax}.`;
          }
        }
      }
    });

    if (!hasAtLeastOne && matchingStudents.length > 0) {
      setErrorMsg('Please enter at least one student mark.');
      return false;
    } else {
      setErrorMsg('');
    }

    setValidationErrors(errs);
    return Object.keys(errs).length === 0;
  };

  // Submit Handler
  const handleSubmit = (e) => {
    if (e) e.preventDefault();

    if (mode === 'delete') {
      onSave(null);
      return;
    }

    if (mode === 'edit') {
      if (validateEdit()) {
        onSave(editForm);
      }
      return;
    }

    if (mode === 'add') {
      if (validateAdd()) {
        // Construct array of mark rows for batch creation
        const examDate = pick(selectedExam, 'examDate', 'exam_date', 'Exam Date', 'date') || '';
        const examSubject = pick(selectedExam, 'subject', 'Subject') || '';
        const examType = pick(selectedExam, 'examType', 'exam Type', 'exam_type') || 'weekly';
        const totalMarks = pick(selectedExam, 'totalMarks', 'total_marks', 'Total Marks', 'total') || '100';

        const batchData = [];
        matchingStudents.forEach((student) => {
          const score = String(obtainedMarks[student.studentId] || '').trim().toUpperCase();
          if (score !== '') {
            batchData.push({
              date: examDate,
              subject: examSubject,
              examType: examType,
              studentId: student.studentId,
              name: student.name,
              totalMarks: totalMarks,
              obtainMarks: score,
            });
          }
        });

        // Save batch array
        onSave(batchData);
      }
    }
  };

  // Render Step 1: Select Exam
  const renderStep1 = () => (
    <div className="space-y-4">
      <div className="relative">
        <input
          type="search"
          value={examSearchQuery}
          onChange={(e) => setExamSearchQuery(e.target.value)}
          placeholder="🔍 Search exam schedule by class, subject, or type..."
          className="w-full rounded-xl border border-slate-200 bg-white px-4 py-2.5 pl-10 text-sm text-slate-900 outline-none focus:border-brand-blue focus:ring-2 focus:ring-brand-blue/20 dark:border-slate-800 dark:bg-slate-950 dark:text-white"
        />
        <svg className="absolute left-3.5 top-3 h-5 w-5 text-slate-400" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
          <path strokeLinecap="round" strokeLinejoin="round" d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z" />
        </svg>
      </div>

      {loadingData ? (
        <div className="flex h-48 items-center justify-center">
          <div className="h-8 w-8 animate-spin rounded-full border-4 border-brand-blue border-t-transparent" />
        </div>
      ) : filteredExams.length === 0 ? (
        <div className="rounded-xl border border-dashed border-slate-200 p-8 text-center dark:border-slate-800">
          <p className="text-sm text-slate-500 dark:text-slate-400">No scheduled exams match your criteria.</p>
        </div>
      ) : (
        <div className="grid grid-cols-1 gap-3 max-h-[50vh] overflow-y-auto pr-1">
          {filteredExams.map((exam) => {
            const eSubj = pick(exam, 'subject', 'Subject') || 'Unknown Subject';
            const eClass = pick(exam, 'className', 'Class', 'class', 'course', 'Course') || '—';
            const eSect = pick(exam, 'section', 'Section') || '';
            const eType = pick(exam, 'examType', 'exam Type', 'exam_type') || 'weekly';
            const eDate = pick(exam, 'examDate', 'exam_date', 'Exam Date', 'date') || '—';
            const eDay = pick(exam, 'day', 'Day') || '';
            const eTotal = pick(exam, 'totalMarks', 'total_marks', 'Total Marks', 'total') || '100';

            return (
              <button
                key={exam.id || `${eDate}-${eSubj}`}
                type="button"
                onClick={() => {
                  setSelectedExam(exam);
                  setCurrentStep(2);
                }}
                className="flex items-center justify-between rounded-xl border border-slate-100 bg-slate-50/50 p-4 text-left transition hover:border-brand-blue hover:bg-brand-blue/5 dark:border-slate-850 dark:bg-slate-900/40 dark:hover:border-blue-500/50"
              >
                <div>
                  <div className="flex items-center gap-2">
                    <span className="font-bold text-slate-800 dark:text-slate-100">{eSubj}</span>
                    <span className="rounded-md bg-brand-blue/10 px-2 py-0.5 text-xs font-semibold text-brand-blue dark:bg-brand-blue/20">
                      Class {eClass}{eSect ? ` - ${eSect}` : ''}
                    </span>
                  </div>
                  <div className="mt-1 text-xs text-slate-500 dark:text-slate-400">
                    Date: <strong className="text-slate-700 dark:text-slate-300">{eDate}</strong> {eDay ? `(${eDay})` : ''} · Type: <strong className="text-slate-700 dark:text-slate-300">{eType}</strong>
                  </div>
                </div>
                <div className="text-right">
                  <div className="text-xs font-medium text-slate-400">Total Marks</div>
                  <div className="text-sm font-bold text-brand-blue">{eTotal}</div>
                </div>
              </button>
            );
          })}
        </div>
      )}
    </div>
  );

  // Render Step 2: Enter Marks for Filtered Students
  const renderStep2 = () => {
    const totalMax = Number(pick(selectedExam, 'totalMarks', 'total_marks', 'Total Marks', 'total') || 100);
    const eSubj = pick(selectedExam, 'subject', 'Subject') || 'Physics';
    const eClass = pick(selectedExam, 'className', 'Class', 'class', 'course', 'Course') || '';
    const eSect = pick(selectedExam, 'section', 'Section') || '';

    return (
      <div className="space-y-4">
        {/* Selected Exam Information Header */}
        <div className="flex flex-col gap-2 rounded-xl border border-blue-100 bg-blue-50/50 p-4 dark:border-blue-900/30 dark:bg-blue-950/20 sm:flex-row sm:items-center sm:justify-between">
          <div>
            <div className="text-xs font-semibold uppercase tracking-wider text-brand-blue">Active Selected Exam</div>
            <h4 className="text-base font-bold text-slate-900 dark:text-white">
              {eSubj} · Class {eClass}{eSect ? ` - ${eSect}` : ''}
            </h4>
            <p className="text-xs text-slate-500 dark:text-slate-400">
              Exam Schedule Date: {pick(selectedExam, 'examDate', 'exam_date', 'Exam Date', 'date')} ({pick(selectedExam, 'day', 'Day')})
            </p>
          </div>
          <div className="flex items-center gap-4">
            <div className="text-center sm:text-right">
              <div className="text-xs text-slate-500">Max Marks</div>
              <div className="text-lg font-black text-brand-blue">{totalMax}</div>
            </div>
            <button
              type="button"
              onClick={() => {
                setCurrentStep(1);
                setSelectedExam(null);
              }}
              className="rounded-lg border border-slate-200 bg-white px-2.5 py-1.5 text-xs font-bold text-slate-700 hover:bg-slate-50 dark:border-slate-800 dark:bg-slate-900 dark:text-slate-300 dark:hover:bg-slate-800"
            >
              ← Change Exam
            </button>
          </div>
        </div>

        {/* Bulk Action Controls */}
        <div className="flex flex-wrap items-center justify-between gap-2 border-b border-slate-100 pb-3 dark:border-slate-850">
          <div className="flex items-center gap-2">
            <span className="text-sm font-semibold text-slate-800 dark:text-slate-200">
              Filtered Student List ({matchingStudents.length} active students)
            </span>
            <span className="rounded-full bg-slate-100 px-2.5 py-0.5 text-xs font-bold text-slate-600 dark:bg-slate-800 dark:text-slate-400">
              {filledCount}/{matchingStudents.length} filled
            </span>
          </div>

          <div className="flex gap-2">
            <button
              type="button"
              onClick={handleBulkSetAbsent}
              className="rounded-lg bg-rose-50 px-2.5 py-1.5 text-xs font-semibold text-rose-600 hover:bg-rose-100 dark:bg-rose-950/20 dark:text-rose-400 dark:hover:bg-rose-950/45"
            >
              Set empty to AB
            </button>
            <button
              type="button"
              onClick={handleClearAll}
              className="rounded-lg border border-slate-200 bg-white px-2.5 py-1.5 text-xs font-semibold text-slate-500 hover:bg-slate-50 dark:border-slate-800 dark:bg-slate-900 dark:text-slate-400 dark:hover:bg-slate-800"
            >
              Clear All
            </button>
          </div>
        </div>

        {/* Student Marks List */}
        {matchingStudents.length === 0 ? (
          <div className="rounded-xl border border-dashed border-amber-200 bg-amber-50/25 p-8 text-center dark:border-amber-900/20 dark:bg-amber-950/5">
            <p className="text-sm font-medium text-amber-800 dark:text-amber-300">
              No active students found matching Class {eClass}{eSect ? ` - Section ${eSect}` : ''}.
            </p>
            <p className="mt-1 text-xs text-slate-500 dark:text-slate-400">
              Please double check the class specifications in the Students record.
            </p>
          </div>
        ) : (
          <div className="max-h-[45vh] overflow-y-auto pr-1 space-y-3">
            {matchingStudents.map((student) => {
              const hasErr = validationErrors[student.studentId];
              const scoreVal = obtainedMarks[student.studentId] || '';

              return (
                <div
                  key={student.studentId}
                  className={`flex flex-col sm:flex-row items-start sm:items-center justify-between gap-3 rounded-xl border p-3.5 transition ${
                    hasErr
                      ? 'border-rose-300 bg-rose-50/10 dark:border-rose-900/30'
                      : 'border-slate-100 bg-slate-50/20 hover:border-slate-200 dark:border-slate-850 dark:bg-slate-900/20'
                  }`}
                >
                  <div className="min-w-0">
                    <div className="font-bold text-slate-800 dark:text-slate-100 truncate">{student.name}</div>
                    <div className="mt-0.5 text-xs text-slate-400">
                      ID: <strong className="font-semibold text-slate-500 dark:text-slate-300">{student.studentId}</strong> · Class: {student.className} {student.section ? `(${student.section})` : ''}
                    </div>
                  </div>

                  <div className="w-full sm:w-auto shrink-0 flex items-center gap-3">
                    <div className="relative flex-1 sm:flex-none">
                      <input
                        type="text"
                        value={scoreVal}
                        onChange={(e) => handleObtainedMarkChange(student.studentId, e.target.value)}
                        placeholder={`Score (Max: ${totalMax}) or AB`}
                        className={`w-full sm:w-44 rounded-lg border px-3 py-1.5 text-right text-sm outline-none transition focus:ring-2 focus:ring-brand-blue/20 dark:bg-slate-950 dark:text-white ${
                          hasErr
                            ? 'border-rose-400 focus:border-rose-500'
                            : 'border-slate-200 focus:border-brand-blue'
                        }`}
                      />
                      {scoreVal.toUpperCase() === 'AB' && (
                        <span className="absolute left-3 top-2 rounded bg-rose-50 px-1.5 py-0.5 text-[10px] font-bold text-rose-600 dark:bg-rose-950/50 dark:text-rose-400">
                          ABSENT
                        </span>
                      )}
                    </div>
                  </div>

                  {hasErr && (
                    <div className="w-full text-xs font-semibold text-rose-600 dark:text-rose-400 mt-1">
                      ⚠ {hasErr}
                    </div>
                  )}
                </div>
              );
            })}
          </div>
        )}
      </div>
    );
  };

  // ── DELETE MODAL ──────────────────────────────────────────
  if (mode === 'delete') {
    return (
      <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/45 backdrop-blur-sm" onClick={onClose}>
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
            <h3 className="text-lg font-bold text-slate-900 dark:text-white">Delete Student Marks</h3>
            <p className="mt-2 text-sm text-slate-500 dark:text-slate-400">
              Are you sure you want to delete the selected marks record(s)? This operation cannot be undone.
            </p>
          </div>
          <div className="mt-6 flex justify-end gap-3">
            <button
              type="button"
              onClick={onClose}
              disabled={loading}
              className="rounded-lg border border-slate-200 bg-white px-4 py-2 text-sm font-semibold text-slate-700 hover:bg-slate-50 dark:border-slate-700 dark:bg-slate-800 dark:text-slate-300 dark:hover:bg-slate-700"
            >
              Cancel
            </button>
            <button
              type="button"
              onClick={handleSubmit}
              disabled={loading}
              className="inline-flex items-center gap-1.5 rounded-lg bg-rose-600 px-4 py-2 text-sm font-semibold text-white hover:bg-rose-500 active:scale-95 disabled:opacity-50"
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

  // ── EDIT MODAL ────────────────────────────────────────────
  if (mode === 'edit') {
    return (
      <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/45 backdrop-blur-sm overflow-y-auto" onClick={onClose}>
        <div
          className="w-full max-w-lg rounded-2xl border border-slate-100 bg-white shadow-xl dark:border-slate-800 dark:bg-slate-900 my-8 animate-in fade-in-50 zoom-in-95 duration-200"
          onClick={(e) => e.stopPropagation()}
        >
          {/* Header */}
          <div className="flex items-center justify-between border-b border-slate-100 px-6 py-4 dark:border-slate-800">
            <div>
              <h3 className="text-lg font-bold text-slate-900 dark:text-white">✏️ Edit Student Marks</h3>
              <p className="text-xs text-slate-500 mt-0.5 dark:text-slate-400">Modify the student's exam score</p>
            </div>
            <button type="button" onClick={onClose} className="rounded-lg p-1.5 text-slate-400 hover:bg-slate-100 dark:hover:bg-slate-800">
              <svg className="h-5 w-5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                <path strokeLinecap="round" strokeLinejoin="round" d="M6 18L18 6M6 6l12 12" />
              </svg>
            </button>
          </div>

          {/* Form */}
          <form onSubmit={handleSubmit} className="p-6 space-y-4">
            <div>
              <label className="text-xs font-semibold text-slate-500 dark:text-slate-400">Student Name</label>
              <div className="mt-1 w-full rounded-lg bg-slate-50 px-3 py-2 text-sm font-semibold text-slate-700 border border-slate-200 dark:bg-slate-800 dark:border-slate-700 dark:text-slate-350">
                {editForm.name} (ID: {editForm.studentId})
              </div>
            </div>

            <div className="grid grid-cols-2 gap-4">
              <div>
                <label className="text-xs font-semibold text-slate-500 dark:text-slate-400">Subject</label>
                <input
                  type="text"
                  name="subject"
                  value={editForm.subject}
                  onChange={handleEditChange}
                  className="mt-1 w-full rounded-lg border border-slate-200 px-3 py-2 text-sm outline-none transition focus:border-brand-blue focus:ring-2 focus:ring-brand-blue/20 dark:border-slate-700 dark:bg-slate-800 dark:text-white"
                />
                {validationErrors.subject && <p className="mt-1 text-xs text-rose-500">{validationErrors.subject}</p>}
              </div>

              <div>
                <label className="text-xs font-semibold text-slate-500 dark:text-slate-400">Exam Type</label>
                <input
                  type="text"
                  name="examType"
                  value={editForm.examType}
                  onChange={handleEditChange}
                  className="mt-1 w-full rounded-lg border border-slate-200 px-3 py-2 text-sm outline-none transition focus:border-brand-blue focus:ring-2 focus:ring-brand-blue/20 dark:border-slate-700 dark:bg-slate-800 dark:text-white"
                />
                {validationErrors.examType && <p className="mt-1 text-xs text-rose-500">{validationErrors.examType}</p>}
              </div>
            </div>

            <div className="grid grid-cols-3 gap-4">
              <div>
                <label className="text-xs font-semibold text-slate-500 dark:text-slate-400">Exam Date</label>
                <input
                  type="text"
                  name="date"
                  value={editForm.date}
                  onChange={handleEditChange}
                  placeholder="DD-MM-YYYY"
                  className="mt-1 w-full rounded-lg border border-slate-200 px-3 py-2 text-sm outline-none transition focus:border-brand-blue focus:ring-2 focus:ring-brand-blue/20 dark:border-slate-700 dark:bg-slate-800 dark:text-white"
                />
                {validationErrors.date && <p className="mt-1 text-xs text-rose-500">{validationErrors.date}</p>}
              </div>

              <div>
                <label className="text-xs font-semibold text-slate-500 dark:text-slate-400">Total Marks</label>
                <input
                  type="number"
                  name="totalMarks"
                  value={editForm.totalMarks}
                  onChange={handleEditChange}
                  className="mt-1 w-full rounded-lg border border-slate-200 px-3 py-2 text-sm outline-none transition focus:border-brand-blue focus:ring-2 focus:ring-brand-blue/20 dark:border-slate-700 dark:bg-slate-800 dark:text-white"
                />
                {validationErrors.totalMarks && <p className="mt-1 text-xs text-rose-500">{validationErrors.totalMarks}</p>}
              </div>

              <div>
                <label className="text-xs font-semibold text-slate-500 dark:text-slate-400">Obtained Score</label>
                <input
                  type="text"
                  name="obtainMarks"
                  value={editForm.obtainMarks}
                  onChange={handleEditChange}
                  placeholder="Number or AB"
                  className="mt-1 w-full rounded-lg border border-slate-200 px-3 py-2 text-sm outline-none transition focus:border-brand-blue focus:ring-2 focus:ring-brand-blue/20 dark:border-slate-700 dark:bg-slate-800 dark:text-white"
                />
                {validationErrors.obtainMarks && <p className="mt-1 text-xs text-rose-500">{validationErrors.obtainMarks}</p>}
              </div>
            </div>

            {/* Footer */}
            <div className="flex justify-end gap-3 pt-4 border-t border-slate-100 dark:border-slate-800">
              <button
                type="button"
                onClick={onClose}
                disabled={loading}
                className="rounded-lg border border-slate-200 bg-white px-4 py-2 text-sm font-semibold text-slate-700 hover:bg-slate-50 dark:border-slate-700 dark:bg-slate-800 dark:text-slate-300 dark:hover:bg-slate-700"
              >
                Cancel
              </button>
              <button
                type="submit"
                disabled={loading}
                className="inline-flex items-center gap-1.5 rounded-lg bg-brand-blue px-5 py-2 text-sm font-semibold text-white hover:bg-brand-blue/90 shadow-sm active:scale-95 disabled:opacity-50"
              >
                {loading ? (
                  <>
                    <div className="h-3.5 w-3.5 animate-spin rounded-full border-2 border-white border-t-transparent" />
                    Saving...
                  </>
                ) : (
                  'Update Marks'
                )}
              </button>
            </div>
          </form>
        </div>
      </div>
    );
  }

  // ── ADD WIZARD MODAL ──────────────────────────────────────
  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/45 backdrop-blur-sm overflow-y-auto" onClick={onClose}>
      <div
        className="w-full max-w-2xl rounded-2xl border border-slate-100 bg-white shadow-xl dark:border-slate-800 dark:bg-slate-900 my-8 animate-in fade-in-50 zoom-in-95 duration-200"
        onClick={(e) => e.stopPropagation()}
      >
        {/* Header */}
        <div className="flex items-center justify-between border-b border-slate-100 px-6 py-4 dark:border-slate-800">
          <div>
            <h3 className="text-lg font-bold text-slate-900 dark:text-white">
              ➕ Add Marks Entries
            </h3>
            <p className="text-xs text-slate-500 mt-0.5 dark:text-slate-400">
              {currentStep === 1
                ? 'Step 1: Select the scheduled exam'
                : 'Step 2: Enter student marks for the exam class'}
            </p>
          </div>
          <button type="button" onClick={onClose} className="rounded-lg p-1.5 text-slate-400 hover:bg-slate-100 dark:hover:bg-slate-800">
            <svg className="h-5 w-5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
              <path strokeLinecap="round" strokeLinejoin="round" d="M6 18L18 6M6 6l12 12" />
            </svg>
          </button>
        </div>

        {/* Wizard Forms */}
        <form onSubmit={handleSubmit} className="p-6">
          {errorMsg && (
            <div className="mb-4 rounded-xl border border-rose-200 bg-rose-50 p-3.5 text-sm font-semibold text-rose-600 dark:border-rose-900/30 dark:bg-rose-950/20 dark:text-rose-400">
              ⚠ {errorMsg}
            </div>
          )}
          {currentStep === 1 ? renderStep1() : renderStep2()}

          {/* Footer */}
          <div className="flex justify-between items-center mt-6 pt-4 border-t border-slate-100 dark:border-slate-800">
            <div>
              {currentStep === 2 && (
                <button
                  type="button"
                  onClick={() => {
                    setCurrentStep(1);
                    setSelectedExam(null);
                  }}
                  className="rounded-lg border border-slate-200 bg-white px-4 py-2 text-sm font-semibold text-slate-700 hover:bg-slate-50 dark:border-slate-700 dark:bg-slate-800 dark:text-slate-300 dark:hover:bg-slate-700"
                >
                  ← Back
                </button>
              )}
            </div>

            <div className="flex gap-3">
              <button
                type="button"
                onClick={onClose}
                disabled={loading}
                className="rounded-lg border border-slate-200 bg-white px-4 py-2 text-sm font-semibold text-slate-700 hover:bg-slate-50 dark:border-slate-700 dark:bg-slate-800 dark:text-slate-300 dark:hover:bg-slate-700"
              >
                Cancel
              </button>
              
              {currentStep === 2 && (
                <button
                  type="submit"
                  disabled={loading || matchingStudents.length === 0}
                  className="inline-flex items-center gap-1.5 rounded-lg bg-brand-blue px-5 py-2 text-sm font-semibold text-white hover:bg-brand-blue/90 shadow-sm active:scale-95 disabled:opacity-50"
                >
                  {loading ? (
                    <>
                      <div className="h-3.5 w-3.5 animate-spin rounded-full border-2 border-white border-t-transparent" />
                      Saving Entries...
                    </>
                  ) : (
                    'Save Marks'
                  )}
                </button>
              )}
            </div>
          </div>
        </form>
      </div>
    </div>
  );
}
