'use client';

import { useState, useEffect, useRef } from 'react';
import { Alert, AlertDescription, AlertTitle } from '@/components/ui/alert';
import { LoaderCircle, AlertCircle, TrendingUp, Play, Pause, DollarSign, PlusCircle } from 'lucide-react';
import { getMarketPrices, type MarketPricesOutput } from '@/ai/flows/get-market-prices';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { useUser } from '../user-provider';
import { Button } from '@/components/ui/button';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Label } from '@/components/ui/label';

type Expense = {
  id: number;
  category: string;
  amount: number;
  date: string;
};

const ExpenseTracker = () => {
    const { t } = useUser();
    const [expenses, setExpenses] = useState<Expense[]>([]);
    const [category, setCategory] = useState('');
    const [amount, setAmount] = useState('');

    const handleAddExpense = (e: React.FormEvent) => {
        e.preventDefault();
        if (!category || !amount) return;

        const newExpense: Expense = {
            id: Date.now(),
            category,
            amount: parseFloat(amount),
            date: new Date().toLocaleDateString('en-IN'),
        };

        setExpenses([newExpense, ...expenses]);
        setCategory('');
        setAmount('');
    };

    const totalExpenses = expenses.reduce((acc, curr) => acc + curr.amount, 0);

    return (
        <div className="space-y-4">
            <Card>
                <CardHeader>
                    <CardTitle className="flex items-center gap-2"><DollarSign /> {t('expense_tracker_title')}</CardTitle>
                </CardHeader>
                <CardContent className="space-y-4">
                    <form onSubmit={handleAddExpense} className="space-y-4">
                        <div className="grid grid-cols-2 gap-4">
                            <div>
                                <Label htmlFor="category">{t('category_label')}</Label>
                                <Select onValueChange={setCategory} value={category}>
                                    <SelectTrigger id="category">
                                        <SelectValue placeholder={t('category_placeholder')} />
                                    </SelectTrigger>
                                    <SelectContent>
                                        <SelectItem value="seeds">{t('seeds_category')}</SelectItem>
                                        <SelectItem value="fertilizer">{t('fertilizer_category')}</SelectItem>
                                        <SelectItem value="pesticide">{t('pesticide_category')}</SelectItem>
                                        <SelectItem value="labor">{t('labor_category')}</SelectItem>
                                        <SelectItem value="other">{t('other_category')}</SelectItem>
                                    </SelectContent>
                                </Select>
                            </div>
                             <div>
                                <Label htmlFor="amount">{t('amount_label')}</Label>
                                <Input 
                                    id="amount" 
                                    type="number" 
                                    value={amount} 
                                    onChange={(e) => setAmount(e.target.value)} 
                                    placeholder="e.g., 500" 
                                />
                            </div>
                        </div>
                        <Button type="submit" className="w-full">
                           <PlusCircle className="mr-2 h-4 w-4" /> {t('add_expense_button')}
                        </Button>
                    </form>

                     {expenses.length > 0 && (
                        <div className="space-y-2">
                             <h4 className="font-semibold">{t('recent_expenses_title')}</h4>
                             <div className="rounded-lg border max-h-48 overflow-y-auto">
                                <Table>
                                    <TableHeader>
                                        <TableRow>
                                            <TableHead>{t('category_label')}</TableHead>
                                            <TableHead>{t('date_label')}</TableHead>
                                            <TableHead className="text-right">{t('amount_label')}</TableHead>
                                        </TableRow>
                                    </TableHeader>
                                    <TableBody>
                                        {expenses.map((expense) => (
                                            <TableRow key={expense.id}>
                                                <TableCell>{t(`${expense.category.toLowerCase()}_category` as any)}</TableCell>
                                                <TableCell>{expense.date}</TableCell>
                                                <TableCell className="text-right font-medium">₹{expense.amount.toLocaleString('en-IN')}</TableCell>
                                            </TableRow>
                                        ))}
                                    </TableBody>
                                </Table>
                            </div>
                            <div className="flex justify-end font-bold pt-2">
                                <span>{t('total_expenses_label')}: ₹{totalExpenses.toLocaleString('en-IN')}</span>
                            </div>
                        </div>
                    )}
                </CardContent>
            </Card>
        </div>
    )
}

