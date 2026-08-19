import { brand } from '../../config/brand';
import { menuItems } from '../../config/navigation';
import { useAuth } from '../../context/AuthContext';

const Icon = ({ name }) => {
  const paths = {
    grid: 'M4 4h7v7H4V4zm9 0h7v7h-7V4zM4 13h7v7H4v-7zm9 0h7v7h-7v-7z',
    users: 'M12 12a4 4 0 100-8 4 4 0 000 8zm-8 8a8 8 0 0116 0H4z',
    check: 'M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z',
    marks: 'M9 5H7a2 2 0 00-2 2v12a2 2 0 002 2h10a2 2 0 002-2V7a2 2 0 00-2-2h-2M9 5a2 2 0 002 2h2a2 2 0 002-2M9 5a2 2 0 012-2h2a2 2 0 012 2',
    calendar: 'M8 7V3m8 4V3m-9 8h10M5 21h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v12a2 2 0 002 2z',
    teacher: 'M12 3l6 4v10H6V7l6-4zm0 6a2 2 0 110 4 2 2 0 010-4z',
    inquiry: 'M3 8l7.89 5.26a2 2 0 002.22 0L21 8M5 19h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v10a2 2 0 002 2z',
    exam: 'M8 4h8v2H8V4zm0 6h8v2H8v-2zm0 6h5v2H8v-2z',
    session: 'M15 7a2 2 0 012 2m-1.5 6l-3.5 3.5-2-2-2 2-2-2 1-1V12h1.5v-1.5h1.5v-1.5L12 7.5a4.5 4.5 0 116 6z',
    fees: 'M12 8c-1.657 0-3 .895-3 2s1.343 2 3 2 3 .895 3 2-1.343 2-3 2m0-8c1.11 0 2.08.402 2.599 1M12 8V7m0 1v8m0 0v1m0-1c-1.11 0-2.08-.402-2.599-1M21 12a9 9 0 11-18 0 9 9 0 0118 0z',
    shield: 'M9 12l2 2 4-4m5.618-4.016A11.955 11.955 0 0112 2.944a11.955 11.955 0 01-8.618 3.04A12.02 12.02 0 003 9c0 5.591 3.824 10.29 9 11.622 5.176-1.332 9-6.03 9-11.622 0-1.042-.133-2.052-.382-3.016z',
  };
  const d = paths[name] || paths.grid;
  const strokeIcons = ['check', 'calendar', 'inquiry', 'session', 'fees', 'shield'];
  const useStroke = strokeIcons.includes(name);

  return (
    <svg className="h-5 w-5 shrink-0" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1.75}>
      {useStroke ? (
        <path strokeLinecap="round" strokeLinejoin="round" d={d} />
      ) : (
        <path fill="currentColor" fillRule="evenodd" d={d} clipRule="evenodd" />
      )}
    </svg>
  );
};

