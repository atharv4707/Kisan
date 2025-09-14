'use client';
import { useState, useEffect, useRef } from 'react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Alert, AlertDescription, AlertTitle } from '@/components/ui/alert';
import { Progress } from '@/components/ui/progress';
import { Accordion, AccordionContent, AccordionItem, AccordionTrigger } from '@/components/ui/accordion';
import { LoaderCircle, AlertCircle, Upload, Camera, CameraIcon, Play, Pause, StopCircle, Mic, MicOff, Stethoscope } from 'lucide-react';
import { diagnosePlantDisease, type DiagnosePlantDiseaseOutput } from '@/ai/flows/diagnose-plant-disease';
import { getPlantRemedies, type GetPlantRemediesOutput } from '@/ai/flows/get-plant-remedies';
import { useToast } from '@/hooks/use-toast';
import { ScrollArea } from '@/components/ui/scroll-area';
import { useUser } from '../user-provider';
import { LanguageMap } from '../types';
import { Textarea } from '@/components/ui/textarea';

const fileToDataUri = (file: File): Promise<string> => {
  return new Promise((resolve, reject) => {
    const reader = new FileReader();
    reader.onload = () => resolve(reader.result as string);
    reader.onerror = reject;
    reader.readAsDataURL(file);
  });
};

const RemediesList = ({ remedyString }: { remedyString: string }) => {
  if (!remedyString) return null;
  const items = remedyString.split(/[\n-•*]/).map(s => s.trim()).filter(Boolean);
  if (items.length === 0) return <p>{remedyString}</p>;

  return (
    <ul className="list-disc pl-5 space-y-2">
      {items.map((item, index) => (
        <li key={index}>{item}</li>
      ))}
    </ul>
  );
};

