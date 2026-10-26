import { Routes, Route, NavLink, Link, Navigate } from 'react-router-dom';
import { useSelector, useDispatch } from 'react-redux';
import { logout } from './store.js';
import { useLang } from './i18n.jsx';
import { Home, Prices, Crops, Info, Auth } from './pages.jsx';
import { Market, ProductDetail, Dashboard } from './market.jsx';
import { Chat } from './Chat.jsx';
import { Admin } from './Admin.jsx';

// Experiment 6: role-based route guard on the client
function Guard({ role, children }) {
  const user = useSelector(s => s.auth.user);
  return user && (!role || user.role === role) ? children : <Navigate to="/login" replace />;
}

export default function App() {
  const { user } = useSelector(s => s.auth);
  const d = useDispatch();
  const { t, lang, setLang } = useLang();
  const link = ({ isActive }) => `py-1 border-b-2 ${isActive ? 'text-turmeric border-turmeric' : 'text-white/80 border-transparent hover:text-white'}`;
  const langs = { en: 'EN', hi: 'हिं', mr: 'मरा' };
  return (
    <>
      <header className="bg-soil text-white sticky top-0 z-10">
        <div className="max-w-6xl mx-auto px-4 py-3 flex flex-wrap items-center gap-x-6 gap-y-2">
          <Link to="/" className="flex items-center gap-2 font-display text-2xl">
            <svg width="28" height="28" viewBox="0 0 32 32" fill="none" stroke="#E8A317" strokeWidth="3" aria-hidden="true">
              <path d="M2 24h28M5 24c0-9 5-14 11-14s11 5 11 14" />
            </svg>
            KisanSetu
          </Link>
          <nav className="flex flex-wrap gap-x-4 gap-y-1 text-sm sm:text-base" aria-label="Main">
            <NavLink to="/prices" className={link}>{t('prices')}</NavLink>
            <NavLink to="/market" className={link}>{t('market')}</NavLink>
            <NavLink to="/crops" className={link}>{t('crops')}</NavLink>
            <NavLink to="/info" className={link}>{t('info')}</NavLink>
            {user && user.role !== 'admin' && <NavLink to="/dashboard" className={link}>{t(user.role === 'farmer' ? 'dashboard' : 'chats')}</NavLink>}
            {user?.role === 'admin' && <NavLink to="/admin" className={link}>{t('admin')}</NavLink>}
          </nav>
          <div className="ml-auto flex items-center gap-3">
            <div className="flex rounded overflow-hidden border border-white/30" role="group" aria-label="Language">
              {Object.entries(langs).map(([k, v]) => (
                <button key={k} aria-pressed={lang === k} onClick={() => setLang(k)}
                  className={`px-2 py-1 text-sm ${lang === k ? 'bg-turmeric text-soil font-semibold' : 'text-white'}`}>{v}</button>
              ))}
            </div>
            {user
              ? <button className="underline" onClick={() => d(logout())}>{t('logout')} ({user.name.split(' ')[0]})</button>
              : <Link className="bg-turmeric text-soil font-semibold px-3 py-1 rounded" to="/login">{t('login')}</Link>}
          </div>
        </div>
      </header>
      <Routes>
        <Route path="/" element={<Home />} />
        <Route path="/prices" element={<Prices />} />
        <Route path="/market" element={<Market />} />
        <Route path="/crops" element={<Crops />} />
        <Route path="/info" element={<Info />} />
        <Route path="/login" element={<Auth />} />
        <Route path="/listing/:id" element={<ProductDetail />} />
        <Route path="/dashboard" element={<Guard><Dashboard /></Guard>} />
        <Route path="/chat/:id" element={<Guard><Chat /></Guard>} />
        <Route path="/admin" element={<Guard role="admin"><Admin /></Guard>} />
        <Route path="*" element={<Navigate to="/" replace />} />
      </Routes>
      <footer className="text-center text-sm text-soil/60 py-8">KisanSetu</footer>
    </>
  );
}
