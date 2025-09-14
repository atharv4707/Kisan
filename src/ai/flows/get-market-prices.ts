'use server';
/**
 * @fileOverview A flow that provides market prices for crops from a dataset.
 *
 * - getMarketPrices - A function that returns market prices for a given location.
 * - MarketPricesInput - The input type for the getMarketPrices function.
 * - MarketPricesOutput - The return type for the getMarketPrices function.
 */

import { ai } from '@/ai/genkit';
import { z } from 'genkit';
import marketData from '@/data/market-prices.json';

const MarketPricesInputSchema = z.object({
  location: z.string().describe("The user's location (village/town)."),
  crop: z.string().optional().describe("The user's primary crop."),
  language: z.string().optional().describe('The language the answer should be in.'),
});
export type MarketPricesInput = z.infer<typeof MarketPricesInputSchema>;

const PriceItemSchema = z.object({
  crop: z.string(),
  market: z.string(),
  price: z.number(),
  unit: z.string(),
  isBest: z.boolean().optional(),
});

const MarketPricesOutputSchema = z.object({
  prices: z.array(PriceItemSchema),
  summary: z.string().describe("A brief, friendly summary of the market prices."),
  audio: z.string().optional().describe('The audio of the market price summary.'),
});
export type MarketPricesOutput = z.infer<typeof MarketPricesOutputSchema>;

export async function getMarketPrices(input: MarketPricesInput): Promise<MarketPricesOutput> {
  return getMarketPricesFlow(input);
}

// System prompt to analyze the prices and provide a summary
const marketAnalysisPrompt = ai.definePrompt({
    name: 'marketAnalysisPrompt',
    input: { schema: z.object({
        userCrop: z.string().optional(),
        prices: z.array(PriceItemSchema),
        language: z.string().optional(),
    })},
    output: { schema: z.object({ summary: z.string() }) },
    prompt: `You are an agricultural market analyst. Analyze the following crop prices.
If the user has a primary crop ({{userCrop}}), identify the market with the best price for that crop.
Provide a short, one-sentence summary of the findings.

{{#if language}}
IMPORTANT: Your entire response must be in the following language: {{{language}}}.
{{/if}}

Prices:
{{#each prices}}
- {{crop}} in {{market}}: {{price}}
{{/each}}
`
});


const getMarketPricesFlow = ai.defineFlow(
  {
    name: 'getMarketPricesFlow',
    inputSchema: MarketPricesInputSchema,
    outputSchema: MarketPricesOutputSchema,
  },
  async (input) => {
    const { location, crop, language } = input;
    const { marketPrices } = marketData;

    // For this demo, we will find prices for the user's location and some other random markets.
    // In a real app, you would likely use a location API to find the nearest markets.
    
    // Find prices in the user's location
    const pricesInLocation = marketPrices.filter(p => p.location.toLowerCase() === location.toLowerCase());
    
    // Find prices for the user's crop in other locations
    const otherPricesForCrop = crop ? marketPrices.filter(p => p.crop.toLowerCase() === crop.toLowerCase() && p.location.toLowerCase() !== location.toLowerCase()) : [];

    // Get a few other random prices to make the list more interesting
    const otherRandomPrices = marketPrices.filter(p => p.location.toLowerCase() !== location.toLowerCase() && (!crop || p.crop.toLowerCase() !== crop.toLowerCase()) );
    
    let combinedPrices = [
        ...pricesInLocation,
        ...otherPricesForCrop.slice(0, 2), // Take up to 2 other prices for the user's crop
        ...otherRandomPrices.slice(0, 3 - pricesInLocation.length - otherPricesForCrop.slice(0, 2).length) // Fill up to 3-4 total entries
    ].filter((v,i,a)=>a.findIndex(t=>(t.market === v.market && t.crop === v.crop))===i) // Unique
     .slice(0, 5); // Max 5 prices

    if (combinedPrices.length === 0) {
        // Return some default prices if no matches found
        combinedPrices.push(...marketPrices.slice(0, 4));
    }

    // Determine the best price for the user's crop if provided
    let bestPriceMarket = null;
    if (crop) {
        const cropPrices = combinedPrices.filter(p => p.crop.toLowerCase() === crop.toLowerCase());
        if (cropPrices.length > 0) {
            bestPriceMarket = cropPrices.reduce((best, current) => current.price > best.price ? current : best);
        }
    }
    
    const finalPrices = combinedPrices.map(p => ({
      ...p,
      isBest: bestPriceMarket ? (p.crop === bestPriceMarket.crop && p.market === bestPriceMarket.market) : false,
    }));
    
    const { output } = await marketAnalysisPrompt({
      userCrop: crop,
      prices: finalPrices,
      language: language,
    });

    const summary = output?.summary ?? "Could not generate summary.";

    return {
      prices: finalPrices,
      summary: summary,
      audio: undefined, // Remove audio generation to save quota
    };
  }
);
