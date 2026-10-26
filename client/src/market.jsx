// Experiments 1, 2, 4: marketplace, product details, farmer dashboard (all talk to the real API)
import { useState, useEffect } from 'react';
import { Link, useParams, useNavigate } from 'react-router-dom';
import { useSelector, useDispatch } from 'react-redux';
import { fetchListings } from './store.js';
import { api } from './api.js';
import { useLang } from './i18n.jsx';
import { useFetch, useDebounce } from './hooks.js';
import { Wrap, Msg, inp, btn } from './pages.jsx';

export const CATEGORIES = ['Grains', 'Vegetables', 'Fruits', 'Pulses', 'Dairy', 'Spices', 'Other'];

export function Market() {
  const { t } = useLang(); const d = useDispatch();
  const { items, status, page, pages } = useSelector(s => s.listings);
  const [f, setF] = useState({ q: '', category: '', location: '', page: 1 });
  const dq = useDebounce(f.q); const dl = useDebounce(f.location);   // wait until the user stops typing
  useEffect(() => { d(fetchListings({ q: dq, category: f.category, location: dl, page: f.page })); }, [dq, dl, f.category, f.page, d]);
  const set = k => e => setF({ ...f, [k]: e.target.value, page: 1 });
  return (
    <Wrap title={t('market')}>
      <div className="grid sm:grid-cols-3 gap-3 max-w-3xl mb-6">
        <input className={inp} aria-label={t('search')} placeholder={t('search')} value={f.q} onChange={set('q')} />
        <select className={inp} aria-label={t('category')} value={f.category} onChange={set('category')}>
          <option value="">{t('all')}</option>
          {CATEGORIES.map(c => <option key={c} value={c}>{t('cat_' + c)}</option>)}
        </select>
        <input className={inp} aria-label={t('location')} placeholder={t('location')} value={f.location} onChange={set('location')} />
      </div>
      <Msg loading={status === 'loading'} error={status === 'error' && 'Could not load listings'} empty={status === 'idle' && items.length === 0} />
      <ul>
        {items.map(l => (
          <li key={l._id} className="border-b border-soil/15">
            <Link to={`/listing/${l._id}`} className="py-4 flex flex-wrap justify-between gap-3 hover:bg-mist/50">
              <div>
                <div className="font-display text-xl">{l.crop}</div>
                <div className="text-soil/70">{t('cat_' + l.category)}, {l.location}</div>
                <div className="text-soil/70">{t('by')}: {l.farmer?.name}</div>
              </div>
              <div className="text-right">
                <div className="font-semibold text-paddy tabular-nums">₹{l.price} / q</div>
                <div className="tabular-nums">{l.quantity} q</div>
              </div>
            </Link>
          </li>
        ))}
      </ul>
      {pages > 1 && (
        <div className="mt-6 flex items-center gap-4">
          <button className={btn} disabled={page <= 1} onClick={() => setF({ ...f, page: page - 1 })}>{t('prev')}</button>
          <span className="tabular-nums">{page} / {pages}</span>
          <button className={btn} disabled={page >= pages} onClick={() => setF({ ...f, page: page + 1 })}>{t('next')}</button>
        </div>
      )}
    </Wrap>
  );
}

export function ProductDetail() {
  const { id } = useParams(); const { t } = useLang(); const nav = useNavigate();
  const { user, token } = useSelector(s => s.auth);
  const { data: l, loading, error } = useFetch(`/listings/${id}`);
  const [err, setErr] = useState('');
  const startChat = () => api('/conversations', { method: 'POST', body: { listingId: id }, token })
    .then(c => nav(`/chat/${c._id}`)).catch(e => setErr(e.message));
  return (
    <Wrap title={l?.crop || t('market')}>
      <Msg loading={loading} error={error} />
      {l && (
        <div className="max-w-xl space-y-2">
          <p className="text-soil/70">{t('cat_' + l.category)}</p>
          {l.description && <p>{l.description}</p>}
          <p className="font-semibold text-paddy text-2xl tabular-nums">₹{l.price} / q</p>
          <p>{t('qty')}: {l.quantity}</p>
          <p>{t('location')}: {l.location}</p>
          <p>{t('by')}: {l.farmer?.name}{l.farmer?.location ? `, ${l.farmer.location}` : ''}</p>
          {err && <p className="text-red-700" role="alert">{err}</p>}
          {user?.role === 'buyer' && <button className={btn} onClick={startChat}>{t('chat')}</button>}
          {!user && <Link className="underline text-paddy" to="/login">{t('login_buyer')}</Link>}
        </div>
      )}
    </Wrap>
  );
}

