'use server';

/**
 * @fileOverview A flow that provides soil and fertilizer advisory information based on a prompt.
 *
 * - getSoilAdvisory - A function that handles the soil advisory process.
 * - SoilAdvisoryInput - The input type for the getSoilAdvisory function.
 * - SoilAdvisoryOutput - The return type for the getSoilAdvisory function.
 */

import {ai} from '@/ai/genkit';
import {z} from 'genkit';

const SoilAdvisoryInputSchema = z.object({
  soilType: z.string().describe('The type of soil (e.g., Alluvial, Black, Red).'),
  crop: z.string().describe('The primary crop being grown.'),
  question: z.string().describe('The specific question or description of the issue from the farmer.'),
  language: z.string().optional().describe('The language the answer should be in.'),
});
export type SoilAdvisoryInput = z.infer<typeof SoilAdvisoryInputSchema>;

const SoilAdvisoryOutputSchema = z.object({
  advice: z.string().describe('The soil and fertilizer advisory information.'),
});
export type SoilAdvisoryOutput = z.infer<typeof SoilAdvisoryOutputSchema>;

export async function getSoilAdvisory(input: SoilAdvisoryInput): Promise<SoilAdvisoryOutput> {
  return soilAdvisoryFlow(input);
}

const prompt = ai.definePrompt({
  name: 'soilAdvisoryPrompt',
  input: {schema: SoilAdvisoryInputSchema},
  output: {schema: z.object({
    advice: z.string().describe('The detailed soil and fertilizer advisory information. Use markdown for formatting with headings and lists.'),
  })},
  prompt: `You are an expert agricultural soil scientist. Please provide soil and fertilizer advisory information based on the following data. Give actionable, clear advice.

{{#if language}}
IMPORTANT: Your entire response must be in the following language: {{{language}}}.
{{/if}}

Soil Type: {{{soilType}}}
Crop: {{{crop}}}
Farmer's Question/Observation: {{{question}}}

Based on this, provide detailed advice. Structure your response with clear headings for each topic (e.g., "### Fertilizer Recommendations"). Use markdown for formatting.
`,
});

const soilAdvisoryFlow = ai.defineFlow(
  {
    name: 'soilAdvisoryFlow',
    inputSchema: SoilAdvisoryInputSchema,
    outputSchema: SoilAdvisoryOutputSchema,
  },
  async input => {
    const {output} = await prompt(input);
    if (!output) {
      throw new Error('Failed to get advisory from AI');
    }

    return {
      advice: output.advice,
    };
  }
);