const MarketPricesView = () => {
  const [isLoading, setIsLoading] = useState(true);
  const [result, setResult] = useState<MarketPricesOutput | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [isPlaying, setIsPlaying] = useState(false);
  const audioRef = useRef<HTMLAudioElement | null>(null);
  const { user, t } = useUser();

  useEffect(() => {
    const fetchPrices = async () => {
      // Use a default location if user context is not available
      const location = user?.village || 'Rampur'; 
      const crop = user?.crop;

      setIsLoading(true);
      setError(null);
      
      try {
        const prices = await getMarketPrices({ location, crop, language: user?.language });
        setResult(prices);
      } catch (err) {
        console.error(err);
        setError(t('market_prices_error_message'));
      } finally {
        setIsLoading(false);
      }
    };
    fetchPrices();
    
    return () => {
       if (audioRef.current) {
        audioRef.current.pause();
        audioRef.current = null;
      }
    }
  }, [user, t]);
  
   const toggleAudioPlayback = () => {
    if (!result?.audio) return;

    if (audioRef.current && !audioRef.current.paused) {
      audioRef.current.pause();
      setIsPlaying(false);
    } else {
      if (audioRef.current && audioRef.current.paused) {
        audioRef.current.play();
      } else {
        audioRef.current = new Audio(result.audio);
        audioRef.current.play();
        audioRef.current.onended = () => setIsPlaying(false);
      }
      setIsPlaying(true);
    }
  };
  
  if (isLoading) {
    return (
      <div className="flex justify-center items-center p-8 space-x-2">
        <LoaderCircle className="w-8 h-8 animate-spin text-primary" />
        <p>{t('fetching_market_prices_message')}</p>
      </div>
    );
  }

  if (error) {
    return (
      <Alert variant="destructive">
        <AlertCircle className="h-4 w-4" />
        <AlertTitle>{t('error_title')}</AlertTitle>
        <AlertDescription>{error}</AlertDescription>
      </Alert>
    );
  }
  
  if (!result || result.prices.length === 0) {
     return (
      <Alert>
        <AlertCircle className="h-4 w-4" />
        <AlertTitle>{t('no_data_title')}</AlertTitle>
        <AlertDescription>{t('no_market_data_description')}</AlertDescription>
      </Alert>
    );
  }

  return (
    <div className="space-y-4 animate-in fade-in">
        <Alert className="bg-green-50 border-green-200 dark:bg-green-950 dark:border-green-800">
          <div className="flex justify-between items-start">
            <div className="flex items-start">
              <TrendingUp className="h-5 w-5 text-green-600 mr-2" />
              <div>
                <AlertTitle className="text-green-700 dark:text-green-300 font-bold">{t('market_summary_title')}</AlertTitle>
                <AlertDescription className="text-green-600 dark:text-green-400/90">
                    {result.summary}
                </AlertDescription>
              </div>
            </div>
            {result.audio && (
             <Button variant="outline" size="sm" onClick={toggleAudioPlayback} disabled={!result.audio}>
                {isPlaying ? <Pause className="w-4 h-4 mr-2" /> : <Play className="w-4 h-4 mr-2" />}
                {isPlaying ? t('pause_audio_button') : t('play_audio_button')}
            </Button>
            )}
          </div>
        </Alert>

        <div className="rounded-lg border">
            <Table>
                <TableHeader>
                    <TableRow>
                        <TableHead>{t('crop_table_header')}</TableHead>
                        <TableHead>{t('market_table_header')}</TableHead>
                        <TableHead className="text-right">{t('price_table_header')}</TableHead>
                    </TableRow>
                </TableHeader>
                <TableBody>
                    {result.prices.map((p, index) => (
                         // @ts-ignore - isBest is a custom property I added in the flow
                        <TableRow key={index} className={p.isBest ? 'bg-primary/10' : ''}>
                            <TableCell className="font-medium">{p.crop}</TableCell>
                            <TableCell>{p.market}</TableCell>
                             {/* @ts-ignore */}
                            <TableCell className={`text-right font-bold ${p.isBest ? 'text-primary' : ''}`}>
                                ₹{p.price.toLocaleString('en-IN')}
                            </TableCell>
                        </TableRow>
                    ))}
                </TableBody>
            </Table>
        </div>
    </div>
  );
};


export default function MarketPricesModal() {
    const { t } = useUser();
    return (
        <Tabs defaultValue="prices" className="w-full">
            <TabsList className="grid w-full grid-cols-2">
                <TabsTrigger value="prices">{t('market_prices_title')}</TabsTrigger>
                <TabsTrigger value="expenses">{t('expense_tracker_title')}</TabsTrigger>
            </TabsList>
            <TabsContent value="prices">
                <MarketPricesView />
            </TabsContent>
            <TabsContent value="expenses">
                <ExpenseTracker />
            </TabsContent>
        </Tabs>
    )
}
