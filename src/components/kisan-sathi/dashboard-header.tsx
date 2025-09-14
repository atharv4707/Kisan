'use client';

import { Alert, AlertDescription, AlertTitle } from "@/components/ui/alert";
import { Bell, Sun, Cloud, CloudRain, AlertTriangle, CloudLightning, CloudSun, Haze, Languages } from "lucide-react";
import type { WeatherForecastOutput } from "@/ai/flows/get-weather-forecast";
import { Card, CardContent } from "../ui/card";
import { useUser } from "./user-provider";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select"
import { SupportedLanguages, type Language } from "./types";
import { cn } from "@/lib/utils";


type DashboardHeaderProps = {
  userName: string;
  // weather: WeatherForecastOutput | null;
  // weatherError: string | null;
};

// const WeatherIcon = ({ icon, className } : {icon: string, className?: string}) => {
//     switch (icon) {
//         case 'Sunny':
//             return <Sun className={cn("text-yellow-500", className)} />;
//         case 'Cloudy':
//             return <Cloud className={cn("text-gray-500", className)} />;
//         case 'Rainy':
//             return <CloudRain className={cn("text-blue-500", className)} />;
//         case 'Stormy':
//             return <CloudLightning className={cn("text-purple-600", className)} />;
//         case 'Partly cloudy':
//             return <CloudSun className={cn("text-yellow-400", className)} />;
//         case 'Mist':
//             return <Haze className={cn("text-gray-400", className)} />;
//         default:
//             return <Cloud className={cn("text-gray-500", className)} />;
//     }
// }

// const getBackgroundColorForWeather = (condition: string) => {
//     if (condition.toLowerCase().includes('sun')) return 'from-blue-200 to-blue-100';
//     if (condition.toLowerCase().includes('rain')) return 'from-gray-300 to-gray-200';
//     if (condition.toLowerCase().includes('storm') || condition.toLowerCase().includes('thunder')) return 'from-indigo-300 to-indigo-200';
//     if (condition.toLowerCase().includes('cloud')) return 'from-gray-200 to-gray-100';
//     return 'from-gray-200 to-gray-100';
// }

// const WeatherDisplay = ({ weather, error }: { weather: WeatherForecastOutput | null, error: string | null}) => {
//     const { t } = useUser();

//     // Do not render anything if there is no weather data or an error.
//     if (!weather && !error) {
//         return null;
//     }
    
//     if (error) {
//         return (
//             <Alert variant="destructive">
//                 <AlertTriangle className="h-4 w-4" />
//                 <AlertTitle>{t('weather_error_title')}</AlertTitle>
//                 <AlertDescription>{error}</AlertDescription>
//             </Alert>
//         )
//     }

//     if (!weather) {
//         return (
//              <Alert className="bg-blue-50 border-blue-200 dark:bg-blue-950 dark:border-blue-800">
//                 <Bell className="h-5 w-5 text-blue-600" />
//                 <AlertTitle className="text-blue-700 dark:text-blue-300 font-bold">{t('loading_weather_title')}</AlertTitle>
//                 <AlertDescription className="text-blue-600 dark:text-blue-400/90">
//                    {t('loading_weather_description')}
//                 </AlertDescription>
//             </Alert>
//         )
//     }
    
//     const today = weather.forecast[0];

//     return (
//         <div className="space-y-3">
//             <Card className={cn("bg-gradient-to-br", getBackgroundColorForWeather(today.condition))}>
//                 <CardContent className="p-4 flex items-center justify-between space-x-4">
//                     <div className="flex items-center space-x-4">
//                         <WeatherIcon icon={today.icon} className="w-12 h-12 drop-shadow-lg" />
//                         <div>
//                             <p className="text-3xl font-bold">{today.temp}</p>
//                             <p className="text-sm text-foreground/80">{today.condition}</p>
//                         </div>
//                     </div>
//                     <p className="text-xs text-foreground/90 text-right flex-1">{weather.summary}</p>
//                 </CardContent>
//             </Card>
//         </div>
//     )

// }

function LanguageSwitcher() {
  const { language, setLanguage, t } = useUser();

  return (
    <Select value={language} onValueChange={(value) => setLanguage(value as Language)}>
      <SelectTrigger className="w-auto border-0 gap-2 text-muted-foreground">
        <Languages className="w-4 h-4" />
        <SelectValue placeholder={t('language_prompt')} />
      </SelectTrigger>
      <SelectContent>
        {SupportedLanguages.map((lang) => (
          <SelectItem key={lang} value={lang}>{lang}</SelectItem>
        ))}
      </SelectContent>
    </Select>
  )
}

export default function DashboardHeader({ userName }: DashboardHeaderProps) {
  const { t } = useUser();
  return (
    <header className="space-y-4">
      <div className="flex justify-between items-center">
        <h1 className="font-headline text-3xl md:text-4l font-bold text-foreground">
          {t('greeting')}, {userName}
        </h1>
        <LanguageSwitcher />
      </div>
      {/* <WeatherDisplay weather={weather} error={weatherError} /> */}
    </header>
  );
}
