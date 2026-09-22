import React from 'react';
import ReactDOM from 'react-dom/client';
import App from './App';

const rootEl = document.getElementById('root');
if (!rootEl) {
    console.error('FATAL: Root element not found');
    document.body.innerHTML = '<h1 style="color:red">Root Element Missing</h1>';
} else {
    try {
        console.log('Mounting React App...');
        ReactDOM.createRoot(rootEl).render(
            <React.StrictMode>
                <App />
            </React.StrictMode>
        );
        console.log('React App Mounted');
    } catch (e) {
        console.error('FATAL: React Render Failed', e);
        document.body.innerHTML = `<h1 style="color:red">React Crash: ${e}</h1>`;
    }
}