function ListingForm({ initial, onDone, onCancel }) {
  const { t } = useLang(); const token = useSelector(s => s.auth.token);
  const [f, setF] = useState({ crop: '', category: 'Grains', description: '', quantity: '', price: '', location: '', ...initial });
  const [err, setErr] = useState('');
  const set = k => e => setF({ ...f, [k]: e.target.value });
  const submit = e => {
    e.preventDefault(); setErr('');
    const { crop, category, description, quantity, price, location } = f;
    api(initial ? `/listings/${initial._id}` : '/listings', { method: initial ? 'PUT' : 'POST', token, body: { crop, category, description, quantity, price, location } })
      .then(onDone).catch(x => setErr(x.message));
  };
  return (
    <form onSubmit={submit} className="bg-mist rounded p-4 mb-6 grid sm:grid-cols-3 gap-3">
      <input required className={inp} placeholder={t('crop')} aria-label={t('crop')} value={f.crop} onChange={set('crop')} />
      <select className={inp} aria-label={t('category')} value={f.category} onChange={set('category')}>
        {CATEGORIES.map(c => <option key={c} value={c}>{t('cat_' + c)}</option>)}
      </select>
      <input required className={inp} placeholder={t('location')} aria-label={t('location')} value={f.location} onChange={set('location')} />
      <input required type="number" min="0.1" step="any" className={inp} placeholder={t('qty')} aria-label={t('qty')} value={f.quantity} onChange={set('quantity')} />
      <input required type="number" min="1" step="any" className={inp} placeholder={t('price_q')} aria-label={t('price_q')} value={f.price} onChange={set('price')} />
      <textarea maxLength={500} className={inp} placeholder={t('description')} aria-label={t('description')} value={f.description} onChange={set('description')} />
      {err && <p className="sm:col-span-3 text-red-700" role="alert">{err}</p>}
      <div className="sm:col-span-3 flex gap-3">
        <button className={btn}>{t('save')}</button>
        <button type="button" className="underline" onClick={onCancel}>{t('cancel')}</button>
      </div>
    </form>
  );
}

function ChatList() {
  const { t } = useLang(); const { user, token } = useSelector(s => s.auth);
  const [items, setItems] = useState(null); const [err, setErr] = useState('');
  useEffect(() => { api('/conversations', { token }).then(setItems).catch(e => setErr(e.message)); }, [token]);
  return (
    <>
      <Msg loading={!items && !err} error={err} empty={items?.length === 0} />
      <ul>{items?.map(c => (
        <li key={c._id} className="py-3 border-b border-soil/15">
          <Link className="underline text-paddy" to={`/chat/${c._id}`}>{c.listing?.crop}: {user.role === 'farmer' ? c.buyer?.name : c.farmer?.name}</Link>
        </li>))}
      </ul>
    </>
  );
}

function FarmerDash() {
  const { t } = useLang(); const token = useSelector(s => s.auth.token);
  const [items, setItems] = useState(null); const [err, setErr] = useState(''); const [editing, setEditing] = useState(null);
  const load = () => api('/listings/mine', { token }).then(setItems).catch(e => setErr(e.message));
  useEffect(() => { load(); }, [token]);
  const del = id => window.confirm(t('delete') + '?') && api(`/listings/${id}`, { method: 'DELETE', token }).then(load).catch(e => setErr(e.message));
  return (
    <Wrap title={t('dashboard')}>
      {editing
        ? <ListingForm key={editing._id || 'new'} initial={editing === 'new' ? null : editing} onDone={() => { setEditing(null); load(); }} onCancel={() => setEditing(null)} />
        : <button className={btn + ' mb-6'} onClick={() => setEditing('new')}>{t('post')}</button>}
      <Msg loading={!items && !err} error={err} empty={items?.length === 0} />
      {items?.map(l => (
        <div key={l._id} className="py-3 border-b border-soil/15 flex flex-wrap justify-between gap-3">
          <span><b className="font-display text-xl">{l.crop}</b> <span className="tabular-nums">₹{l.price} / q, {l.quantity} q</span></span>
          <span className="flex gap-4">
            <button className="underline text-paddy" onClick={() => setEditing(l)}>{t('edit')}</button>
            <button className="underline text-red-700" onClick={() => del(l._id)}>{t('delete')}</button>
          </span>
        </div>
      ))}
      <h2 className="font-display text-2xl mt-10 mb-2">{t('chats')}</h2>
      <ChatList />
    </Wrap>
  );
}

export function Dashboard() {
  const { t } = useLang(); const role = useSelector(s => s.auth.user.role);
  return role === 'farmer' ? <FarmerDash /> : <Wrap title={t('chats')}><ChatList /></Wrap>;
}
