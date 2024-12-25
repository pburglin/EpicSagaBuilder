import { createContext, useContext, useEffect, useState } from 'react';
import { supabase } from '../lib/supabase';
import { useAuth } from './AuthContext';

type Theme = 'light' | 'dark';

interface ThemeContextType {
  theme: Theme;
  toggleTheme: () => void;
}

const ThemeContext = createContext<ThemeContextType>({
  theme: 'light',
  toggleTheme: () => {},
});

export function ThemeProvider({ children }: { children: React.ReactNode }) {
  const { user } = useAuth();
  const [theme, setTheme] = useState<Theme>('light');

  // Load theme preference
  useEffect(() => {
    async function loadThemePreference() {
      if (user) {
        const { data } = await supabase
          .from('users')
          .select('theme_preference')
          .eq('id', user.id)
          .single();
        
        if (data?.theme_preference) {
          setTheme(data.theme_preference as Theme);
        }
      } else {
        // Use system preference for non-authenticated users
        const prefersDark = window.matchMedia('(prefers-color-scheme: dark)').matches;
        setTheme(prefersDark ? 'dark' : 'light');
      }
    }

    loadThemePreference();
  }, [user]);

  // Update HTML class when theme changes
  useEffect(() => {
    document.documentElement.classList.remove('light', 'dark');
    document.documentElement.classList.add(theme);
  }, [theme]);

  async function toggleTheme() {
    const newTheme = theme === 'light' ? 'dark' : 'light';
    setTheme(newTheme);

    if (user) {
      await supabase
        .from('users')
        .update({ theme_preference: newTheme })
        .eq('id', user.id);
    }
  }

  return (
    <ThemeContext.Provider value={{ theme, toggleTheme }}>
      {children}
    </ThemeContext.Provider>
  );
}

export const useTheme = () => useContext(ThemeContext);