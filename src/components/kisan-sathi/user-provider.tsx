'use client';

import React, { createContext, useState, ReactNode, useContext, useMemo } from 'react';
import type { User, Language } from './types';
import en from '@/locales/en.json';
import hi from '@/locales/hi.json';
import mr from '@/locales/mr.json';
import pa from '@/locales/pa.json';

type Translations = typeof en;
const translations: Record<string, Translations> = {
  'English': en,
  'हिंदी': hi,
  'मराठी': mr,
  'ਪੰਜਾਬੀ': pa,
};

type UserContextType = {
  user: User | null;
  setUser: (user: User | null) => void;
  t: (key: keyof Translations, defaultVal?: string) => string;
  language: Language;
  setLanguage: (language: Language) => void;
};

export const UserContext = createContext<UserContextType | null>(null);

export const useUser = () => {
    const context = useContext(UserContext);
    if (!context) {
        throw new Error('useUser must be used within a UserProvider');
    }
    return context;
}

export const UserProvider = ({ children }: { children: ReactNode }) => {
  const [user, setUser] = useState<User | null>(null);
  const [language, setLanguage] = useState<Language>('English');

  const t = useMemo(() => {
    return (key: keyof Translations, defaultVal?: string): string => {
        const langFile = translations[language] || en;
        return langFile[key] || defaultVal || key;
    }
  }, [language]);
  
  const value = { user, setUser, t, language, setLanguage };

  return (
    <UserContext.Provider value={value}>
      {children}
    </UserContext.Provider>
  );
};
