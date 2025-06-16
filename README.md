# Team Guessing Game

A collaborative real-time guessing game where players submit text answers based on photos shown by an admin. Features AI-powered answer matching and competitive scoring with POTUS/Vice President winner declarations.

## Features

- **Simple Join Process**: Players join using just a game ID (US state names) and their name
- **Real-time Gameplay**: Live updates as players submit and modify guesses
- **AI Answer Matching**: Smart matching recognizes exact answers, similar spellings, and key terms
- **Presidential Winners**: Top scorer becomes POTUS, tied players become Vice Presidents
- **Persistent Database**: PostgreSQL storage for reliable game state management
- **Mobile Responsive**: Works on phones, tablets, and desktop

## Quick Start

### Local Development
1. Clone this repository
2. Install dependencies: `npm install`
3. Set up PostgreSQL database
4. Copy `.env.example` to `.env` and configure your database
5. Run: `npm run dev`
6. Visit: `http://localhost:5000`

### Deploy to Railway (Free)
1. Push code to GitHub
2. Connect Railway account to your GitHub repo
3. Add PostgreSQL service in Railway
4. Generate session secret: `node generate-session-secret.js`
5. Add environment variables in Railway dashboard
6. Deploy automatically

## Game Flow

1. **Admin Setup**: Create game with state name ID (e.g., "California")
2. **Player Join**: Players use game ID and enter their own names
3. **Gameplay**: Admin shows photos, players submit text guesses
4. **Scoring**: AI determines correct answers, awards points
5. **Winners**: Highest scorer becomes POTUS, ties become Vice Presidents

## Tech Stack

- **Frontend**: React, TypeScript, TailwindCSS, Vite
- **Backend**: Express.js, Node.js
- **Database**: PostgreSQL with Drizzle ORM
- **Real-time**: WebSockets
- **Authentication**: Express sessions
- **Deployment**: Railway-ready configuration

## Environment Variables

```
DATABASE_URL=postgresql://username:password@host:port/database
SESSION_SECRET=your-secure-random-string
NODE_ENV=production
```

## Deployment Files

- `railway.json` - Railway deployment configuration
- `nixpacks.toml` - Build configuration
- `RAILWAY_DEPLOYMENT.md` - Detailed deployment guide
- `DEPLOYMENT_CHECKLIST.md` - Step-by-step checklist

## Support

See `RAILWAY_DEPLOYMENT.md` for complete deployment instructions and troubleshooting.