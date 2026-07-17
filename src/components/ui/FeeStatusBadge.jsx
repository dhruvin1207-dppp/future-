const styles = {
  paid: 'bg-emerald-100 text-emerald-700 dark:bg-emerald-900/40 dark:text-emerald-300',
  pending: 'bg-amber-100 text-amber-700 dark:bg-amber-900/40 dark:text-amber-300',
  partial: 'bg-blue-100 text-blue-700 dark:bg-blue-900/40 dark:text-blue-300',
};

export default function FeeStatusBadge({ status }) {
  const key = String(status).toLowerCase();
  const variant = key.includes('paid')
    ? 'paid'
    : key.includes('partial')
      ? 'partial'
      : 'pending';

  return (
    <span className={`inline-flex rounded-full px-2.5 py-0.5 text-xs font-medium ${styles[variant]}`}>
      {status}
    </span>
  );
}
