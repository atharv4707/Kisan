'use client';

import { useEffect } from 'react';
import GlowingLeafIcon from './glowing-leaf-icon';

type SplashScreenProps = {
  onFinished: () => void;
};

export default function SplashScreen({ onFinished }: SplashScreenProps) {
  useEffect(() => {
    const timer = setTimeout(() => {
      onFinished();
    }, 1000);
    return () => clearTimeout(timer);
  }, [onFinished]);

  return (
    <div className="flex h-screen w-full flex-col items-center justify-center bg-background animate-in fade-in duration-1000">
      <div className="flex flex-col items-center gap-4 text-center">
        <div
          className="animate-pulse"
          style={{
            filter: 'drop-shadow(0 0 1rem hsl(var(--primary) / 0.6))',
          }}
        >
          <GlowingLeafIcon className="w-24 h-24" />
        </div>
        <div>
          <h1 className="font-headline text-5xl font-bold text-primary-foreground tracking-tight">
            Kisan Sathi
          </h1>
          <p className="font-body text-lg text-muted-foreground mt-2">
            Smart Farming. Better Living.
          </p>
        </div>
      </div>
    </div>
  );
}
