import React from 'react';
import { createRoot } from 'react-dom/client';
import App from './App';
import TrisOpsDashboard from './TrisOpsDashboard';
import './index.css';

const dashboardMode = new URLSearchParams(window.location.search).get('dashboard');
const root = createRoot(document.getElementById('root') as HTMLElement);
root.render(dashboardMode === 'operational' ? <TrisOpsDashboard /> : <App />);
