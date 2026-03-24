import { createContext, createElement, useContext, useState, type ReactNode } from 'react';

export interface MatrixContextState {
  enabled: boolean;
  setEnabled: (enabled: boolean) => void;
  toggle: () => void;
}

const MatrixContext = createContext<MatrixContextState | null>(null);

function getInitialState() {
  if (typeof window === 'undefined' || typeof window.matchMedia !== 'function') {
    return true;
  }

  return !window.matchMedia('(prefers-reduced-motion: reduce)').matches;
}

export function MatrixProvider({ children }: { children: ReactNode }) {
  const [enabled, setEnabled] = useState<boolean>(getInitialState);

  const toggle = () => {
    setEnabled((current) => !current);
  };

  return createElement(MatrixContext, { value: { enabled, setEnabled, toggle } }, children);
}

export function useMatrixToggle(): MatrixContextState {
  const context = useContext(MatrixContext);

  if (!context) {
    throw new Error('useMatrixToggle must be used within MatrixProvider');
  }

  return context;
}
