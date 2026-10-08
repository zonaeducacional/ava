import React, { createContext, useContext, useState, useEffect } from 'react';

const FocusModeContext = createContext({
  isFocusMode: false,
  focusData: null,
  enterFocusMode: () => {},
  exitFocusMode: () => {}
});

export function FocusModeProvider({ children }) {
  const [isFocusMode, setIsFocusMode] = useState(false);
  const [focusData, setFocusData] = useState(null);

  const enterFocusMode = (data) => {
    setFocusData(data);
    setIsFocusMode(true);
    window.scrollTo({ top: 0, behavior: 'smooth' });
  };

  const exitFocusMode = () => {
    setIsFocusMode(false);
    setFocusData(null);
  };

  useEffect(() => {
    if (isFocusMode) {
      document.body.classList.add('in-focus-mode');
    } else {
      document.body.classList.remove('in-focus-mode');
    }
    return () => {
      document.body.classList.remove('in-focus-mode');
    };
  }, [isFocusMode]);

  // Tecla ESC para sair do modo de foco rapidamente
  useEffect(() => {
    const handleKeyDown = (e) => {
      if (e.key === 'Escape' && isFocusMode) {
        exitFocusMode();
      }
    };
    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [isFocusMode]);

  return (
    <FocusModeContext.Provider
      value={{
        isFocusMode,
        focusData,
        enterFocusMode,
        exitFocusMode
      }}
    >
      {children}
    </FocusModeContext.Provider>
  );
}

export function useFocusMode() {
  return useContext(FocusModeContext);
}
