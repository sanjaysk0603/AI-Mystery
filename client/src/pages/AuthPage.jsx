import { useContext, useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { AuthContext } from '../context/AuthContext.jsx';
import { usePreferences } from '../context/PreferencesContext.jsx';
import { loginUser, registerUser } from '../lib/api.js';

export default function AuthPage({ mode }) {
  const navigate = useNavigate();
  const { setUser } = useContext(AuthContext);
  const { t } = usePreferences();
  const [form, setForm] = useState({ name: '', email: '', password: '' });
  const [error, setError] = useState('');

  async function handleSubmit(event) {
    event.preventDefault();
    setError('');

    try {
      const response = mode === 'register'
        ? await registerUser(form)
        : await loginUser({ email: form.email, password: form.password });
      setUser(response.user);
      try {
        const previousIndex = Number(window.sessionStorage.getItem('mystery-default-scenario-index') ?? -1);
        window.sessionStorage.setItem('mystery-default-scenario-index', String((previousIndex + 1) % 3));
      } catch { /* The new-case form will use its first sample if session storage is unavailable. */ }
      window.dispatchEvent(new Event('mystery:logged-in'));
      navigate('/dashboard');
    } catch (err) {
      setError(err.message);
    }
  }

  return (
    <main className="case-shell flex min-h-screen items-center justify-center bg-slate-950 px-4 pb-24">
      <div className="animate-case-in w-full max-w-md rounded-2xl border border-amber-500/20 bg-slate-900/80 p-8 shadow-glow">
        <h1 className="mb-6 text-center font-serif text-4xl text-amber-100">{mode === 'register' ? t('auth.register') : t('auth.login')}</h1>

        <form onSubmit={handleSubmit} className="space-y-4">
          {mode === 'register' && (
            <label className="block">
              <span className="mb-1 block text-sm text-slate-300">{t('auth.name')}</span>
              <input className="w-full rounded-lg border border-slate-700 bg-slate-950 px-3 py-2 text-slate-100" value={form.name} onChange={(e) => setForm({ ...form, name: e.target.value })} />
            </label>
          )}

          <label className="block">
              <span className="mb-1 block text-sm text-slate-300">{t('auth.email')}</span>
            <input type="email" className="w-full rounded-lg border border-slate-700 bg-slate-950 px-3 py-2 text-slate-100" value={form.email} onChange={(e) => setForm({ ...form, email: e.target.value })} />
          </label>

          <label className="block">
              <span className="mb-1 block text-sm text-slate-300">{t('auth.password')}</span>
            <input type="password" className="w-full rounded-lg border border-slate-700 bg-slate-950 px-3 py-2 text-slate-100" value={form.password} onChange={(e) => setForm({ ...form, password: e.target.value })} />
          </label>

          {error && <p className="text-sm text-rose-400">{error}</p>}

          <button type="submit" className="w-full rounded-lg bg-amber-500 px-4 py-3 font-medium text-slate-900">
            {mode === 'register' ? t('auth.submitRegister') : t('auth.submitLogin')}
          </button>
        </form>

        <p className="mt-4 text-center text-sm text-slate-400">
          {mode === 'register' ? t('auth.already') : t('auth.need')}{' '}
          <Link to={mode === 'register' ? '/login' : '/register'} className="text-amber-300 underline">
            {mode === 'register' ? t('auth.loginLink') : t('auth.registerLink')}
          </Link>
        </p>
      </div>
    </main>
  );
}
