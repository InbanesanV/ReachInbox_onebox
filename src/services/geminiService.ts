import { GoogleGenerativeAI } from '@google/generative-ai';
import { config } from '../config';
import logger from '../logger';

class GeminiService {
  private genAI: GoogleGenerativeAI;
  private model: any;

  constructor() {
    this.genAI = new GoogleGenerativeAI(config.geminiApiKey!);
    this.model = this.genAI.getGenerativeModel({ model: 'gemini-1.5-flash' });
  }

  async categorizeEmail(subject: string, body: string): Promise<string> {
    try {
      const systemInstruction = "You are an expert email classifier. Your task is to analyze the provided email text and categorize it into one of the following labels: Interested, Meeting Booked, Not Interested, Spam, or Out of Office.";

      const responseSchema = {
        type: "OBJECT",
        properties: {
          category: {
            type: "STRING",
            enum: ["Interested", "Meeting Booked", "Not Interested", "Spam", "Out of Office"]
          }
        }
      };

      const result = await this.model.generateContent({
        contents: [{ role: 'user', parts: [{ text: `Subject: ${subject}\n\nBody: ${body}` }] }],
        generationConfig: {
          responseMimeType: "application/json",
          responseSchema
        },
        systemInstruction
      });

      const response = JSON.parse(result.response.text());
      return response.category;
    } catch (error: any) {
      logger.error('Error categorizing email:', error.message);
      return 'Uncategorized';
    }
  }

  async generateEmbedding(text: string): Promise<number[]> {
    try {
      const embeddingModel = this.genAI.getGenerativeModel({ model: 'models/embedding-001' });
      const result = await embeddingModel.embedContent(text);
      return result.embedding.values;
    } catch (error: any) {
      logger.error('Error generating embedding:', error.message);
      return [];
    }
  }

  async generateReply(subject: string, body: string, context: string): Promise<string> {
    try {
      const systemInstruction = "You are a helpful assistant that writes professional, relevant email replies. Based ONLY on the context provided and the original email, draft a professional and helpful reply. Be concise.";

      const prompt = `Context: ${context}\n\nOriginal Email Subject: ${subject}\n\nOriginal Email Body: ${body}\n\nPlease provide a professional email reply.`;

      const result = await this.model.generateContent({
        contents: [{ role: 'user', parts: [{ text: prompt }] }],
        systemInstruction,
        generationConfig: {
          temperature: 0.7,
          maxOutputTokens: 500
        }
      });

      const reply = result.response.text();
      if (!reply || reply.trim() === '') {
        throw new Error('Empty response from Gemini');
      }

      return reply.trim();
    } catch (error: any) {
      logger.error('Error generating reply:', error.message);
      return '';
    }
  }
}

export default new GeminiService();
