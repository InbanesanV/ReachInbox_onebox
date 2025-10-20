import { ImapFlow } from 'imapflow';
import { simpleParser } from 'mailparser';
import logger from '../logger';
import { ImapAccountConfig, EmailDocument } from '../types';
import { config } from '../config';
import elasticsearchService from './elasticsearchService';
import geminiService from './geminiService';

export class ImapSync {
  private client: ImapFlow;
  private config: ImapAccountConfig;

  constructor(config: ImapAccountConfig) {
    this.config = config;
    this.client = new ImapFlow({
      host: config.host,
      port: config.port,
      secure: config.secure,
      auth: {
        user: config.user,
        pass: config.pass
      }
    });
  }

  async start() {
    await this.client.connect();
    logger.info(`IMAP connected for account ${this.config.accountId}`);

    for (const folder of this.config.folders) {
      await this.client.mailboxOpen(folder);
      await this.initialFetch(folder);
      this.listenNew(folder);
    }

    this.watchdog();
  }

  private async initialFetch(folder: string) {
    const sinceDate = new Date(Date.now() - 30 * 24 * 3600 * 1000);
    const searchQuery = { since: sinceDate };

    const lock = await this.client.getMailboxLock(folder);
    try {
      for await (let msg of this.client.fetch(searchQuery, {
        envelope: true, bodyStructure: true, uid: true
      })) {
        const email = await this.parseEmail(msg, folder);
        if (email) {
          await this.processEmail(email);
        }
      }
    } finally {
      lock.release();
    }
  }

  private listenNew(folder: string) {
    this.client.on('exists', async () => {
      logger.info(`New mails detected in folder ${folder} for ${this.config.accountId}`);
      await this.handleNew(folder);
    });
  }

  private async handleNew(folder: string) {
    const lock = await this.client.getMailboxLock(folder);
    try {
      for await (let msg of this.client.fetch({ seen: false }, {
        envelope: true, bodyStructure: true, uid: true
      })) {
        const email = await this.parseEmail(msg, folder);
        if (email) {
          await this.processEmail(email);
        }
      }
    } finally {
      lock.release();
    }
  }

  private async parseEmail(msg: any, folder: string): Promise<EmailDocument | null> {
    try {
      const { uid } = msg;
      const { content } = await this.client.download(uid);
      const parsed = await simpleParser(content);

      return {
        id: `${this.config.accountId}-${folder}-${uid}`,
        accountId: this.config.accountId,
        folder,
        subject: parsed.subject || '(no subject)',
        body: parsed.text || parsed.html || '',
        from: parsed.from?.text || '',
        to: Array.isArray(parsed.to) ? parsed.to.map((v: any) => v.address) : parsed.to?.value?.map((v: any) => v.address) || [],
        date: parsed.date || new Date(),
        aiCategory: 'Uncategorized',
        indexedAt: new Date()
      };
    } catch (error: any) {
      logger.error('Error parsing email:', error.message);
      return null;
    }
  }

  private async processEmail(email: EmailDocument) {
    await elasticsearchService.indexEmail(email);
    const category = await geminiService.categorizeEmail(email.subject, email.body);
    await elasticsearchService.updateCategory(email.id, category);

    if (category === 'Interested') {
      await this.triggerIntegrations(email);
    }
  }

  private async triggerIntegrations(email: EmailDocument) {
    // Slack notification
    if (config.slackWebhookUrl) {
      try {
        const response = await fetch(config.slackWebhookUrl, {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            text: `New Interested Lead: ${email.subject} from ${email.from}`
          })
        });
        if (response.ok) {
          logger.info('Slack notification sent');
        }
      } catch (error: any) {
        logger.error('Error sending Slack notification:', error.message);
      }
    }

    // Webhook trigger
    if (config.webhookSiteUrl) {
      try {
        await fetch(config.webhookSiteUrl, {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ event: 'InterestedLead', email })
        });
        logger.info('Webhook triggered');
      } catch (error: any) {
        logger.error('Error triggering webhook:', error.message);
      }
    }
  }

  private watchdog() {
    setInterval(async () => {
      if (!this.client.usable) {
        logger.warn(`IMAP connection for ${this.config.accountId} lost. Reconnecting...`);
        await this.client.logout().catch(() => {});
        await this.client.connect();
      }
    }, 1000 * 60 * 25);
  }
}
