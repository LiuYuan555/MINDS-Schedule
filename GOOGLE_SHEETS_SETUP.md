# Google Sheets Setup Guide

Connect your MINDS Schedule app to Google Sheets for data storage.

## Step 1: Create Google Cloud Project

1. Go to [Google Cloud Console](https://console.cloud.google.com/)
2. Click **Select a project** → **New Project**
3. Name: "MINDS Schedule"
4. Click **Create**

## Step 2: Enable Google Sheets API

1. Go to **APIs & Services** → **Library**
2. Search for "Google Sheets API"
3. Click **Enable**

## Step 3: Create Service Account

1. Go to **APIs & Services** → **Credentials**
2. Click **Create Credentials** → **Service Account**
3. Name: `minds-schedule-service`
4. Click **Create and Continue** → **Done**

## Step 4: Download Service Account Key

1. Click on your service account in the list
2. Go to **Keys** tab
3. Click **Add Key** → **Create new key** → **JSON**
4. Download and keep the JSON file safe

## Step 5: Create Google Sheet

1. Go to [Google Sheets](https://sheets.google.com)
2. Create a new spreadsheet named "MINDS Events Database"
3. Create these sheets (tabs):

### Events Sheet
Add headers in Row 1:
```
id	title	description	date	time	endTime	location	category	capacity	currentSignups	currentWaitlist	wheelchairAccessible	caregiverRequired	caregiverPaymentRequired	caregiverPaymentAmount	ageRestriction	skillLevel	volunteersNeeded	currentVolunteers	recurringGroupId	isRecurring	confirmationMessage
```

### Registrations Sheet
Add headers in Row 1:
```
id	eventId	eventTitle	userId	userName	userEmail	userPhone	registrationType	status	dietaryRequirements	specialNeeds	needsWheelchairAccess	hasCaregiverAccompanying	caregiverName	caregiverPhone	registeredAt	waitlistPosition	promotedAt	isCaregiver	participantName
```

### Users Sheet
Add headers in Row 1:
```
id	name	email	phone	role	status	membershipType	isCaregiver	participantName	createdAt	approvedAt	approvedBy	lastUpdatedAt	lastUpdatedBy
```

## Step 6: Share Sheet with Service Account

1. Click **Share** button
2. Paste the service account email (from JSON file: `client_email`)
3. Set permission to **Editor**
4. Uncheck "Notify people"
5. Click **Share**

## Step 7: Get Spreadsheet ID

From your sheet URL:
```
https://docs.google.com/spreadsheets/d/[SPREADSHEET_ID]/edit
```
Copy the ID between `/d/` and `/edit`

## Step 8: Configure Environment

Add to `.env.local`:

```env
GOOGLE_SERVICE_ACCOUNT_KEY='{"type":"service_account",...}'
GOOGLE_SPREADSHEET_ID=your_spreadsheet_id_here
```

> **Note:** Paste the entire JSON file content as one line for `GOOGLE_SERVICE_ACCOUNT_KEY`

## Step 9: Test

1. Restart dev server: `npm run dev`
2. Go to http://localhost:3000
3. Register for an event
4. Check your Google Sheet - data should appear!

## Troubleshooting

| Error | Solution |
|-------|----------|
| "Google Sheets not configured" | Check both env variables are set, restart server |
| "Caller does not have permission" | Share sheet with service account email as Editor |
| "Unable to parse range" | Check sheet names match exactly (Events, Registrations, Users) |
| "Invalid JSON" | Ensure JSON is on one line, wrapped in single quotes |

## Data Formats

- **Dates:** `YYYY-MM-DD` (e.g., `2026-01-15`)
- **Booleans:** `true` or `false` (lowercase)
- **Categories:** Sports, Arts, Education, Social, Health, Workshop, Outdoor Activity, Fitness, Life Skills, Support Group, Festive, Employment
- **Skill Levels:** all, beginner, intermediate, advanced

## Security

- Never commit `.env.local` to git
- Keep service account JSON key secure
- Only share sheet with service account email
- Rotate keys regularly (every 90 days)

