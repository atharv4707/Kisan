'use client';
import React, { lazy, Suspense } from 'react';

import {
  Card,
  CardContent,
} from '@/components/ui/card';
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from '@/components/ui/dialog';
import { BrainCircuit, Bug, FlaskConical, BarChart3, Leaf, ThumbsUp, Phone, LoaderCircle } from 'lucide-react';
import { useUser } from './user-provider';

const PestDetectionModal = lazy(() => import('./modals/pest-detection'));
const CropAdvisoryModal = lazy(() => import('./modals/crop-advisory'));
const SoilAdvisoryModal = lazy(() => import('./modals/soil-advisory'));
const MarketPricesModal = lazy(() => import('./modals/market-prices'));
const Feedback = lazy(() => import('./modals/feedback'));
const HelplineModal = lazy(() => import('./modals/helpline'));


type Feature = {
  id: string;
  titleKey: string;
  icon: JSX.Element;
  descriptionKey: string;
  isAi?: boolean;
  modalContent: React.ReactNode;
}

const ModalSuspenseWrapper = ({ children }: { children: React.ReactNode }) => (
    <Suspense fallback={
      <div className="flex justify-center items-center p-8 min-h-[200px]">
          <LoaderCircle className="w-8 h-8 animate-spin text-primary" />
      </div>
    }>
        {children}
    </Suspense>
);


export default function FeatureCards() {
  const { t } = useUser();
  
  const features: Feature[] = [
    {
      id: 'crop-advisory',
      titleKey: 'crop_advisory_title',
      icon: <Leaf className="w-12 h-12 text-primary" />,
      descriptionKey: 'crop_advisory_description',
      isAi: true,
      modalContent: <ModalSuspenseWrapper><CropAdvisoryModal /></ModalSuspenseWrapper>,
    },
    {
      id: 'pest-detection',
      titleKey: 'pest_detection_title',
      icon: <Bug className="w-12 h-12 text-primary" />,
      descriptionKey: 'pest_detection_description',
      isAi: true,
      modalContent: <ModalSuspenseWrapper><PestDetectionModal /></ModalSuspenseWrapper>,
    },
    {
      id: 'soil-guide',
      titleKey: 'soil_guide_title',
      icon: <FlaskConical className="w-12 h-12 text-primary" />,
      descriptionKey: 'soil_guide_description',
      isAi: true,
      modalContent: <ModalSuspenseWrapper><SoilAdvisoryModal /></ModalSuspenseWrapper>,
    },
    {
      id: 'market-prices',
      titleKey: 'market_prices_title',
      icon: <BarChart3 className="w-12 h-12 text-primary" />,
      descriptionKey: 'market_prices_description',
      isAi: true,
      modalContent: <ModalSuspenseWrapper><MarketPricesModal /></ModalSuspenseWrapper>,
    },
    {
      id: 'govt-helpline',
      titleKey: 'helpline_title',
      icon: <Phone className="w-12 h-12 text-primary" />,
      descriptionKey: 'helpline_description',
      modalContent: <ModalSuspenseWrapper><HelplineModal /></ModalSuspenseWrapper>,
    },
     {
      id: 'feedback',
      titleKey: 'feedback_title',
      icon: <ThumbsUp className="w-12 h-12 text-primary" />,
      descriptionKey: 'feedback_description',
      modalContent: <ModalSuspenseWrapper><Feedback /></ModalSuspenseWrapper>,
    },
  ];

  return (
    <div className="grid grid-cols-2 md:grid-cols-3 gap-4 md:gap-6">
      {features.map((feature) => (
        <Dialog key={feature.id}>
          <DialogTrigger asChild>
            <Card className="cursor-pointer hover:shadow-lg hover:-translate-y-1 transition-transform duration-300">
              <CardContent className="p-4 flex flex-col items-center text-center gap-2">
                {feature.isAi && <div className="absolute top-2 right-2 p-1 bg-accent/80 rounded-full"><BrainCircuit className="w-4 h-4 text-accent-foreground" /></div>}
                {feature.icon}
                <h3 className="font-headline text-lg font-bold mt-2">{t(feature.titleKey as any)}</h3>
                <p className="text-xs text-muted-foreground">{t(feature.descriptionKey as any)}</p>
              </CardContent>
            </Card>
          </DialogTrigger>
          <DialogContent className="sm:max-w-lg">
            <DialogHeader>
              <DialogTitle className="flex items-center gap-2">{feature.icon} {t(feature.titleKey as any)}</DialogTitle>
            </DialogHeader>
            {feature.modalContent}
          </DialogContent>
        </Dialog>
      ))}
    </div>
  );
}
