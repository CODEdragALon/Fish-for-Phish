# Fish for Phish

A phishing awareness training simulation that helps users learn to identify phishing attacks through realistic email scenarios.

## Features

- **7-Day Progressive Training**: Start with obvious phishing attempts and progress to AI-powered sophisticated attacks
- **Realistic Email Client UI**: Gmail/Outlook-inspired interface for authentic experience
- **Multiple Phishing Types**: Email phishing, spear-phishing, whaling, quishing (QR codes), calendar phishing, and clone phishing
- **Interactive Link Inspection**: Hover over links to see their actual destination (crucial for spotting phishing)
- **Mobile View Simulation**: See how emails appear on mobile devices where phishing is more effective
- **Header Analysis**: Advanced users can inspect SPF/DKIM/DMARC headers for Level 3 challenges
- **Gamified Scoring**: Start with 1000 points - earn for correct identifications, lose for mistakes
- **Detailed Feedback**: Learn from every decision with comprehensive daily summaries

## Tech Stack

- **Frontend**: Next.js 14, React 18, Tailwind CSS 3
- **Backend**: Express.js, Prisma ORM, SQLite
- **AI**: Google Gemini 2.0 Flash for dynamic email generation (optional)

## Getting Started

### Prerequisites

- Node.js 18.17.0+ 
- npm or yarn
- Google Gemini API key (optional - app works with fallback email templates without it)

### Installation

1. **Clone the repository**
   ```bash
   git clone <repository-url>
   cd Fish-for-Phish
   ```

2. **Set up the server**
   ```bash
   cd server
   npm install
   
   # Create .env file with your configuration
   echo "DATABASE_URL=\"file:./prisma/dev.db\"" > .env
   echo "GEMINI_API_KEY=\"your-gemini-api-key-here\"" >> .env
   echo "PORT=3001" >> .env
   
   # Generate Prisma client and run migrations
   npx prisma generate
   npx prisma migrate dev
   ```

3. **Set up the client**
   ```bash
   cd ../client
   npm install
   ```

### Running the Application

**Option 1: Run both together** (from project root)
```bash
npm install
npm run dev
```

**Option 2: Run separately**

1. **Start the backend server** (in the `server` directory)
   ```bash
   cd server
   npm run dev
   ```
   Server will run on http://localhost:3001

2. **Start the frontend** (in the `client` directory)
   ```bash
   cd client
   npm run dev
   ```
   Frontend will run on http://localhost:3000

3. **Open your browser** and navigate to http://localhost:3000

## Daily Progression

| Day | Theme | Description |
|-----|-------|-------------|
| 1 | Introduction | Obvious phishing with typos and generic greetings |
| 2 | Urgency Tactics | Emails creating false sense of urgency |
| 3 | Spear-phishing | Personalized attacks targeting you specifically |
| 4 | Safe Harbor | All legitimate - test for false positives |
| 5 | Modern Tactics | QR code and calendar phishing attacks |
| 6 | Whaling | Executive impersonation attacks |
| 7 | Boss Level | Sophisticated AI-generated clone phishing |

## Scoring System

- **Correct phishing report**: +50 points
- **Correct legitimate mark**: +25 points  
- **Bonus for indicators**: +10 per correct indicator identified
- **False positive** (report legitimate): -75 points
- **False negative** (miss phishing): -100 points

## Project Structure

```
Fish-for-Phish/
├── client/                    # Next.js frontend
│   ├── app/
│   │   ├── components/       # React components
│   │   │   ├── email/       # Email-related components
│   │   │   ├── layout/      # Layout components
│   │   │   ├── modals/      # Modal dialogs
│   │   │   └── ui/          # UI utilities
│   │   ├── lib/             # API client and types
│   │   ├── inbox/           # Inbox page
│   │   └── page.tsx         # Landing page
│   └── ...
├── server/                    # Express.js backend
│   ├── src/
│   │   ├── controllers/     # Route handlers
│   │   ├── routes/          # API routes
│   │   ├── services/        # Business logic
│   │   └── types/           # TypeScript types
│   ├── prisma/              # Database schema
│   └── ...
└── README.md
```

## API Endpoints

### Sessions
- `POST /api/sessions` - Create new session
- `GET /api/sessions/:id` - Get session details
- `POST /api/sessions/:id/advance` - Advance to next day
- `GET /api/sessions/:id/summary` - Get final summary

### Emails
- `GET /api/emails/session/:sessionId/day/:day` - Get emails for a day
- `GET /api/emails/:id` - Get single email
- `POST /api/emails/:id/respond` - Submit response
- `GET /api/emails/session/:sessionId/day/:day/summary` - Get daily summary

## Environment Variables

### Server (.env)
```
DATABASE_URL="file:./prisma/dev.db"
GEMINI_API_KEY="your-gemini-api-key"
PORT=3001
```

> **Note**: Get your Gemini API key from [Google AI Studio](https://aistudio.google.com/app/apikey). The application uses Gemini 1.5 Flash for generating realistic phishing emails for training purposes. Without an API key, the app falls back to built-in email templates.

### Client
```
NEXT_PUBLIC_API_URL=http://localhost:3001/api
```

## Contributing

Contributions are welcome! Please feel free to submit a Pull Request.

## License

ISC

## Disclaimer

This application is for educational purposes only. The phishing emails generated are simulations designed to teach users how to identify real-world threats. Never use the techniques shown here for malicious purposes.
