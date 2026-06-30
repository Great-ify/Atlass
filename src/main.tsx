import {StrictMode} from 'react';
import {createRoot} from 'react-dom/client';
import App from './App.tsx';
import { PrivyProvider } from './lib/privy.tsx';
import './index.css';

createRoot(document.getElementById('root')!).render(
  <StrictMode>
    <PrivyProvider>
      <App />
    </PrivyProvider>
  </StrictMode>,
);
