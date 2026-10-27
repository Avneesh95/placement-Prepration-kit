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
  Target,
  CheckCheck,
} from 'lucide-react';
import { useAuth } from '../lib/auth';
import { api } from '../lib/api';
import ThemeToggle from './ThemeToggle';
import InstallPrompt from './InstallPrompt';

const NAV_GROUPS = [
  {
    title: 'OVERVIEW',
    items: [
      { to: '/', name: 'Dashboard', icon: LayoutDashboard, exact: true },
      { to: '/companies', name: 'Company Preparation', icon: Building2 },
      { to: '/drill', name: 'Drill & Syllabus Explorer', icon: Target },
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
  const [notifications, setNotifications] = useState([]);
  const [unreadCount, setUnreadCount] = useState(0);
  const [loadingNotifs, setLoadingNotifs] = useState(false);

  const loc = useLocation();
  const nav = useNavigate();
  const { user, logout } = useAuth();
  const notifRef = useRef(null);
  const userRef = useRef(null);

  const fetchNotifications = async () => {
    if (!user) return;
    try {
      setLoadingNotifs(true);
      const res = await api.get('/notifications');
      setNotifications(res?.items || []);
      setUnreadCount(res?.unreadCount || 0);
    } catch (e) {
      // Safe fallback: keep existing notifications without throwing an unhandled rejection
    } finally {
      setLoadingNotifs(false);
    }
  };

  useEffect(() => {
    if (user) {
      fetchNotifications();
    }
  }, [loc.pathname, user]);

  const markAsRead = async (id, link) => {
    try {
      const res = await api.patch(`/notifications/${id}/read`);
      setNotifications((prev) =>
        prev.map((n) => (n._id === id ? { ...n, read: true } : n))
      );
      setUnreadCount(res.unreadCount ?? Math.max(0, unreadCount - 1));
      if (link) {
        setNotifOpen(false);
        nav(link);
      }
    } catch (e) {
      // ignore
    }
  };

  const markAllAsRead = async () => {
    try {
      await api.patch('/notifications/read-all');
      setNotifications((prev) => prev.map((n) => ({ ...n, read: true })));
      setUnreadCount(0);
    } catch (e) {
      // ignore
    }
  };

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
    return `group relative flex items-center justify-between gap-3 rounded-xl px-3 py-2.5 text-xs font-semibold transition-all ${
      active
        ? 'border-l-4 border-sky-500 bg-sky-500/10 text-sky-600 dark:border-sky-400 dark:bg-sky-500/20 dark:text-sky-300 font-bold -ml-3 pl-2.5 rounded-l-none'
        : 'text-slate-600 hover:bg-sky-50/60 hover:text-sky-600 dark:text-gray-400 dark:hover:bg-gray-800/80 dark:hover:text-gray-200'
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
        {/* Brand Header */}
        <div className="flex items-center justify-between px-4 pt-5 pb-3">
          <NavLink to="/" className="flex items-center gap-2.5">
            <div className="grid h-9 w-9 place-items-center rounded-xl bg-gradient-to-tr from-brand-600 to-sky-400 text-base font-extrabold text-white shadow-md shadow-brand-500/30">
              P
            </div>
            <div>
              <div className="flex items-center gap-1.5 text-base font-bold tracking-tight text-slate-900 dark:text-white">
                <span>Prepo</span>
                <span className="rounded bg-orange-500/15 px-1.5 py-0.5 text-[10px] font-bold text-orange-600 dark:text-orange-400">
                  by Avneesh
                </span>
              </div>
              <p className="text-[10px] font-medium text-slate-500 dark:text-gray-400">
                CSE 2027 Placement Prep
              </p>
            </div>
          </NavLink>
        </div>

        {/* Top Profile Badge (Matching UI Screenshot) */}
        <div className="mx-3 my-3 rounded-2xl border border-sky-100 bg-white/80 p-2.5 shadow-xs dark:border-[#1f2430] dark:bg-[#0c0e14]">
          <NavLink to="/profile" className="flex items-center gap-3">
            <div className="relative">
              <div className="grid h-9 w-9 place-items-center rounded-full bg-gradient-to-tr from-sky-500 to-brand-600 text-xs font-bold text-white shadow-xs">
                {initials}
              </div>
              <span className="absolute -bottom-0.5 -right-0.5 h-2.5 w-2.5 rounded-full bg-emerald-500 ring-2 ring-white dark:ring-[#0c0e14]" />
            </div>
            <div className="min-w-0 flex-1">
              <div className="truncate text-xs font-bold text-slate-900 dark:text-white">
                {user?.name || 'Student Prep'}
              </div>
              <div className="flex items-center gap-1.5 text-[10px] font-medium text-emerald-600 dark:text-emerald-400">
                <span>Online</span>
                <span className="text-slate-300 dark:text-gray-600">·</span>
                <span className="text-slate-500 dark:text-gray-400">Batch 2027</span>
              </div>
            </div>
          </NavLink>
        </div>

        {/* Navigation Sections */}
        <nav className="space-y-4 px-3 py-1" aria-label="Main sidebar">
          {NAV_GROUPS.map((group) => (
            <div key={group.title}>
              <div className="px-3 pb-1 text-[10px] font-bold uppercase tracking-wider text-slate-400 dark:text-gray-500">
                {group.title}
              </div>
              <div className="space-y-0.5">
                {group.items.map((item) => {
                  const Icon = item.icon;
                  const active = isItemActive(item);
                  const isOrangeDot = item.name.includes('Revision') || item.name.includes('Coding');
                  return (
                    <NavLink key={item.name} to={item.to} className={linkClass(item)}>
                      <div className="flex items-center gap-3 min-w-0">
                        <Icon className={`h-4 w-4 shrink-0 transition-transform ${active ? 'text-sky-600 dark:text-sky-300' : 'text-slate-500 group-hover:text-sky-600 dark:text-gray-400 dark:group-hover:text-sky-400'}`} />
                        <span className="truncate">{item.name}</span>
                      </div>
                      {isOrangeDot && (
                        <span className="h-1.5 w-1.5 shrink-0 rounded-full bg-orange-500 ring-2 ring-orange-500/20" />
                      )}
                    </NavLink>
                  );
                })}
              </div>
            </div>
          ))}
        </nav>
      </div>

      {/* User profile footer card */}
      <div className="border-t border-sky-100/80 p-3 dark:border-[#222d44]">
        <div className="flex items-center justify-between rounded-xl p-2 hover:bg-sky-50/50 dark:hover:bg-gray-800/50">
          <NavLink to="/profile" className="flex min-w-0 items-center gap-2.5">
            <User className="h-4 w-4 text-slate-500 dark:text-gray-400" />
            <div className="min-w-0 truncate text-xs font-semibold text-slate-700 dark:text-gray-300">
              Account Settings
            </div>
          </NavLink>
          <button
            type="button"
            onClick={logout}
            className="rounded-lg p-1.5 text-slate-500 hover:bg-rose-50 hover:text-rose-600 dark:text-gray-400 dark:hover:bg-rose-950/40 dark:hover:text-rose-400 transition"
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
    <div className="min-h-screen bg-[#f0f6ff] text-[#0f172a] dark:bg-[#000000] dark:text-gray-100">
      <div className="flex min-h-screen">
        {/* Desktop Left Sidebar */}
        <aside className="hidden w-64 shrink-0 border-r border-[#e0edfb] bg-white dark:border-[#1a1f2c] dark:bg-[#07080c] lg:block">
          <div className="sticky top-0 h-screen overflow-y-auto">
            <NavContent />
          </div>
        </aside>

        {/* Main Content Area */}
        <div className="flex flex-1 flex-col min-w-0">
          {/* Top Sticky Header */}
          <header className="safe-top sticky top-0 z-30 border-b border-[#e0edfb] bg-white/90 backdrop-blur-md dark:border-[#1a1f2c] dark:bg-[#000000]/90">
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
                    onClick={() => {
                      setNotifOpen(!notifOpen);
                      if (!notifOpen) fetchNotifications();
                    }}
                    className="relative grid h-9 w-9 place-items-center rounded-full border border-slate-200 bg-white text-slate-600 shadow-subtle hover:bg-slate-50 dark:border-gray-700 dark:bg-gray-800 dark:text-gray-300 dark:hover:bg-gray-700"
                    aria-label="Notifications"
                    aria-expanded={notifOpen}
                  >
                    <Bell className="h-4 w-4" />
                    {unreadCount > 0 && (
                      <span className="absolute -top-0.5 -right-0.5 flex h-4 w-4 items-center justify-center rounded-full bg-rose-500 text-[9px] font-bold text-white ring-2 ring-white dark:ring-gray-900">
                        {unreadCount > 9 ? '9+' : unreadCount}
                      </span>
                    )}
                  </button>

                  {notifOpen && (
                    <div className="absolute right-0 mt-2 w-80 rounded-2xl border border-slate-200 bg-white p-4 shadow-xl dark:border-gray-800 dark:bg-gray-900 z-50">
                      <div className="flex items-center justify-between pb-2 border-b border-slate-100 dark:border-gray-800">
                        <div className="flex items-center gap-1.5">
                          <span className="text-xs font-bold text-slate-900 dark:text-gray-100">Updates & Notifications</span>
                          {unreadCount > 0 && (
                            <span className="rounded-full bg-sky-100 px-1.5 py-0.2 text-[10px] font-bold text-sky-700 dark:bg-sky-950/60 dark:text-sky-300">
                              {unreadCount} new
                            </span>
                          )}
                        </div>
                        {unreadCount > 0 && (
                          <button
                            type="button"
                            onClick={markAllAsRead}
                            className="flex items-center gap-1 text-[10px] font-semibold text-sky-600 hover:underline dark:text-sky-400"
                          >
                            <CheckCheck className="h-3 w-3" />
                            Mark all read
                          </button>
                        )}
                      </div>

                      <div className="mt-3 max-h-80 overflow-y-auto space-y-2 text-xs">
                        {loadingNotifs && notifications.length === 0 ? (
                          <p className="text-center py-4 text-xs text-slate-400">Loading notifications…</p>
                        ) : notifications.length === 0 ? (
                          <p className="text-center py-4 text-xs text-slate-400">No notifications yet.</p>
                        ) : (
                          notifications.map((n) => (
                            <div
                              key={n._id}
                              onClick={() => markAsRead(n._id, n.link)}
                              className={`group cursor-pointer rounded-xl p-2.5 transition ${
                                n.read
                                  ? 'bg-slate-50/60 hover:bg-slate-100/70 dark:bg-gray-800/40 dark:hover:bg-gray-800/70 opacity-75'
                                  : 'bg-sky-50/80 hover:bg-sky-100/70 dark:bg-sky-950/40 dark:hover:bg-sky-950/70 border border-sky-100 dark:border-sky-900/40'
                              }`}
                            >
                              <div className="flex items-start justify-between gap-1">
                                <p className={`font-semibold ${n.read ? 'text-slate-700 dark:text-gray-300' : 'text-slate-900 dark:text-gray-100'}`}>
                                  {n.title}
                                </p>
                                {!n.read && (
                                  <span className="mt-1 h-1.5 w-1.5 shrink-0 rounded-full bg-sky-500" />
                                )}
                              </div>
                              <p className="muted mt-0.5 text-[11px] leading-relaxed">{n.message}</p>
                              {n.link && (
                                <span className="mt-1.5 inline-flex items-center gap-1 text-[10px] font-bold text-sky-600 dark:text-sky-400 group-hover:underline">
                                  View details →
                                </span>
                              )}
                            </div>
                          ))
                        )}
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

      <InstallPrompt />
      {/* Mobile Sticky Bottom Quick Bar */}
      <nav
        className="fixed inset-x-0 bottom-0 z-30 border-t border-slate-200/80 bg-white/95 pb-[env(safe-area-inset-bottom)] backdrop-blur-md dark:border-gray-800 dark:bg-[#07080c]/95 lg:hidden"
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
