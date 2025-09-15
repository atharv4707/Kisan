'use server';
/**
 * @fileOverview A flow that gets remedies for a given plant disease.
 *
 * - getPlantRemedies - A function that returns remedies.
 * - GetPlantRemediesInput - The input type for the getPlantRemedies function.
 * - GetPlantRemediesOutput - The return type for the getPlantRemedies function.
 */

import {ai} from '@/ai/genkit';
import {z} from 'genkit';

const GetPlantRemediesInputSchema = z.object({
  disease: z.string().describe('The name of the plant disease.'),
  description: z.string().optional().describe('A user-provided description of the issue, which may include field-wide context.'),
  language: z.string().optional().describe('The language the answer should be in.'),
});
export type GetPlantRemediesInput = z.infer<typeof GetPlantRemediesInputSchema>;

const GetPlantRemediesOutputSchema = z.object({
  chemical: z.string().describe('A comma-separated list of chemical remedies, including specific quantities and climate conditions for application. Example: "Remedy one, Remedy two"'),
  organic: z.string().describe('A comma-separated list of organic remedies, including specific quantities and climate conditions for application. Example: "Remedy one, Remedy two"'),
});
export type GetPlantRemediesOutput = z.infer<typeof GetPlantRemediesOutputSchema>;

export async function getPlantRemedies(input: GetPlantRemediesInput): Promise<GetPlantRemediesOutput> {
  return getPlantRemediesFlow(input);
}

const prompt = ai.definePrompt({
  name: 'getPlantRemediesPrompt',
  input: {schema: GetPlantRemediesInputSchema},
  output: {schema: GetPlantRemediesOutputSchema},
  prompt: `You are an expert plant pathologist. For the given disease, provide practical remedies for a farmer.
Assume the issue could be affecting the entire field, not just one plant.

{{#if language}}
IMPORTANT: Your entire response must be in the following language: {{{language}}}.
{{/if}}

Disease: {{{disease}}}
{{#if description}}
Farmer's Description: {{{description}}}
{{/if}}

Your response must include:
1.  **Chemical Remedies**: Provide a comma-separated list of chemical remedies. For each remedy, specify:
    *   The exact quantity or dosage to use (e.g., "Mix 5ml of [Product] per liter of water").
    *   The ideal climate conditions for application (e.g., "Apply in the early morning or late evening to avoid leaf burn").
2.  **Organic Remedies**: Provide a comma-separated list of organic remedies, following the same quantity and climate condition guidelines.

Do NOT use bullet points or any special formatting. Just return comma-separated text.
`,
});

const getPlantRemediesFlow = ai.defineFlow(
  {
    name: 'getPlantRemediesFlow',
    inputSchema: GetPlantRemediesInputSchema,
    outputSchema: GetPlantRemediesOutputSchema,
  },
  async input => {
    try {
        const { output } = await prompt(input);
        if (!output) {
          throw new Error('Failed to generate remedies from AI');
        }
        
        return output;

    } catch (err: any) {
        if (err.message?.includes('503')) {
            throw new Error("The AI service is currently busy. Please try again in a few moments.");
        }
        throw err;
    }
  }
);
