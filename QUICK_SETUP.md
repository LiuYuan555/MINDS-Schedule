# Quick Setup Guide

Get the MINDS Schedule app running in 10 minutes.

## Prerequisites

- Node.js 18+
- Google account
- Clerk account (for authentication)

## Step 1: Install Dependencies

```bash
npm install
```

## Step 2: Set Up Clerk Authentication

1. Go to [clerk.com](https://clerk.com) and create an account
2. Create a new application
3. Copy your API keys

### Set Up Admin Access

To grant admin access to staff members:

1. Sign in to [Clerk Dashboard](https://dashboard.clerk.com/)
2. Go to **Users** and select the staff user
3. Scroll to **Public metadata** and click **Edit**
4. Add: `{"role": "admin"}`
5. Click **Save**

## Step 3: Set Up Google Sheets

### Create Google Cloud Project
1. Go to [console.cloud.google.com](https://console.cloud.google.com/)
2. Create new project: **MINDS Schedule**
3. Enable **Google Sheets API** (APIs & Services → Library)

### Create Service Account
1. Go to **APIs & Services** → **Credentials**
2. **Create Credentials** → **Service Account**
3. Name: `minds-schedule-service`
4. Go to **Keys** tab → **Add Key** → **JSON**
5. Download the JSON file (keep it safe!)

### Create Google Sheet
1. Go to [sheets.google.com](https://sheets.google.com)
2. Create new spreadsheet: **MINDS Events Database**
3. Create these sheets with headers:

**Sheet: Events**
```
id	title	description	date	time	endTime	location	category	capacity	currentSignups	currentWaitlist	wheelchairAccessible	caregiverRequired	caregiverPaymentRequired	caregiverPaymentAmount	ageRestriction	skillLevel	volunteersNeeded	currentVolunteers	recurringGroupId	isRecurring	confirmationMessage
```

**Sheet: Registrations**
```
id	eventId	eventTitle	userId	userName	userEmail	userPhone	registrationType	status	dietaryRequirements	specialNeeds	needsWheelchairAccess	hasCaregiverAccompanying	caregiverName	caregiverPhone	registeredAt	waitlistPosition	promotedAt	isCaregiver	participantName
```

**Sheet: Users**
```
id	name	email	phone	role	status	membershipType	isCaregiver	participantName	createdAt	approvedAt	approvedBy	lastUpdatedAt	lastUpdatedBy
```

### Share Sheet
1. Click **Share** button
2. Add service account email (from JSON file's `client_email`)
3. Give **Editor** permission
4. Uncheck "Notify people"

### Get Spreadsheet ID
From URL: `https://docs.google.com/spreadsheets/d/[SPREADSHEET_ID]/edit`

## Step 4: Configure Environment

Create `.env.local`:

```bash
# Clerk Authentication (Required)
NEXT_PUBLIC_CLERK_PUBLISHABLE_KEY=pk_...
CLERK_SECRET_KEY=sk_...

# Google Sheets (Required)
GOOGLE_SERVICE_ACCOUNT_KEY='{"type":"service_account",...}'  # Paste entire JSON
GOOGLE_SPREADSHEET_ID=your_spreadsheet_id

# Optional: Email (Resend)
RESEND_API_KEY=re_...

# Optional: SMS (Twilio)
TWILIO_ACCOUNT_SID=AC...
TWILIO_AUTH_TOKEN=...
TWILIO_PHONE_NUMBER=+1...
```

## Step 5: Run the App

```bash
npm run dev
```

Open [http://localhost:3000](http://localhost:3000)

## Verification Checklist

- [ ] Homepage loads with calendar
- [ ] Can sign in with Clerk
- [ ] Can register for an event
- [ ] Registration appears in Google Sheet
- [ ] Admin panel works at `/admin` (requires admin role in Clerk)

## Troubleshooting

**"Google Sheets not configured"**
- Check both Google env variables are set
- Restart dev server

**"The caller does not have permission"**
- Share sheet with service account email
- Ensure Editor permission

**"Unable to parse range: 'Events'"**
- Sheet must be named exactly **Events** (capital E)
- Same for **Registrations** and **Users**

**"Access Denied" on admin page**
- Ensure user has `{"role": "admin"}` in Clerk public metadata
- Sign out and sign back in after adding the role

### Issue: "Invalid JSON in environment variable"
**Fix:**
- Make sure entire JSON is on one line
- Must be wrapped in single quotes: `'{ ... }'`
- No line breaks inside the JSON

### Issue: "Data not saving to sheet"
**Fix:**
- Open browser console (F12) and check for errors
- Verify column headers match template exactly
- Check sheet names are correct (case-sensitive)
- Try creating a simple test event first

---

## 📱 What You Can Do Now

Once Google Sheets is integrated:

✅ **Event Management**
- Events persist across page refreshes
- Events sync across all users in real-time
- Staff can edit events directly in Google Sheets

✅ **Registration System**
- User registrations saved to Registrations sheet
- Track who signed up for what
- Export data for reports

✅ **Waitlist Management**
- Staff can approve/reject waitlist requests
- Promote waitlist members when spots open
- Track waitlist positions

✅ **Multi-Select Registration**
- Users can register for multiple events at once
- All registrations save to Google Sheets
- Handle full events automatically

---

## 🎓 Pro Tips

💡 **Backup Your Data**
- Google Sheets auto-saves
- Download as Excel periodically for backup
- Use File → Version History to see changes

💡 **Data Validation**
- Add dropdown lists for categories, status fields
- Prevents typos and invalid data
- Right-click column → Data validation

💡 **Conditional Formatting**
- Highlight full events (currentSignups >= capacity)
- Color-code by status (registered/waitlist/cancelled)
- Format → Conditional formatting

💡 **Formulas**
- Add calculated columns
- Example: `=J2/I2` for capacity percentage
- `=IF(J2>=I2,"FULL","Available")` for status

💡 **Multiple Environments**
- Create separate sheets for testing/production
- Use different `.env.local` files
- Never test with production data

---

## 🆘 Still Need Help?

1. **Check Documentation**
   - `GOOGLE_SHEETS_SETUP.md` - Detailed guide
   - `GOOGLE_SHEETS_TEMPLATE.md` - Column reference
   - `MANUAL_WAITLIST_APPROVAL.md` - Waitlist features

2. **Check Logs**
   - Browser console (F12 → Console tab)
   - Terminal where `npm run dev` is running
   - Look for specific error messages

3. **Verify Configuration**
   - Run `./setup-google-sheets.sh` to see checklist
   - Check all environment variables are set
   - Ensure JSON key is valid

4. **Test Step by Step**
   - Test with one simple event first
   - Check if it appears in Google Sheet
   - Then test registration
   - Finally test advanced features

---

## 🎉 Success!

If everything works, you should see:
- Events loading from Google Sheets
- Registrations saving to Registrations sheet
- Admin panel accessible to users with admin role
- Data persisting after server restart

Welcome to the MINDS Schedule system! 🚀
