import { useState, useEffect, useRef } from 'react';
import { NavLink, Outlet, useLocation, useNavigate } from 'react-router-dom';
import {
  LayoutDashboard,
  Building2,
  BookOpen,
  Code2,
  Database,
  Timer,
  CalendarCheck,
  Bookmark,
  RotateCcw,
  User,
  HelpCircle,
  Menu,
  X,
  LogOut,
  Search,
  Bell,
  ChevronRight,
  ExternalLink,
} from 'lucide-react';
import { useAuth } from '../lib/auth';
import ThemeToggle from './ThemeToggle';

const NAV_GROUPS = [
  {
    title: 'OVERVIEW',
    items: [
      { to: '/', name: 'Dashboard', icon: LayoutDashboard, exact: true },
      { to: '/companies', name: 'Company Preparation', icon: Building2 },
    ],
  },
  {
    title: 'PRACTICE ARENA',
    items: [
      { to: '/practice', name: 'Practice Questions', icon: BookOpen },
      { to: '/mocks', name: 'Mock Tests', icon: Timer },
      { to: '/coding', name: 'Coding Arena', icon: Code2 },
      { to: '/sql', name: 'SQL Lab', icon: Database },
    ],
  },
  {
    title: 'STUDY & REVISION',
    items: [
      { to: '/practice?bookmarked=true', name: 'Bookmarks', icon: Bookmark, match: (loc) => loc.pathname === '/practice' && loc.search.includes('bookmarked=true') },
      { to: '/practice?status=incorrect', name: 'Mistakes & Revision', icon: RotateCcw, match: (loc) => loc.pathname === '/practice' && loc.search.includes('status=incorrect') },
      { to: '/plan', name: 'My Progress & Plan', icon: CalendarCheck },
    ],
  },
  {
    title: 'SETTINGS',
    items: [
      { to: '/profile', name: 'Profile & Settings', icon: User },
      { to: '/faqs', name: 'FAQs', icon: HelpCircle },
    ],
  },
];

const BOTTOM_NAV = [
  { to: '/', name: 'Dashboard', icon: LayoutDashboard, exact: true },
  { to: '/practice', name: 'Practice', icon: BookOpen },
  { to: '/mocks', name: 'Mocks', icon: Timer },
  { to: '/plan', name: 'Planner', icon: CalendarCheck },
];

