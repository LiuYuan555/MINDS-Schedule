# Google Sheets Quick Setup Guide

## 🚀 Quick Start (5-10 minutes)

### Step 1: Create Google Cloud Project (2 minutes)

1. Go to https://console.cloud.google.com/
2. Click "Select a project" → "New Project"
3. Name: **MINDS Schedule**
4. Click "Create"

### Step 2: Enable Google Sheets API (1 minute)

1. In Google Cloud Console: **APIs & Services** → **Library**
2. Search: **Google Sheets API**
3. Click **Enable**

### Step 3: Create Service Account & Download Key (2 minutes)

1. **APIs & Services** → **Credentials**
2. **Create Credentials** → **Service Account**
3. Name: `minds-schedule-service`
4. Click **Create and Continue** → **Done**
5. Click on the service account email in the list
6. Go to **Keys** tab
7. **Add Key** → **Create new key** → **JSON**
8. Download the JSON file (KEEP IT SAFE!)

### Step 4: Create Your Google Sheet (2 minutes)

1. Go to https://sheets.google.com
2. Create new spreadsheet
3. Name it: **MINDS Events Database**

#### Create Sheet 1: "Events"
- Rename "Sheet1" to **Events** (exact spelling, capital E)
- Copy-paste this header row into Row 1:

```
id	title	description	date	time	endTime	location	category	capacity	currentSignups	currentWaitlist	wheelchairAccessible	caregiverRequired	caregiverPaymentRequired	caregiverPaymentAmount	ageRestriction	skillLevel	volunteersNeeded	currentVolunteers	recurringGroupId	isRecurring
```

#### Create Sheet 2: "Registrations"
- Click + to add new sheet
- Name it **Registrations** (exact spelling, capital R)
- Copy-paste this header row into Row 1:

```
id	eventId	eventTitle	userId	userName	userEmail	userPhone	registrationType	status	dietaryRequirements	specialNeeds	needsWheelchairAccess	hasCaregiverAccompanying	caregiverName	caregiverPhone	registeredAt	waitlistPosition	promotedAt
```

### Step 5: Share Sheet with Service Account (1 minute)

1. Click **Share** button (top-right)
2. Open the JSON file you downloaded
3. Find `"client_email"` - copy that email address
4. Paste email in Share dialog
5. Change permission to **Editor**
6. **UNCHECK** "Notify people"
7. Click **Share**

### Step 6: Get Spreadsheet ID (30 seconds)

Look at your browser URL:
```
https://docs.google.com/spreadsheets/d/1A2B3C4D5E6F7G8H9I0J/edit
                                          ↑
                                   Copy this part
```

Copy the ID between `/d/` and `/edit`

### Step 7: Configure .env.local (2 minutes)

Open `.env.local` in VS Code and update these two lines:

#### For GOOGLE_SERVICE_ACCOUNT_KEY:
1. Open the JSON file you downloaded
2. **Select ALL content** (Cmd+A)
3. Copy it (Cmd+C)
4. Paste it into `.env.local` replacing everything between the single quotes

Should look like:
```env
GOOGLE_SERVICE_ACCOUNT_KEY='{"type":"service_account","project_id":"minds-schedule-123","private_key_id":"abc123...","private_key":"-----BEGIN PRIVATE KEY-----\nMIIE...\n-----END PRIVATE KEY-----\n","client_email":"minds-schedule@minds-schedule-123.iam.gserviceaccount.com",...}'
```

#### For GOOGLE_SPREADSHEET_ID:
Replace with the ID you copied in Step 6:
```env
GOOGLE_SPREADSHEET_ID=1A2B3C4D5E6F7G8H9I0J
```

### Step 8: Restart Server (30 seconds)

In your terminal:
```bash
# Stop current server (press Ctrl+C)
# Then restart:
npm run dev
```

### Step 9: Test It! (1 minute)

1. Go to http://localhost:3000
2. Sign in (or create account)
3. Click on an event
4. Fill out the registration form
5. Submit
6. **Check your Google Sheet** - the registration should appear! 🎉

---

## ✅ Verification Checklist

- [ ] Google Cloud Project created
- [ ] Google Sheets API enabled
- [ ] Service Account created
- [ ] JSON key downloaded
- [ ] Google Spreadsheet created with "Events" and "Registrations" sheets
- [ ] Column headers added to both sheets
- [ ] Sheet shared with service account email (Editor permission)
- [ ] Spreadsheet ID copied
- [ ] `.env.local` updated with JSON key
- [ ] `.env.local` updated with Spreadsheet ID
- [ ] Dev server restarted
- [ ] Test registration created
- [ ] Data appears in Google Sheet

---

## 🎯 Common Issues & Fixes

### Issue: "Google Sheets not configured"
**Fix:** 
- Check `.env.local` has both variables filled in
- Restart dev server (Ctrl+C, then `npm run dev`)

### Issue: "The caller does not have permission"
**Fix:**
- Share the Google Sheet with service account email
- Make sure permission is **Editor**, not Viewer
- Check email in JSON matches email in Share dialog

### Issue: "Unable to parse range: 'Events'"
**Fix:**
- Sheet must be named exactly **Events** (capital E)
- Same for **Registrations** (capital R)
- Check for typos or extra spaces

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
- Real-time updates across all users
- Data persisting after server restart

Welcome to the MINDS Schedule system! 🚀
