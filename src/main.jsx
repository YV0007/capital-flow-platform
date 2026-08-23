import React from 'react';
import { createRoot } from 'react-dom/client';
import './theme.css';
import App from './App.jsx';
import { LangProvider } from './lib/i18n.jsx';

// React entry point. Mounts <App /> into #root in index.html.
const rootEl = document.getElementById('root');
createRoot(rootEl).render(
  <LangProvider>
    <App />
  </LangProvider>
);
