import { useState, useEffect, useRef, useMemo } from 'react';
import { fetchSectionData } from '../../services/sectionService';

const MAX_INSTALLMENTS = 10;
const BASE_INSTALLMENTS = 4;

const INSTALLMENT_FIELDS = Array.from({ length: MAX_INSTALLMENTS }, (_, idx) => {
  const num = idx + 1;
  return {
    num,
    dateKey: num === 1 ? 'date' : `date${num}`,
    amountKey: `amount${num}`,
    detailsKey: `details${num}`,
    refKey: `ref${num}`,
  };
});

const INSTALLMENT_AMOUNT_KEYS = new Set(INSTALLMENT_FIELDS.map((f) => f.amountKey));

const EMPTY_FORM = {
  studentId: '',
  name: '',
  totalGrossFee: '',
  discount: '',
  totalNetFee: '',
  paidFee: '',
  pendingFee: '',
  ...Object.fromEntries(
    INSTALLMENT_FIELDS.flatMap(({ dateKey, detailsKey, refKey, amountKey }) => [
      [dateKey, ''],
      [detailsKey, ''],
      [refKey, ''],
      [amountKey, ''],
    ])
  ),
};

const INACTIVE_TX_REGEX = /\b(failed|fail|cancelled|canceled|cancel|pending|bounced|rejected|reversed)\b/i;

/** Resolve a field from multiple possible key names */
const pick = (obj, ...keys) => {
  if (!obj) return '';
  for (const k of keys) {
    if (obj[k] !== undefined && obj[k] !== null && obj[k] !== '') return String(obj[k]).trim();
  }
  return '';
};