export default function PestDetectionModal() {
  const [file, setFile] = useState<File | null>(null);
  const [description, setDescription] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const [isLoadingRemedies, setIsLoadingRemedies] = useState(false);
  const [result, setResult] = useState<DiagnosePlantDiseaseOutput | null>(null);
  const [remedies, setRemedies] = useState<GetPlantRemediesOutput | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [preview, setPreview] = useState<string | null>(null);
  const [showCamera, setShowCamera] = useState(false);
  const [hasCameraPermission, setHasCameraPermission] = useState(false);
  const [isListening, setIsListening] = useState(false);
  const [isPlaying, setIsPlaying] = useState(false);
  const videoRef = useRef<HTMLVideoElement>(null);
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const recognitionRef = useRef<any>(null);
  const { toast } = useToast();
  const { user, t, language } = useUser();

  // Speech Synthesis cleanup
  useEffect(() => {
    return () => {
      window.speechSynthesis.cancel();
    }
  }, []);

  // Speech Recognition setup
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
        setDescription(transcript);
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
  }, [toast, t, language]);

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


  useEffect(() => {
    if (showCamera) {
      const getCameraPermission = async () => {
        try {
          const stream = await navigator.mediaDevices.getUserMedia({ video: { facingMode: { exact: 'environment' } } });
          setHasCameraPermission(true);

          if (videoRef.current) {
            videoRef.current.srcObject = stream;
          }
        } catch (error) {
          console.error('Error accessing rear camera, trying default:', error);
          try {
             const stream = await navigator.mediaDevices.getUserMedia({ video: true });
             setHasCameraPermission(true);
             if (videoRef.current) {
                videoRef.current.srcObject = stream;
             }
          } catch (fallbackError) {
              console.error('Error accessing any camera:', fallbackError);
              setHasCameraPermission(false);
              setShowCamera(false);
              toast({
                variant: 'destructive',
                title: t('camera_access_denied_title'),
                description: t('camera_access_denied_description'),
              });
          }
        }
      };
      getCameraPermission();
    } else {
       if (videoRef.current && videoRef.current.srcObject) {
        (videoRef.current.srcObject as MediaStream).getTracks().forEach(track => track.stop());
      }
    }
  }, [showCamera, toast, t]);
  
  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const selectedFile = e.target.files?.[0];
    if (selectedFile) {
      setShowCamera(false);
      setFile(selectedFile);
      setResult(null);
      setRemedies(null);
      setError(null);
      const objectUrl = URL.createObjectURL(selectedFile);
      setPreview(objectUrl);
      return () => URL.revokeObjectURL(objectUrl);
    }
  };

  const handleSubmit = async (e?: React.FormEvent) => {
    e?.preventDefault();
    if (!file) {
      setError(t('pest_detection_select_image_error'));
      return;
    }

    setIsLoading(true);
    setError(null);
    setResult(null);
    setRemedies(null);

    try {
      const dataUri = await fileToDataUri(file);
      const diagnosis = await diagnosePlantDisease({ 
        photoDataUri: dataUri,
        description: description,
        language: language,
      });
      setResult(diagnosis);
      setShowCamera(false);
    } catch (err: any) {
      console.error(err);
      if (err.message?.includes('429') || err.message?.includes('503')) {
        setError("The AI service is currently busy. Please try again in a few moments.");
      } else {
        setError(t('pest_detection_error_message'));
      }
    } finally {
      setIsLoading(false);
    }
  };

  const handleGetRemedies = async () => {
      if (!result) return;
      setIsLoadingRemedies(true);
      setError(null);
      try {
        const remediesOutput = await getPlantRemedies({
            disease: result.disease,
            description: description,
            language: language,
        });
        setRemedies(remediesOutput);
      } catch (err: any) {
         console.error(err);
        if (err.message?.includes('429') || err.message?.includes('503')) {
            setError("The AI service is currently busy. Please try again in a few moments.");
        } else {
            setError("Failed to get remedies. Please try again.");
        }
      } finally {
        setIsLoadingRemedies(false);
      }
  }

  const handleCapture = () => {
    if (videoRef.current && canvasRef.current) {
      const video = videoRef.current;
      const canvas = canvasRef.current;
      canvas.width = video.videoWidth;
      canvas.height = video.videoHeight;
      const context = canvas.getContext('2d');
      context?.drawImage(video, 0, 0, video.videoWidth, video.videoHeight);
      
      canvas.toBlob((blob) => {
        if (blob) {
          const capturedFile = new File([blob], "capture.jpg", { type: "image/jpeg" });
          setFile(capturedFile);
          setPreview(URL.createObjectURL(capturedFile));
          setShowCamera(false);
        }
      }, 'image/jpeg');
    }
  };
  
  const toggleAudioPlayback = () => {
    if (!result || !remedies) return;
    
    if (isPlaying) {
      window.speechSynthesis.cancel();
      setIsPlaying(false);
    } else {
      const textToSpeak = `
        ${t('diagnosis_result_title')}: ${result.disease}.
        ${t('confidence_label')}: ${result.confidence.toFixed(0)}%.
        ${t('chemical_remedies_title')}: ${remedies.chemical}.
        ${t('organic_remedies_title')}: ${remedies.organic}.
      `;
      const utterance = new SpeechSynthesisUtterance(textToSpeak);
      const langCode = LanguageMap[language];

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
        {!result && (
          <form onSubmit={handleSubmit} className="space-y-4">
            <div className="space-y-2">
                <label className="block text-sm font-medium text-foreground">{t('pest_detection_prompt')}</label>
                <div className="grid grid-cols-2 gap-2">
                  <label htmlFor="crop-photo" className="w-full text-center p-2 rounded-md border cursor-pointer hover:bg-secondary">
                    <Upload className="mx-auto mb-1 h-5 w-5" />
                    {t('upload_from_device_button')}
                    <Input id="crop-photo" type="file" accept="image/*" onChange={handleFileChange} className="sr-only"/>
                  </label>
                  <Button type="button" variant="outline" onClick={() => {setShowCamera(true); setFile(null); setPreview(null); setResult(null);}}>
                    <Camera className="mr-2 h-5 w-5"/> {t('use_camera_button')}
                  </Button>
                </div>
            </div>
            
            {showCamera && (
              <div className="space-y-2">
                <video ref={videoRef} className="w-full aspect-video rounded-md bg-black" autoPlay muted playsInline />
                {!hasCameraPermission && (
                  <Alert variant="destructive">
                        <AlertCircle className="h-4 w-4" />
                        <AlertTitle>{t('camera_access_required_title')}</AlertTitle>
                        <AlertDescription>
                          {t('camera_access_required_description')}
                        </AlertDescription>
                    </Alert>
                )}
                <Button type="button" onClick={handleCapture} disabled={!hasCameraPermission} className="w-full">
                  <CameraIcon className="mr-2" /> {t('capture_photo_button')}
                </Button>
                <canvas ref={canvasRef} className="hidden" />
              </div>
            )}

            {(preview || file) && !showCamera && (
              <div className="space-y-4">
                <p className="text-sm font-medium">{t('image_preview_title')}</p>
                {preview && <img src={preview} alt="Crop preview" className="mt-2 rounded-lg max-h-60 w-auto mx-auto" />}

                <div className="space-y-2">
                   <label htmlFor="description" className="block text-sm font-medium text-foreground">{t('description_label')}</label>
                    <div className="relative">
                      <Textarea
                        id="description"
                        placeholder={isListening ? t('listening_placeholder') : t('pest_detection_description_placeholder')}
                        value={description}
                        onChange={(e) => setDescription(e.target.value)}
                        rows={3}
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
                </div>

                <Button type="submit" disabled={isLoading || !file} className="w-full bg-primary hover:bg-primary/90 text-primary-foreground">
                  {isLoading ? <LoaderCircle className="animate-spin" /> : <><Stethoscope className="mr-2" />{t('diagnose_button')}</>}
                </Button>
              </div>
            )}
          </form>
        )}
        
        {isLoading && (
          <div className="flex justify-center items-center p-8">
            <LoaderCircle className="w-8 h-8 animate-spin text-primary" />
            <p className="ml-2">{t('analyzing_image_message')}</p>
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
            <div className="space-y-4 animate-in fade-in">
              <h3 className="font-bold text-lg">{t('diagnosis_result_title')}</h3>
              {preview && <img src={preview} alt="Crop preview" className="mt-2 rounded-lg max-h-48 w-auto mx-auto" />}
              <div className="p-4 border rounded-lg bg-secondary/50">
                <div className="flex justify-between items-center mb-2">
                  <p className="font-semibold text-xl text-primary">{result.disease}</p>
                   {remedies && <Button variant="outline" size="sm" onClick={toggleAudioPlayback}>
                     {isPlaying ? <StopCircle className="w-4 h-4 mr-2" /> : <Play className="w-4 h-4 mr-2" />}
                     {isPlaying ? t('stop_audio_button') : t('play_audio_diagnosis_button')}
                  </Button>}
                </div>
                <p className="text-sm text-muted-foreground">{t('confidence_label')}</p>
                <div className="flex items-center gap-2">
                    <Progress value={result.confidence} className="w-full" />
                    <span className="font-bold text-primary">{result.confidence.toFixed(0)}%</span>
                </div>
              </div>
              
              {remedies ? (
                   <div className="space-y-2 animate-in fade-in">
                      <h3 className="font-bold text-lg">{t('suggested_remedies_title')}</h3>
                      <Accordion type="multiple" defaultValue={['chemical', 'organic']} className="w-full space-y-2">
                          <AccordionItem value="chemical" className="border rounded-md">
                              <AccordionTrigger className="text-base font-semibold p-3">{t('chemical_remedies_title')}</AccordionTrigger>
                              <AccordionContent className="p-4 pt-0 text-sm">
                                  <RemediesList remedyString={remedies.chemical} />
                              </AccordionContent>
                          </AccordionItem>
                          <AccordionItem value="organic" className="border rounded-md">
                              <AccordionTrigger className="text-base font-semibold p-3">{t('organic_remedies_title')}</AccordionTrigger>
                              <AccordionContent className="p-4 pt-0 text-sm">
                                  <RemediesList remedyString={remedies.organic} />
                              </AccordionContent>
                          </AccordionItem>
                      </Accordion>
                  </div>
              ) : (
                  <Button onClick={handleGetRemedies} disabled={isLoadingRemedies} className="w-full">
                      {isLoadingRemedies ? <LoaderCircle className="animate-spin" /> : t('get_remedies_button')}
                  </Button>
              )}

               <Button onClick={() => {setResult(null); setFile(null); setPreview(null); setDescription(''); setRemedies(null); window.speechSynthesis.cancel();}} className="w-full">
                  {t('diagnose_another_button')}
                </Button>
            </div>
        )}
      </div>
    </ScrollArea>
  );
}
