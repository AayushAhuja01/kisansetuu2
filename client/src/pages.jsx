import { useState, useEffect } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { useSelector, useDispatch } from 'react-redux';
import { authenticate } from './store.js';
import { api } from './api.js';
import { useLang } from './i18n.jsx';
import { useFetch, useDebounce, useWeather } from './hooks.js';

export const inp = 'border border-soil/30 rounded px-3 py-2 w-full bg-white';
export const btn = 'bg-paddy text-white font-semibold px-4 py-2 rounded hover:bg-paddy/90 disabled:opacity-50';
const STATES = ['Maharashtra', 'Madhya Pradesh', 'Punjab', 'Gujarat', 'Karnataka', 'Uttar Pradesh'];

export const Wrap = ({ title, children }) => (
  <main className="max-w-6xl mx-auto px-4 py-8">
    <h1 className="font-display text-3xl text-paddy mb-6">{title}</h1>{children}
  </main>
);
export const Msg = ({ loading, error, empty }) => {
  const { t } = useLang();
  if (loading) return <p>{t('loading')}</p>;
  if (error) return <p className="text-red-700" role="alert">{error}</p>;
  return empty ? <p className="text-soil/60">{t('none')}</p> : null;
};

/* ---------- Home ---------- */
function Weather() {
  const { t } = useLang();
  const [city, setCity] = useState('Kolhapur');
  const { data, loading, error } = useWeather(useDebounce(city, 700));
  return (
    <section className="max-w-6xl mx-auto px-4 py-10">
      <div className="flex flex-wrap items-end gap-4 mb-4">
        <h2 className="font-display text-2xl text-paddy">{t('weather')}</h2>
        <input aria-label={t('city')} className={inp + ' max-w-xs'} value={city} onChange={e => setCity(e.target.value)} placeholder={t('city')} />
      </div>
      <Msg loading={loading} error={error} />
      {data && (
        <div className="grid sm:grid-cols-4 gap-4">
          <div className="bg-mist rounded p-4">
            <div className="text-sm">{data.place}</div>
            <div className="font-display text-4xl">{Math.round(data.current.temperature_2m)}°C</div>
            <div className="text-sm">{t('humidity')}: {data.current.relative_humidity_2m}%</div>
            <div className="text-sm">{t('wind')}: {data.current.wind_speed_10m} km/h</div>
          </div>
          {data.daily.time.map((d, i) => (
            <div key={d} className="border-l-4 border-turmeric pl-3">
              <div className="font-semibold">{new Date(d).toLocaleDateString(undefined, { weekday: 'short', day: 'numeric' })}</div>
              <div>{Math.round(data.daily.temperature_2m_max[i])}° / {Math.round(data.daily.temperature_2m_min[i])}°</div>
              <div className="text-sm text-soil/70">{t('rain')}: {data.daily.precipitation_sum[i]} mm</div>
            </div>
          ))}
        </div>
      )}
    </section>
  );
}

export function Home() {
  const { t } = useLang();
  const { data, loading, error } = useFetch('/prices');
  return (
    <>
      <section className="bg-paddy text-white">
        <div className="max-w-6xl mx-auto px-4 py-12 grid md:grid-cols-2 gap-8 items-center">
          <div>
            <h1 className="font-display text-4xl md:text-6xl leading-tight">{t('hero_h')}</h1>
            <p className="mt-4 text-lg text-white/90 max-w-prose">{t('hero_p')}</p>
            <div className="mt-6 flex flex-wrap gap-3">
              <Link to="/market" className="bg-turmeric text-soil font-semibold px-5 py-2 rounded">{t('market')}</Link>
              <Link to="/crops" className="border border-white/60 px-5 py-2 rounded">{t('crops')}</Link>
            </div>
          </div>
          <div className="bg-soil rounded-lg p-5 shadow-lg text-white">
            <h2 className="font-display text-turmeric text-xl">{t('board')}</h2>
            <p className="text-white/60 text-sm mb-2">{t('per_q')}</p>
            <Msg loading={loading} error={error} />
            {data?.slice(0, 6).map(p => (
              <div key={p._id} className="flex justify-between py-2 border-b border-white/10 last:border-0">
                <span>{p.crop} <span className="text-white/50 text-sm">{p.mandi}</span></span>
                <b className="text-turmeric tabular-nums">₹{p.modalPrice}</b>
              </div>
            ))}
            <Link to="/prices" className="inline-block mt-3 text-turmeric underline">{t('prices')}</Link>
          </div>
        </div>
      </section>
      <Weather />
    </>
  );
}

