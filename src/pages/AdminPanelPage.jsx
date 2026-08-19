import { useState } from 'react';
import { useAuth } from '../context/AuthContext';
import { menuItems, pageTitles } from '../config/navigation';
import Toast from '../components/ui/Toast';

export default function AdminPanelPage() {
  const {
    staffPermissions,
    updateStaffPermission,
    setAllStaffPermissions,
    resetStaffPermissions,
  } = useAuth();
  const [toast, setToast] = useState(null);

  // Filter out adminPanel itself from manageable pages
  const manageablePages = menuItems.filter((item) => item.id !== 'adminPanel');

  const totalPages = manageablePages.length;
  const allowedCount = manageablePages.filter(
    (item) => staffPermissions[item.id] !== false
  ).length;
  const restrictedCount = totalPages - allowedCount;

  const handleToggle = (pageId, currentAllowed) => {
    const nextAllowed = !currentAllowed;
    updateStaffPermission(pageId, nextAllowed);
    const title = pageTitles[pageId]?.title || pageId;
    setToast({
      message: `${title} is now ${nextAllowed ? 'VISIBLE to' : 'HIDDEN from'} Staff`,
      type: 'info',
    });
  };

  const handleSelectAll = () => {
    setAllStaffPermissions(true);
    setToast({ message: 'All pages enabled for Staff members', type: 'success' });
  };

  const handleDeselectAll = () => {
    setAllStaffPermissions(false);
    setToast({ message: 'All pages disabled for Staff members', type: 'warning' });
  };

  const handleReset = () => {
    resetStaffPermissions();
    setToast({ message: 'Permissions reset to default settings', type: 'success' });
  };

  return (
    <div className="p-4 sm:p-6 lg:p-8 space-y-6 max-w-6xl mx-auto">
      {toast && <Toast message={toast.message} type={toast.type} onClose={() => setToast(null)} />}

      {/* Header Banner */}
      <div className="rounded-2xl gradient-accent p-6 text-white shadow-xl flex flex-col md:flex-row md:items-center justify-between gap-6">
        <div>
          <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-white/20 text-white text-xs font-semibold backdrop-blur-md mb-2">
            <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12l2 2 4-4m5.618-4.016A11.955 11.955 0 0112 2.944a11.955 11.955 0 01-8.618 3.04A12.02 12.02 0 003 9c0 5.591 3.824 10.29 9 11.622 5.176-1.332 9-6.03 9-11.622 0-1.042-.133-2.052-.382-3.016z" />
            </svg>
            Admin Control Center
          </div>
          <h2 className="text-2xl font-bold">Staff Page Access Management</h2>
          <p className="text-white/80 text-sm mt-1 max-w-xl">
            Control which navigation tabs and pages staff members can access when logged in with Staff credentials.
          </p>
        </div>

        {/* Action Controls */}
        <div className="flex flex-wrap items-center gap-2 shrink-0">
          <button
            type="button"
            onClick={handleSelectAll}
            className="px-3.5 py-2 rounded-xl bg-white/20 hover:bg-white/30 text-white text-xs font-semibold transition backdrop-blur-sm active:scale-95"
          >
            Allow All
          </button>
          <button
            type="button"
            onClick={handleDeselectAll}
            className="px-3.5 py-2 rounded-xl bg-white/20 hover:bg-white/30 text-white text-xs font-semibold transition backdrop-blur-sm active:scale-95"
          >
            Restrict All
          </button>
          <button
            type="button"
            onClick={handleReset}
            className="px-3.5 py-2 rounded-xl bg-slate-900/40 hover:bg-slate-900/60 text-white text-xs font-semibold transition backdrop-blur-sm active:scale-95"
          >
            Reset Defaults
          </button>
        </div>
      </div>

      {/* Summary KPI Cards */}
      <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
        <div className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-2xl p-5 shadow-sm">
          <div className="flex items-center justify-between">
            <span className="text-xs font-medium text-slate-500 dark:text-slate-400 uppercase tracking-wider">Total Dashboard Pages</span>
            <span className="p-2 rounded-xl bg-slate-100 dark:bg-slate-800 text-slate-600 dark:text-slate-300">
              <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 6h16M4 12h16M4 18h16" />
              </svg>
            </span>
          </div>
          <p className="text-3xl font-extrabold text-slate-900 dark:text-white mt-2">{totalPages}</p>
        </div>

        <div className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-2xl p-5 shadow-sm">
          <div className="flex items-center justify-between">
            <span className="text-xs font-medium text-emerald-600 dark:text-emerald-400 uppercase tracking-wider">Visible to Staff</span>
            <span className="p-2 rounded-xl bg-emerald-50 dark:bg-emerald-950/50 text-emerald-600 dark:text-emerald-400">
              <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 12a3 3 0 11-6 0 3 3 0 016 0z" />
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M2.458 12C3.732 7.943 7.523 5 12 5c4.478 0 8.268 2.943 9.542 7-1.274 4.057-5.064 7-9.542 7-4.477 0-8.268-2.943-9.542-7z" />
              </svg>
            </span>
          </div>
          <p className="text-3xl font-extrabold text-emerald-600 dark:text-emerald-400 mt-2">{allowedCount}</p>
        </div>

        <div className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-2xl p-5 shadow-sm">
          <div className="flex items-center justify-between">
            <span className="text-xs font-medium text-rose-600 dark:text-rose-400 uppercase tracking-wider">Restricted from Staff</span>
            <span className="p-2 rounded-xl bg-rose-50 dark:bg-rose-950/50 text-rose-600 dark:text-rose-400">
              <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13.875 18.825A10.05 10.05 0 0112 19c-4.478 0-8.268-2.943-9.543-7a9.97 9.97 0 011.563-3.029m5.858-5.908a10.025 10.025 0 013.98-1.063c4.478 0 8.268 2.943 9.543 7a10.025 10.025 0 01-4.132 5.411m0 0L21 21M3 3l18 18" />
              </svg>
            </span>
          </div>
          <p className="text-3xl font-extrabold text-rose-600 dark:text-rose-400 mt-2">{restrictedCount}</p>
        </div>
      </div>

      {/* Pages List Grid */}
      <div className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-2xl overflow-hidden shadow-sm">
        <div className="px-6 py-4 border-b border-slate-200 dark:border-slate-800 flex items-center justify-between">
          <h3 className="font-bold text-slate-900 dark:text-white text-base">Dashboard Page Permissions</h3>
          <span className="text-xs text-slate-500 dark:text-slate-400">Changes apply immediately to Staff logins</span>
        </div>

        <div className="divide-y divide-slate-100 dark:divide-slate-800">
          {manageablePages.map((item) => {
            const isAllowed = staffPermissions[item.id] !== false;
            const meta = pageTitles[item.id] || { title: item.label, subtitle: '' };

            return (
              <div
                key={item.id}
                className="px-6 py-4 flex items-center justify-between gap-4 hover:bg-slate-50/80 dark:hover:bg-slate-800/50 transition"
              >
                <div className="min-w-0 flex-1">
                  <div className="flex items-center gap-2.5">
                    <span className="font-semibold text-slate-900 dark:text-white text-sm">
                      {meta.title}
                    </span>
                    {isAllowed ? (
                      <span className="inline-flex items-center px-2 py-0.5 rounded-full text-[11px] font-medium bg-emerald-100 text-emerald-800 dark:bg-emerald-950 dark:text-emerald-300">
                        Visible to Staff
                      </span>
                    ) : (
                      <span className="inline-flex items-center px-2 py-0.5 rounded-full text-[11px] font-medium bg-rose-100 text-rose-800 dark:bg-rose-950 dark:text-rose-300">
                        Hidden from Staff
                      </span>
                    )}
                  </div>
                  {meta.subtitle && (
                    <p className="text-xs text-slate-500 dark:text-slate-400 mt-0.5 truncate">
                      {meta.subtitle}
                    </p>
                  )}
                </div>

                {/* Switch Toggle */}
                <button
                  type="button"
                  role="switch"
                  aria-checked={isAllowed}
                  onClick={() => handleToggle(item.id, isAllowed)}
                  className={`relative inline-flex h-6 w-11 shrink-0 cursor-pointer rounded-full border-2 border-transparent transition-colors duration-200 ease-in-out focus:outline-none focus:ring-2 focus:ring-brand-blue focus:ring-offset-2 ${
                    isAllowed ? 'bg-emerald-500' : 'bg-slate-300 dark:bg-slate-700'
                  }`}
                >
                  <span
                    className={`pointer-events-none inline-block h-5 w-5 transform rounded-full bg-white shadow ring-0 transition duration-200 ease-in-out ${
                      isAllowed ? 'translate-x-5' : 'translate-x-0'
                    }`}
                  />
                </button>
              </div>
            );
          })}
        </div>
      </div>
    </div>
  );
}
