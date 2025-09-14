'use client';

import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import Feedback from "./feedback";


export const MarketPricesContent = () => {
    const prices = [
        { crop: 'Wheat', market: 'Rampur Mandi', price: '₹2,350', isBest: true },
        { crop: 'Wheat', market: 'Sita Pur Mandi', price: '₹2,310', isBest: false },
        { crop: 'Wheat', market: 'Aligarh Mandi', price: '₹2,290', isBest: false },
        { crop: 'Rice', market: 'Rampur Mandi', price: '₹3,400', isBest: false },
        { crop: 'Rice', market: 'Sita Pur Mandi', price: '₹3,550', isBest: true },
    ];
    return (
        <div className="space-y-4">
            <p className="text-muted-foreground">Real-time prices per quintal for your selected crops in nearby markets.</p>
            <Card>
                <Table>
                    <TableHeader>
                        <TableRow>
                            <TableHead>Crop</TableHead>
                            <TableHead>Market</TableHead>
                            <TableHead className="text-right">Price</TableHead>
                        </TableRow>
                    </TableHeader>
                    <TableBody>
                        {prices.map(p => (
                            <TableRow key={`${p.market}-${p.crop}`} className={p.isBest ? 'bg-primary/10' : ''}>
                                <TableCell className="font-medium">{p.crop}</TableCell>
                                <TableCell>{p.market}</TableCell>
                                <TableCell className={`text-right font-bold ${p.isBest ? 'text-primary' : ''}`}>{p.price}</TableCell>
                            </TableRow>
                        ))}
                    </TableBody>
                </Table>
            </Card>
        </div>
    );
};

export const FeedbackContent = () => (
    <Feedback />
);
