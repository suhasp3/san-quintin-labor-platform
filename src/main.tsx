import { StrictMode } from 'react'
import { createRoot } from 'react-dom/client'
import './index.css'
import App from './App.tsx'

// Global error handlers to prevent white screens
window.addEventListener('error', (event) => {
  console.error('Global error:', event.error);
  // Don't prevent default - let ErrorBoundary handle it
  // But log it for debugging
});

window.addEventListener('unhandledrejection', (event) => {
  console.error('Unhandled promise rejection:', event.reason);
  // Log but don't prevent - let the app handle it
  // This prevents the browser from showing error dialogs
  event.preventDefault();
});

const rootElement = document.getElementById('root');
if (!rootElement) {
  throw new Error('Root element not found');
}

createRoot(rootElement).render(
  <StrictMode>
    <App />
  </StrictMode>,
)
