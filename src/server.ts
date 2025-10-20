import app from './app';
import dotenv from 'dotenv';
import elasticsearchService from './services/elasticsearchService';
import qdrantService from './services/qdrantService';
import { ImapSync } from './services/imapSyncService';
import logger from './logger';

dotenv.config();

const PORT = process.env.PORT || 4000;

async function initServices() {
  try {
    // Initialize Elasticsearch
    await elasticsearchService.createIndex();

    // Initialize Qdrant
    await qdrantService.createCollection('product_data');

    // Store sample product data for RAG
    const productData: { id: string, text: string, vector: number[] }[] = [
      {
        id: '1',
        text: 'I am applying for a job position. If the lead is interested, share the meeting booking link: https://cal.com/example',
        vector: []
      },
      {
        id: '2',
        text: 'Our product helps businesses manage email outreach effectively with AI-powered categorization and real-time synchronization.',
        vector: []
      },
      {
        id: '3',
        text: 'For partnership inquiries, schedule a meeting to discuss opportunities. Use the calendar link: https://cal.com/example',
        vector: []
      }
    ];

    // Generate embeddings for product data
    const geminiService = (await import('./services/geminiService')).default;
    for (const item of productData) {
      const vector = await geminiService.generateEmbedding(item.text);
      item.vector = vector;
    }

    // Store in Qdrant
    await qdrantService.storeProductData('product_data', productData);

    // Initialize IMAP sync (mock config for demo)
    const imapConfig = {
      accountId: 'test@example.com',
      host: 'imap.gmail.com',
      port: 993,
      secure: true,
      user: process.env.IMAP_USER || '',
      pass: process.env.IMAP_PASS || '',
      folders: ['INBOX']
    };

    if (imapConfig.user && imapConfig.pass) {
      const imapSync = new ImapSync(imapConfig);
      await imapSync.start();
    } else {
      logger.warn('IMAP credentials not provided, skipping IMAP sync');
    }

    logger.info('All services initialized with RAG data');
  } catch (error: any) {
    logger.error('Error initializing services:', error.message);
  }
}

initServices();

app.listen(PORT, () => {
  logger.info(`Server running on http://localhost:${PORT}`);
});
