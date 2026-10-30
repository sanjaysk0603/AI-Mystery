import { useEffect, useState } from 'react';
import { useNavigate, useParams } from 'react-router-dom';
import { fetchCaseById, retryCase } from '../lib/api.js';

const stages = ['Building the suspects', 'Planting clues', 'Writing the chats', 'Developing the photos', 'Reviewing the footage', 'Ready'];

export default function GeneratingPage() {
  const { id } = useParams();
  const navigate = useNavigate();
  const [caseData, setCaseData] = useState(null);
  const [error, setError] = useState('');

  useEffect(() => {
    let alive = true;

    async function poll() {
      try {
        const response = await fetchCaseById(id);
        if (!alive) return;
        setCaseData(response);
        if (response.status === 'ready') {
          navigate(`/cases/${id}`);
        }
      } catch (err) {
        setError(err.message);
      }
    }

    poll();
    const timer = setInterval(poll, 3000);
    return () => {
      alive = false;
      clearInterval(timer);
    };
  }, [id, navigate]);

  return (
    <main className="flex min-h-screen items-center justify-center bg-slate-950 p-6 text-slate-100">
      <div className="w-full max-w-xl rounded-2xl border border-amber-500/20 bg-slate-900/80 p-8 text-center shadow-glow">
        <div className="mb-4 text-xs uppercase tracking-[0.25em] text-amber-300">{caseData?.status === 'failed' ? 'Generation stopped' : 'Creating case'}</div>
        <h1 className="font-serif text-4xl text-amber-100">{caseData?.status === 'failed' ? 'The file needs another pass' : 'Building the mystery'}</h1>
        <div className="mt-6 h-3 w-full overflow-hidden rounded-full bg-slate-800">
          <div className="h-full rounded-full bg-amber-500 transition-all" style={{ width: `${caseData?.progress?.percent || 15}%` }} />
        </div>
        {caseData?.status === 'failed' ? <><p className="mt-4 text-slate-300">{caseData.failureReason || 'We could not finish this mystery.'}</p><button onClick={async () => { await retryCase(id); setCaseData({ ...caseData, status: 'generating', progress: { stage: stages[0], percent: 5 } }); }} className="mt-6 rounded-full bg-amber-500 px-5 py-2 font-medium text-slate-900">Try again</button></> : <>
        <p className="mt-4 text-slate-300">{error || `${caseData?.progress?.stage || 'Building the suspects'}…`}</p>
        <ol className="mt-6 grid grid-cols-2 gap-2 text-left text-xs sm:grid-cols-3">{stages.map((stage) => <li key={stage} className={`rounded border p-2 ${stages.indexOf(caseData?.progress?.stage) >= stages.indexOf(stage) ? 'border-amber-500/50 text-amber-200' : 'border-slate-800 text-slate-500'}`}>{stage}</li>)}</ol></>}
      </div>
    </main>
  );
}
