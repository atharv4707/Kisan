'use client';

import { Card, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { PhoneOutgoing } from "lucide-react";
import { useUser } from "../user-provider";

type Helpline = {
    name: string;
    number: string;
    number_display: string;
}

const helplines: Helpline[] = [
    { name: "Kisan Call Centre", number: "18001801551", number_display: "1800-180-1551" },
    { name: "PM-KISAN Helpdesk", number: "155261", number_display: "155261 / 011-24300606" },
    { name: "Fertilizer Helpline", number: "1800115515", number_display: "1800-11-5515" },
    { name: "National Seeds Corporation", number: "1800110088", number_display: "1800-11-0088" },
];

export default function HelplineModal() {
    const { t } = useUser();

    return (
        <div className="space-y-4">
            <p className="text-muted-foreground">{t('helpline_modal_description')}</p>
            <div className="space-y-3">
                {helplines.map((helpline) => (
                    <Card key={helpline.name}>
                        <CardContent className="p-4 flex items-center justify-between">
                            <div>
                                <p className="font-bold">{helpline.name}</p>
                                <p className="text-muted-foreground">{helpline.number_display}</p>
                            </div>
                            <Button asChild variant="outline">
                                <a href={`tel:${helpline.number}`}>
                                    <PhoneOutgoing className="mr-2 h-4 w-4" />
                                    {t('call_button')}
                                </a>
                            </Button>
                        </CardContent>
                    </Card>
                ))}
            </div>
        </div>
    );
}
