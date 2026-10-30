import { useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { createCase } from '../lib/api.js';
import { usePreferences } from '../context/PreferencesContext.jsx';

export default function NewCasePage() {
  const navigate = useNavigate();
  const { language, t } = usePreferences();
  const [sampleIndex] = useState(() => {
    try { return Number(window.sessionStorage.getItem('mystery-default-scenario-index') || 0) % 3; }
    catch { return 0; }
  });
  const [usingDefaultScenario, setUsingDefaultScenario] = useState(true);
  const [form, setForm] = useState(() => ({
    scenario: t(`new.sample${sampleIndex + 1}`),
    settings: { difficulty: 'medium', suspectCount: 4, language },
  }));
  const [error, setError] = useState('');

  useEffect(() => {
    setForm((current) => ({
      ...current,
      scenario: usingDefaultScenario ? t(`new.sample${sampleIndex + 1}`) : current.scenario,
      settings: { ...current.settings, language },
    }));
  }, [language, t, sampleIndex, usingDefaultScenario]);

  async function handleSubmit(event) {
    event.preventDefault();
    setError('');

    try {
      const response = await createCase(form);
      navigate(`/cases/${response.id}/generating`);
    } catch (err) {
      setError(err.message);
    }
  }

  return (
    <main className="case-shell min-h-screen bg-slate-950 p-6 pb-24 text-slate-100">
      <div className="animate-case-in mx-auto max-w-2xl rounded-2xl border border-amber-500/20 bg-slate-900/80 p-8 shadow-glow">
        <h1 className="mb-6 font-serif text-4xl text-amber-100">{t('new.title')}</h1>

        <form onSubmit={handleSubmit} className="space-y-5">
          <label className="block">
            <span className="mb-2 block text-sm text-slate-300">{t('new.scenario')}</span>
            <textarea rows="5" minLength="20" maxLength="1000" value={form.scenario} onChange={(event) => { setUsingDefaultScenario(false); setForm({ ...form, scenario: event.target.value }); }} className="w-full rounded-lg border border-slate-700 bg-slate-950 px-3 py-2 text-slate-100" />
            <span className="mt-1 block text-xs text-slate-500">{t('new.scenarioHint')}</span>
          </label>

          <div className="grid gap-4 md:grid-cols-2">
            <label className="block">
              <span className="mb-2 block text-sm text-slate-300">{t('new.difficulty')}</span>
              <select value={form.settings.difficulty} onChange={(event) => setForm({ ...form, settings: { ...form.settings, difficulty: event.target.value } })} className="w-full rounded-lg border border-slate-700 bg-slate-950 px-3 py-2 text-slate-100">
                <option value="easy">{t('new.easy')}</option>
                <option value="medium">{t('new.medium')}</option>
                <option value="hard">{t('new.hard')}</option>
              </select>
            </label>

            <label className="block">
              <span className="mb-2 block text-sm text-slate-300">{t('new.suspects')}</span>
              <input type="number" min="3" max="6" value={form.settings.suspectCount} onChange={(event) => setForm({ ...form, settings: { ...form.settings, suspectCount: Number(event.target.value) } })} className="w-full rounded-lg border border-slate-700 bg-slate-950 px-3 py-2 text-slate-100" />
            </label>

            <label className="block md:col-span-2">
              <span className="mb-2 block text-sm text-slate-300">{t('new.language')}</span>
              <select value={form.settings.language} onChange={(event) => setForm({ ...form, settings: { ...form.settings, language: event.target.value } })} className="w-full rounded-lg border border-slate-700 bg-slate-950 px-3 py-2 text-slate-100">
                <option value="ta">தமிழ்</option>
                <option value="tanglish">Tanglish</option>
                <option value="en">English</option>
              </select>
            </label>
          </div>

          {error && <p role="alert" className="text-sm text-rose-400">{error}</p>}

          <button type="submit" className="rounded-full bg-amber-500 px-6 py-3 font-medium text-slate-900">{t('new.create')}</button>
        </form>
      </div>
    </main>
  );
}
