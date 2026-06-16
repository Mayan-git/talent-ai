import {StrictMode} from 'react';
import {createRoot} from 'react-dom/client';
import App from './App.tsx';
import './index.css';
import { setupFetchInterceptor } from './lib/fetchInterceptor.ts';
import { setupWebSocketInterceptor } from './lib/wsInterceptor.ts';

// Enable resilient websocket and fetch failovers
setupWebSocketInterceptor();
setupFetchInterceptor();

createRoot(document.getElementById('root')!).render(
  <StrictMode>
    <App />
  </StrictMode>,
);
