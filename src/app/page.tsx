'use client';

import { useState } from 'react';
import type { AppState, User } from '@/components/kisan-sathi/types';
import SplashScreen from '@/components/kisan-sathi/splash-screen';
import Onboarding from '@/components/kisan-sathi/onboarding';
import Dashboard from '@/components/kisan-sathi/dashboard';
import { UserProvider, useUser } from '@/components/kisan-sathi/user-provider';

function AppContent() {
  const [appState, setAppState] = useState<AppState>('splash');
  const { setUser } = useUser();

  const handleOnboardingFinish = (user: User) => {
    setUser(user);
    setAppState('dashboard');
  };

  const renderState = () => {
    switch (appState) {
      case 'splash':
        return <SplashScreen onFinished={() => setAppState('onboarding')} />;
      case 'onboarding':
        return <Onboarding onFinished={handleOnboardingFinish} />;
      case 'dashboard':
        return <Dashboard />;
      default:
        return <SplashScreen onFinished={() => setAppState('onboarding')} />;
    }
  };
  
  return (
    <main className="min-h-screen bg-background text-foreground">
      {renderState()}
    </main>
  );
}


export default function Home() {
  return (
    <UserProvider>
      <AppContent />
    </UserProvider>
  );
}
