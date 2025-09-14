'use server';
/**
 * @fileOverview A flow that provides a weather forecast for a given location.
 *
 * - getWeatherForecast - A function that returns the weather forecast.
 * - WeatherForecastInput - The input type for the getWeatherForecast function.
 * - WeatherForecastOutput - The return type for the getWeatherForecast function.
 */

import {ai} from '@/ai/genkit';
import {z} from 'genkit';

const WeatherForecastInputSchema = z.object({
  location: z.string().describe('The location to get the weather forecast for.'),
});
export type WeatherForecastInput = z.infer<typeof WeatherForecastInputSchema>;

const DailyForecastSchema = z.object({
  day: z.string(),
  temp: z.string(),
  condition: z.string(),
  icon: z.enum(['Sunny', 'Cloudy', 'Rainy', 'Stormy', 'Partly cloudy', 'Mist']),
});

const WeatherForecastOutputSchema = z.object({
  summary: z.string().optional().describe('A brief, friendly summary of the weather for the next few days.'),
  forecast: z.array(DailyForecastSchema).optional(),
  alert: z.string().optional().describe('Any urgent weather alerts.'),
  error: z.string().optional().describe('An error message if the forecast could not be fetched.'),
});
export type WeatherForecastOutput = z.infer<typeof WeatherForecastOutputSchema>;

// A Zod schema for the external WeatherAPI.com response.
const WeatherApiResponseSchema = z.object({
  forecast: z.object({
    forecastday: z.array(z.object({
      date: z.string(),
      day: z.object({
        maxtemp_c: z.number(),
        mintemp_c: z.number(),
        condition: z.object({
          text: z.string(),
          code: z.number(),
        }),
      }),
      astro: z.object({}),
      hour: z.array(z.object({
        time: z.string(),
        temp_c: z.number(),
        condition: z.object({
          text: z.string(),
          code: z.number(),
        }),
        will_it_rain: z.number(),
        chance_of_rain: z.number(),
      })),
    })),
  }),
});


// This prompt will take the raw weather data and generate a summary and alert.
const weatherAnalysisPrompt = ai.definePrompt({
    name: 'weatherAnalysisPrompt',
    input: { schema: z.object({
        location: z.string(),
        weatherDataString: z.string(),
    })},
    output: { schema: z.object({ 
        summary: z.string().describe("A brief, friendly, one-sentence summary of the weather for the next 3 days. Mention the location."),
        alert: z.string().optional().describe("A brief, friendly alert for any urgent weather conditions (e.g., high winds, storms, heavy rain) in the next 3 days. If no alerts, this should be empty."),
     }) },
    prompt: `You are a helpful weather assistant. Analyze the following weather data for the user's location and provide a short, friendly summary and an optional alert.

Location: {{{location}}}

Weather Data (JSON):
{{{weatherDataString}}}

Provide a one-sentence summary of the overall weather for the next 3 days.
Also, identify any single most important weather alert (like storms, heavy rain, or high winds) and provide a brief alert message. If there are no major alerts, do not provide one.`
});

