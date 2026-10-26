// Experiment 8: real-time chat screen using socket.io-client
import { useState, useEffect, useRef } from 'react';
import { useParams } from 'react-router-dom';
import { useSelector } from 'react-redux';
import { io } from 'socket.io-client';
import { api } from './api.js';
import { useLang } from './i18n.jsx';
import { Wrap, Msg, inp, btn } from './pages.jsx';

export function Chat() {
  const { id } = useParams(); const { t } = useLang();
  const { user, token } = useSelector(s => s.auth);
  const [conv, setConv] = useState(null); const [msgs, setMsgs] = useState([]);
  const [text, setText] = useState(''); const [online, setOnline] = useState(false); const [err, setErr] = useState('');
  const sock = useRef(null); const end = useRef(null);

  useEffect(() => {
    let live = true;
    // 1) saved history from the REST API
    api(`/conversations/${id}/messages`, { token })
      .then(r => { if (live) { setConv(r.conversation); setMsgs(r.messages); } })
      .catch(e => live && setErr(e.message));
    // 2) live updates from the socket
    const s = io(import.meta.env.VITE_API_URL || undefined, { auth: { token } });
    sock.current = s;
    s.on('connect', () => { setOnline(true); s.emit('join', id, r => r?.error && setErr(r.error)); });   // also re-joins after a reconnect
    s.on('disconnect', () => setOnline(false));
    s.on('connect_error', e => { setOnline(false); setErr(e.message); });
    s.on('message', m => setMsgs(x => (x.some(y => y._id === m._id) ? x : [...x, m])));
    return () => { live = false; s.disconnect(); };       // cleanup: close the connection when leaving the page
  }, [id, token]);

  useEffect(() => { end.current?.scrollIntoView({ behavior: 'smooth' }); }, [msgs]);

  const send = e => {
    e.preventDefault();
    if (!text.trim()) return;
    sock.current.emit('message', { conversationId: id, text }, r => {
      if (r?.error) setErr(r.error); else { setText(''); setErr(''); }
    });
  };
  const other = conv && (user.role === 'farmer' ? conv.buyer?.name : conv.farmer?.name);

  return (
    <Wrap title={conv ? `${conv.listing?.crop}: ${other}` : t('chats')}>
      <p className={online ? 'text-paddy' : 'text-red-700'} role="status">{online ? t('connected') : t('offline')}</p>
      <Msg error={err} />
      <ul className="my-4 h-96 overflow-y-auto border border-soil/20 rounded p-3 space-y-2 bg-white">
        {msgs.map(m => {
          const mine = m.sender === user.id;
          return (
            <li key={m._id} className={mine ? 'text-right' : ''}>
              <span className={`inline-block rounded px-3 py-2 max-w-[80%] text-left ${mine ? 'bg-paddy text-white' : 'bg-mist'}`}>{m.text}</span>
              <div className="text-xs text-soil/60">{new Date(m.createdAt).toLocaleString()}</div>
            </li>
          );
        })}
        <li ref={end} />
      </ul>
      <form onSubmit={send} className="flex gap-2">
        <input className={inp} maxLength={1000} aria-label={t('type_msg')} placeholder={t('type_msg')} value={text} onChange={e => setText(e.target.value)} />
        <button className={btn} disabled={!online}>{t('send')}</button>
      </form>
    </Wrap>
  );
}
