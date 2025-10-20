import { Client } from '@elastic/elasticsearch';
import { config } from '../config';
import logger from '../logger';
import { EmailDocument } from '../types';

class ElasticsearchService {
  private client: Client;

  constructor() {
    this.client = new Client({ node: config.esNode });
  }

  async createIndex() {
    try {
      const exists = await this.client.indices.exists({ index: 'emails' });
      if (!exists) {
        await this.client.indices.create({
          index: 'emails',
          mappings: {
            properties: {
              id: { type: 'keyword' },
              accountId: { type: 'keyword' },
              folder: { type: 'keyword' },
              subject: { type: 'text' },
              body: { type: 'text' },
              from: { type: 'keyword' },
              to: { type: 'keyword' },
              date: { type: 'date' },
              aiCategory: { type: 'keyword' },
              indexedAt: { type: 'date' }
            }
          }
        });
        logger.info('Elasticsearch index created');
      }
    } catch (error: any) {
      logger.error('Error creating index:', error.message);
    }
  }

  async indexEmail(email: EmailDocument) {
    try {
      await this.client.index({
        index: 'emails',
        id: email.id,
        document: email
      });
      logger.info(`Email indexed: ${email.id}`);
    } catch (error: any) {
      logger.error('Error indexing email:', error.message);
    }
  }

  async searchEmails(query: string, accountId?: string, folder?: string, size = 20, days?: number) {
    try {
      const must: any[] = [];
      if (query) {
        must.push({
          multi_match: {
            query,
            fields: ['subject', 'body']
          }
        });
      }

      const filter: any[] = [];
      if (accountId) filter.push({ term: { accountId } });
      if (folder) filter.push({ term: { folder } });
      if (days) {
        const fromDate = new Date(Date.now() - days * 24 * 60 * 60 * 1000).toISOString();
        filter.push({
          range: {
            date: {
              gte: fromDate
            }
          }
        });
      }

      const searchQuery = must.length > 0 ? {
        bool: {
          must,
          filter
        }
      } : {
        bool: {
          filter
        }
      };

      const response = await this.client.search({
        index: 'emails',
        query: searchQuery,
        size
      });

      return response.hits.hits.map(hit => hit._source);
    } catch (error: any) {
      logger.error('Error searching emails:', error.message);
      return [];
    }
  }

  async updateCategory(emailId: string, category: string) {
    try {
      await this.client.update({
        index: 'emails',
        id: emailId,
        doc: { aiCategory: category }
      });
      logger.info(`Category updated for email ${emailId}: ${category}`);
    } catch (error: any) {
      logger.error('Error updating category:', error.message);
    }
  }
}

export default new ElasticsearchService();
