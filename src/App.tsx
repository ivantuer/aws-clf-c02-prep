import { NavLink, Route, Routes } from 'react-router-dom';
import { Dashboard } from './pages/Dashboard';
import { ExamTracker } from './pages/ExamTracker';
import { Session } from './pages/Session';
import { Recap } from './pages/Recap';
import { Browse } from './pages/Browse';
import { SettingsPage } from './pages/SettingsPage';

const NAV = [
  { to: '/', label: 'Dashboard', end: true },
  { to: '/browse', label: 'All questions' },
  { to: '/settings', label: 'Settings' },
];

export function App() {
  return (
    <div className="mx-auto flex min-h-full max-w-5xl flex-col px-6 py-8">
      <header className="mb-8 flex flex-wrap items-center justify-between gap-4">
        <NavLink to="/" className="text-sm font-semibold tracking-wide text-white">
          AWS Cloud Practitioner <span className="text-aws">Prep</span>
        </NavLink>
        <nav className="flex gap-1 text-sm">
          {NAV.map((item) => (
            <NavLink
              key={item.to}
              to={item.to}
              end={item.end}
              className={({ isActive }) =>
                `rounded-lg px-3 py-1.5 ${
                  isActive ? 'bg-ink-800 text-white' : 'text-ink-400 hover:text-ink-200'
                }`
              }
            >
              {item.label}
            </NavLink>
          ))}
        </nav>
      </header>

      <main className="flex-1">
        <Routes>
          <Route path="/" element={<Dashboard />} />
          <Route path="/exam/:exam" element={<ExamTracker />} />
          <Route path="/session" element={<Session />} />
          <Route path="/recap/:exam" element={<Recap />} />
          <Route path="/browse" element={<Browse />} />
          <Route path="/settings" element={<SettingsPage />} />
        </Routes>
      </main>
    </div>
  );
}
