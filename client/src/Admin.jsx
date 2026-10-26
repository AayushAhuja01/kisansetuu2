// Experiment 6: admin dashboard (route is protected by Guard in App.jsx and by allow('admin') on the API)
import { useState, useEffect } from 'react';
import { useSelector } from 'react-redux';
import { api } from './api.js';
import { useLang } from './i18n.jsx';
import { Wrap, Msg } from './pages.jsx';

export function Admin() {
  const { t } = useLang(); const { user, token } = useSelector(s => s.auth);
  const [users, setUsers] = useState(null); const [listings, setListings] = useState(null); const [err, setErr] = useState('');
  const load = () => {
    api('/admin/users', { token }).then(setUsers).catch(e => setErr(e.message));
    api('/listings?limit=50').then(r => setListings(r.items)).catch(e => setErr(e.message));
  };
  useEffect(() => { load(); }, [token]);
  const remove = path => window.confirm(t('delete') + '?') && api(path, { method: 'DELETE', token }).then(load).catch(e => setErr(e.message));
  return (
    <Wrap title={t('admin')}>
      <Msg error={err} />
      <h2 className="font-display text-2xl mb-2">{t('users')} ({users?.length ?? 0})</h2>
      <Msg loading={!users && !err} />
      <ul className="mb-10">{users?.map(u => (
        <li key={u._id} className="py-2 border-b border-soil/15 flex flex-wrap justify-between gap-3">
          <span>{u.name} <span className="text-soil/60">{u.email}, {t(u.role)}</span></span>
          {u._id !== user.id && <button className="underline text-red-700" onClick={() => remove(`/admin/users/${u._id}`)}>{t('delete')}</button>}
        </li>))}
      </ul>
      <h2 className="font-display text-2xl mb-2">{t('listings')} ({listings?.length ?? 0})</h2>
      <ul>{listings?.map(l => (
        <li key={l._id} className="py-2 border-b border-soil/15 flex flex-wrap justify-between gap-3">
          <span>{l.crop} <span className="text-soil/60">{l.farmer?.name}, ₹{l.price} / q</span></span>
          <button className="underline text-red-700" onClick={() => remove(`/listings/${l._id}`)}>{t('delete')}</button>
        </li>))}
      </ul>
    </Wrap>
  );
}
