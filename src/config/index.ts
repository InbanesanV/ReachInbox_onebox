export const config = {
  esNode: process.env.ES_NODE || 'http://localhost:9200',
  qdrantUrl: process.env.QDRANT_URL || 'http://localhost:6333',
  geminiApiKey: process.env.GEMINI_API_KEY,
  slackWebhookUrl: process.env.SLACK_WEBHOOK_URL,
  webhookSiteUrl: process.env.WEBHOOK_SITE_URL,
  port: process.env.PORT || 4000
};