/* ---------- Mandi prices ---------- */
export function Prices() {
  const { t } = useLang();
  const [q, setQ] = useState(''); const [st, setSt] = useState('');
  const { data, loading, error } = useFetch(`/prices?crop=${encodeURIComponent(useDebounce(q))}&state=${encodeURIComponent(st)}`);
  return (
    <Wrap title={t('prices')}>
      <div className="grid sm:grid-cols-2 gap-3 max-w-xl mb-6">
        <input className={inp} aria-label={t('search')} placeholder={t('search')} value={q} onChange={e => setQ(e.target.value)} />
        <select className={inp} aria-label={t('state')} value={st} onChange={e => setSt(e.target.value)}>
          <option value="">{t('all_states')}</option>
          {STATES.map(s => <option key={s}>{s}</option>)}
        </select>
      </div>
      <Msg loading={loading} error={error} empty={data?.length === 0} />
      {data?.length > 0 && (
        <div className="overflow-x-auto">
          <table className="w-full text-left">
            <thead><tr className="border-b-2 border-soil">
              {['crop', 'mandi', 'state', 'range', 'modal'].map(h => <th key={h} className="py-2 pr-4">{t(h)}</th>)}
            </tr></thead>
            <tbody>{data.map(p => (
              <tr key={p._id} className="border-b border-soil/15">
                <td className="py-2 pr-4 font-semibold">{p.crop}</td><td className="pr-4">{p.mandi}</td><td className="pr-4">{p.state}</td>
                <td className="pr-4 tabular-nums">₹{p.minPrice} to ₹{p.maxPrice}</td>
                <td className="font-semibold text-paddy tabular-nums">₹{p.modalPrice}</td>
              </tr>))}
            </tbody>
          </table>
        </div>
      )}
    </Wrap>
  );
}

/* ---------- Crop recommendation ---------- */
export function Crops() {
  const { t } = useLang();
  const [f, setF] = useState({ soil: 'black', season: 'kharif', water: 'medium' });
  const [res, setRes] = useState(null); const [err, setErr] = useState('');
  const go = e => { e.preventDefault(); setErr(''); api(`/crops/recommend?${new URLSearchParams(f)}`).then(setRes).catch(x => setErr(x.message)); };
  const sel = (k, opts) => (
    <label className="block"><span className="font-semibold">{t(k)}</span>
      <select className={inp} value={f[k]} onChange={e => setF({ ...f, [k]: e.target.value })}>
        {opts.map(o => <option key={o} value={o}>{t(o)}</option>)}
      </select>
    </label>
  );
  return (
    <Wrap title={t('crops')}>
      <form onSubmit={go} className="grid sm:grid-cols-4 gap-3 items-end max-w-3xl">
        {sel('soil', ['black', 'red', 'alluvial', 'sandy'])}
        {sel('season', ['kharif', 'rabi', 'zaid'])}
        {sel('water', ['low', 'medium', 'high'])}
        <button className={btn}>{t('recommend')}</button>
      </form>
      <div className="mt-6"><Msg error={err} empty={res?.length === 0} /></div>
      <ul className="mt-4 max-w-md">
        {res?.map(c => (
          <li key={c.crop} className="flex justify-between py-2 border-b border-soil/15">
            <span className="font-display text-xl">{c.crop}</span><span className="text-paddy font-semibold">{c.score} / 3</span>
          </li>))}
      </ul>
    </Wrap>
  );
}

/* ---------- Schemes and tips ---------- */
export function Info() {
  const { t, content } = useLang();
  return (
    <Wrap title={t('info')}>
      <div className="grid md:grid-cols-2 gap-10">
        <section>
          <h2 className="font-display text-2xl mb-3">{t('schemes')}</h2>
          {content.schemes.map(([title, desc]) => (
            <div key={title} className="py-3 border-b border-soil/15"><b>{title}</b><p className="text-soil/80">{desc}</p></div>
          ))}
        </section>
        <section>
          <h2 className="font-display text-2xl mb-3">{t('tips')}</h2>
          <ul className="list-disc pl-5 space-y-2">{content.tips.map(x => <li key={x}>{x}</li>)}</ul>
        </section>
      </div>
    </Wrap>
  );
}

/* ---------- Login / Register ---------- */
export function Auth() {
  const { t } = useLang(); const d = useDispatch(); const nav = useNavigate();
  const { status, error } = useSelector(s => s.auth);
  const [mode, setMode] = useState('login');
  const [f, setF] = useState({ name: '', email: '', password: '', role: 'farmer' });
  const set = k => e => setF({ ...f, [k]: e.target.value });
  const submit = e => { e.preventDefault(); d(authenticate({ mode, ...f })).unwrap().then(() => nav('/')).catch(() => {}); };
  return (
    <Wrap title={t(mode)}>
      <form onSubmit={submit} className="max-w-sm space-y-3">
        {mode === 'register' && (
          <>
            <input required className={inp} placeholder={t('name')} aria-label={t('name')} value={f.name} onChange={set('name')} />
            <label className="block"><span className="font-semibold">{t('role')}</span>
              <select className={inp} value={f.role} onChange={set('role')}>
                <option value="farmer">{t('farmer')}</option><option value="buyer">{t('buyer')}</option>
              </select>
            </label>
          </>
        )}
        <input required type="email" className={inp} placeholder={t('email')} aria-label={t('email')} value={f.email} onChange={set('email')} />
        <input required type="password" minLength={6} className={inp} placeholder={t('password')} aria-label={t('password')} value={f.password} onChange={set('password')} />
        {error && <p className="text-red-700" role="alert">{error}</p>}
        <button className={btn} disabled={status === 'loading'}>{t(mode)}</button>
        <button type="button" className="block underline text-paddy" onClick={() => setMode(mode === 'login' ? 'register' : 'login')}>
          {t(mode === 'login' ? 'register' : 'login')}
        </button>
      </form>
    </Wrap>
  );
}
