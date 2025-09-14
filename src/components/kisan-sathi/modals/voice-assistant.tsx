'use client';
import { useState, useEffect, useRef } from 'react';
import { Button } from '@/components/ui/button';
import { Mic, Play, LoaderCircle, AlertCircle, MicOff, Send, Pause } from 'lucide-react';
import { answerFarmerQuestion, type AnswerFarmerQuestionOutput } from '@/ai/flows/answer-farmer-question';
import { Alert, AlertDescription, AlertTitle } from '@/components/ui/alert';
import { Card, CardContent } from '@/components/ui/card';
import { useUser } from '../user-provider';
import { useToast } from '@/hooks/use-toast';
import Feedback from './feedback';
import { Textarea } from '@/components/ui/textarea';
import { LanguageMap } from '../types';

export default function VoiceAssistantModal() {
  const { user, t, language } = useUser();
  const [isLoading, setIsLoading] = useState(false);
  const [result, setResult] = useState<AnswerFarmerQuestionOutput | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [isListening, setIsListening] = useState(false);
  const [question, setQuestion] = useState('');
  const recognitionRef = useRef<any>(null);
  const { toast } = useToast();

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
        setQuestion(transcript);
        handleGetAnswer(transcript);
        stopListening();
      };

      recognitionRef.current.onerror = (event: any) => {
        if (event.error === 'no-speech') {
            // Don't show an error, just reset.
        } else {
            console.error('Speech recognition error', event.error);
            toast({
                variant: 'destructive',
                title: t('voice_error_title'),
                description: t('voice_error_description', { error: event.error }),
            });
        }
        stopListening();
        setIsLoading(false);
      };

      recognitionRef.current.onstart = () => {
        setIsListening(true);
        setIsLoading(true);
        setError(null);
        setResult(null);
        setQuestion('');
      };

    }
    return () => {
      if (recognitionRef.current) {
        recognitionRef.current.stop();
      }
    };
  }, [toast, t, language]);

  const startListening = () => {
    if (recognitionRef.current) {
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


  const handleGetAnswer = async (q: string) => {
    if (!q) return;
    setIsLoading(true);
    setError(null);
    setResult(null);

    try {
      const answer = await answerFarmerQuestion({
        question: q,
        language: language,
      });
      setResult(answer);
    } catch (err) {
      console.error(err);
      setError(t('voice_assistant_error_message'));
    } finally {
      setIsLoading(false);
    }
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    handleGetAnswer(question);
  }
  
  return (
    <div className="flex flex-col items-center justify-center space-y-4 p-4 text-center">
      <p className="text-muted-foreground">
        {isLoading ? (isListening ? t('listening_placeholder') : t('generating_advice_message')) : t('voice_assistant_prompt')}
      </p>
      
      <form onSubmit={handleSubmit} className="w-full space-y-2">
        <div className="flex items-center gap-2">
            <Textarea 
                placeholder={t('voice_assistant_placeholder')}
                value={question}
                onChange={(e) => setQuestion(e.target.value)}
                rows={1}
                className="flex-1"
                disabled={isLoading}
            />
            <Button
                type="button"
                size="icon"
                className="w-12 h-12 rounded-full bg-accent text-accent-foreground shadow-lg hover:bg-accent/90 disabled:opacity-50"
                onClick={handleMicClick}
                disabled={isLoading}
            >
                {isListening ? (
                <MicOff className="w-6 h-6" />
                ) : (
                <Mic className="w-6 h-6" />
                )}
            </Button>
            <Button type="submit" size="icon" className="w-12 h-12" disabled={isLoading || !question}>
                {isLoading && !isListening ? <LoaderCircle className="w-6 h-6 animate-spin" /> : <Send className="w-6 h-6"/>}
            </Button>
        </div>
      </form>

       {error && (
        <Alert variant="destructive">
          <AlertCircle className="h-4 w-4" />
          <AlertTitle>{t('error_title')}</AlertTitle>
          <AlertDescription>{error}</AlertDescription>
        </Alert>
      )}

      {result && (
        <div className="w-full space-y-4 animate-in fade-in">
          <Card className="w-full text-left">
            <CardContent className="p-4 space-y-2">
              <p className="font-semibold">{t('answer_label')}:</p>
              <p className="text-muted-foreground">{result.answer}</p>
            </CardContent>
          </Card>
          <Feedback />
        </div>
      )}
    </div>
  );
}