export default function Sidebar({ activeItem, onNavigate, isOpen, onClose }) {
  const { user, logout, isPageAllowed } = useAuth();

  const visibleMenuItems = menuItems.filter((item) => isPageAllowed(item.id));

  return (
    <>
      {/* Mobile backdrop */}
      {isOpen && (
        <div
          className="fixed inset-0 z-40 bg-black/50 backdrop-blur-sm lg:hidden"
          onClick={onClose}
          aria-hidden="true"
        />
      )}

      <aside
        className={`fixed left-0 top-0 z-50 flex h-full w-72 flex-col border-r border-slate-200 bg-white transition-transform duration-300 dark:border-slate-700 dark:bg-slate-900 lg:translate-x-0 ${
          isOpen ? 'translate-x-0' : '-translate-x-full'
        }`}
      >
        {/* Brand header with close button on mobile */}
        <div className="flex items-center gap-3 border-b border-slate-100 px-5 py-5 dark:border-slate-800">
          <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-xl gradient-accent text-white font-bold text-xs">
            {brand.shortName}
          </div>
          <div className="min-w-0 flex-1">
            <p className="font-semibold text-sm leading-snug text-slate-900 dark:text-white">
              {brand.name}
            </p>
            <p className="text-xs text-slate-500 dark:text-slate-400">{brand.tagline}</p>
          </div>
          {/* Close button — only visible on mobile when sidebar is open */}
          <button
            type="button"
            onClick={onClose}
            className="ml-auto rounded-lg border border-slate-200 p-1.5 text-slate-500 hover:bg-slate-50 hover:text-slate-900 lg:hidden dark:border-slate-700 dark:text-slate-400 dark:hover:bg-slate-800 dark:hover:text-white"
            aria-label="Close menu"
          >
            <svg className="h-4 w-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
              <path strokeLinecap="round" strokeLinejoin="round" d="M6 18L18 6M6 6l12 12" />
            </svg>
          </button>
        </div>

        <nav className="flex-1 overflow-y-auto px-3 py-4">
          <ul className="space-y-1">
            {visibleMenuItems.map((item) => {
              const active = activeItem === item.id;
              const isAdminOnly = item.adminOnly;

              return (
                <li key={item.id}>
                  <button
                    type="button"
                    onClick={() => {
                      onNavigate(item.id);
                      onClose?.();
                    }}
                    className={`flex w-full items-center gap-3 rounded-lg px-3 py-2.5 text-sm font-medium transition-colors ${
                      active
                        ? 'gradient-accent text-white shadow-md'
                        : isAdminOnly
                        ? 'text-indigo-600 dark:text-indigo-400 hover:bg-indigo-50 dark:hover:bg-indigo-950/40 font-semibold'
                        : 'text-slate-600 hover:bg-slate-50 hover:text-brand-blue dark:text-slate-300 dark:hover:bg-slate-800'
                    }`}
                  >
                    <Icon name={item.icon} />
                    <span className="flex-1 text-left">{item.label}</span>
                    {isAdminOnly && (
                      <span className="text-[10px] uppercase font-bold tracking-wider px-1.5 py-0.5 rounded bg-indigo-100 dark:bg-indigo-900/60 text-indigo-700 dark:text-indigo-300">
                        Admin
                      </span>
                    )}
                  </button>
                </li>
              );
            })}
          </ul>
        </nav>

        {/* User Card & Logout Footer */}
        <div className="border-t border-slate-100 p-4 dark:border-slate-800 space-y-3">
          {user && (
            <div className="flex items-center justify-between gap-3 bg-slate-50 dark:bg-slate-800/60 p-2.5 rounded-xl border border-slate-100 dark:border-slate-700/60">
              <div className="flex items-center gap-2.5 min-w-0">
                <div className={`h-8 w-8 rounded-lg flex items-center justify-center font-bold text-xs text-white shrink-0 ${
                  user.role === 'admin' ? 'bg-gradient-to-tr from-indigo-600 to-purple-600' : 'bg-gradient-to-tr from-emerald-600 to-teal-600'
                }`}>
                  {user.name.charAt(0).toUpperCase()}
                </div>
                <div className="min-w-0">
                  <p className="text-xs font-bold text-slate-800 dark:text-white truncate">
                    {user.name}
                  </p>
                  <span className={`inline-block text-[10px] font-semibold px-1.5 py-0.2 rounded uppercase ${
                    user.role === 'admin' 
                      ? 'bg-indigo-100 text-indigo-700 dark:bg-indigo-950 dark:text-indigo-300' 
                      : 'bg-emerald-100 text-emerald-700 dark:bg-emerald-950 dark:text-emerald-300'
                  }`}>
                    {user.role}
                  </span>
                </div>
              </div>

              <button
                type="button"
                onClick={logout}
                title="Logout"
                className="p-1.5 rounded-lg text-slate-400 hover:text-rose-600 hover:bg-rose-50 dark:hover:bg-rose-950/50 transition shrink-0"
              >
                <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                  <path strokeLinecap="round" strokeLinejoin="round" d="M17 16l4-4m0 0l-4-4m4 4H7m6 4v1a3 3 0 01-3 3H6a3 3 0 01-3-3V7a3 3 0 013-3h4a3 3 0 013 3v1" />
                </svg>
              </button>
            </div>
          )}

          <p className="text-[11px] text-slate-400 text-center">{brand.copyright}</p>
        </div>
      </aside>
    </>
  );
}
