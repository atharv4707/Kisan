'use server';
/**
 * @fileOverview A flow that answers questions from farmers in their local language.
 *
 * - answerFarmerQuestion - A function that handles answering farmer questions.
 * - AnswerFarmerQuestionInput - The input type for the answerFarmerQuestion function.
 * - AnswerFarmerQuestionOutput - The return type for the answerFarmerQuestion function.
 */

import {ai} from '@/ai/genkit';
import {z} from 'genkit';

const AnswerFarmerQuestionInputSchema = z.object({
  question: z.string().describe('The question asked by the farmer.'),
  language: z.string().optional().describe('The language the answer should be in.'),
});
export type AnswerFarmerQuestionInput = z.infer<typeof AnswerFarmerQuestionInputSchema>;

const AnswerFarmerQuestionOutputSchema = z.object({
  answer: z.string().describe('The answer to the farmer question.'),
  audio: z.string().optional().describe('The audio of the answer to the farmer question.'),
});
export type AnswerFarmerQuestionOutput = z.infer<typeof AnswerFarmerQuestionOutputSchema>;

export async function answerFarmerQuestion(input: AnswerFarmerQuestionInput): Promise<AnswerFarmerQuestionOutput> {
  return answerFarmerQuestionFlow(input);
}

const answerFarmerQuestionPrompt = ai.definePrompt({
  name: 'answerFarmerQuestionPrompt',
  input: {schema: AnswerFarmerQuestionInputSchema},
  prompt: `You are a helpful AI assistant for farmers. Answer the following question to the best of your ability.
{{#if language}}
IMPORTANT: Your entire response must be in the following language: {{{language}}}.
{{/if}}

Question: {{{question}}}`,
});

const answerFarmerQuestionFlow = ai.defineFlow(
  {
    name: 'answerFarmerQuestionFlow',
    inputSchema: AnswerFarmerQuestionInputSchema,
    outputSchema: AnswerFarmerQuestionOutputSchema,
  },
  async input => {
    try {
      const {text} = await answerFarmerQuestionPrompt(input);

      return {
        answer: text,
        audio: undefined, // Remove audio generation to save quota
      };
    } catch (err: any) {
        if (err.message?.includes('503')) {
            throw new Error("The AI service is currently busy. Please try again in a few moments.");
        }
        throw err;
    }
  }
);
