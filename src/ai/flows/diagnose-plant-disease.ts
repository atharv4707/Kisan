'use server';
/**
 * @fileOverview A plant disease diagnosis AI agent.
 *
 * - diagnosePlantDisease - A function that handles the plant disease diagnosis process.
 * - DiagnosePlantDiseaseInput - The input type for the diagnosePlantDisease function.
 * - DiagnosePlantDiseaseOutput - The return type for the diagnosePlantDisease function.
 */

import {ai} from '@/ai/genkit';
import {z} from 'genkit';

const DiagnosePlantDiseaseInputSchema = z.object({
  photoDataUri: z
    .string()
    .describe(
      "A photo of a plant, as a data URI that must include a MIME type and use Base64 encoding. Expected format: 'data:<mimetype>;base64,<encoded_data>'."
    ),
  description: z.string().optional().describe('A user-provided description of the issue, which may include field-wide context.'),
  language: z.string().optional().describe('The language the answer should be in.'),
});
export type DiagnosePlantDiseaseInput = z.infer<typeof DiagnosePlantDiseaseInputSchema>;

const DiagnosePlantDiseaseOutputSchema = z.object({
  disease: z.string().describe('The disease identified in the plant.'),
  confidence: z.number().describe('The confidence percentage of the diagnosis.'),
});
export type DiagnosePlantDiseaseOutput = z.infer<typeof DiagnosePlantDiseaseOutputSchema>;

export async function diagnosePlantDisease(input: DiagnosePlantDiseaseInput): Promise<DiagnosePlantDiseaseOutput | null> {
  return diagnosePlantDiseaseFlow(input);
}

const prompt = ai.definePrompt({
  name: 'diagnosePlantDiseasePrompt',
  input: {schema: DiagnosePlantDiseaseInputSchema},
  output: {schema: DiagnosePlantDiseaseOutputSchema},
  prompt: `You are an expert plant pathologist. Analyze the provided image and description to diagnose plant diseases.
Your advice should be practical for a farmer. Assume the issue could be affecting the entire field, not just one plant.

{{#if language}}
IMPORTANT: Your entire response, including the disease name, must be in the following language: {{{language}}}.
{{/if}}

Analyze the following:
Photo: {{media url=photoDataUri}}
{{#if description}}
Farmer's Description: {{{description}}}
{{/if}}

Your diagnosis must include ONLY:
1.  **Disease Name**: The most likely disease.
2.  **Confidence**: Your confidence percentage in this diagnosis (as a number).

Do NOT provide remedies or any other information.
`,
});

const diagnosePlantDiseaseFlow = ai.defineFlow(
  {
    name: 'diagnosePlantDiseaseFlow',
    inputSchema: DiagnosePlantDiseaseInputSchema,
    outputSchema: z.nullable(DiagnosePlantDiseaseOutputSchema),
  },
  async input => {
    if (!process.env.GEMINI_API_KEY) {
      throw new Error(
        'The GEMINI_API_KEY environment variable is not set in Vercel. Please add it to your project settings to enable AI features.'
      );
    }
    const { output } = await prompt(input);
    return output;
  }
);
