import { useState, useEffect } from 'react';

const EMPTY_FORM = {
  studentId: '',
  name: '',
  totalGrossFee: '',
  discount: '',
  totalNetFee: '',
  paidFee: '',
  pendingFee: '',
  // Installment 1
  date: '',
  details1: '',
  ref1: '',
  amount1: '',
  // Installment 2
  date2: '',
  details2: '',
  ref2: '',
  amount2: '',
  // Installment 3
  date3: '',
  details3: '',
  ref3: '',
  amount3: '',
  // Installment 4
  date4: '',
  details4: '',
  ref4: '',
  amount4: '',
};

/** Resolve a field from multiple possible key names */
const pick = (obj, ...keys) => {
  for (const k of keys) {
    if (obj[k] !== undefined && obj[k] !== null && obj[k] !== '') return obj[k];
  }
  return '';
};

export default function FeesModals({
  isOpen,
  mode,
  feesData,
  onClose,
  onSave,
  loading,
}) {
  const [formData, setFormData] = useState(EMPTY_FORM);

  useEffect(() => {
    if (isOpen) {
      if (mode === 'edit' && feesData) {
        setFormData({
          studentId:    pick(feesData, 'Student_ID', 'student_id', 'Student ID'),
          name:         pick(feesData, 'name', 'Name'),
          totalGrossFee: pick(feesData, 'TOTAL GROSS FEE', 'total_gross_fee', 'Total Gross Fee'),
          discount:     pick(feesData, 'DISCOUNT', 'discount'),
          totalNetFee:  pick(feesData, 'TOTAL NET FEE', 'total_net_fee', 'Total Net Fee'),
          paidFee:      pick(feesData, 'PAID FEE', 'paid_fee', 'Paid Fee'),
          pendingFee:   pick(feesData, 'PENDING FEE', 'pending_fee', 'Pending Fee'),
          date:         pick(feesData, 'date', 'Date', 'DATE'),
          details1:     pick(feesData, 'detials1', 'details1', 'DETIALS1', 'Details1'),
          ref1:         pick(feesData, 'ref1', 'REF1', 'Ref1'),
          amount1:      pick(feesData, 'amount1', 'AMOUNT1', 'Amount1'),
          date2:        pick(feesData, 'date2', 'Date2', 'DATE2'),
          details2:     pick(feesData, 'detials2', 'details2', 'DETIALS2'),
          ref2:         pick(feesData, 'ref2', 'REF2'),
          amount2:      pick(feesData, 'amount2', 'AMOUNT2'),
          date3:        pick(feesData, 'date3', 'Date3', 'DATE3'),
          details3:     pick(feesData, 'detials3', 'details3', 'DETIALS3'),
          ref3:         pick(feesData, 'ref3', 'REF3'),
          amount3:      pick(feesData, 'amount3', 'AMOUNT3'),
          date4:        pick(feesData, 'date4', 'Date4', 'DATE4'),
          details4:     pick(feesData, 'detials4', 'details4', 'DETIALS4'),
          ref4:         pick(feesData, 'ref4', 'REF4'),
          amount4:      pick(feesData, 'amount4', 'AMOUNT4'),
        });
      } else {
        setFormData(EMPTY_FORM);
      }
    }
  }, [isOpen, mode, feesData]);

  // Auto-calculate derived fields whenever gross fee, discount or paid fee changes
  useEffect(() => {
    const gross   = parseFloat(formData.totalGrossFee) || 0;
    const disc    = parseFloat(formData.discount)      || 0;
    const netFee  = gross - disc;
    const paid    = parseFloat(formData.paidFee)       || 0;
    const pending = netFee - paid;

    setFormData(prev => ({
      ...prev,
      totalNetFee: (gross || disc) ? String(netFee  >= 0 ? netFee  : 0) : prev.totalNetFee,
      pendingFee:  (paid  || netFee) ? String(pending >= 0 ? pending : 0) : prev.pendingFee,
    }));
  }, [formData.totalGrossFee, formData.discount, formData.paidFee]); // eslint-disable-line react-hooks/exhaustive-deps

  // Escape key to close
  useEffect(() => {
    const handleKey = (e) => { if (isOpen && e.key === 'Escape') onClose(); };
    window.addEventListener('keydown', handleKey);
    return () => window.removeEventListener('keydown', handleKey);
  }, [isOpen, onClose]);

  if (!isOpen) return null;

  const handleChange = (e) => {
    const { name, value } = e.target;
    setFormData(prev => ({ ...prev, [name]: value }));
  };

  const handleSubmit = (e) => {
    if (e) e.preventDefault();
    onSave(formData); // no mandatory validation — all fields optional
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

          {/* Student Info */}
          <Section title="Student Information">
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              <Field label="Student ID" name="studentId" value={formData.studentId} onChange={handleChange} disabled={loading} placeholder="e.g. F2627111001" />
              <Field label="Full Name" name="name" value={formData.name} onChange={handleChange} disabled={loading} placeholder="Student full name" />
            </div>
          </Section>

          {/* Fee Breakdown */}
          <Section title="Fee Breakdown (₹)">
            <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
              <Field label="Total Gross Fee" name="totalGrossFee" inputMode="numeric" value={formData.totalGrossFee} onChange={handleChange} disabled={loading} placeholder="105000" />
              <Field label="Discount" name="discount" inputMode="numeric" value={formData.discount} onChange={handleChange} disabled={loading} placeholder="0" />
              <ComputedField label="Total Net Fee (auto)" value={formData.totalNetFee} />
            </div>
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 mt-4">
              <Field label="Paid Fee" name="paidFee" inputMode="numeric" value={formData.paidFee} onChange={handleChange} disabled={loading} placeholder="0" />
              <ComputedField label="Pending Fee (auto)" value={formData.pendingFee} />
            </div>
          </Section>

          {/* Installment 1 */}
          <Section title="Payment Installment 1">
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              <Field label="Date" name="date" type="date" value={formData.date} onChange={handleChange} disabled={loading} />
              <Field label="Amount" name="amount1" type="number" value={formData.amount1} onChange={handleChange} disabled={loading} placeholder="0" />
              <Field label="Details / Remarks" name="details1" value={formData.details1} onChange={handleChange} disabled={loading} placeholder="e.g. Cash payment" />
              <Field label="Reference No." name="ref1" value={formData.ref1} onChange={handleChange} disabled={loading} placeholder="e.g. TXN001" />
            </div>
          </Section>

          {/* Installment 2 */}
          <Section title="Payment Installment 2">
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              <Field label="Date" name="date2" type="date" value={formData.date2} onChange={handleChange} disabled={loading} />
              <Field label="Amount" name="amount2" type="number" value={formData.amount2} onChange={handleChange} disabled={loading} placeholder="0" />
              <Field label="Details / Remarks" name="details2" value={formData.details2} onChange={handleChange} disabled={loading} placeholder="e.g. Online transfer" />
              <Field label="Reference No." name="ref2" value={formData.ref2} onChange={handleChange} disabled={loading} placeholder="e.g. TXN002" />
            </div>
          </Section>

          {/* Installment 3 */}
          <Section title="Payment Installment 3">
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              <Field label="Date" name="date3" type="date" value={formData.date3} onChange={handleChange} disabled={loading} />
              <Field label="Amount" name="amount3" type="number" value={formData.amount3} onChange={handleChange} disabled={loading} placeholder="0" />
              <Field label="Details / Remarks" name="details3" value={formData.details3} onChange={handleChange} disabled={loading} placeholder="e.g. Cheque" />
              <Field label="Reference No." name="ref3" value={formData.ref3} onChange={handleChange} disabled={loading} placeholder="e.g. TXN003" />
            </div>
          </Section>

          {/* Installment 4 */}
          <Section title="Payment Installment 4">
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              <Field label="Date" name="date4" type="date" value={formData.date4} onChange={handleChange} disabled={loading} />
              <Field label="Amount" name="amount4" type="number" value={formData.amount4} onChange={handleChange} disabled={loading} placeholder="0" />
              <Field label="Details / Remarks" name="details4" value={formData.details4} onChange={handleChange} disabled={loading} placeholder="e.g. UPI" />
              <Field label="Reference No." name="ref4" value={formData.ref4} onChange={handleChange} disabled={loading} placeholder="e.g. TXN004" />
            </div>
          </Section>

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

function Section({ title, children }) {
  return (
    <div>
      <p className="text-xs font-semibold uppercase tracking-wider text-slate-400 mb-3 flex items-center gap-2">
        <span className="flex-1 h-px bg-slate-100 dark:bg-slate-800" />
        {title}
        <span className="flex-1 h-px bg-slate-100 dark:bg-slate-800" />
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