// A mapping from WeatherAPI.com condition codes to our simplified icon types.
const codeToIcon: Record<number, WeatherForecastOutput['forecast'][0]['icon']> = {
    1000: 'Sunny',
    1003: 'Partly cloudy',
    1006: 'Cloudy',
    1009: 'Cloudy', // Overcast
    1030: 'Mist',
    1063: 'Rainy', // Patchy rain possible
    1066: 'Rainy', // Patchy snow possible
    1069: 'Rainy', // Patchy sleet possible
    1072: 'Rainy', // Patchy freezing drizzle possible
    1087: 'Stormy', // Thundery outbreaks possible
    1114: 'Rainy', // Blowing snow
    1117: 'Stormy', // Blizzard
    1135: 'Mist', // Fog
    1147: 'Mist', // Freezing fog
    1150: 'Rainy', // Patchy light drizzle
    1153: 'Rainy', // Light drizzle
    1168: 'Rainy', // Freezing drizzle
    1171: 'Rainy', // Heavy freezing drizzle
    1180: 'Rainy', // Patchy light rain
    1183: 'Rainy', // Light rain
    1186: 'Rainy', // Moderate rain at times
    1189: 'Rainy', // Moderate rain
    1192: 'Rainy', // Heavy rain at times
    1195: 'Rainy', // Heavy rain
    1198: 'Rainy', // Light freezing rain
    1201: 'Rainy', // Moderate or heavy freezing rain
    1204: 'Rainy', // Light sleet
    1207: 'Rainy', // Moderate or heavy sleet
    1210: 'Rainy', // Patchy light snow
    1213: 'Rainy', // Light snow
    1216: 'Rainy', // Patchy moderate snow
    1219: 'Rainy', // Moderate snow
    1222: 'Rainy', // Patchy heavy snow
    1225: 'Rainy', // Heavy snow
    1237: 'Rainy', // Ice pellets
    1240: 'Rainy', // Light rain shower
    1243: 'Rainy', // Moderate or heavy rain shower
    1246: 'Rainy', // Torrential rain shower
    1249: 'Rainy', // Light sleet showers
    1252: 'Rainy', // Moderate or heavy sleet showers
    1255: 'Rainy', // Light snow showers
    1258: 'Rainy', // Moderate or heavy snow showers
    1261: 'Rainy', // Light showers of ice pellets
    1264: 'Rainy', // Moderate or heavy showers of ice pellets
    1273: 'Stormy', // Patchy light rain with thunder
    1276: 'Stormy', // Moderate or heavy rain with thunder
    1279: 'Stormy', // Patchy light snow with thunder
    1282: 'Stormy', // Moderate or heavy snow with thunder
};


export async function getWeatherForecast(input: WeatherForecastInput): Promise<WeatherForecastOutput> {
    const apiKey = process.env.WEATHER_API_KEY;
    if (!apiKey) {
        return { error: 'The Weather API key is not configured in the environment. Please add WEATHER_API_KEY to your Vercel project settings.' };
    }

    const url = `https://api.weatherapi.com/v1/forecast.json?key=${apiKey}&q=${encodeURIComponent(input.location)}&days=3`;
    
    let response;
    try {
        response = await fetch(url, { cache: 'no-store' });
    } catch (err: any) {
        console.error('Failed to fetch weather data', err);
        return { error: `Failed to connect to weather service: ${err.message}` };
    }

    if (!response.ok) {
        if (response.status === 401) {
            return { error: 'Weather API key is invalid or unauthorized. Please check the key in your Vercel project settings and redeploy.' };
        }
        return { error: `Failed to fetch weather data. Status: ${response.status} ${response.statusText}` };
    }
    const rawData = await response.json();

    // Validate the response with Zod
    const weatherData = WeatherApiResponseSchema.parse(rawData);

    // Generate the summary and alert using the AI
    const { output } = await weatherAnalysisPrompt({
        location: input.location,
        weatherDataString: JSON.stringify(weatherData),
    });
    
    if (!output) {
        // Return an error in the output object instead of throwing
        return { error: 'Failed to generate weather summary from AI.' };
    }

    const forecast = weatherData.forecast.forecastday.map((day, index) => {
      let dayLabel = 'Today';
      if (index === 1) dayLabel = 'Tomorrow';
      else if (index > 1) {
        dayLabel = new Date(day.date).toLocaleDateString('en-US', { weekday: 'long' });
      }

      return {
        day: dayLabel,
        temp: `${Math.round(day.day.maxtemp_c)}°C`,
        condition: day.day.condition.text,
        icon: codeToIcon[day.day.condition.code] || 'Cloudy',
      };
    });

    return {
        summary: output.summary,
        forecast,
        alert: output.alert,
    };
}
