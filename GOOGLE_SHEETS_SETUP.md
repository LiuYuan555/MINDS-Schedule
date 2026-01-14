# Google Sheets Setup Guide

This guide will help you connect your MINDS Schedule application to Google Sheets for persistent data storage.

## Step 1: Create a Google Cloud Project

1. Go to [Google Cloud Console](https://console.cloud.google.com/)
2. Click **Select a project** → **New Project**
3. Name your project (e.g., "MINDS Schedule")
4. Click **Create**

## Step 2: Enable Google Sheets API

1. In your project, go to **APIs & Services** → **Library**
2. Search for "Google Sheets API"
3. Click on it and press **Enable**

## Step 3: Create a Service Account

1. Go to **APIs & Services** → **Credentials**
2. Click **Create Credentials** → **Service Account**
3. Fill in the details:
   - Service account name: `minds-schedule-service`
   - Service account ID: (auto-generated)
   - Description: "Service account for MINDS Schedule app"
4. Click **Create and Continue**
5. Skip the optional steps (Grant access & Grant users access)
6. Click **Done**

## Step 4: Generate Service Account Key

1. In **Credentials**, find your service account in the list
2. Click on the service account email
3. Go to the **Keys** tab
4. Click **Add Key** → **Create new key**
5. Choose **JSON** format
6. Click **Create**
7. A JSON file will download - **keep this safe!**

## Step 5: Create Your Google Sheet

1. Go to [Google Sheets](https://sheets.google.com)
2. Create a new spreadsheet
3. Name it "MINDS Events Database" (or any name you prefer)
4. Create sheets with these exact names:
   - **Events** (for storing event data)
   - **Registrations** (for storing user signups)

### Set up the Events sheet:

Add these column headers in row 1 (columns A-T):

| A | B | C | D | E | F | G | H | I | J | K | L | M | N | O | P | Q | R | S | T |
|---|---|---|---|---|---|---|---|---|---|---|---|---|---|---|---|---|---|---|---|
| ID | Title | Description | Date | Time | EndTime | Location | Category | Capacity | CurrentSignups | WheelchairAccessible | CaregiverRequired | CaregiverPaymentRequired | CaregiverPaymentAmount | AgeRestriction | SkillLevel | VolunteersNeeded | CurrentVolunteers | RecurringGroupId | IsRecurring |

### Set up the Registrations sheet:

Add these column headers in row 1 (columns A-I):

| A | B | C | D | E | F | G | H | I |
|---|---|---|---|---|---|---|---|---|
| ID | EventID | Name | Email | Phone | MembershipNumber | RequiresCaregiver | CaregiverName | Timestamp |

## Step 6: Share the Sheet with Service Account

1. In your Google Sheet, click the **Share** button
2. Paste the service account email (from the JSON file, looks like: `your-service@project.iam.gserviceaccount.com`)
3. Give it **Editor** permissions
4. Uncheck "Notify people"
5. Click **Share**

## Step 7: Get Your Spreadsheet ID

The spreadsheet ID is in the URL of your Google Sheet:
```
https://docs.google.com/spreadsheets/d/[SPREADSHEET_ID]/edit
```

Copy the part between `/d/` and `/edit`

## Step 8: Configure Environment Variables

1. Open your project's `.env.local` file (create it if it doesn't exist)
2. Add these environment variables:

```env
# Admin Password (already configured)
ADMIN_PASSWORD=mindspassword

# Google Sheets Configuration
GOOGLE_SERVICE_ACCOUNT_KEY='{"type":"service_account","project_id":"your-project-id","private_key_id":"...","private_key":"-----BEGIN PRIVATE KEY-----\n...\n-----END PRIVATE KEY-----\n","client_email":"your-service@project.iam.gserviceaccount.com","client_id":"...","auth_uri":"https://accounts.google.com/o/oauth2/auth","token_uri":"https://accounts.google.com/o/oauth2/token","auth_provider_x509_cert_url":"https://www.googleapis.com/oauth2/v1/certs","client_x509_cert_url":"..."}'

GOOGLE_SPREADSHEET_ID=your_spreadsheet_id_here
```

### Important Notes:

- **GOOGLE_SERVICE_ACCOUNT_KEY**: Copy the **entire contents** of the JSON file you downloaded in Step 4. Paste it as a single line string (keep the quotes around it).
- **GOOGLE_SPREADSHEET_ID**: Paste the spreadsheet ID from Step 7

## Step 9: Restart Your Development Server

1. Stop your current server (Ctrl+C in terminal)
2. Restart it:
   ```bash
   npm run dev
   ```

## Step 10: Test the Connection

1. Go to `http://localhost:3000/admin`
2. Enter the admin password: `mindspassword`
3. Try creating a new event
4. Check your Google Sheet - the event should appear!

## Troubleshooting

### Error: "Google Sheets not configured"
- Check that both environment variables are set in `.env.local`
- Restart your dev server after adding environment variables

### Error: "The caller does not have permission"
- Make sure you shared the Google Sheet with your service account email
- Verify the service account has **Editor** permissions

### Error: "Unable to parse range"
- Check that your sheet is named exactly "Events" (case-sensitive)
- Verify the column headers are in row 1

### Error: "Invalid JSON"
- Make sure the entire JSON key is on one line
- Ensure the JSON is wrapped in single quotes in `.env.local`
- Check for any escaped characters or newlines in the private key

## Data Format Notes

### Date Format
- Use ISO format: `YYYY-MM-DD` (e.g., `2026-01-15`)

### Boolean Values
- Use `true` or `false` (lowercase)

### Categories
Must be one of: `Sports`, `Arts`, `Education`, `Social`, `Health`, `Technology`, `Volunteer`

### Skill Levels
Must be one of: `all`, `beginner`, `intermediate`, `advanced`

## Security Best Practices

1. **Never commit `.env.local` to git** (it's already in `.gitignore`)
2. Keep your service account JSON key secure
3. Only share the Google Sheet with the service account email
4. Use environment variables for all sensitive data
5. Regularly rotate your service account keys (every 90 days recommended)

## Need Help?

If you're still having issues:
1. Check the browser console for error messages
2. Check the terminal where your dev server is running
3. Verify all environment variables are correctly set
4. Make sure the Google Sheets API is enabled in your project
