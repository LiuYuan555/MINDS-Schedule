# MINDS Singapore Event Scheduling Platform

A modern event scheduling and registration platform built for MINDS Singapore (Movement for the Intellectually Disabled of Singapore).

## Features

- 📅 **Calendar View** - Browse events in a monthly calendar format
- 📋 **List View** - View upcoming events in a detailed list format
- ✍️ **Event Registration** - Easy sign-up process with support for dietary and accessibility requirements
- 📊 **Google Sheets Backend** - All registrations are automatically saved to Google Sheets

## Getting Started

### Prerequisites

- Node.js 18+ installed
- npm or yarn package manager

### Installation

1. Clone the repository and install dependencies:

```bash
npm install
```

2. Start the development server:

```bash
npm run dev
```

3. Open [http://localhost:3000](http://localhost:3000) in your browser

## Setting Up Google Sheets Integration

To enable registration data to be saved to Google Sheets:

### Step 1: Create a Google Cloud Project

1. Go to [Google Cloud Console](https://console.cloud.google.com/)
2. Create a new project
3. Enable the **Google Sheets API**

### Step 2: Create a Service Account

1. Go to **APIs & Services** > **Credentials**
2. Click **Create Credentials** > **Service Account**
3. Fill in the details and create
4. Click on the service account, go to **Keys** tab
5. Add Key > Create new key > JSON
6. Download the JSON file

### Step 3: Create and Share the Google Sheet

1. Create a new Google Sheet
2. Rename the first sheet tab to `Sign-ups`
3. Add these headers in row 1:
   - A1: `Timestamp`
   - B1: `Event ID`
   - C1: `Event Title`
   - D1: `Name`
   - E1: `Email`
   - F1: `Phone`
   - G1: `Dietary Requirements`
   - H1: `Special Needs`
4. Share the sheet with the service account email (found in the JSON file as `client_email`)

### Step 4: Configure Environment Variables

1. Copy `.env.local.example` to `.env.local`
2. Add your credentials:

```bash
GOOGLE_SERVICE_ACCOUNT_KEY={"type":"service_account",...}  # Paste entire JSON as one line
GOOGLE_SPREADSHEET_ID=your_spreadsheet_id  # From the sheet URL
```

The spreadsheet ID is found in the URL: `https://docs.google.com/spreadsheets/d/SPREADSHEET_ID/edit`

## Customizing Events

Edit `src/data/events.ts` to add, modify, or remove events. Each event has:

```typescript
{
  id: string;
  title: string;
  description: string;
  date: string;        // Format: 'YYYY-MM-DD'
  time: string;        // e.g., '10:00 AM'
  endTime?: string;    // Optional
  location: string;
  category: string;
  capacity?: number;
  currentSignups?: number;
}
```

## Deployment

This app can be deployed to Vercel, Netlify, or any platform that supports Next.js:

```bash
npm run build
```

Remember to set the environment variables in your hosting platform's settings.

## Tech Stack

- [Next.js 15](https://nextjs.org/) - React framework
- [TypeScript](https://www.typescriptlang.org/) - Type safety
- [Tailwind CSS](https://tailwindcss.com/) - Styling
- [date-fns](https://date-fns.org/) - Date manipulation
- [Google Sheets API](https://developers.google.com/sheets/api) - Backend storage

## License

Built for MINDS Singapore Hack4Good 2026.
