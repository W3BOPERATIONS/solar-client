import React from 'react';
import ReactDOM from 'react-dom/client';
import App from './App.jsx';
import Maintenance from './pages/Maintenance.jsx';
import { Toaster } from 'react-hot-toast';
import './index.css';

/**
 * -------------------------------------------------------------
 * ⚙️ CRM MAINTENANCE TOGGLE VIA .ENV
 * -------------------------------------------------------------
 * This value is read directly from your environment:
 * VITE_MAINTENANCE_MODE=true  --> Shows Maintenance screen
 * VITE_MAINTENANCE_MODE=false --> Runs standard CRM application
 * -------------------------------------------------------------
 */
const IS_MAINTENANCE_MODE = import.meta.env.VITE_MAINTENANCE_MODE === 'true';

ReactDOM.createRoot(document.getElementById('root')).render(
  <React.StrictMode>
    <Toaster position="top-right" />
    {IS_MAINTENANCE_MODE ? <Maintenance /> : <App />}
  </React.StrictMode>
);