const resilientPick = (obj, ...keys) => {
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

const toDateInputValue = (val) => {
  const str = String(val ?? '').trim();
  if (!str) return '';
  if (/^\d{4}-\d{2}-\d{2}$/.test(str)) return str;
  const dmy = str.match(/^(\d{1,2})[-/](\d{1,2})[-/](\d{4})$/);
  if (dmy) {
    return `${dmy[3]}-${dmy[2].padStart(2, '0')}-${dmy[1].padStart(2, '0')}`;
  }
  return '';
};

const toNumber = (val) => {
  if (val === '' || val === null || val === undefined) return 0;
  const n = Number(val);
  return Number.isFinite(n) ? n : NaN;
};

const buildStudentFullName = (s) => {
  const first = String(resilientPick(s, 'student_name', 'student_NAme', 'Student Name', 'name', 'Name') || '').trim();
  const father = String(resilientPick(s, 'father_name', 'father name', 'father NAme', 'Father Name', 'fatherName') || '').trim();
  const surname = String(resilientPick(s, 'surname', 'Surname', 'SurNAme') || '').trim();

  const parts = [];
  if (first) parts.push(first);
  if (father && !first.toLowerCase().includes(father.toLowerCase())) parts.push(father);
  if (surname && !first.toLowerCase().includes(surname.toLowerCase())) parts.push(surname);
  return parts.join(' ').trim();
};

export const isNonSuccessfulInstallment = (details, ref) => {
  const text = `${details || ''} ${ref || ''}`.trim();
  return text ? INACTIVE_TX_REGEX.test(text) : false;
};

export const computeFeeSummary = (data, useInstallmentSum) => {
  const hasGross = String(data.totalGrossFee ?? '').trim() !== '';
  const hasDisc = String(data.discount ?? '').trim() !== '';
  const grossRaw = toNumber(data.totalGrossFee);
  const discRaw = toNumber(data.discount);
  const gross = Number.isFinite(grossRaw) ? grossRaw : 0;
  const disc = Number.isFinite(discRaw) ? discRaw : 0;

  const totalNetFee = (hasGross || hasDisc)
    ? Math.max(0, gross - disc)
    : (Number.isFinite(toNumber(data.totalNetFee)) ? Math.max(0, toNumber(data.totalNetFee)) : 0);

  let installmentSum = 0;
  const excludedInstallments = [];
  let hasPositiveInstallment = false;

  INSTALLMENT_FIELDS.forEach(({ num, amountKey, detailsKey, refKey }) => {
    const rawAmt = String(data[amountKey] ?? '').trim();
    const amt = toNumber(rawAmt);
    if (rawAmt !== '' && Number.isFinite(amt) && amt > 0) {
      if (isNonSuccessfulInstallment(data[detailsKey], data[refKey])) {
        excludedInstallments.push(num);
      } else {
        installmentSum += amt;
        hasPositiveInstallment = true;
      }
    }
  });

  const manualPaid = toNumber(data.paidFee);
  const paidFee = (useInstallmentSum || hasPositiveInstallment || excludedInstallments.length > 0)
    ? installmentSum
    : (Number.isFinite(manualPaid) ? manualPaid : 0);

  const rawPending = totalNetFee - paidFee;
  const pendingFee = rawPending >= 0 ? rawPending : 0;

  let status = 'Unpaid';
  if (paidFee > totalNetFee && (totalNetFee > 0 || hasGross || paidFee > 0)) {
    status = 'Overpaid';
  } else if (paidFee <= 0) {
    status = 'Unpaid';
  } else if (paidFee < totalNetFee) {
    status = 'Partial Paid';
  } else {
    status = 'Fully Paid';
  }

  return {
    totalNetFee,
    paidFee,
    pendingFee,
    rawPending,
    status,
    excludedInstallments,
    hasInstallmentDrivenPaid: useInstallmentSum || hasPositiveInstallment || excludedInstallments.length > 0,
  };
};

const getInitialVisibleInstallments = (form) => {
  let highest = BASE_INSTALLMENTS;
  INSTALLMENT_FIELDS.forEach(({ num, dateKey, amountKey, detailsKey, refKey }) => {
    if (num > BASE_INSTALLMENTS && (form[dateKey] || form[amountKey] || form[detailsKey] || form[refKey])) {
      highest = num;
    }
  });
  return highest;
};

const hasAnyPositiveInstallment = (form) =>
  INSTALLMENT_FIELDS.some(({ amountKey }) => (parseFloat(form[amountKey]) || 0) > 0);

const buildInitialForm = (mode, feesData) => {
  if (mode === 'edit' && feesData) {
    const installmentEntries = Object.fromEntries(
      INSTALLMENT_FIELDS.flatMap(({ num, dateKey, detailsKey, refKey, amountKey }) => {
        const dateVal = num === 1
          ? toDateInputValue(pick(feesData, 'date', 'Date', 'DATE'))
          : toDateInputValue(pick(feesData, `date${num}`, `Date${num}`, `DATE${num}`));
        const detailsVal = pick(
          feesData,
          `detials${num}`,
          `details${num}`,
          `DETIALS${num}`,
          `Details${num}`
        );
        const refVal = pick(feesData, `ref${num}`, `REF${num}`, `Ref${num}`);
        const amtVal = pick(feesData, `amount${num}`, `AMOUNT${num}`, `Amount${num}`);
        return [
          [dateKey, dateVal],
          [detailsKey, detailsVal],
          [refKey, refVal],
          [amountKey, amtVal],
        ];
      })
    );

    return {
      studentId: pick(feesData, 'Student_ID', 'student_id', 'Student ID'),
      name: pick(feesData, 'NAME', 'name', 'Name'),
      totalGrossFee: pick(feesData, 'TOTAL GROSS FEE', 'total_gross_fee', 'Total Gross Fee'),
      discount: pick(feesData, 'DISCOUNT', 'discount'),
      totalNetFee: pick(feesData, 'TOTAL NET FEE', 'total_net_fee', 'Total Net Fee'),
      paidFee: pick(feesData, 'PAID FEE', 'paid_fee', 'Paid Fee'),
      pendingFee: pick(feesData, 'PENDING FEE', 'pending_fee', 'Pending Fee'),
      ...installmentEntries,
    };
  }
  return { ...EMPTY_FORM };
};

export default function FeesModals({
  isOpen,
  mode,
  feesData,
  onClose,
  onSave,
  loading,
}) {
  const initialForm = useMemo(() => (isOpen ? buildInitialForm(mode, feesData) : EMPTY_FORM), [isOpen, mode, feesData]);
  const [formData, setFormData] = useState(initialForm);
  const [visibleInstallments, setVisibleInstallments] = useState(() =>
    getInitialVisibleInstallments(initialForm)
  );
  const [installmentsTouched, setInstallmentsTouched] = useState(() =>
    hasAnyPositiveInstallment(initialForm)
  );
  const [validationError, setValidationError] = useState('');
  const [students, setStudents] = useState([]);
  const [loadingStudents, setLoadingStudents] = useState(false);
  const [showDropdown, setShowDropdown] = useState(false);
  const dropdownRef = useRef(null);
  const originalStudentIdRef = useRef(initialForm.studentId);
  const submittingRef = useRef(false);

  useEffect(() => {
    if (!loading) {
      submittingRef.current = false;
    }
  }, [loading]);

  // Fetch students list once the modal is open
  useEffect(() => {
    if (isOpen) {
      setLoadingStudents(true);
      fetchSectionData('students')
        .then((res) => {
          if (res && res.rows) {
            setStudents(res.rows);
          }
        })
        .catch((err) => {
          console.error('Error fetching students:', err);
        })
        .finally(() => {
          setLoadingStudents(false);
        });
    }
  }, [isOpen]);

  // Click outside to close dropdown
  useEffect(() => {
    const handleClickOutside = (event) => {
      if (dropdownRef.current && !dropdownRef.current.contains(event.target)) {
        setShowDropdown(false);
      }
    };
    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, []);

  // Normalize student objects using resilientPick and full name construction
  const normalizedStudents = useMemo(() => {
    return students.map((s) => {
      const studentId = String(resilientPick(s, 'student_id', 'Student ID', 'studentId', 'roll_no', 'Roll No') || '').trim();
      const name = buildStudentFullName(s);
      const rollNumber = String(resilientPick(s, 'roll_number', 'Roll Number', 'rollNumber', 'roll_no', 'Roll No') || '').trim();
      const phone = String(resilientPick(s, 'student_phone', 'Student_Phone', 'parent_phone', 'Parent_Phone', 'mobileNumber', 'mobile_number', 'Mobile Number', 'parentMobile') || '').trim();
      const active = resilientPick(s, 'active', 'Active', 'is_active') !== false && String(resilientPick(s, 'status', 'Status')).toLowerCase() !== 'inactive';

      return { studentId, name, rollNumber, phone, active };
    }).filter(s => s.studentId);
  }, [students]);

  // Filter students based on search query
  const filteredStudents = useMemo(() => {
    const query = String(formData.studentId || '').trim().toLowerCase();
    if (!query) {
      return normalizedStudents.filter(s => s.active).slice(0, 50);
    }
    return normalizedStudents
      .filter((s) => {
        return (
          s.studentId.toLowerCase().includes(query) ||
          s.name.toLowerCase().includes(query) ||
          s.phone.toLowerCase().includes(query) ||
          s.rollNumber.toLowerCase().includes(query)
        );
      })
      .slice(0, 50);
  }, [normalizedStudents, formData.studentId]);

  // Auto-fill full student name when adding a student or when studentId is changed/name is blank
  useEffect(() => {
    if (!isOpen || !formData.studentId) return;
    const match = normalizedStudents.find(
      (s) => s.studentId.toLowerCase() === formData.studentId.trim().toLowerCase()
    );
    if (!match || !match.name) return;

    const isSameOriginalEditRecord =
      mode === 'edit' &&
      originalStudentIdRef.current &&
      formData.studentId.trim().toLowerCase() === originalStudentIdRef.current.trim().toLowerCase();

    const currentName = String(formData.name || '').trim();
    const shouldFill =
      mode === 'add' ||
      !isSameOriginalEditRecord ||
      !currentName;

    if (shouldFill && currentName !== match.name) {
      setFormData((prev) => ({ ...prev, name: match.name }));
    }
  }, [isOpen, mode, formData.studentId, formData.name, normalizedStudents]);

  const handleSelectStudent = (student) => {
    setFormData((prev) => ({
      ...prev,
      studentId: student.studentId,
      name: student.name,
    }));
    setShowDropdown(false);
    setValidationError('');
  };

  useEffect(() => {
    setValidationError('');
    if (isOpen) {
      const next = buildInitialForm(mode, feesData);
      originalStudentIdRef.current = next.studentId;
      setFormData(next);
      setVisibleInstallments(getInitialVisibleInstallments(next));
      setInstallmentsTouched(hasAnyPositiveInstallment(next));
    } else {
      originalStudentIdRef.current = '';
      setFormData(EMPTY_FORM);
      setVisibleInstallments(BASE_INSTALLMENTS);
      setInstallmentsTouched(false);
    }
  }, [isOpen, mode, feesData]);

  const summary = useMemo(
    () => computeFeeSummary(formData, installmentsTouched),
    [formData, installmentsTouched]
  );

  // Escape key to close
  useEffect(() => {
    const handleKey = (e) => { if (isOpen && e.key === 'Escape') onClose(); };
    window.addEventListener('keydown', handleKey);
    return () => window.removeEventListener('keydown', handleKey);
  }, [isOpen, onClose]);

  if (!isOpen) return null;

  const handleChange = (e) => {
    const { name, value } = e.target;
    setValidationError('');
    if (INSTALLMENT_AMOUNT_KEYS.has(name)) {
      setInstallmentsTouched(true);
    }
    setFormData(prev => ({ ...prev, [name]: value }));
  };

  const handleAddInstallment = () => {
    setVisibleInstallments((prev) => Math.min(MAX_INSTALLMENTS, prev + 1));
  };

  const handleRemoveExtraInstallment = (inst) => {
    setValidationError('');
    setFormData((prev) => ({
      ...prev,
      [inst.dateKey]: '',
      [inst.amountKey]: '',
      [inst.detailsKey]: '',
      [inst.refKey]: '',
    }));
    if (inst.num === visibleInstallments && visibleInstallments > BASE_INSTALLMENTS) {
      setVisibleInstallments((prev) => Math.max(BASE_INSTALLMENTS, prev - 1));
    }
  };

  const validateBeforeSave = () => {
    const grossVal = String(formData.totalGrossFee ?? '').trim();
    const discVal = String(formData.discount ?? '').trim();
    const gross = toNumber(grossVal);
    const disc = toNumber(discVal);

    if (grossVal !== '' && (!Number.isFinite(gross) || gross < 0)) {
      return 'Total Gross Fee must be a valid non-negative number.';
    }
    if (discVal !== '' && (!Number.isFinite(disc) || disc < 0)) {
      return 'Discount must be a valid non-negative number.';
    }
    if (grossVal !== '' && discVal !== '' && disc > gross) {
      return 'Discount cannot exceed Total Gross Fee.';
    }

    const seenRefs = new Map();
    for (const { num, amountKey, refKey } of INSTALLMENT_FIELDS) {
      const rawAmt = String(formData[amountKey] ?? '').trim();
      if (rawAmt !== '') {
        const amt = toNumber(rawAmt);
        if (!Number.isFinite(amt) || amt < 0) {
          return `Installment ${num} amount must be a valid non-negative number.`;
        }
      }
      const ref = String(formData[refKey] ?? '').trim();
      if (ref) {
        const normRef = ref.toLowerCase();
        if (seenRefs.has(normRef)) {
          return `Duplicate Reference No. "${ref}" found in Installment ${seenRefs.get(normRef)} and Installment ${num}.`;
        }
        seenRefs.set(normRef, num);
      }
    }

    const paidRaw = String(formData.paidFee ?? '').trim();
    if (!summary.hasInstallmentDrivenPaid && paidRaw !== '') {
      const manualPaid = toNumber(paidRaw);
      if (!Number.isFinite(manualPaid) || manualPaid < 0) {
        return 'Paid Fee must be a valid non-negative number.';
      }
    }

    if (summary.paidFee < 0) {
      return 'Paid Fee cannot be negative.';
    }

    if (summary.paidFee > summary.totalNetFee && (summary.totalNetFee > 0 || grossVal !== '' || summary.paidFee > 0)) {
      return `Paid Fee (₹${summary.paidFee.toLocaleString('en-IN')}) cannot exceed Total Net Fee (₹${summary.totalNetFee.toLocaleString('en-IN')}).`;
    }

    return '';
  };

  const handleSubmit = (e) => {
    if (e) e.preventDefault();
    if (mode === 'delete') {
      if (loading || submittingRef.current) return;
      submittingRef.current = true;
      onSave(formData);
      return;
    }

    if (loading || submittingRef.current) return;

    const err = validateBeforeSave();
    if (err) {
      setValidationError(err);
      return;
    }

    submittingRef.current = true;
    onSave({
      ...formData,
      totalNetFee: (String(formData.totalGrossFee ?? '').trim() !== '' || String(formData.discount ?? '').trim() !== '' || String(formData.totalNetFee ?? '').trim() !== '')
        ? String(summary.totalNetFee)
        : '',
      paidFee: String(summary.paidFee),
      pendingFee: String(summary.pendingFee),
    });
  };

  // ── DELETE MODAL ──────────────────────────────────────────
  if (mode === 'delete') {
    return (
      <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/40 backdrop-blur-sm">
        <div
          className="w-full max-w-md rounded-2xl border border-slate-100 bg-white p-6 shadow-xl dark:border-slate-800 dark:bg-slate-900 animate-in fade-in-50 zoom-in-95 duration-200"
          onClick={e => e.stopPropagation()}
        >
          <div className="flex h-12 w-12 items-center justify-center rounded-full bg-rose-50 text-rose-600 dark:bg-rose-950/30 dark:text-rose-400">
            <svg className="h-6 w-6" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
              <path strokeLinecap="round" strokeLinejoin="round" d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16" />
            </svg>
          </div>
          <div className="mt-4">
            <h3 className="text-lg font-semibold text-slate-900 dark:text-white">Delete Fee Record</h3>
            <p className="mt-2 text-sm text-slate-500 dark:text-slate-400">
              Are you sure you want to delete the selected fee record(s)? This cannot be undone.
            </p>
          </div>
          <div className="mt-6 flex justify-end gap-3">
            <button type="button" onClick={onClose} disabled={loading}
              className="rounded-lg border border-slate-200 bg-white px-4 py-2 text-sm font-semibold text-slate-700 hover:bg-slate-50 dark:border-slate-700 dark:bg-slate-800 dark:text-slate-300 dark:hover:bg-slate-700">
              Cancel
            </button>
            <button type="button" onClick={handleSubmit} disabled={loading}
              className="inline-flex items-center gap-1.5 rounded-lg bg-rose-600 px-4 py-2 text-sm font-semibold text-white hover:bg-rose-500 active:scale-95 disabled:opacity-50">
              {loading ? <><div className="h-3.5 w-3.5 animate-spin rounded-full border-2 border-white border-t-transparent" />Deleting...</> : 'Delete'}
            </button>
          </div>
        </div>
      </div>
    );
  }

  // ── ADD / EDIT MODAL ──────────────────────────────────────
  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/45 backdrop-blur-sm overflow-y-auto" onClick={onClose}>
      <div
        className="w-full max-w-2xl rounded-2xl border border-slate-100 bg-white shadow-xl dark:border-slate-800 dark:bg-slate-900 my-8 animate-in fade-in-50 zoom-in-95 duration-200"
        onClick={e => e.stopPropagation()}
      >
        {/* Header */}
        <div className="flex items-center justify-between border-b border-slate-100 px-6 py-4 dark:border-slate-800">
          <div>
            <h3 className="text-lg font-bold text-slate-900 dark:text-white">
              {mode === 'add' ? '➕ Add Fee Record' : '✏️ Edit Fee Record'}
            </h3>
            <p className="text-xs text-slate-500 mt-0.5 dark:text-slate-400">All fields are optional — fill only what you need</p>
          </div>
          <button type="button" onClick={onClose}
            className="rounded-lg p-1.5 text-slate-400 hover:bg-slate-100 dark:hover:bg-slate-800">
            <svg className="h-5 w-5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
              <path strokeLinecap="round" strokeLinejoin="round" d="M6 18L18 6M6 6l12 12" />
            </svg>
          </button>
        </div>

        {/* Form */}
        <form onSubmit={handleSubmit} className="p-6 space-y-6 max-h-[75vh] overflow-y-auto">
          {validationError && (
            <div className="rounded-lg border border-rose-200 bg-rose-50 px-4 py-3 text-xs font-medium text-rose-700 dark:border-rose-900/50 dark:bg-rose-950/30 dark:text-rose-300">
              {validationError}
            </div>
          )}

          {/* Student Info */}
          <Section title="Student Information">
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              <div className="relative" ref={dropdownRef}>
                <label className="text-xs font-semibold text-slate-500 dark:text-slate-400">Student ID</label>
                <div className="relative mt-1.5">
                  <input
                    type="text"
                    name="studentId"
                    value={formData.studentId}
                    onChange={handleChange}
                    onFocus={() => setShowDropdown(true)}
                    disabled={loading}
                    placeholder="e.g. F2627111001"
                    autoComplete="off"
                    className="w-full rounded-lg border border-slate-200 px-3 py-2 text-sm outline-none transition focus:border-brand-blue focus:ring-2 focus:ring-brand-blue/20 dark:border-slate-700 dark:bg-slate-800 dark:text-white disabled:opacity-60"
                  />
                  {loadingStudents && (
                    <div className="absolute right-3 top-2.5">
                      <div className="h-4 w-4 animate-spin rounded-full border-2 border-brand-blue border-t-transparent" />
                    </div>
                  )}
                </div>

                {/* Dropdown panel */}
                {showDropdown && filteredStudents.length > 0 && (
                  <div className="absolute z-50 mt-1 max-h-60 w-full overflow-y-auto rounded-lg border border-slate-200 bg-white py-1 shadow-lg dark:border-slate-700 dark:bg-slate-800 dark:text-white animate-in fade-in slide-in-from-top-1 duration-100">
                    {filteredStudents.map((student) => (
                      <button
                        key={student.studentId}
                        type="button"
                        onClick={() => handleSelectStudent(student)}
                        className="flex w-full flex-col px-4 py-2 text-left text-sm hover:bg-slate-50 dark:hover:bg-slate-700/50 transition-colors border-b border-slate-50 dark:border-slate-700/50 last:border-b-0"
                      >
                        <div className="flex items-center justify-between">
                          <span className="font-semibold text-slate-900 dark:text-white">
                            {student.studentId}
                          </span>
                          {student.rollNumber && (
                            <span className="text-xs text-slate-400 dark:text-slate-500">
                              Roll: {student.rollNumber}
                            </span>
                          )}
                        </div>
                        <div className="flex items-center justify-between mt-0.5">
                          <span className="text-xs text-slate-500 dark:text-slate-400">
                            {student.name}
                          </span>
                          {student.phone && (
                            <span className="text-xs text-slate-400 dark:text-slate-500">
                              📞 {student.phone}
                            </span>
                          )}
                        </div>
                      </button>
                    ))}
                  </div>
                )}

                {showDropdown && !loadingStudents && filteredStudents.length === 0 && formData.studentId.trim() !== '' && (
                  <div className="absolute z-50 mt-1 w-full rounded-lg border border-slate-200 bg-white px-4 py-3 text-center text-xs text-slate-500 dark:border-slate-700 dark:bg-slate-800 dark:text-slate-400 shadow-lg">
                    No matching students found
                  </div>
                )}
              </div>
              <Field label="Full Name" name="name" value={formData.name} onChange={handleChange} disabled={loading} placeholder="Student full name" />
            </div>
          </Section>

          {/* Fee Breakdown */}
          <Section title="Fee Breakdown (₹)">
            <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
              <Field label="Total Gross Fee" name="totalGrossFee" inputMode="numeric" value={formData.totalGrossFee} onChange={handleChange} disabled={loading} placeholder="105000" />
              <Field label="Discount" name="discount" inputMode="numeric" value={formData.discount} onChange={handleChange} disabled={loading} placeholder="0" />
              <ComputedField label="Total Net Fee (auto)" value={summary.totalNetFee} />
            </div>
            <div className="grid grid-cols-1 sm:grid-cols-3 gap-4 mt-4">
              {summary.hasInstallmentDrivenPaid ? (
                <ComputedField label="Paid Fee (auto)" value={summary.paidFee} />
              ) : (
                <Field label="Paid Fee" name="paidFee" inputMode="numeric" value={formData.paidFee} onChange={handleChange} disabled={loading} placeholder="0" />
              )}
              <ComputedField label="Pending Fee (auto)" value={summary.pendingFee} />
              <StatusField label="Fee Status" status={summary.status} />
            </div>
            {summary.excludedInstallments.length > 0 && (
              <p className="mt-2 text-xs text-amber-600 dark:text-amber-400">
                Note: Installment {summary.excludedInstallments.join(', ')} marked as failed/cancelled/pending and excluded from Paid Fee.
              </p>
            )}
          </Section>

          {/* Installments 1..N (default 4, expandable up to 10 via + button) */}
          {INSTALLMENT_FIELDS.slice(0, visibleInstallments).map((inst) => {
            const placeholders = {
              1: 'e.g. Cash payment',
              2: 'e.g. Online transfer',
              3: 'e.g. Cheque',
              4: 'e.g. UPI',
            };
            return (
              <Section
                key={inst.num}
                title={`Payment Installment ${inst.num}`}
                action={
                  inst.num > BASE_INSTALLMENTS && inst.num === visibleInstallments ? (
                    <button
                      type="button"
                      onClick={() => handleRemoveExtraInstallment(inst)}
                      disabled={loading}
                      className="text-xs font-medium text-rose-500 hover:text-rose-600 disabled:opacity-50"
                    >
                      Remove
                    </button>
                  ) : null
                }
              >
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                  <Field label="Date" name={inst.dateKey} type="date" value={formData[inst.dateKey]} onChange={handleChange} disabled={loading} />
                  <Field label="Amount" name={inst.amountKey} inputMode="numeric" value={formData[inst.amountKey]} onChange={handleChange} disabled={loading} placeholder="0" />
                  <Field label="Details / Remarks" name={inst.detailsKey} value={formData[inst.detailsKey]} onChange={handleChange} disabled={loading} placeholder={placeholders[inst.num] || 'e.g. UPI / Cash'} />
                  <Field label="Reference No." name={inst.refKey} value={formData[inst.refKey]} onChange={handleChange} disabled={loading} placeholder={`e.g. TXN${String(inst.num).padStart(3, '0')}`} />
                </div>
              </Section>
            );
          })}

          {visibleInstallments < MAX_INSTALLMENTS && (
            <div className="flex justify-center">
              <button
                type="button"
                onClick={handleAddInstallment}
                disabled={loading}
                className="inline-flex items-center gap-1.5 rounded-lg border border-dashed border-brand-blue/40 bg-brand-blue/5 px-4 py-2 text-xs font-semibold text-brand-blue transition hover:bg-brand-blue/10 active:scale-95 disabled:opacity-50 dark:border-brand-blue/50 dark:bg-brand-blue/10 dark:text-blue-300"
              >
                <svg className="h-4 w-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2.5}>
                  <path strokeLinecap="round" strokeLinejoin="round" d="M12 4v16m8-8H4" />
                </svg>
                <span>Add Installment {visibleInstallments + 1}</span>
              </button>
            </div>
          )}

          {/* Footer */}
          <div className="flex justify-end gap-3 pt-2 border-t border-slate-100 dark:border-slate-800">
            <button type="button" onClick={onClose} disabled={loading}
              className="rounded-lg border border-slate-200 bg-white px-4 py-2 text-sm font-semibold text-slate-700 hover:bg-slate-50 dark:border-slate-700 dark:bg-slate-800 dark:text-slate-300 dark:hover:bg-slate-700">
              Cancel
            </button>
            <button type="submit" disabled={loading}
              className="inline-flex items-center gap-1.5 rounded-lg bg-brand-blue px-5 py-2 text-sm font-semibold text-white hover:bg-brand-blue/90 shadow-sm active:scale-95 disabled:opacity-50">
              {loading
                ? <><div className="h-3.5 w-3.5 animate-spin rounded-full border-2 border-white border-t-transparent" />Saving...</>
                : mode === 'add' ? 'Save Record' : 'Update Record'}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}

function Section({ title, action, children }) {
  return (
    <div>
      <p className="text-xs font-semibold uppercase tracking-wider text-slate-400 mb-3 flex items-center gap-2">
        <span className="flex-1 h-px bg-slate-100 dark:bg-slate-800" />
        <span>{title}</span>
        <span className="flex-1 h-px bg-slate-100 dark:bg-slate-800" />
        {action}
      </p>
      {children}
    </div>
  );
}

function Field({ label, name, value, onChange, disabled, placeholder, type = 'text', inputMode }) {
  return (
    <div>
      <label className="text-xs font-semibold text-slate-500 dark:text-slate-400">{label}</label>
      <input
        type={inputMode ? 'text' : type}
        inputMode={inputMode}
        name={name}
        value={value}
        onChange={onChange}
        disabled={disabled}
        placeholder={placeholder}
        className="mt-1.5 w-full rounded-lg border border-slate-200 px-3 py-2 text-sm outline-none transition focus:border-brand-blue focus:ring-2 focus:ring-brand-blue/20 dark:border-slate-700 dark:bg-slate-800 dark:text-white disabled:opacity-60"
      />
    </div>
  );
}

/** Read-only auto-calculated field */
function ComputedField({ label, value }) {
  return (
    <div>
      <label className="text-xs font-semibold text-slate-500 dark:text-slate-400 flex items-center gap-1">
        {label}
        <span title="Auto-calculated" className="text-brand-blue">
          <svg className="h-3 w-3 inline" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
            <path strokeLinecap="round" strokeLinejoin="round" d="M9 7h6m0 10v-3m-3 3h.01M9 17h.01M9 11h.01M12 11h.01M15 11h.01M4 19h16a2 2 0 002-2V7a2 2 0 00-2-2H4a2 2 0 00-2 2v10a2 2 0 002 2z" />
          </svg>
        </span>
      </label>
      <div className="mt-1.5 w-full rounded-lg border border-brand-blue/30 bg-brand-blue/5 px-3 py-2 text-sm font-semibold text-brand-blue dark:border-brand-blue/40 dark:bg-brand-blue/10 dark:text-blue-300 select-none">
        {value !== '' && value !== undefined ? `₹ ${Number(value).toLocaleString('en-IN')}` : '—'}
      </div>
    </div>
  );
}

function StatusField({ label, status }) {
  const tone =
    status === 'Fully Paid'
      ? 'border-emerald-200 bg-emerald-50 text-emerald-700 dark:border-emerald-900/50 dark:bg-emerald-950/30 dark:text-emerald-300'
      : status === 'Partial Paid'
        ? 'border-blue-200 bg-blue-50 text-blue-700 dark:border-blue-900/50 dark:bg-blue-950/30 dark:text-blue-300'
        : status === 'Overpaid'
          ? 'border-rose-200 bg-rose-50 text-rose-700 dark:border-rose-900/50 dark:bg-rose-950/30 dark:text-rose-300'
          : 'border-amber-200 bg-amber-50 text-amber-700 dark:border-amber-900/50 dark:bg-amber-950/30 dark:text-amber-300';

  return (
    <div>
      <label className="text-xs font-semibold text-slate-500 dark:text-slate-400">{label}</label>
      <div className={`mt-1.5 w-full rounded-lg border px-3 py-2 text-sm font-semibold select-none ${tone}`}>
        {status}
      </div>
    </div>
  );
}
