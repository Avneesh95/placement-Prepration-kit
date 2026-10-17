import { useState, useEffect } from 'react';
import { NavLink, Outlet, useLocation } from 'react-router-dom';
import { LayoutDashboard, Building2, BookOpen, Code2, Database, Timer, CalendarCheck, HelpCircle, User, Menu, X, Moon, Sun, LogOut } from 'lucide-react';
import { useAuth } from '../lib/auth';
const NAV = [
  ['/', 'Dashboard', LayoutDashboard], ['/companies', 'Companies', Building2], ['/practice', 'Practice', BookOpen], ['/coding', 'Coding Arena', Code2],
  ['/sql', 'SQL Lab', Database], ['/mocks', 'Mock Tests', Timer], ['/plan', 'Study Plan', CalendarCheck], ['/faqs', 'FAQs', HelpCircle], ['/profile', 'Profile', User],
];
const BOTTOM = ['/', '/practice', '/mocks', '/plan'];
const linkCls = ({ isActive }) => `flex items-center gap-2 rounded-lg px-3 py-2 text-sm font-medium ${isActive ? 'bg-brand-50 text-brand-700 dark:bg-brand-700/30 dark:text-brand-100' : 'text-slate-600 hover:bg-slate-100 dark:text-slate-300 dark:hover:bg-slate-800'}`;
export default function Layout() {
  const [open, setOpen] = useState(false); const loc = useLocation(); const { logout } = useAuth();
  const [dark, setDark] = useState(() => { try { return localStorage.getItem('theme') === 'dark'; } catch { return false; } });
  useEffect(() => { document.documentElement.classList.toggle('dark', dark); try { localStorage.setItem('theme', dark ? 'dark' : 'light'); } catch { /* ignore */ } }, [dark]);
  useEffect(() => setOpen(false), [loc.pathname]);
  return (
    <div className="min-h-screen">
      <header className="safe-top sticky top-0 z-30 border-b border-slate-200 bg-white/90 backdrop-blur dark:border-slate-800 dark:bg-slate-900/90">
        <div className="mx-auto flex max-w-6xl items-center gap-3 px-4 py-2.5">
          <NavLink to="/" className="flex items-center gap-2 text-lg font-extrabold tracking-tight"><span className="grid h-8 w-8 place-items-center rounded-lg bg-brand-600 text-white">P</span><span>Prepo <span className="text-xs font-semibold text-accent-500">by Avneesh</span></span></NavLink>
          <nav className="ml-4 hidden flex-1 items-center gap-1 lg:flex" aria-label="Main">{NAV.map(([to, name]) => <NavLink key={to} to={to} end={to === '/'} className={linkCls}>{name}</NavLink>)}</nav>
          <div className="ml-auto flex items-center gap-1">
            <button className="btn btn-ghost !px-3" onClick={() => setDark(!dark)} aria-label="Toggle dark mode">{dark ? <Sun className="h-4 w-4" /> : <Moon className="h-4 w-4" />}</button>
            <button className="btn btn-ghost hidden !px-3 lg:inline-flex" onClick={logout} aria-label="Log out"><LogOut className="h-4 w-4" /></button>
            <button className="btn btn-ghost !px-3 lg:hidden" onClick={() => setOpen(true)} aria-label="Open menu"><Menu className="h-5 w-5" /></button>
          </div>
        </div>
      </header>
      {open && (
        <div className="fixed inset-0 z-40 lg:hidden" role="dialog" aria-modal="true" aria-label="Menu">
          <div className="absolute inset-0 bg-slate-900/50" onClick={() => setOpen(false)} />
          <div className="safe-top absolute right-0 top-0 h-full w-72 max-w-[85%] overflow-y-auto bg-white p-4 shadow-xl dark:bg-slate-900">
            <div className="mb-3 flex items-center justify-between"><span className="font-bold">Menu</span><button className="btn btn-ghost !px-3" onClick={() => setOpen(false)} aria-label="Close menu"><X className="h-4 w-4" /></button></div>
            <nav className="space-y-1">{NAV.map(([to, name, Icon]) => <NavLink key={to} to={to} end={to === '/'} className={linkCls}><Icon className="h-4 w-4" />{name}</NavLink>)}</nav>
            <button className="btn btn-ghost mt-4 w-full" onClick={logout}><LogOut className="h-4 w-4" />Log out</button>
          </div>
        </div>
      )}
      <main className="mx-auto max-w-6xl px-4 pb-28 pt-5 lg:pb-10"><Outlet /></main>
      <nav className="fixed inset-x-0 bottom-0 z-30 border-t border-slate-200 bg-white/95 pb-[env(safe-area-inset-bottom)] backdrop-blur dark:border-slate-800 dark:bg-slate-900/95 lg:hidden" aria-label="Bottom">
        <div className="mx-auto grid max-w-md grid-cols-5">
          {NAV.filter(([to]) => BOTTOM.includes(to)).map(([to, name, Icon]) => (
            <NavLink key={to} to={to} end={to === '/'} className={({ isActive }) => `flex min-h-[56px] flex-col items-center justify-center gap-0.5 text-[11px] font-semibold ${isActive ? 'text-brand-600' : 'text-slate-500'}`}><Icon className="h-5 w-5" />{name.split(' ')[0]}</NavLink>
          ))}
          <button onClick={() => setOpen(true)} className="flex min-h-[56px] flex-col items-center justify-center gap-0.5 text-[11px] font-semibold text-slate-500"><Menu className="h-5 w-5" />More</button>
        </div>
      </nav>
    </div>
  );
}
