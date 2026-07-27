import {StrictMode} from 'react';
import {createRoot} from 'react-dom/client';
import App from './App.tsx';
import { ErrorBoundary } from './shared/components/ErrorBoundary.tsx';
import './index.css';

console.log('🚀 [Pulse] Main.tsx starting...');

const rootElement = document.getElementById('root');
console.log('🚀 [Pulse] Root element found:', !!rootElement);

if (rootElement) {
  createRoot(rootElement).render(
    <StrictMode>
      <ErrorBoundary>
        <App />
      </ErrorBoundary>
    </StrictMode>,
  );
  console.log('🚀 [Pulse] App rendered to DOM');
} else {
  console.error('🚀 [Pulse] Root element #root not found!');
}

