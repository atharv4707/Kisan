'use client';
import { useState } from "react";
import { Button } from "@/components/ui/button";
import { ThumbsUp, ThumbsDown, CheckCircle } from "lucide-react";
import { useUser } from "../user-provider";

export default function Feedback() {
    const [submitted, setSubmitted] = useState(false);
    const { t } = useUser();

    const handleSubmit = () => {
        setSubmitted(true);
    };

    if (submitted) {
        return (
            <div className="text-center space-y-4 py-8 text-green-600 animate-in fade-in">
                <CheckCircle className="h-12 w-12 mx-auto" />
                <h3 className="font-semibold text-lg">{t('feedback_thanks_title')}</h3>
                <p className="text-muted-foreground">{t('feedback_thanks_description')}</p>
            </div>
        )
    }

    return (
        <div className="text-center space-y-6 py-4">
            <h3 className="font-semibold text-lg">{t('feedback_prompt')}</h3>
            <div className="flex justify-center gap-6">
                <Button onClick={handleSubmit} variant="outline" size="lg" className="h-20 w-20 flex-col gap-2 border-2 border-green-500 text-green-500 hover:bg-green-100 hover:text-green-600">
                    <ThumbsUp className="h-8 w-8"/>
                    <span>{t('feedback_yes')}</span>
                </Button>
                <Button onClick={handleSubmit} variant="outline" size="lg" className="h-20 w-20 flex-col gap-2 border-2 border-red-500 text-red-500 hover:bg-red-100 hover:text-red-600">
                    <ThumbsDown className="h-8 w-8"/>
                    <span>{t('feedback_no')}</span>
                </Button>
            </div>
            <p className="text-muted-foreground text-sm">{t('feedback_help_us_improve')}</p>
        </div>
    );
};
