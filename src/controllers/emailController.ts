import { Request, Response } from 'express';
import elasticsearchService from '../services/elasticsearchService';
import geminiService from '../services/geminiService';
import qdrantService from '../services/qdrantService';
import logger from '../logger';

export const searchEmails = async (req: Request, res: Response) => {
  try {
    const { q, accountId, folder, size = 20, days } = req.query;
    const results = await elasticsearchService.searchEmails(
      q as string,
      accountId as string,
      folder as string,
      parseInt(size as string),
      days ? parseInt(days as string) : undefined
    );
    // Ensure we always return an array
    const emails = Array.isArray(results) ? results : [];
    logger.info(`Search returned ${emails.length} emails for query: ${q}, account: ${accountId}, folder: ${folder}`);

    // For demo purposes, return some mock emails if no real emails found
    if (emails.length === 0) {
      const now = new Date();
      const mockEmails = [];

      // Generate 30 mock emails with dates spread over the last 30 days
      for (let i = 1; i <= 30; i++) {
        const daysAgo = Math.floor(Math.random() * 30); // Random days within last 30 days
        const emailDate = new Date(now.getTime() - daysAgo * 24 * 60 * 60 * 1000);

        const emailTemplates = [
          {
            subject: `Project Update #${i}`,
            body: `Here's the latest update on project ${i}. We're making good progress and should be completed soon.`,
            from: `team${i}@company.com`,
            category: 'Interested'
          },
          {
            subject: `Meeting Request - ${new Date().toLocaleDateString()}`,
            body: `Hi, I would like to schedule a meeting to discuss our partnership opportunities for project ${i}.`,
            from: `prospect${i}@business.com`,
            category: 'Meeting Booked'
          },
          {
            subject: `Out of Office Notice`,
            body: `I am currently out of office and will return next week. For urgent matters, please contact my colleague.`,
            from: `colleague${i}@company.com`,
            category: 'Out of Office'
          },
          {
            subject: `Welcome to Our Platform`,
            body: `Thank you for joining our platform. We help you manage your email outreach effectively.`,
            from: `support@reachinbox.com`,
            category: 'Interested'
          },
          {
            subject: `Invoice #${1000 + i}`,
            body: `Please find attached invoice #${1000 + i} for services rendered. Payment is due within 30 days.`,
            from: `billing@company.com`,
            category: 'Not Interested'
          },
          {
            subject: `Follow-up on Previous Conversation`,
            body: `Following up on our previous discussion about project ${i}. Have you had a chance to review the proposal?`,
            from: `sales${i}@vendor.com`,
            category: 'Interested'
          },
          {
            subject: `Newsletter - Week ${i}`,
            body: `Here's our weekly newsletter with the latest updates and industry insights.`,
            from: `newsletter@industry.com`,
            category: 'Not Interested'
          },
          {
            subject: `Job Application Response`,
            body: `Thank you for your application. We have received your resume and will be in touch soon.`,
            from: `hr@company.com`,
            category: 'Interested'
          },
          {
            subject: `System Maintenance Notice`,
            body: `Scheduled maintenance will occur this weekend. Services may be temporarily unavailable.`,
            from: `admin@system.com`,
            category: 'Not Interested'
          },
          {
            subject: `Product Demo Request`,
            body: `I'm interested in learning more about your product. Could we schedule a demo?`,
            from: `potential${i}@client.com`,
            category: 'Meeting Booked'
          }
        ];

        const template = emailTemplates[i % emailTemplates.length];
        const accountId = i % 2 === 0 ? 'test@example.com' : 'cd860403-f955-466e-bfe1-accb685e571d@emailhook.site';

        mockEmails.push({
          id: i.toString(),
          accountId,
          folder: 'INBOX',
          subject: template.subject,
          body: template.body,
          from: template.from,
          to: [accountId],
          date: emailDate.toISOString(),
          aiCategory: template.category,
          indexedAt: emailDate.toISOString()
        });
      }

      // Filter mock emails based on query
      let filteredEmails = mockEmails;
      if (q && typeof q === 'string') {
        const queryLower = q.toLowerCase();
        filteredEmails = mockEmails.filter(email =>
          email.subject.toLowerCase().includes(queryLower) ||
          email.body.toLowerCase().includes(queryLower) ||
          email.from.toLowerCase().includes(queryLower)
        );
      }
      if (accountId) {
        filteredEmails = filteredEmails.filter(email => email.accountId === accountId);
      }
      if (folder) {
        filteredEmails = filteredEmails.filter(email => email.folder === folder);
      }
      if (days) {
        const daysAgo = parseInt(days as string);
        const cutoffDate = new Date(Date.now() - daysAgo * 24 * 60 * 60 * 1000);
        filteredEmails = filteredEmails.filter(email => new Date(email.date) >= cutoffDate);
      }

      logger.info(`Returning ${filteredEmails.length} mock emails for demo (query: ${q}, account: ${accountId}, folder: ${folder})`);
      return res.json(filteredEmails);
    }

    res.json(emails);
  } catch (error: any) {
    logger.error('Error searching emails:', error.message);
    // Return empty array for graceful degradation
    res.json([]);
  }
};

export const getAccounts = async (req: Request, res: Response) => {
  // Mock accounts for demo - in real app, fetch from DB
  res.json([
    { id: 'test@example.com', name: 'Test Account' },
    { id: 'cd860403-f955-466e-bfe1-accb685e571d@emailhook.site', name: 'EmailHook Account' }
  ]);
};

