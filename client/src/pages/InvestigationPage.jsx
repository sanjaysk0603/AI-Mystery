import { useEffect, useMemo, useState } from 'react';
import { useNavigate, useParams } from 'react-router-dom';
import { accuseCase, fetchAttempt, fetchCaseById, requestHint, saveAttempt } from '../lib/api.js';
import CctvPlayer from '../components/CctvPlayer.jsx';
import { usePreferences } from '../context/PreferencesContext.jsx';

const tabs = [['Chats', 'investigation.chats'], ['Photos', 'investigation.photos'], ['CCTV', 'investigation.cctv'], ['Notebook', 'investigation.notebook']];

export default function InvestigationPage() {
  const { id } = useParams();
  const navigate = useNavigate();
  const { t } = usePreferences();
  const [caseData, setCaseData] = useState(null);
  const [activeTab, setActiveTab] = useState('Chats');
  const [note, setNote] = useState('');
  const [selectedSuspect, setSelectedSuspect] = useState('');
  const [justification, setJustification] = useState('');
  const [hintsUsed, setHintsUsed] = useState(0);
  const [pins, setPins] = useState([]);
  const [lightbox, setLightbox] = useState(null);
  const [saved, setSaved] = useState(true);
  const [readOnly, setReadOnly] = useState(false);
  const [error, setError] = useState('');

  useEffect(() => {
    async function load() {
      try {
        const response = await fetchCaseById(id);
        setCaseData(response);
        const attempt = await fetchAttempt(id);
        setHintCount(attempt.attempt.hintsUsed || 0);
        setNote(attempt.attempt.notebook || '');
        setPins(attempt.attempt.pinnedEvidenceIds || []);
        setReadOnly(attempt.attempt.status === 'completed');
      } catch (err) {
        console.error(err);
      }
    }
    load();
  }, [id]);

  useEffect(() => {
    if (!caseData || readOnly) return undefined;
    setSaved(false);
    const timer = setTimeout(async () => {
      try {
        await saveAttempt(id, { notebook: note, pinnedEvidenceIds: pins });
        setSaved(true);
      } catch (err) { setError(err.message); }
    }, 800);
    return () => clearTimeout(timer);
  }, [id, note, pins, caseData, readOnly]);

  function setHintCount(value) {
    setHintsUsed(value);
  }

  async function handleSaveNotebook() {
    await saveAttempt(id, { notebook: note, pinnedEvidenceIds: pins });
    setSaved(true);
  }

  function togglePin(evidenceId) {
    if (readOnly) return;
    setPins((current) => current.includes(evidenceId) ? current.filter((item) => item !== evidenceId) : [...current, evidenceId]);
  }

  async function handleHint() {
    try {
      const response = await requestHint(id);
      setHintCount(response.hintsUsed);
      alert(response.hint);
    } catch (err) {
      setError(err.message);
    }
  }

  async function handleAccuse() {
    try {
      const confirmed = window.confirm(t('investigation.confirm'));
      if (!confirmed) return;
      const response = await accuseCase(id, { suspectId: selectedSuspect, justification });
      navigate(`/cases/${id}/result`, { state: { result: response.result } });
    } catch (err) {
      setError(err.message);
    }
  }

  const activeSuspects = useMemo(() => caseData?.public?.suspects || [], [caseData]);

  return (
    <main className="case-shell min-h-screen bg-slate-950 p-6 pb-24 text-slate-100">
      <div className="mx-auto max-w-6xl">
        <header className="mb-6 flex flex-col gap-4 rounded-xl border border-slate-700 bg-slate-900/80 p-5 md:flex-row md:items-center md:justify-between">
          <div>
            <p className="text-xs uppercase tracking-[0.25em] text-amber-300">{t('investigation.label')}</p>
            <h1 className="font-serif text-4xl text-amber-100">{caseData?.public?.title || t('investigation.caseFile')}</h1>
          </div>
          <div className="flex gap-3">
            {!readOnly && <button onClick={handleHint} className="rounded-full border border-amber-500/30 px-4 py-2 text-amber-300">{t('investigation.hint', { count: hintsUsed })}</button>}
            {!readOnly && <button onClick={handleSaveNotebook} className="rounded-full border border-slate-700 px-4 py-2">{saved ? t('investigation.saved') : t('investigation.save')}</button>}
            {readOnly && <span className="rounded-full border border-slate-700 px-4 py-2 text-slate-400">{t('investigation.readOnly')}</span>}
          </div>
        </header>

        <section className="grid gap-6 lg:grid-cols-[1.3fr_0.7fr]">
          <div className="space-y-6">
            <div className="rounded-xl border border-amber-500/20 bg-slate-900/70 p-4 shadow-glow">
              <div className="mb-3 text-xs uppercase tracking-[0.2em] text-amber-300">{t('investigation.clueBoard')} · {pins.length}</div>
              {pins.length ? <ul className="space-y-2">{pins.map((pin) => <li key={pin} className="flex items-center justify-between text-sm text-slate-300"><span>{caseData?.public?.chats?.find((item) => item.id === pin)?.title || caseData?.public?.photos?.find((item) => item.id === pin)?.caption || caseData?.public?.cctv?.find((item) => item.id === pin)?.cameraName || pin}</span><button onClick={() => togglePin(pin)} className="ml-2 text-amber-300" aria-label={`${t('investigation.unpin')} ${pin}`}>×</button></li>)}</ul> : <p className="text-sm text-slate-500">{t('investigation.pinPrompt')}</p>}
            </div>

            <div className="rounded-xl border border-amber-500/20 bg-slate-900/70 p-4 shadow-glow">
              <p className="mb-2 text-xs uppercase tracking-[0.2em] text-amber-300">{t('investigation.briefing')}</p>
              <p className="text-slate-300">{caseData?.public?.briefing}</p>
              <p className="mt-3 text-xs uppercase tracking-widest text-slate-500">{caseData?.public?.setting?.place} · {caseData?.public?.setting?.date} · {caseData?.public?.setting?.timeWindow}</p>
            </div>

            <div className="rounded-xl border border-amber-500/20 bg-slate-900/70 p-4 shadow-glow">
              <div className="mb-4 flex flex-wrap gap-2">
                {tabs.map(([tab, key]) => (
                  <button key={tab} onClick={() => setActiveTab(tab)} className={`rounded-full px-3 py-1 text-sm ${activeTab === tab ? 'bg-amber-500 text-slate-900' : 'bg-slate-800 text-slate-200'}`}>
                    {t(key)}
                  </button>
                ))}
              </div>

              {activeTab === 'Chats' && (
                <div className="space-y-4">
                  {(caseData?.public?.chats || []).map((chat) => (
                    <div key={chat.id} className="evidence-card rounded-lg border border-slate-700 bg-slate-950 p-4">
                      <div className="mb-2 text-sm font-semibold text-amber-200">{chat.title}</div>
                      {chat.messages.map((msg, index) => (
                        <div key={`${chat.id}-${index}`} className="mb-2 flex">
                          <div className={`max-w-[80%] rounded-2xl px-3 py-2 text-sm ${msg.sender === activeSuspects[0]?.name ? 'ml-auto bg-amber-500/20 text-amber-100' : 'bg-slate-800 text-slate-100'}`}>
                            <div className="mb-1 text-[10px] uppercase tracking-[0.2em] text-slate-400">{msg.sender}</div>
                            {msg.text}
                          </div>
                        </div>
                      ))}
                      <button type="button" onClick={() => togglePin(chat.id)} className="mt-2 text-xs text-amber-300 underline">{pins.includes(chat.id) ? t('investigation.unpinChat') : t('investigation.pinChat')}</button>
                    </div>
                  ))}
                </div>
              )}

              {activeTab === 'Photos' && (
                <div className="grid gap-4 md:grid-cols-2">
                  {(caseData?.public?.photos || []).map((photo) => (
                    <div key={photo.id} className="evidence-card overflow-hidden rounded-xl border border-slate-700 bg-slate-950">
                      <button type="button" onClick={() => setLightbox(photo)} className="block w-full" aria-label={t('investigation.openPhoto', { caption: photo.caption })}><img src={photo.imageUrl} alt={photo.caption} className="h-40 w-full object-cover" /></button>
                      <div className="p-3 text-sm text-slate-300"><p>{photo.caption}</p><p className="mt-1 text-xs text-slate-500">{photo.timestamp} · {photo.location}</p><button type="button" onClick={() => togglePin(photo.id)} className="mt-2 text-xs text-amber-300 underline">{pins.includes(photo.id) ? t('investigation.unpinEvidence') : t('investigation.pinEvidence')}</button></div>
                    </div>
                  ))}
                </div>
              )}

              {activeTab === 'CCTV' && (
                <div className="space-y-4">
                  {(caseData?.public?.cctv || []).map((camera) => (
                    <div key={camera.id} className="rounded-xl border border-slate-700 bg-slate-950 p-4">
                      <CctvPlayer camera={camera} pinned={pins.includes(camera.id)} onTogglePin={togglePin} />
                      <div className="hidden">
                        {camera.frames.map((frame) => (
                          <div key={frame.offsetSeconds} className="overflow-hidden rounded-lg border border-slate-700">
                            <img src={frame.imageUrl} alt={frame.caption} className="h-32 w-full object-cover" />
                            <div className="bg-slate-900 p-2 text-sm text-slate-200">{frame.timestamp} — {frame.caption}</div>
                          </div>
                        ))}
                      </div>
                    </div>
                  ))}
                </div>
              )}

              {activeTab === 'Notebook' && (
                <textarea value={note} readOnly={readOnly} onChange={(e) => setNote(e.target.value)} rows={10} className="w-full rounded-lg border border-slate-700 bg-slate-950 p-3 text-slate-100 read-only:opacity-80" placeholder="Write your deductions..." />
              )}
            </div>
          </div>

          <aside className="space-y-6">
            <div className="rounded-xl border border-amber-500/20 bg-slate-900/70 p-4 shadow-glow">
              <div className="mb-4 text-xs uppercase tracking-[0.2em] text-amber-300">{t('investigation.suspects')}</div>
              <div className="space-y-3">
                {activeSuspects.map((suspect) => (
                  <button key={suspect.id} onClick={() => setSelectedSuspect(suspect.id)} className={`flex w-full items-center gap-3 rounded-lg border p-2 text-left ${selectedSuspect === suspect.id ? 'border-amber-500 bg-amber-500/10' : 'border-slate-700 bg-slate-950'}`}>
                    <img src={suspect.portraitUrl} alt={suspect.name} className="h-14 w-14 rounded-full object-cover" />
                    <div>
                      <div className="font-medium text-slate-100">{suspect.name}</div>
                      <div className="text-xs text-slate-400">{suspect.role}</div>
                      <div className="mt-1 text-xs text-slate-500">{suspect.age} · {suspect.publicBio}</div>
                    </div>
                  </button>
                ))}
              </div>
            </div>

            {!readOnly && <div className="rounded-xl border border-amber-500/20 bg-slate-900/70 p-4 shadow-glow">
              <div className="mb-3 text-xs uppercase tracking-[0.2em] text-amber-300">{t('investigation.accuse')}</div>
              <textarea rows={3} value={justification} onChange={(e) => setJustification(e.target.value)} placeholder={t('investigation.reason')} className="w-full rounded-lg border border-slate-700 bg-slate-950 p-3 text-slate-100" />
              <p className="mt-2 text-xs text-slate-500">{t('investigation.length')}</p>
              <button onClick={handleAccuse} disabled={!selectedSuspect || justification.trim().length < 10 || justification.length > 500} className="mt-3 w-full rounded-lg bg-amber-500 px-4 py-2 font-medium text-slate-900 disabled:cursor-not-allowed disabled:opacity-50">{t('investigation.submit')}</button>
              {error && <div className="mt-2 text-sm text-rose-400">{error}</div>}
            </div>}
          </aside>
        </section>
        <p className="mt-8 text-center text-xs text-slate-500">{t('investigation.footer')}</p>
      </div>
      {lightbox && <div role="dialog" aria-modal="true" aria-label={lightbox.caption} className="fixed inset-0 z-50 flex items-center justify-center bg-black/90 p-4" onClick={() => setLightbox(null)}><div className="max-h-full max-w-4xl" onClick={(event) => event.stopPropagation()}><button onClick={() => setLightbox(null)} className="mb-2 rounded bg-slate-900 px-3 py-2 text-white">{t('common.close')}</button><img src={lightbox.imageUrl} alt={lightbox.caption} className="max-h-[75vh] w-full object-contain" /><p className="mt-2 text-center text-slate-200">{lightbox.caption}</p></div></div>}
    </main>
  );
}
