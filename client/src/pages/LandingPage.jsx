import { Link } from 'react-router-dom';
import { usePreferences } from '../context/PreferencesContext.jsx';

export default function LandingPage() {
  const { t } = usePreferences();
  return (
    <main className="case-shell min-h-screen bg-slate-950 px-4 py-10 pb-24 text-slate-100">
      <div className="mx-auto max-w-5xl">
        <header className="mb-10 flex flex-wrap items-center justify-between gap-4">
          <div className="text-xl font-semibold tracking-[0.22em] text-amber-300">AI MYSTERY ROOM</div>
          <div className="flex gap-3">
            <Link to="/login" className="rounded-full border border-amber-500/40 px-5 py-2 text-sm hover:bg-amber-500/10">{t('landing.login')}</Link>
            <Link to="/register" className="rounded-full bg-amber-500 px-5 py-2 text-sm font-medium text-slate-900">{t('landing.register')}</Link>
          </div>
        </header>

        <section className="animate-case-in grid gap-8 rounded-3xl border border-amber-500/20 bg-slate-900/70 p-8 shadow-glow lg:grid-cols-2">
          <div className="space-y-6">
            <p className="text-sm uppercase tracking-[0.3em] text-amber-300">{t('landing.eyebrow')}</p>
            <h1 className="max-w-2xl font-serif text-5xl leading-tight text-amber-100 sm:text-6xl">{t('landing.title')}</h1>
            <p className="max-w-lg text-lg leading-relaxed text-slate-300">{t('landing.description')}</p>
            <div className="flex flex-wrap gap-4">
              <Link to="/register" className="rounded-full bg-amber-500 px-6 py-3 font-medium text-slate-900">{t('landing.start')}</Link>
              <Link to="/dashboard" className="rounded-full border border-slate-600 px-6 py-3 text-slate-200">{t('landing.browse')}</Link>
            </div>
          </div>

          <div className="rounded-2xl border border-slate-700 bg-slate-950/60 p-5">
            <div className="mb-4 text-xs uppercase tracking-[0.22em] text-slate-400">{t('landing.example')}</div>
            <div className="space-y-3 text-sm text-slate-300">
              <p>{t('landing.sample')}</p>
              <div className="evidence-card rounded-lg bg-slate-800 p-3 text-slate-100">
                <div className="text-xs uppercase text-amber-300">{t('investigation.caseFile')}</div>
                <div className="mt-2 font-serif text-2xl text-amber-100">{t('landing.caseTitle')}</div>
              </div>
            </div>
          </div>
        </section>
      </div>
    </main>
  );
}
