import { useEffect, useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { deleteCase, fetchCases, logoutUser } from '../lib/api.js';
import { usePreferences } from '../context/PreferencesContext.jsx';

export default function DashboardPage() {
  const navigate = useNavigate();
  const { language, t } = usePreferences();
  const [cases, setCases] = useState([]);

  useEffect(() => {
    async function load() {
      try {
        const data = await fetchCases();
        setCases(data.cases || []);
      } catch (error) {
        console.error(error);
      }
    }
    load();
  }, []);

  async function handleLogout() {
    await logoutUser();
    navigate('/login');
  }

  async function handleDelete(caseId) {
    if (!window.confirm(t('dashboard.deleteConfirm'))) return;
    await deleteCase(caseId);
    setCases((current) => current.filter((item) => item._id !== caseId));
  }

  return (
    <main className="case-shell min-h-screen bg-slate-950 p-6 pb-24 text-slate-100">
      <div className="mx-auto max-w-5xl">
        <header className="mb-8 flex flex-wrap items-center justify-between gap-4">
          <div>
            <p className="text-xs uppercase tracking-[0.25em] text-amber-300">{t('dashboard.board')}</p>
            <h1 className="font-serif text-4xl text-amber-100">{t('dashboard.title')}</h1>
          </div>
          <div className="flex gap-3">
            <Link to="/new" className="rounded-full bg-amber-500 px-5 py-2 font-medium text-slate-900">{t('dashboard.new')}</Link>
            <button onClick={handleLogout} className="rounded-full border border-slate-700 px-5 py-2">{t('dashboard.logout')}</button>
          </div>
        </header>

        <div className="grid gap-4 md:grid-cols-2 xl:grid-cols-3">
          {cases.length === 0 ? (
            <div className="animate-case-in col-span-full rounded-xl border border-dashed border-slate-700 p-8 text-slate-400">{t('dashboard.empty')}</div>
          ) : (
            cases.map((item) => (
              <div key={item._id} className="evidence-card animate-case-in rounded-xl border border-amber-500/20 bg-slate-900/70 p-4 shadow-glow">
                <div className="mb-2 text-xs uppercase tracking-[0.2em] text-amber-300">{t(`status.${item.status}`)}</div>
                <h2 className="font-serif text-2xl text-amber-100">{item.title || t('dashboard.caseProgress')}</h2>
                <p className="mt-2 text-sm text-slate-300">{t('dashboard.difficulty')}: {t(`new.${item.difficulty}`)}</p>
                <div className="mt-4 flex justify-between">
                  <span className="text-xs text-slate-400">{new Date(item.createdAt).toLocaleDateString(language === 'ta' ? 'ta-IN' : 'en-IN')}</span>
                  <div className="flex gap-3"><Link to={item.status === 'generating' || item.status === 'failed' ? `/cases/${item._id}/generating` : item.status === 'solved' || item.status === 'failed_accusation' ? `/cases/${item._id}/result` : `/cases/${item._id}`} className="text-amber-300 underline">{t('dashboard.open')}</Link><button onClick={() => handleDelete(item._id)} className="text-rose-300 underline">{t('dashboard.delete')}</button></div>
                </div>
              </div>
            ))
          )}
        </div>
      </div>
    </main>
  );
}
