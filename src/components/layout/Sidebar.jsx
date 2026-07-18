import { brand } from '../../config/brand';
import { menuItems } from '../../config/navigation';

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
  };
  const d = paths[name] || paths.grid;
  const strokeIcons = ['check', 'calendar', 'inquiry', 'session', 'fees'];
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
            {menuItems.map((item) => {
              const active = activeItem === item.id;
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
                        : 'text-slate-600 hover:bg-slate-50 hover:text-brand-blue dark:text-slate-300 dark:hover:bg-slate-800'
                    }`}
                  >
                    <Icon name={item.icon} />
                    {item.label}
                  </button>
                </li>
              );
            })}
          </ul>
        </nav>

        <div className="border-t border-slate-100 px-5 py-4 dark:border-slate-800">
          <p className="text-xs text-slate-400">{brand.copyright}</p>
        </div>
      </aside>
    </>
  );
}
