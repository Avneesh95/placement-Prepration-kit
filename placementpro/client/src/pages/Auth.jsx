import { useState } from 'react';
import { Link, Navigate, useLocation, useNavigate } from 'react-router-dom';
import { Sparkles, ArrowRight, Lock, Mail, User as UserIcon, Calendar, CheckCircle } from 'lucide-react';
import { useAuth } from '../lib/auth';
import { api } from '../lib/api';
import { Btn, Field, ErrorBox, Card } from '../components/ui';
import ThemeToggle from '../components/ThemeToggle';

export const validateRegister = (f) => {
  const e = {};
  if (f.name.trim().length < 2) e.name = 'Enter your full name';
  if (!/^\S+@\S+\.\S+$/.test(f.email)) e.email = 'Enter a valid email';
  if (f.password.length < 8) e.password = 'Use at least 8 characters';
  else if (!/[A-Za-z]/.test(f.password) || !/\d/.test(f.password)) e.password = 'Include a letter and a number';
  const y = Number(f.graduationYear);
  if (!(y >= 2024 && y <= 2035)) e.graduationYear = 'Enter a year between 2024 and 2035';
  return e;
};

function Shell({ title, sub, children }) {
  return (
    <div className="relative min-h-screen flex items-center justify-center p-4 bg-[#f0f6ff] dark:bg-[#101624]">
      <div className="absolute right-4 top-4 z-10">
        <ThemeToggle />
      </div>

      {/* Background radial glow */}
      <div className="pointer-events-none absolute inset-0 overflow-hidden">
        <div className="absolute -top-40 left-1/2 -translate-x-1/2 h-[450px] w-[600px] rounded-full bg-sky-500/10 blur-3xl dark:bg-sky-500/5" />
      </div>

      <div className="w-full max-w-md relative z-10">
        <div className="mb-6 text-center">
          <Link to="/" className="inline-flex items-center gap-2 mb-3">
            <div className="grid h-12 w-12 place-items-center rounded-2xl bg-gradient-to-tr from-brand-600 to-sky-400 font-extrabold text-white text-xl shadow-lg shadow-sky-500/30">
              P
            </div>
          </Link>
          <div className="text-sm font-bold text-slate-800 dark:text-slate-200">
            Prepo <span className="text-orange-500 font-bold">by Avneesh</span>
          </div>
          <h1 className="mt-2 text-2xl font-bold tracking-tight text-slate-900 dark:text-white">{title}</h1>
          <p className="mt-1 text-xs text-slate-500 dark:text-gray-400">{sub}</p>
        </div>

        <Card className="shadow-xl border-slate-200/80 dark:border-gray-800 backdrop-blur-sm">
          {children}
        </Card>
      </div>
    </div>
  );
}

export function Login() {
  const { user, login } = useAuth();
  const nav = useNavigate();
  const loc = useLocation();
  const [f, setF] = useState({ email: '', password: '' });
  const [err, setErr] = useState(null);
  const [busy, setBusy] = useState(false);

  if (user) return <Navigate to={loc.state?.from || '/'} replace />;

  const submit = async (e) => {
    e.preventDefault();
    setErr(null);
    setBusy(true);
    try {
      await login(f.email, f.password);
      nav(loc.state?.from || '/', { replace: true });
    } catch (x) {
      setErr(x);
    } finally {
      setBusy(false);
    }
  };

  return (
    <Shell title="Welcome back" sub="Log in to continue your placement preparation.">
      <form onSubmit={submit} className="space-y-4" noValidate>
        <ErrorBox error={err} />
        <Field label="Email">
          <input
            className="input"
            type="email"
            autoComplete="email"
            value={f.email}
            onChange={(e) => setF({ ...f, email: e.target.value })}
            required
            placeholder="student@college.edu"
          />
        </Field>
        <Field label="Password">
          <input
            className="input"
            type="password"
            autoComplete="current-password"
            value={f.password}
            onChange={(e) => setF({ ...f, password: e.target.value })}
            required
            placeholder="••••••••"
          />
        </Field>
        <div className="pt-1">
          <Btn className="w-full !min-h-[42px]" disabled={busy}>
            {busy ? 'Logging in…' : 'Log in'}
          </Btn>
        </div>
        <div className="flex items-center justify-between text-xs pt-1 border-t border-slate-100 dark:border-gray-800">
          <Link className="font-semibold text-brand-600 hover:underline dark:text-brand-400" to="/forgot-password">
            Forgot password?
          </Link>
          <Link className="font-semibold text-brand-600 hover:underline dark:text-brand-400" to="/register">
            Create account →
          </Link>
        </div>
      </form>
    </Shell>
  );
}