export default function Layout() {
  const [mobileOpen, setMobileOpen] = useState(false);
  const [searchQuery, setSearchQuery] = useState('');
  const [notifOpen, setNotifOpen] = useState(false);
  const [userMenuOpen, setUserMenuOpen] = useState(false);

  const loc = useLocation();
  const nav = useNavigate();
  const { user, logout } = useAuth();
  const notifRef = useRef(null);
  const userRef = useRef(null);

  useEffect(() => {
    setMobileOpen(false);
    setUserMenuOpen(false);
    setNotifOpen(false);
  }, [loc.pathname, loc.search]);

  // Click outside to close menus
  useEffect(() => {
    const handler = (e) => {
      if (notifRef.current && !notifRef.current.contains(e.target)) setNotifOpen(false);
      if (userRef.current && !userRef.current.contains(e.target)) setUserMenuOpen(false);
    };
    document.addEventListener('mousedown', handler);
    return () => document.removeEventListener('mousedown', handler);
  }, []);

  const handleSearch = (e) => {
    e.preventDefault();
    if (searchQuery.trim()) {
      nav(`/practice?q=${encodeURIComponent(searchQuery.trim())}`);
      setSearchQuery('');
    }
  };

  const isItemActive = (item) => {
    if (item.match) return item.match(loc);
    if (item.exact) return loc.pathname === item.to && !loc.search;
    return loc.pathname.startsWith(item.to) && !loc.search.includes('bookmarked') && !loc.search.includes('incorrect');
  };

  const linkClass = (item) => {
    const active = isItemActive(item);
    return `group flex items-center gap-3 rounded-xl px-3 py-2 text-xs font-semibold transition-all ${
      active
        ? 'bg-brand-600 text-white shadow-sm shadow-brand-500/20'
        : 'text-slate-600 hover:bg-slate-100 hover:text-slate-900 dark:text-gray-400 dark:hover:bg-gray-800/80 dark:hover:text-gray-200'
    }`;
  };

  const initials = user?.name
    ? user.name
        .split(' ')
        .map((p) => p[0])
        .join('')
        .slice(0, 2)
        .toUpperCase()
    : 'U';

  const NavContent = () => (
    <div className="flex h-full flex-col justify-between">
      <div>
        {/* Brand Logo Header */}
        <div className="flex items-center gap-2.5 px-4 py-5">
          <NavLink to="/" className="flex items-center gap-2.5">
            <div className="grid h-9 w-9 place-items-center rounded-xl bg-brand-600 text-base font-extrabold text-white shadow-sm shadow-brand-500/30">
              P
            </div>
            <div>
              <div className="flex items-center gap-1.5 text-base font-bold tracking-tight text-slate-900 dark:text-white">
                <span>Prepo</span>
                <span className="rounded bg-amber-500/10 px-1.5 py-0.5 text-[10px] font-semibold text-amber-600 dark:text-amber-400">
                  by Avneesh
                </span>
              </div>
              <p className="text-[10px] font-medium text-slate-600 dark:text-gray-400">
                CSE 2027 Placement Prep
              </p>
            </div>
          </NavLink>
        </div>

        {/* Navigation Sections */}
        <nav className="space-y-5 px-3 py-2" aria-label="Main sidebar">
          {NAV_GROUPS.map((group) => (
            <div key={group.title}>
              <div className="px-3 pb-1.5 text-[10px] font-bold uppercase tracking-wider text-slate-600 dark:text-gray-400">
                {group.title}
              </div>
              <div className="space-y-1">
                {group.items.map((item) => {
                  const Icon = item.icon;
                  const active = isItemActive(item);
                  return (
                    <NavLink key={item.name} to={item.to} className={linkClass(item)}>
                      <Icon className={`h-4 w-4 shrink-0 transition-transform ${active ? 'text-white' : 'text-slate-600 group-hover:text-slate-900 dark:text-gray-400 dark:group-hover:text-gray-200'}`} />
                      <span className="truncate">{item.name}</span>
                    </NavLink>
                  );
                })}
              </div>
            </div>
          ))}
        </nav>
      </div>

      {/* User profile footer card */}
      <div className="border-t border-slate-200/80 p-3 dark:border-gray-800">
        <div className="flex items-center justify-between rounded-xl p-2 hover:bg-slate-50 dark:hover:bg-gray-800/50">
          <NavLink to="/profile" className="flex min-w-0 items-center gap-2.5">
            <div className="grid h-8 w-8 shrink-0 place-items-center rounded-lg bg-brand-50 text-xs font-bold text-brand-700 dark:bg-brand-950 dark:text-brand-300">
              {initials}
            </div>
            <div className="min-w-0 truncate">
              <div className="truncate text-xs font-semibold text-slate-900 dark:text-gray-100">
                {user?.name}
              </div>
              <div className="truncate text-[10px] text-slate-600 dark:text-gray-400">
                Class of {user?.graduationYear || 2027}
              </div>
            </div>
          </NavLink>
          <button
            type="button"
            onClick={logout}
            className="rounded-lg p-1.5 text-slate-600 hover:bg-slate-200/70 hover:text-slate-900 dark:text-gray-400 dark:hover:bg-gray-700 dark:hover:text-gray-200"
            aria-label="Log out"
            title="Log out"
          >
            <LogOut className="h-4 w-4" />
          </button>
        </div>
      </div>
    </div>
  );

  return (
    <div className="min-h-screen bg-[#f3f6fc] text-slate-900 dark:bg-[#0b0f19] dark:text-gray-100">
      <div className="flex min-h-screen">
        {/* Desktop Left Sidebar */}
        <aside className="hidden w-64 shrink-0 border-r border-slate-200/80 bg-white dark:border-gray-800 dark:bg-[#111827] lg:block">
          <div className="sticky top-0 h-screen overflow-y-auto">
            <NavContent />
          </div>
        </aside>

        {/* Main Content Area */}
        <div className="flex flex-1 flex-col min-w-0">
          {/* Top Sticky Header */}
          <header className="safe-top sticky top-0 z-30 border-b border-slate-200/80 bg-white/85 backdrop-blur-md dark:border-gray-800/80 dark:bg-[#111827]/85">
            <div className="mx-auto flex h-16 w-full max-w-7xl items-center justify-between gap-3 px-4 sm:px-6">
              {/* Left: Mobile hamburger & Search bar */}
              <div className="flex flex-1 items-center gap-3">
                <button
                  type="button"
                  className="rounded-xl p-2 text-slate-600 hover:bg-slate-100 dark:text-gray-400 dark:hover:bg-gray-800 lg:hidden"
                  onClick={() => setMobileOpen(true)}
                  aria-label="Open sidebar menu"
                >
                  <Menu className="h-5 w-5" />
                </button>

                <form onSubmit={handleSearch} className="relative hidden w-full max-w-md sm:block">
                  <Search className="absolute left-3.5 top-1/2 h-4 w-4 -translate-y-1/2 text-slate-600 dark:text-gray-400" />
                  <input
                    type="search"
                    className="input !h-9 !rounded-full pl-9 pr-4 text-xs bg-slate-50/80 dark:bg-gray-800/60 focus:bg-white dark:focus:bg-gray-800"
                    placeholder="Search practice questions, topics, companies…"
                    value={searchQuery}
                    onChange={(e) => setSearchQuery(e.target.value)}
                    aria-label="Search platform"
                  />
                </form>
              </div>

              {/* Right: Notifications, ThemeToggle, User Avatar */}
              <div className="flex items-center gap-2">
                {/* Theme Toggle */}
                <ThemeToggle className="!min-h-[38px] !h-9 !w-9 !p-0 !rounded-full" />

                {/* Notifications Bell */}
                <div className="relative" ref={notifRef}>
                  <button
                    type="button"
                    onClick={() => setNotifOpen(!notifOpen)}
                    className="relative grid h-9 w-9 place-items-center rounded-full border border-slate-200 bg-white text-slate-600 shadow-subtle hover:bg-slate-50 dark:border-gray-700 dark:bg-gray-800 dark:text-gray-300 dark:hover:bg-gray-700"
                    aria-label="Notifications"
                    aria-expanded={notifOpen}
                  >
                    <Bell className="h-4 w-4" />
                    <span className="absolute right-1.5 top-1.5 h-2 w-2 rounded-full bg-brand-600 ring-2 ring-white dark:ring-gray-900" />
                  </button>

                  {notifOpen && (
                    <div className="absolute right-0 mt-2 w-80 rounded-2xl border border-slate-200 bg-white p-4 shadow-xl dark:border-gray-800 dark:bg-gray-900 z-50">
                      <div className="flex items-center justify-between pb-2 border-b border-slate-100 dark:border-gray-800">
                        <span className="text-xs font-bold text-slate-900 dark:text-gray-100">Updates & Notifications</span>
                        <span className="text-[10px] text-brand-600 dark:text-brand-400 font-semibold">Placement 2027</span>
                      </div>
                      <div className="mt-3 space-y-2.5 text-xs">
                        <div className="rounded-xl bg-slate-50 p-2.5 dark:bg-gray-800/60">
                          <p className="font-semibold text-slate-800 dark:text-gray-200">24 Timed Mock Tests Ready</p>
                          <p className="muted mt-0.5 text-[11px]">Full-length and sectional pattern tests for TCS, Infosys, and Cognizant are available.</p>
                        </div>
                        <div className="rounded-xl bg-slate-50 p-2.5 dark:bg-gray-800/60">
                          <p className="font-semibold text-slate-800 dark:text-gray-200">Daily Coding Challenge</p>
                          <p className="muted mt-0.5 text-[11px]">Practice today&apos;s coding challenge and solve it directly on LeetCode.</p>
                        </div>
                      </div>
                    </div>
                  )}
                </div>

                {/* Profile Avatar Menu */}
                <div className="relative" ref={userRef}>
                  <button
                    type="button"
                    onClick={() => setUserMenuOpen(!userMenuOpen)}
                    className="flex items-center gap-2 rounded-full border border-slate-200 bg-white p-1 pr-2.5 text-xs font-semibold text-slate-700 shadow-subtle hover:bg-slate-50 dark:border-gray-700 dark:bg-gray-800 dark:text-gray-200 dark:hover:bg-gray-700"
                    aria-label="User account menu"
                    aria-expanded={userMenuOpen}
                  >
                    <div className="grid h-7 w-7 place-items-center rounded-full bg-brand-600 text-[11px] font-bold text-white">
                      {initials}
                    </div>
                    <span className="hidden max-w-[100px] truncate sm:inline">{user?.name?.split(' ')[0]}</span>
                  </button>

                  {userMenuOpen && (
                    <div className="absolute right-0 mt-2 w-56 rounded-2xl border border-slate-200 bg-white p-2 shadow-xl dark:border-gray-800 dark:bg-gray-900 z-50">
                      <div className="px-3 py-2 border-b border-slate-100 dark:border-gray-800">
                        <p className="text-xs font-bold text-slate-900 dark:text-gray-100">{user?.name}</p>
                        <p className="truncate text-[11px] text-slate-600 dark:text-gray-400">{user?.email}</p>
                      </div>
                      <div className="mt-1 space-y-0.5 text-xs">
                        <NavLink
                          to="/profile"
                          className="flex items-center gap-2 rounded-lg px-3 py-2 font-medium text-slate-700 hover:bg-slate-100 dark:text-gray-300 dark:hover:bg-gray-800"
                        >
                          <User className="h-4 w-4" />
                          <span>Profile & Settings</span>
                        </NavLink>
                        <NavLink
                          to="/plan"
                          className="flex items-center gap-2 rounded-lg px-3 py-2 font-medium text-slate-700 hover:bg-slate-100 dark:text-gray-300 dark:hover:bg-gray-800"
                        >
                          <CalendarCheck className="h-4 w-4" />
                          <span>My Study Plan</span>
                        </NavLink>
                        <button
                          type="button"
                          onClick={logout}
                          className="flex w-full items-center gap-2 rounded-lg px-3 py-2 font-medium text-rose-600 hover:bg-rose-50 dark:text-rose-400 dark:hover:bg-rose-950/40"
                        >
                          <LogOut className="h-4 w-4" />
                          <span>Log out</span>
                        </button>
                      </div>
                    </div>
                  )}
                </div>
              </div>
            </div>
          </header>

          {/* Main Content Body */}
          <main className="mx-auto w-full max-w-7xl flex-1 px-4 py-6 sm:px-6 md:py-8 pb-28 lg:pb-12">
            <Outlet />
          </main>
        </div>
      </div>

      {/* Mobile Slide-Over Sidebar Drawer */}
      {mobileOpen && (
        <div className="fixed inset-0 z-50 lg:hidden" role="dialog" aria-modal="true" aria-label="Mobile navigation drawer">
          <div className="fixed inset-0 bg-slate-900/60 backdrop-blur-sm" onClick={() => setMobileOpen(false)} />
          <div className="safe-top fixed inset-y-0 left-0 w-72 max-w-[85%] overflow-y-auto bg-white p-4 shadow-2xl dark:bg-[#111827]">
            <div className="flex items-center justify-between pb-3 border-b border-slate-100 dark:border-gray-800">
              <span className="text-sm font-bold text-slate-900 dark:text-white">Navigation</span>
              <button
                type="button"
                className="rounded-lg p-1.5 text-slate-600 hover:bg-slate-100 dark:text-gray-400 dark:hover:bg-gray-800"
                onClick={() => setMobileOpen(false)}
                aria-label="Close menu"
              >
                <X className="h-5 w-5" />
              </button>
            </div>
            <div className="mt-2">
              <NavContent />
            </div>
          </div>
        </div>
      )}

      {/* Mobile Sticky Bottom Quick Bar */}
      <nav
        className="fixed inset-x-0 bottom-0 z-30 border-t border-slate-200/80 bg-white/95 pb-[env(safe-area-inset-bottom)] backdrop-blur-md dark:border-gray-800 dark:bg-[#111827]/95 lg:hidden"
        aria-label="Bottom Navigation"
      >
        <div className="mx-auto grid max-w-md grid-cols-5">
          {BOTTOM_NAV.map((item) => {
            const Icon = item.icon;
            const active = isItemActive(item);
            return (
              <NavLink
                key={item.name}
                to={item.to}
                className={`flex min-h-[56px] flex-col items-center justify-center gap-1 text-[10px] font-semibold transition ${
                  active ? 'text-brand-600 dark:text-brand-400' : 'text-slate-600 dark:text-gray-400'
                }`}
              >
                <Icon className="h-5 w-5" />
                <span>{item.name}</span>
              </NavLink>
            );
          })}
          <button
            type="button"
            onClick={() => setMobileOpen(true)}
            className="flex min-h-[56px] flex-col items-center justify-center gap-1 text-[10px] font-semibold text-slate-600 dark:text-gray-400"
          >
            <Menu className="h-5 w-5" />
            <span>More</span>
          </button>
        </div>
      </nav>
    </div>
  );
}
