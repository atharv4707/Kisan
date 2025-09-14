'use client';

import { useState, useEffect, useRef } from 'react';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { z } from 'zod';
import { Button } from '@/components/ui/button';
import { Alert, AlertDescription, AlertTitle } from '@/components/ui/alert';
import { LoaderCircle, AlertCircle, Mic, MicOff, Play, Pause, StopCircle } from 'lucide-react';
import { getCropAdvisory, type CropAdvisoryOutput } from '@/ai/flows/crop-advisory-from-prompt';
import { Card, CardContent } from '@/components/ui/card';
import { Form, FormControl, FormField, FormItem, FormLabel, FormMessage } from '@/components/ui/form';
import { Input } from '@/components/ui/input';
import { Textarea } from '@/components/ui/textarea';
import { useUser } from '../user-provider';
import { useToast } from '@/hooks/use-toast';
import { LanguageMap } from '../types';
import { ScrollArea } from '@/components/ui/scroll-area';

const formSchema = z.object({
  cropName: z.string().min(2, { message: 'Crop name is required.' }),
  nitrogen: z.coerce.number().min(0, { message: 'Nitrogen level is required.' }),
  phosphorous: z.coerce.number().min(0, { message: 'Phosphorous level is required.' }),
  potassium: z.coerce.number().min(0, { message: 'Potassium level is required.' }),
  ph: z.coerce.number().min(0).max(14, { message: 'pH must be between 0 and 14.' }),
  rainfall: z.coerce.number().min(0, { message: 'Rainfall is required.' }),
  description: z.string().optional(),
});

