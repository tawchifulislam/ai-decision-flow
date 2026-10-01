# AI Decision Flow

A visual workflow builder where each node is an AI decision step that returns YES or NO.
The flow is drawn with React Flow and executed step by step with Inngest.

## Tech stack

Next.js, React Flow, Inngest, OpenAI SDK (pointed at Gemini), shadcn/ui, Tailwind

## Setup

1. Install dependencies: `npm install`
2. Copy `.env.example` to `.env.local` and fill in the values
3. Run the app: `npm run dev`
4. In a second terminal, run the Inngest dev server:
   `npx inngest-cli@latest dev -u http://localhost:3000/api/inngest`
5. Open <http://localhost:3000> and <http://localhost:8288>

## Environment variables

- `GEMINI_API_KEY`: API key from Google AI Studio
- `INNGEST_DEV`: set to 1 for local development
