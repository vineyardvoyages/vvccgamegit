import React from 'react';
import ReactDOM from 'react-dom/client';
import './index.css'; // Assuming you might have a basic CSS file, if not, it's okay.
import App from './App'; // Import your main App component

const root = ReactDOM.createRoot(document.getElementById('root'));
root.render(
  <React.StrictMode>
    <App />
  </React.StrictMode>
);
