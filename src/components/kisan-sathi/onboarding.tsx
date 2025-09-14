'use client';

import { useState, useEffect } from 'react';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { Label } from '@/components/ui/label';
import { Languages, Camera, MapPin, Mic, CheckCircle, XCircle, AlertTriangle, User as UserIcon } from 'lucide-react';
import GlowingLeafIcon from './glowing-leaf-icon';
import { Alert, AlertDescription, AlertTitle } from '../ui/alert';
import { Input } from '../ui/input';
import type { User } from './types';
import { ScrollArea } from '../ui/scroll-area';
import { useUser } from './user-provider';


type OnboardingProps = {
  onFinished: (user: User) => void;
};

type PermissionStatus = 'prompt' | 'granted' | 'denied';

export default function Onboarding({ onFinished }: OnboardingProps) {
  const { t, language } = useUser();
  const [name, setName] = useState('');
  const [village, setVillage] = useState('');
  const [cameraStatus, setCameraStatus] = useState<PermissionStatus>('prompt');
  const [locationStatus, setLocationStatus] = useState<PermissionStatus>('prompt');
  const [micStatus, setMicStatus] = useState<PermissionStatus>('prompt');

  useEffect(() => {
    const checkPermissions = async () => {
      try {
        // Check Camera Permission
        const cameraResult = await navigator.permissions.query({ name: 'camera' as PermissionName });
        setCameraStatus(cameraResult.state as PermissionStatus);
        cameraResult.onchange = () => setCameraStatus(cameraResult.state as PermissionStatus);

        // Check Microphone Permission
        const micResult = await navigator.permissions.query({ name: 'microphone' as PermissionName });
        setMicStatus(micResult.state as PermissionStatus);
        micResult.onchange = () => setMicStatus(micResult.state as PermissionStatus);
        
        // Check Geolocation Permission
        const locationResult = await navigator.permissions.query({ name: 'geolocation' as PermissionName });
        setLocationStatus(locationResult.state as PermissionStatus);
        locationResult.onchange = () => setLocationStatus(locationResult.state as PermissionStatus);

      } catch (error) {
        console.error("Permissions API not fully supported or errored:", error);
      }
    };

    checkPermissions();
  }, []);
  
  const handleCameraPermission = async () => {
    try {
      const stream = await navigator.mediaDevices.getUserMedia({ video: true });
      setCameraStatus('granted');
      stream.getTracks().forEach(track => track.stop());
    } catch (error) {
      console.error('Camera permission denied:', error);
      setCameraStatus('denied');
    }
  };

  const handleLocationPermission = () => {
    navigator.geolocation.getCurrentPosition(
      () => {
        setLocationStatus('granted');
      },
      (error) => {
        console.error('Location permission denied:', error);
        setLocationStatus('denied');
      }
    );
  };
  
  const handleMicPermission = async () => {
    try {
      const stream = await navigator.mediaDevices.getUserMedia({ audio: true });
      setMicStatus('granted');
      stream.getTracks().forEach(track => track.stop());
    } catch (error) {
      console.error('Microphone permission denied:', error);
      setMicStatus('denied');
    }
  };

  const allPermissionsGranted = cameraStatus === 'granted' && locationStatus === 'granted' && micStatus === 'granted';

  const PermissionButton = ({ status, onClick, children }: { status: PermissionStatus; onClick: () => void; children: React.ReactNode }) => {
    switch (status) {
      case 'granted':
        return <Button size="sm" variant="outline" disabled className="text-green-500 border-green-500"><CheckCircle className="mr-2" /> {t('allowed')}</Button>;
      case 'denied':
        return <Button size="sm" variant="outline" disabled className="text-red-500 border-red-500"><XCircle className="mr-2" /> {t('denied')}</Button>;
      default:
        return <Button size="sm" variant="outline" onClick={onClick}>{children}</Button>;
    }
  };

  const handleFinish = () => {
    onFinished({ name, village, language });
  }

  return (
    <div className="flex w-full justify-center p-4 animate-in fade-in duration-500">
       <ScrollArea className="h-full w-full max-w-md">
        <div className="w-full">
            <Card className="w-full">
                <CardHeader className="items-center text-center p-6 space-y-4">
                    <GlowingLeafIcon className="w-20 h-20" />
                    <div>
                        <CardTitle className="font-headline text-2xl">{t('welcome_title')}</CardTitle>
                        <CardDescription>{t('welcome_subtitle')}</CardDescription>
                    </div>
                </CardHeader>
                <CardContent className="space-y-6 p-6 pt-2">
                    <div className="space-y-4">
                        <div className="space-y-2">
                            <Label htmlFor="name-signup" className="flex items-center gap-2"><UserIcon /> {t('name_prompt')}</Label>
                            <Input id="name-signup" placeholder={t('name_placeholder')} value={name} onChange={(e) => setName(e.target.value)} />
                        </div>
                         <div className="space-y-2">
                            <Label htmlFor="village-signup" className="flex items-center gap-2"><MapPin /> {t('village_prompt')}</Label>
                            <Input id="village-signup" placeholder={t('village_placeholder')} value={village} onChange={(e) => setVillage(e.target.value)} />
                        </div>
                    </div>
                    
                    <div className="space-y-2">
                    <Label>{t('permissions_title')}</Label>
                    <CardDescription>{t('permissions_subtitle')}</CardDescription>
                    <div className="space-y-2 pt-2">
                        <div className="flex items-center justify-between rounded-lg border p-3">
                        <div className="flex items-center gap-3">
                            <Camera className="w-6 h-6 text-primary" />
                            <div>
                            <h4 className="font-bold text-sm">{t('camera')}</h4>
                            </div>
                        </div>
                        <PermissionButton status={cameraStatus} onClick={handleCameraPermission}>{t('allow')}</PermissionButton>
                        </div>
                        <div className="flex items-center justify-between rounded-lg border p-3">
                        <div className="flex items-center gap-3">
                            <MapPin className="w-6 h-6 text-primary" />
                            <div>
                            <h4 className="font-bold text-sm">{t('location')}</h4>
                            </div>
                        </div>
                        <PermissionButton status={locationStatus} onClick={handleLocationPermission}>{t('allow')}</PermissionButton>
                        </div>
                        <div className="flex items-center justify-between rounded-lg border p-3">
                        <div className="flex items-center gap-3">
                            <Mic className="w-6 h-6 text-primary" />
                            <div>
                            <h4 className="font-bold text-sm">{t('microphone')}</h4>
                            </div>
                        </div>
                        <PermissionButton status={micStatus} onClick={handleMicPermission}>{t('allow')}</PermissionButton>
                        </div>
                    </div>
                    </div>
                    
                    {!allPermissionsGranted && (
                        <Alert variant="destructive">
                            <AlertTriangle className="h-4 w-4" />
                            <AlertTitle>{t('action_required_title')}</AlertTitle>
                            <AlertDescription>
                            {t('action_required_description')}
                            </AlertDescription>
                        </Alert>
                    )}

                    <Button onClick={handleFinish} disabled={!name || !village || !allPermissionsGranted} className="w-full mt-6 bg-accent text-accent-foreground hover:bg-accent/hover">
                        {t('get_started')}
                    </Button>
                </CardContent>
            </Card>
        </div>
      </ScrollArea>
    </div>
  );
}