export default function CropAdvisoryModal() {
  const [isLoading, setIsLoading] = useState(false);
  const [result, setResult] = useState<CropAdvisoryOutput | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [isListening, setIsListening] = useState(false);
  const [isPlaying, setIsPlaying] = useState(false);
  const recognitionRef = useRef<any>(null);
  const { user, t, language } = useUser();
  const { toast } = useToast();

  const form = useForm<z.infer<typeof formSchema>>({
    resolver: zodResolver(formSchema),
    defaultValues: {
      cropName: '',
      nitrogen: 0,
      phosphorous: 0,
      potassium: 0,
      ph: 7.0,
      rainfall: 0,
      description: '',
    },
  });
  
  // Speech Synthesis cleanup
  useEffect(() => {
    return () => {
      window.speechSynthesis.cancel();
    }
  }, []);

  useEffect(() => {
    // @ts-ignore
    const SpeechRecognition = window.SpeechRecognition || window.webkitSpeechRecognition;
    if (SpeechRecognition) {
      recognitionRef.current = new SpeechRecognition();
      recognitionRef.current.continuous = false;
      recognitionRef.current.lang = LanguageMap[language];
      recognitionRef.current.interimResults = false;

      recognitionRef.current.onresult = (event: any) => {
        const transcript = event.results[0][0].transcript;
        form.setValue('description', transcript);
        stopListening();
      };

      recognitionRef.current.onerror = (event: any) => {
        console.error('Speech recognition error', event.error);
        toast({
          variant: 'destructive',
          title: t('voice_error_title'),
          description: t('voice_error_description', { error: event.error }),
        });
        stopListening();
      };
    }
    return () => {
      if (recognitionRef.current) {
        recognitionRef.current.stop();
      }
    };
  }, [toast, t, language, form]);

  const startListening = () => {
    if (recognitionRef.current) {
      setIsListening(true);
      recognitionRef.current.start();
    } else {
      toast({
        variant: 'destructive',
        title: t('voice_not_supported_title'),
        description: t('voice_not_supported_description'),
      });
    }
  };

  const stopListening = () => {
    if (recognitionRef.current) {
      recognitionRef.current.stop();
    }
    setIsListening(false);
  };

  const handleMicClick = () => {
    if (isListening) {
      stopListening();
    } else {
      startListening();
    }
  };

  const onSubmit = async (values: z.infer<typeof formSchema>) => {
    setIsLoading(true);
    setError(null);
    setResult(null);

    try {
      const advisory = await getCropAdvisory({ ...values, language: language });
      setResult(advisory);
    } catch (err) {
      console.error(err);
      setError(t('crop_advisory_error_message'));
    } finally {
      setIsLoading(false);
    }
  };
  
  const toggleAudioPlayback = () => {
    if (!result?.advice) return;

    if (isPlaying) {
      window.speechSynthesis.cancel();
      setIsPlaying(false);
    } else {
      const utterance = new SpeechSynthesisUtterance(result.advice.replace(/###/g, ''));
      const langCode = LanguageMap[language];
      
      // Find a suitable voice
      const voices = window.speechSynthesis.getVoices();
      const voice = voices.find(v => v.lang === langCode) || voices.find(v => v.lang.startsWith(langCode.split('-')[0]));
      if (voice) {
        utterance.voice = voice;
      }
      utterance.lang = langCode;

      utterance.onstart = () => setIsPlaying(true);
      utterance.onend = () => setIsPlaying(false);
      utterance.onerror = () => setIsPlaying(false);
      
      window.speechSynthesis.speak(utterance);
    }
  };


  return (
    <ScrollArea className="max-h-[80vh] pr-4">
      <div className="space-y-4">
        <Form {...form}>
          <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-4">
            <FormField
              control={form.control}
              name="cropName"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>{t('crop_name_label')}</FormLabel>
                  <FormControl>
                    <Input placeholder={t('crop_name_placeholder')} {...field} />
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />
            <div className="grid grid-cols-2 md:grid-cols-3 gap-4">
              <FormField
                control={form.control}
                name="nitrogen"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>{t('nitrogen_label')}</FormLabel>
                    <FormControl>
                      <Input type="number" {...field} />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />
              <FormField
                control={form.control}
                name="phosphorous"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>{t('phosphorous_label')}</FormLabel>
                    <FormControl>
                      <Input type="number" {...field} />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />
              <FormField
                control={form.control}
                name="potassium"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>{t('potassium_label')}</FormLabel>
                    <FormControl>
                      <Input type="number" {...field} />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />
              <FormField
                control={form.control}
                name="ph"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>{t('ph_label')}</FormLabel>
                    <FormControl>
                      <Input type="number" step="0.1" {...field} />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />
              <FormField
                control={form.control}
                name="rainfall"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>{t('rainfall_label')}</FormLabel>
                    <FormControl>
                      <Input type="number" {...field} />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />
            </div>
            <FormField
              control={form.control}
              name="description"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>{t('description_label')}</FormLabel>
                  <FormControl>
                    <div className="relative">
                      <Textarea
                        placeholder={isListening ? t('listening_placeholder') : t('description_placeholder')}
                        {...field}
                      />
                      <Button
                        type="button"
                        variant="ghost"
                        size="icon"
                        onClick={handleMicClick}
                        className={`absolute right-2 top-1/2 -translate-y-1/2 ${isListening ? 'text-red-500' : ''}`}
                      >
                        {isListening ? <MicOff /> : <Mic />}
                      </Button>
                    </div>
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />
            <Button type="submit" disabled={isLoading} className="w-full bg-primary hover:bg-primary/90 text-primary-foreground">
              {isLoading ? <LoaderCircle className="animate-spin" /> : t('get_advice_button')}
            </Button>
          </form>
        </Form>

        {isLoading && (
          <div className="flex justify-center items-center p-8">
            <LoaderCircle className="w-8 h-8 animate-spin text-primary" />
            <p className="ml-2">{t('generating_advice_message')}</p>
          </div>
        )}

        {error && (
          <Alert variant="destructive">
            <AlertCircle className="h-4 w-4" />
            <AlertTitle>{t('error_title')}</AlertTitle>
            <AlertDescription>{error}</AlertDescription>
          </Alert>
        )}

        {result && (
          <div className="space-y-2 animate-in fade-in">
            <div className="flex justify-between items-center">
              <h3 className="font-bold text-lg">{t('ai_powered_advisory_title')}</h3>
               <Button variant="outline" size="sm" onClick={toggleAudioPlayback}>
                  {isPlaying ? <StopCircle className="w-4 h-4 mr-2" /> : <Play className="w-4 h-4 mr-2" />}
                  {isPlaying ? t('stop_audio_button') : t('play_audio_button')}
              </Button>
            </div>
            <Card>
              <CardContent className="p-0">
                 <div className="max-h-[30vh] w-full overflow-y-auto">
                  <div className="p-4 prose prose-sm max-w-none" dangerouslySetInnerHTML={{ __html: result.advice.replace(/### (.*)/g, '<h3>$1</h3>').replace(/\n/g, '<br />') }} />
                </div>
              </CardContent>
            </Card>
          </div>
        )}
      </div>
    </ScrollArea>
  );
}