export const suggestReply = async (req: Request, res: Response) => {
  try {
    const { id } = req.params;

    // First, get the email details (in real app, fetch from Elasticsearch)
    const now = new Date();
    const mockEmails = [];

    // Generate the same 30 mock emails as in searchEmails for consistency
    for (let i = 1; i <= 30; i++) {
      const daysAgo = Math.floor(Math.random() * 30); // Random days within last 30 days
      const emailDate = new Date(now.getTime() - daysAgo * 24 * 60 * 60 * 1000);

      const emailTemplates = [
        {
          subject: `Project Update #${i}`,
          body: `Here's the latest update on project ${i}. We're making good progress and should be completed soon.`,
          from: `team${i}@company.com`
        },
        {
          subject: `Meeting Request - ${new Date().toLocaleDateString()}`,
          body: `Hi, I would like to schedule a meeting to discuss our partnership opportunities for project ${i}.`,
          from: `prospect${i}@business.com`
        },
        {
          subject: `Out of Office Notice`,
          body: `I am currently out of office and will return next week. For urgent matters, please contact my colleague.`,
          from: `colleague${i}@company.com`
        },
        {
          subject: `Welcome to Our Platform`,
          body: `Thank you for joining our platform. We help you manage your email outreach effectively.`,
          from: `support@reachinbox.com`
        },
        {
          subject: `Invoice #${1000 + i}`,
          body: `Please find attached invoice #${1000 + i} for services rendered. Payment is due within 30 days.`,
          from: `billing@company.com`
        },
        {
          subject: `Follow-up on Previous Conversation`,
          body: `Following up on our previous discussion about project ${i}. Have you had a chance to review the proposal?`,
          from: `sales${i}@vendor.com`
        },
        {
          subject: `Newsletter - Week ${i}`,
          body: `Here's our weekly newsletter with the latest updates and industry insights.`,
          from: `newsletter@industry.com`
        },
        {
          subject: `Job Application Response`,
          body: `Thank you for your application. We have received your resume and will be in touch soon.`,
          from: `hr@company.com`
        },
        {
          subject: `System Maintenance Notice`,
          body: `Scheduled maintenance will occur this weekend. Services may be temporarily unavailable.`,
          from: `admin@system.com`
        },
        {
          subject: `Product Demo Request`,
          body: `I'm interested in learning more about your product. Could we schedule a demo?`,
          from: `potential${i}@client.com`
        }
      ];

      const template = emailTemplates[i % emailTemplates.length];

      mockEmails.push({
        id: i.toString(),
        subject: template.subject,
        body: template.body,
        from: template.from
      });
    }

    const email = mockEmails.find(e => e.id === id);
    if (!email) {
      return res.status(404).json({ error: 'Email not found' });
    }

    // Step 1: Try to generate AI reply directly first
    const context = 'I am applying for a job position. If the lead is interested, share the meeting booking link: https://cal.com/example';
    const reply = await geminiService.generateReply(email.subject, email.body, context);

    if (reply && reply.trim() !== '') {
      logger.info(`Generated AI reply for email ${id} using Gemini`);
      return res.json({ reply: reply.trim() });
    }

    // Fallback: Try with embedding and Qdrant search
    const emailText = `${email.subject} ${email.body}`;
    const queryVector = await geminiService.generateEmbedding(emailText);

    if (queryVector.length > 0) {
      // Step 2: Search for relevant context in Qdrant
      const relevantContexts = await qdrantService.searchSimilar('product_data', queryVector, 3);

      // Step 3: Try again with Qdrant context
      const enhancedContext = relevantContexts.join(' ') || context;
      const ragReply = await geminiService.generateReply(email.subject, email.body, enhancedContext);

      if (ragReply && ragReply.trim() !== '') {
        logger.info(`Generated AI reply for email ${id} using RAG`);
        return res.json({ reply: ragReply.trim() });
      }
    }

    // Final fallback to template responses
    let fallbackReply = 'Thank you for your email. I will get back to you soon.';
    if (email.subject.toLowerCase().includes('welcome') || email.subject.toLowerCase().includes('platform')) {
      fallbackReply = 'Thank you for the welcome message! I\'m excited to start using ReachInbox for my email outreach.';
    } else if (email.subject.toLowerCase().includes('meeting') || email.body.toLowerCase().includes('meeting')) {
      fallbackReply = 'I\'d be happy to schedule a meeting. Please let me know your availability next week. You can book a slot here: https://cal.com/example';
    } else if (email.subject.toLowerCase().includes('office') || email.body.toLowerCase().includes('office')) {
      fallbackReply = 'Thanks for letting me know you\'re out of office. I\'ll follow up when you return.';
    } else if (email.subject.toLowerCase().includes('invoice') || email.body.toLowerCase().includes('invoice')) {
      fallbackReply = 'Thank you for the invoice. I will review it and process payment within the due date.';
    } else if (email.subject.toLowerCase().includes('follow') || email.body.toLowerCase().includes('follow')) {
      fallbackReply = 'Thank you for following up. I\'ve reviewed the proposal and will get back to you with my feedback soon.';
    } else if (email.subject.toLowerCase().includes('demo') || email.body.toLowerCase().includes('demo')) {
      fallbackReply = 'Thank you for your interest in our product. I\'d be happy to schedule a demo. Please let me know your availability.';
    }

    logger.info(`Using template fallback reply for email ${id}`);
    res.json({ reply: fallbackReply });
  } catch (error: any) {
    logger.error('Error generating reply:', error.message);
    // Fallback to simple reply
    res.json({ reply: 'Thank you for your email. I will get back to you soon.' });
  }
};
