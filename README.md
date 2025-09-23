# Hello Eden

A Next.js application demonstrating integration with the Eden API. This starter app showcases core Eden functionalities including AI-powered image/video creation, agent interactions, and browsing community creations.

## Features

- **🎨 Create** - Generate AI-powered images and videos using Eden's creation tools
- **💬 Chat** - Interactive conversations with Eden AI agents through sessions
- **🔍 Creations** - Browse and filter community creations with pagination support

## Prerequisites

- Node.js 18+ and pnpm
- Eden API credentials

## Setup

1. Clone the repository and install dependencies:
```bash
pnpm install
```

2. Copy the environment template and configure your credentials:
```bash
cp .env.local.example .env.local
```

3. Configure your `.env.local` file with your Eden credentials:
```env
EDEN_API_KEY=your_eden_api_key_here
NEXT_PUBLIC_EDEN_AGENT_ID=your_eden_agent_id_here
NEXT_PUBLIC_EDEN_API_BASE=https://api.eden.art  # Optional, defaults to production API
```

### Getting Your Credentials

- **EDEN_API_KEY**: Your private API key for authenticating with Eden services
- **NEXT_PUBLIC_EDEN_AGENT_ID**: The ID of the Eden agent you want to interact with
- **NEXT_PUBLIC_EDEN_API_BASE**: (Optional) Override the default API endpoint for development/testing

## Development

Run the development server:
```bash
pnpm run dev
```

Open [http://localhost:3000](http://localhost:3000) to see the application.

## Core Functionality

### Creation Features
- Submit creation tasks (images or videos) with prompts
- Poll task status and retrieve results
- Support for different model preferences
- Real-time status updates during generation

### Session Management
- Create interactive sessions with Eden agents
- Send messages with optional attachments
- Poll for session updates and agent responses
- Support for multi-agent conversations
- Configurable autonomy settings for automated agent replies

### Creations Browser
- Fetch and display Eden creations
- Filter by type (image/video)
- Filter by ownership (your creations vs all)
- Filter by agent-generated content
- Pagination with cursor-based navigation
- Detailed view with metadata

## API Integration

The app uses Eden's v2 API endpoints:
- `/v2/tasks/create` - Submit creation tasks
- `/v2/tasks/{taskId}` - Poll task status
- `/v2/sessions` - Create sessions and send messages
- `/v2/sessions/{sessionId}` - Get session details
- `/v2/agents` - List available agents
- `/v2/agents/{agentId}` - Get agent details
- `/v2/feed-cursor/creations` - Browse creations with filtering
- `/v2/creations/{creationId}` - Get creation details

## Project Structure

```
src/
├── app/
│   ├── api/          # API route handlers
│   ├── chat/         # Chat interface page
│   ├── create/       # Creation interface page
│   ├── creations/    # Creations browser page
│   └── page.tsx      # Home page
├── components/       # Reusable UI components
└── lib/
    └── eden.ts       # Eden API client functions
```

## Available Scripts

- `pnpm run dev` - Start development server
- `pnpm run build` - Build for production
- `pnpm run start` - Start production server
- `pnpm run lint` - Run ESLint

## Tech Stack

- **Next.js 15** - React framework with App Router
- **React 19** - UI library
- **TypeScript** - Type safety
- **Tailwind CSS** - Utility-first styling
- **Eden SDK** - Eden API integration

## License

MIT
