'use server';

/**
 * @fileOverview A flow that provides crop advisory information based on structured soil and weather data.
 *
 * - getCropAdvisory - A function that handles the crop advisory process.
 * - CropAdvisoryInput - The input type for the getCropAdvisory function.
 * - CropAdvisoryOutput - The return type for the getCropAdvisory function.
 */

import {ai} from '@/ai/genkit';
import {z} from 'genkit';

const CropAdvisoryInputSchema = z.object({
  cropName: z.string().describe('The name of the crop.'),
  nitrogen: z.number().describe('The nitrogen level of the soil in kg/ha.'),
  phosphorous: z.number().describe('The phosphorous level of the soil in kg/ha.'),
  potassium: z.number().describe('The potassium level of the soil in kg/ha.'),
  ph: z.number().describe('The pH level of the soil.'),
  rainfall: z.number().describe('The annual rainfall in the area in mm.'),
  description: z.string().optional().describe('A free-form description of the crop, soil, and conditions.'),
  language: z.string().optional().describe('The language the answer should be in.'),
});
export type CropAdvisoryInput = z.infer<typeof CropAdvisoryInputSchema>;

const CropAdvisoryOutputSchema = z.object({
  advice: z.string().describe('The detailed crop advisory information, formatted for readability.'),
});
export type CropAdvisoryOutput = z.infer<typeof CropAdvisoryOutputSchema>;

export async function getCropAdvisory(input: CropAdvisoryInput): Promise<CropAdvisoryOutput> {
  return cropAdvisoryFlow(input);
}

const prompt = ai.definePrompt({
  name: 'cropAdvisoryPrompt',
  input: {schema: CropAdvisoryInputSchema},
  output: {schema: z.object({
    fertilizerRecommendations: z.string(),
    soilAmendments: z.string(),
    waterManagement: z.string(),
    potentialIssues: z.string(),
  })},
  prompt: `You are an expert agricultural advisor. Provide a crop advisory for a farmer based on the following data.

{{#if language}}
IMPORTANT: Your entire response must be in the following language: {{{language}}}.
{{/if}}

Crop: {{{cropName}}}
Soil Conditions:
- Nitrogen (N): {{{nitrogen}}} kg/ha
- Phosphorous (P): {{{phosphorous}}} kg/ha
- Potassium (K): {{{potassium}}} kg/ha
- pH: {{{ph}}}

Environmental Conditions:
- Annual Rainfall: {{{rainfall}}} mm

{{#if description}}
Additional Farmer's Description:
{{{description}}}
{{/if}}


Based on all this data, provide clear, actionable advice covering:
1.  Fertilizer Recommendations: Suggest specific types and quantities of fertilizers.
2.  Soil Amendments: Recommend actions to balance pH or improve soil structure.
3.  Water Management: Advise on irrigation strategies based on the rainfall.
4.  Potential Issues: Warn about any potential nutrient deficiencies or toxicities based on both the structured data and the farmer's description.

Return ONLY the advice for each section as a string. Do not add any extra formatting.
`,
});

const cropAdvisoryFlow = ai.defineFlow(
  {
    name: 'cropAdvisoryFlow',
    inputSchema: CropAdvisoryInputSchema,
    outputSchema: CropAdvisoryOutputSchema,
  },
  async input => {
    const {output} = await prompt(input);
    
    if (!output) {
        throw new Error('Failed to generate advisory from AI');
    }

    const formattedAdvice = `
### Fertilizer Recommendations
${output.fertilizerRecommendations}

### Soil Amendments
${output.soilAmendments}

### Water Management
${output.waterManagement}

### Potential Issues
${output.potentialIssues}
    `.trim();

    return {
      advice: formattedAdvice,
    };
  }
);
