export type User = {
  name: string;
  language?: string;
  village?: string;
  crop?: string;
};

export type AppState = 'splash' | 'onboarding' | 'dashboard';

export type Language = 'English' | 'हिंदी' | 'मराठी' | 'ਪੰਜਾਬੀ';

export const SupportedLanguages: Language[] = ['English', 'हिंदी', 'मराठी', 'ਪੰਜਾਬੀ'];

export const LanguageMap: Record<Language, string> = {
    'English': 'en-IN',
    'हिंदी': 'hi-IN',
    'मराठी': 'mr-IN',
    'ਪੰਜਾਬੀ': 'pa-IN',
};
