# ReachInbox Onebox

A real-time AI-powered email aggregator with IMAP sync, Elasticsearch search, AI categorization, and RAG-based reply suggestions.

## Features

- ✅ Real-time IMAP email synchronization (IDLE mode)
- ✅ Elasticsearch indexing and search
- ✅ AI email categorization using Gemini API
- ✅ Slack notifications for interested leads
- ✅ Webhook integration
- ✅ Basic frontend UI
- ✅ RAG-powered suggested replies

## Setup

1. **Clone and install dependencies:**
   ```bash
   cd reachinbox-onebox-fresh
   npm install
   ```

2. **Start Docker services:**
   ```bash
   docker-compose up -d
   ```

3. **Configure environment:**
   ```bash
   cp .env.example .env
   # Edit .env with your API keys and IMAP credentials
   ```

4. **Build and run:**
   ```bash
   npm run build
   npm start
   ```

## API Endpoints

- `GET /api/accounts` - List configured accounts
- `GET /api/emails?q=search&accountId=...&folder=...` - Search emails
- `POST /api/emails/:id/suggest-reply` - Generate AI reply suggestion

## Architecture

- **IMAP Sync Service:** Real-time email fetching using IDLE
- **Elasticsearch:** Full-text search and indexing
- **Gemini AI:** Email categorization and reply generation
- **Qdrant:** Vector database for RAG context
- **Express API:** REST endpoints for frontend

## Demo

Start the server and visit `http://localhost:4000` for the health check. Use Postman to test API endpoints.
![Project Demo](./assets/demo.gif)
