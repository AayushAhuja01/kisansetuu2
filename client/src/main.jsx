import React from 'react';
import { createRoot } from 'react-dom/client';
import { Provider } from 'react-redux';
import { BrowserRouter } from 'react-router-dom';
import store from './store.js';
import { LanguageProvider } from './i18n.jsx';
import App from './App.jsx';
import './index.css';

createRoot(document.getElementById('root')).render(
  <Provider store={store}>
    <LanguageProvider>
      <BrowserRouter><App /></BrowserRouter>
    </LanguageProvider>
  </Provider>
);
