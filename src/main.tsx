import { StrictMode } from 'react';
import { createRoot } from 'react-dom/client';
import App from './App';
import { LanguageProvider } from './hooks/useLanguage';
import { MatrixProvider } from './hooks/useMatrixToggle';
import './index.css';

createRoot(document.getElementById('root')!).render(
  <StrictMode>
    <LanguageProvider>
      <MatrixProvider>
        <App />
      </MatrixProvider>
    </LanguageProvider>
  </StrictMode>,
);
