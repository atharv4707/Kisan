'use client';

import { useEffect, useState } from 'react';
import DashboardHeader from './dashboard-header';
import FeatureCards from './feature-cards';
import { getWeatherForecast, type WeatherForecastOutput } from '@/ai/flows/get-weather-forecast';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from '@/components/ui/dialog';
import { Bot } from 'lucide-react';
import VoiceAssistantModal from './modals/voice-assistant';
import { Button } from '../ui/button';
import { useUser } from './user-provider';

const VoiceAssistantButton = () => {
    const { t } = useUser();
    return (
    <Dialog>
        <DialogTrigger asChild>
             <Button className="fixed bottom-6 right-6 w-16 h-16 rounded-full bg-accent text-accent-foreground shadow-lg hover:bg-accent/90 flex items-center justify-center animate-in fade-in zoom-in-95 duration-500">
                <Bot className="w-8 h-8" />
            </Button>
        </DialogTrigger>
        <DialogContent className="sm:max-w-[425px]">
            <DialogHeader>
                <DialogTitle className="flex items-center gap-2"><Bot /> {t('voice_assistant_title')}</DialogTitle>
            </DialogHeader>
            <VoiceAssistantModal />
        </DialogContent>
    </Dialog>
)};

export default function Dashboard() {
  const { user, t, setLanguage } = useUser();
  const [weather, setWeather] = useState<WeatherForecastOutput | null>(null);
  const [weatherError, setWeatherError] = useState<string | null>(null);

  useEffect(() => {
    const fetchWeather = async () => {
      if (!user?.village) return;
        try {
          // Temporarily disable weather fetching to avoid API key errors.
          // The underlying issue is that the WEATHER_API_KEY environment variable
          // is not correctly configured in the Vercel project settings.
          setWeather(null);
          setWeatherError(null);
          // console.log("Weather fetching is temporarily disabled.");
          // setWeatherError(null);
          // const forecast = await getWeatherForecast({ location: user.village });
          // setWeather(forecast);
        } catch (err) {
          console.error(err);
          setWeatherError(t('weather_error_message'));
        }
    };
    if (user) {
        // fetchWeather();
    }
  }, [user, t]);

  if (!user) {
    // This can be a loading spinner or some fallback UI
    return <div className="flex h-screen items-center justify-center">{t('loading_user_profile')}</div>;
  }

  return (
    <div className="flex flex-col min-h-screen p-4 md:p-6 space-y-4 animate-in fade-in duration-500 pb-24">
        <div className="flex-grow">
            <DashboardHeader userName={user.name} weather={weather} weatherError={weatherError} />
            <div className="mt-4">
                <FeatureCards />
            </div>
        </div>
        <VoiceAssistantButton />
    </div>
  );
}