export function Register() {
  const { user, register } = useAuth();
  const nav = useNavigate();
  const [f, setF] = useState({ name: '', email: '', password: '', graduationYear: 2027 });
  const [errs, setErrs] = useState({});
  const [err, setErr] = useState(null);
  const [busy, setBusy] = useState(false);

  if (user) return <Navigate to="/" replace />;

  const submit = async (e) => {
    e.preventDefault();
    setErr(null);
    const v = validateRegister(f);
    setErrs(v);
    if (Object.keys(v).length) return;
    setBusy(true);
    try {
      await register({ ...f, graduationYear: Number(f.graduationYear) });
      nav('/profile', { replace: true });
    } catch (x) {
      if (x.details) setErrs(Object.fromEntries(x.details.map((d) => [d.path, d.message])));
      setErr(x);
    } finally {
      setBusy(false);
    }
  };

  const set = (k) => (e) => setF({ ...f, [k]: e.target.value });

  return (
    <Shell title="Create your account" sub="Structured placement preparation for top IT and product companies.">
      <form onSubmit={submit} className="space-y-3.5" noValidate>
        <ErrorBox error={err} />
        <Field label="Full name" error={errs.name}>
          <input
            className="input"
            value={f.name}
            onChange={set('name')}
            autoComplete="name"
            placeholder="John Doe"
          />
        </Field>
        <Field label="Email" error={errs.email}>
          <input
            className="input"
            type="email"
            value={f.email}
            onChange={set('email')}
            autoComplete="email"
            placeholder="john@college.edu"
          />
        </Field>
        <Field label="Password" error={errs.password}>
          <input
            className="input"
            type="password"
            value={f.password}
            onChange={set('password')}
            autoComplete="new-password"
            placeholder="At least 8 characters (letters + numbers)"
          />
        </Field>
        <Field label="Graduation year" error={errs.graduationYear}>
          <input
            className="input"
            type="number"
            value={f.graduationYear}
            onChange={set('graduationYear')}
            placeholder="2027"
          />
        </Field>
        <div className="pt-1">
          <Btn className="w-full !min-h-[42px]" disabled={busy}>
            {busy ? 'Creating…' : 'Create account'}
          </Btn>
        </div>
        <p className="text-center text-xs text-slate-500 dark:text-gray-400 pt-1 border-t border-slate-100 dark:border-gray-800">
          Already registered?{' '}
          <Link className="font-semibold text-brand-600 hover:underline dark:text-brand-400" to="/login">
            Log in
          </Link>
        </p>
      </form>
    </Shell>
  );
}

export function Forgot() {
  const [email, setEmail] = useState('');
  const [step, setStep] = useState(1);
  const [token, setToken] = useState('');
  const [pw, setPw] = useState('');
  const [msg, setMsg] = useState('');
  const [err, setErr] = useState(null);

  const send = async (e) => {
    e.preventDefault();
    setErr(null);
    try {
      const r = await api.post('/auth/forgot-password', { email });
      setMsg(r.message);
      if (r.devResetToken) setToken(r.devResetToken);
      setStep(2);
    } catch (x) {
      setErr(x);
    }
  };

  const reset = async (e) => {
    e.preventDefault();
    setErr(null);
    try {
      const r = await api.post('/auth/reset-password', { token, password: pw });
      setMsg(r.message);
      setStep(3);
    } catch (x) {
      setErr(x);
    }
  };

  return (
    <Shell title="Reset password" sub="We will help you regain access to your account.">
      <ErrorBox error={err} />
      {step === 1 && (
        <form onSubmit={send} className="space-y-4">
          <Field label="Email">
            <input
              className="input"
              type="email"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              required
              placeholder="student@college.edu"
            />
          </Field>
          <Btn className="w-full !min-h-[42px]">Send reset link</Btn>
        </form>
      )}
      {step === 2 && (
        <form onSubmit={reset} className="space-y-4">
          <p className="text-xs text-slate-500 dark:text-gray-400">
            {msg} In this environment, your reset token is automatically pre-filled.
          </p>
          <Field label="Reset token">
            <input className="input" value={token} onChange={(e) => setToken(e.target.value)} required />
          </Field>
          <Field label="New password">
            <input
              className="input"
              type="password"
              value={pw}
              onChange={(e) => setPw(e.target.value)}
              required
              placeholder="••••••••"
            />
          </Field>
          <Btn className="w-full !min-h-[42px]">Set new password</Btn>
        </form>
      )}
      {step === 3 && (
        <div className="space-y-4 text-center">
          <div className="mx-auto grid h-12 w-12 place-items-center rounded-full bg-emerald-100 text-emerald-600 dark:bg-emerald-950/60 dark:text-emerald-400">
            <CheckCircle className="h-6 w-6" />
          </div>
          <p className="text-sm font-semibold text-slate-800 dark:text-gray-200">{msg}</p>
          <Link className="btn btn-primary inline-flex w-full items-center justify-center" to="/login">
            Log in now
          </Link>
        </div>
      )}
      {step !== 3 && (
        <p className="mt-4 text-center text-xs text-slate-500 dark:text-gray-400">
          <Link className="font-semibold text-brand-600 hover:underline dark:text-brand-400" to="/login">
            ← Back to login
          </Link>
        </p>
      )}
    </Shell>
  );
}

