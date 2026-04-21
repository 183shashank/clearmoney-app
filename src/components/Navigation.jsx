import { useState } from 'react';
import { LayoutDashboard, Lightbulb, Target, BookOpen, Menu, X, Gem, Receipt } from 'lucide-react';
import { useApp } from '../context/AppContext.jsx';

const NAV_ITEMS = [
  { id: 'dashboard',    label: 'Dashboard',    icon: LayoutDashboard },
  { id: 'transactions', label: 'Transactions', icon: Receipt },
  { id: 'insights',     label: 'Insights',     icon: Lightbulb },
  { id: 'goals',        label: 'Goals',        icon: Target },
  { id: 'education',    label: 'Learn',        icon: BookOpen },
];

export default function Navigation() {
  const { currentScreen, navigateTo } = useApp();
  const [mobileOpen, setMobileOpen] = useState(false);

  return (
    <>
      {/* Desktop top nav */}
      <nav className="sticky top-0 z-50 bg-white/90 backdrop-blur-sm border-b border-gray-100 hidden md:block">
        <div className="max-w-6xl mx-auto px-6 h-16 flex items-center justify-between">
          {/* Wordmark */}
          <button
            onClick={() => navigateTo('dashboard')}
            className="flex items-center gap-2 hover:opacity-80 transition-opacity"
          >
            <div className="w-7 h-7 rounded-lg bg-indigo-500 flex items-center justify-center">
              <Gem size={15} className="text-white" />
            </div>
            <span className="font-semibold text-xl text-gray-900">ClearMoney</span>
          </button>

          {/* Nav links */}
          <div className="flex items-center gap-1">
            {NAV_ITEMS.map(({ id, label, icon: Icon }) => {
              const active = currentScreen === id;
              return (
                <button
                  key={id}
                  onClick={() => navigateTo(id)}
                  className={`
                    flex items-center gap-2 px-4 py-2 rounded-xl text-sm font-medium
                    transition-all duration-200
                    ${active
                      ? 'text-indigo-600 bg-indigo-50'
                      : 'text-gray-500 hover:text-gray-800 hover:bg-gray-50'
                    }
                  `}
                >
                  <Icon size={16} />
                  {label}
                </button>
              );
            })}
          </div>
        </div>
      </nav>

      {/* Mobile top bar */}
      <nav className="sticky top-0 z-50 bg-white/90 backdrop-blur-sm border-b border-gray-100 md:hidden">
        <div className="px-4 h-14 flex items-center justify-between">
          <button
            onClick={() => navigateTo('dashboard')}
            className="flex items-center gap-2"
          >
            <div className="w-6 h-6 rounded-md bg-indigo-500 flex items-center justify-center">
              <Gem size={12} className="text-white" />
            </div>
            <span className="font-semibold text-lg text-gray-900">ClearMoney</span>
          </button>
          <button
            onClick={() => setMobileOpen(!mobileOpen)}
            className="p-2 rounded-xl text-gray-500 hover:bg-gray-50 transition-colors"
          >
            {mobileOpen ? <X size={20} /> : <Menu size={20} />}
          </button>
        </div>

        {/* Mobile menu */}
        {mobileOpen && (
          <div className="bg-white border-b border-gray-100 px-4 pb-4 space-y-1">
            {NAV_ITEMS.map(({ id, label, icon: Icon }) => {
              const active = currentScreen === id;
              return (
                <button
                  key={id}
                  onClick={() => { navigateTo(id); setMobileOpen(false); }}
                  className={`
                    w-full flex items-center gap-3 px-4 py-3 rounded-xl text-sm font-medium
                    transition-all duration-200
                    ${active
                      ? 'text-indigo-600 bg-indigo-50'
                      : 'text-gray-600 hover:bg-gray-50'
                    }
                  `}
                >
                  <Icon size={18} />
                  {label}
                </button>
              );
            })}
          </div>
        )}
      </nav>

      {/* Mobile bottom tab bar */}
      <div className="fixed bottom-0 left-0 right-0 z-50 bg-white border-t border-gray-100 md:hidden">
        <div className="flex">
          {NAV_ITEMS.map(({ id, label, icon: Icon }) => {
            const active = currentScreen === id;
            return (
              <button
                key={id}
                onClick={() => navigateTo(id)}
                className={`
                  flex-1 flex flex-col items-center gap-1 py-2.5
                  transition-colors duration-200
                  ${active ? 'text-indigo-600' : 'text-gray-400 hover:text-gray-600'}
                `}
              >
                <Icon size={20} />
                <span className="text-[10px] font-medium">{label}</span>
              </button>
            );
          })}
        </div>
      </div>
    </>
  );
}
