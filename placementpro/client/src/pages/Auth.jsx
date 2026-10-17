import { useState } from 'react';
import { Link, Navigate, useLocation, useNavigate } from 'react-router-dom';
import { useAuth } from '../lib/auth';
import { api } from '../lib/api';
import { Btn, Field, ErrorBox } from '../components/ui';

export const validateRegister = (f) => {
  const e = {};
  if (f.name.trim().length < 2) e.name = 'Enter your full name';
  if (!/^\S+@\S+\.\S+$/.test(f.email)) e.email = 'Enter a valid email';
  if (f.password.length < 8) e.password = 'Use at least 8 characters';
  else if (!/[A-Za-z]/.test(f.password) || !/\d/.test(f.password)) e.password = 'Include a letter and a number';
  const y = Number(f.graduationYear); if (!(y >= 2024 && y <= 2035)) e.graduationYear = 'Enter a year between 2024 and 2035';
  return e;
};
function Shell({ title, sub, children }) {
  return (
    <div className="grid min-h-screen place-items-center px-4 py-8">
      <div className="w-full max-w-md">
        <div className="mb-6 text-center"><div className="mx-auto mb-3 grid h-12 w-12 place-items-center rounded-2xl bg-brand-600 text-xl font-extrabold text-white">P</div>
          <h1 className="text-2xl font-bold">{title}</h1><p className="muted mt-1">{sub}</p></div>
        <div className="card">{children}</div>
      </div>
    </div>
  );
}
export function Login() {
  const { user, login } = useAuth(); const nav = useNavigate(); const loc = useLocation();
  const [f, setF] = useState({ email: '', password: '' }); const [err, setErr] = useState(null); const [busy, setBusy] = useState(false);
  if (user) return <Navigate to={loc.state?.from || '/'} replace />;
  const submit = async (e) => { e.preventDefault(); setErr(null); setBusy(true); try { await login(f.email, f.password); nav(loc.state?.from || '/', { replace: true }); } catch (x) { setErr(x); } finally { setBusy(false); } };
  return (
    <Shell title="Welcome back" sub="Log in to continue your preparation.">
      <form onSubmit={submit} className="space-y-3" noValidate>
        <ErrorBox error={err} />
        <Field label="Email"><input className="input" type="email" autoComplete="email" value={f.email} onChange={(e) => setF({ ...f, email: e.target.value })} required /></Field>
        <Field label="Password"><input className="input" type="password" autoComplete="current-password" value={f.password} onChange={(e) => setF({ ...f, password: e.target.value })} required /></Field>
        <Btn className="w-full" disabled={busy}>{busy ? 'Logging in…' : 'Log in'}</Btn>
        <div className="flex justify-between text-sm"><Link className="text-brand-600" to="/forgot-password">Forgot password?</Link><Link className="text-brand-600" to="/register">Create account</Link></div>
      </form>
    </Shell>
  );
}
export function Register() {
  const { user, register } = useAuth(); const nav = useNavigate();
  const [f, setF] = useState({ name: '', email: '', password: '', graduationYear: 2027 }); const [errs, setErrs] = useState({}); const [err, setErr] = useState(null); const [busy, setBusy] = useState(false);
  if (user) return <Navigate to="/" replace />;
  const submit = async (e) => {
    e.preventDefault(); setErr(null); const v = validateRegister(f); setErrs(v); if (Object.keys(v).length) return;
    setBusy(true);
    try { await register({ ...f, graduationYear: Number(f.graduationYear) }); nav('/profile', { replace: true }); }
    catch (x) { if (x.details) setErrs(Object.fromEntries(x.details.map((d) => [d.path, d.message]))); setErr(x); } finally { setBusy(false); }
  };
  const set = (k) => (e) => setF({ ...f, [k]: e.target.value });
  return (
    <Shell title="Create your account" sub="Free preparation for the 2027 placement season.">
      <form onSubmit={submit} className="space-y-3" noValidate>
        <ErrorBox error={err} />
        <Field label="Full name" error={errs.name}><input className="input" value={f.name} onChange={set('name')} autoComplete="name" /></Field>
        <Field label="Email" error={errs.email}><input className="input" type="email" value={f.email} onChange={set('email')} autoComplete="email" /></Field>
        <Field label="Password" error={errs.password}><input className="input" type="password" value={f.password} onChange={set('password')} autoComplete="new-password" /></Field>
        <Field label="Graduation year" error={errs.graduationYear}><input className="input" type="number" value={f.graduationYear} onChange={set('graduationYear')} /></Field>
        <Btn className="w-full" disabled={busy}>{busy ? 'Creating…' : 'Create account'}</Btn>
        <p className="text-center text-sm">Already registered? <Link className="text-brand-600" to="/login">Log in</Link></p>
      </form>
    </Shell>
  );
}
export function Forgot() {
  const [email, setEmail] = useState(''); const [step, setStep] = useState(1); const [token, setToken] = useState(''); const [pw, setPw] = useState(''); const [msg, setMsg] = useState(''); const [err, setErr] = useState(null);
  const send = async (e) => { e.preventDefault(); setErr(null); try { const r = await api.post('/auth/forgot-password', { email }); setMsg(r.message); if (r.devResetToken) setToken(r.devResetToken); setStep(2); } catch (x) { setErr(x); } };
  const reset = async (e) => { e.preventDefault(); setErr(null); try { const r = await api.post('/auth/reset-password', { token, password: pw }); setMsg(r.message); setStep(3); } catch (x) { setErr(x); } };
  return (
    <Shell title="Reset password" sub="We will help you get back in.">
      <ErrorBox error={err} />
      {step === 1 && <form onSubmit={send} className="space-y-3"><Field label="Email"><input className="input" type="email" value={email} onChange={(e) => setEmail(e.target.value)} required /></Field><Btn className="w-full">Send reset link</Btn></form>}
      {step === 2 && <form onSubmit={reset} className="space-y-3"><p className="muted">{msg} Email delivery is not configured in this build, so in development the token is filled in for you.</p>
        <Field label="Reset token"><input className="input" value={token} onChange={(e) => setToken(e.target.value)} required /></Field>
        <Field label="New password"><input className="input" type="password" value={pw} onChange={(e) => setPw(e.target.value)} required /></Field><Btn className="w-full">Set new password</Btn></form>}
      {step === 3 && <p className="text-center">{msg} <Link className="font-semibold text-brand-600" to="/login">Log in</Link></p>}
      {step !== 3 && <p className="mt-3 text-center text-sm"><Link className="text-brand-600" to="/login">Back to login</Link></p>}
    </Shell>
  );
}
