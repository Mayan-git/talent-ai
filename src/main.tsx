import {StrictMode} from 'react';
import {createRoot} from 'react-dom/client';
import App from './App.tsx';
import './index.css';
import { setupFetchInterceptor } from './lib/fetchInterceptor.ts';

// Enable safe client-side proxy fallback for Vercel outputs
setupFetchInterceptor();

createRoot(document.getElementById('root')!).render(
  <StrictMode>
    <App />
  </StrictMode>,
);
