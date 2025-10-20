import { QdrantClient } from '@qdrant/js-client-rest';
import { config } from '../config';
import logger from '../logger';

class QdrantService {
  private client: QdrantClient;

  constructor() {
    this.client = new QdrantClient({ url: config.qdrantUrl });
  }

  async createCollection(collectionName: string) {
    try {
      await this.client.createCollection(collectionName, {
        vectors: {
          size: 768, // Assuming embedding size for Gemini
          distance: 'Cosine'
        }
      });
      logger.info(`Qdrant collection ${collectionName} created`);
    } catch (error: any) {
      if (error.message.includes('already exists')) {
        logger.info(`Collection ${collectionName} already exists`);
      } else {
        logger.error('Error creating collection:', error.message);
      }
    }
  }

  async storeProductData(collectionName: string, data: { id: string, text: string, vector: number[] }[]) {
    try {
      await this.client.upsert(collectionName, {
        wait: true,
        points: data.map(item => ({
          id: item.id,
          vector: item.vector,
          payload: { text: item.text }
        }))
      });
      logger.info(`Stored ${data.length} items in ${collectionName}`);
    } catch (error: any) {
      logger.error('Error storing data:', error.message);
    }
  }

  async searchSimilar(collectionName: string, queryVector: number[], limit = 3) {
    try {
      const result = await this.client.search(collectionName, {
        vector: queryVector,
        limit
      });
      return result.map(hit => hit.payload?.text);
    } catch (error: any) {
      logger.error('Error searching:', error.message);
      return [];
    }
  }
}

export default new QdrantService();
