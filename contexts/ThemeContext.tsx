import React, { createContext, useState, useContext, useEffect, ReactNode } from 'react';

type Theme = 'light' | 'dark';
export type ColorTheme = 'blue' | 'green' | 'red' | 'yellow' | 'orange';
export const THEMES: ColorTheme[] = ['blue', 'green', 'red', 'yellow', 'orange'];

interface ThemeContextType {
  theme: Theme;
  toggleTheme: () => void;
  colorTheme: ColorTheme;
  setColorTheme: (theme: ColorTheme) => void;
}

const ThemeContext = createContext<ThemeContextType | undefined>(undefined);

export const ThemeProvider: React.FC<{ children: ReactNode }> = ({ children }) => {
  const [theme, setTheme] = useState<Theme>(() => {
    // Check for saved theme in localStorage, or system preference, or default to light
    const savedTheme = localStorage.getItem('theme');
    if (savedTheme === 'light' || savedTheme === 'dark') {
      return savedTheme;
    }
    if (window.matchMedia && window.matchMedia('(prefers-color-scheme: dark)').matches) {
      return 'dark';
    }
    return 'light';
  });
  
  const [colorTheme, setColorThemeState] = useState<ColorTheme>(() => {
    const savedColorTheme = localStorage.getItem('colorTheme') as ColorTheme;
    return THEMES.includes(savedColorTheme) ? savedColorTheme : 'blue';
  });

  useEffect(() => {
    const root = window.document.documentElement;
    if (theme === 'dark') {
      root.classList.add('dark');
    } else {
      root.classList.remove('dark');
    }
    localStorage.setItem('theme', theme);
  }, [theme]);

  const setColorTheme = (newColorTheme: ColorTheme) => {
    const root = window.document.documentElement;
    
    // Remove old theme class
    THEMES.forEach(t => root.classList.remove(`theme-${t}`));
    // Add new theme class
    root.classList.add(`theme-${newColorTheme}`);
    
    localStorage.setItem('colorTheme', newColorTheme);
    setColorThemeState(newColorTheme);
  };

  const toggleTheme = () => {
    setTheme(prevTheme => (prevTheme === 'light' ? 'dark' : 'light'));
  };

  return (
    <ThemeContext.Provider value={{ theme, toggleTheme, colorTheme, setColorTheme }}>
      {children}
    </ThemeContext.Provider>
  );
};

export const useTheme = (): ThemeContextType => {
  const context = useContext(ThemeContext);
  if (!context) {
    throw new Error('useTheme must be used within a ThemeProvider');
  }
  return context;
};
