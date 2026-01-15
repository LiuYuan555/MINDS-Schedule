# Google Sheets Template Setup

Use this as a reference when setting up your Google Sheets database.

## Sheet 1: Events

Create a sheet named **Events** with these column headers in Row 1:

| Column | Header | Description | Example |
|--------|--------|-------------|---------|
| A | id | Unique event ID | evt_abc123 |
| B | title | Event name | Art Workshop |
| C | description | Event details | Learn watercolor painting |
| D | date | ISO date | 2026-01-20 |
| E | time | Start time | 10:00 AM |
| F | endTime | End time | 12:00 PM |
| G | location | Venue | MINDS Training Centre |
| H | category | Event category | Arts |
| I | capacity | Max participants | 15 |
| J | currentSignups | Current registrations | 10 |
| K | currentWaitlist | Current on waitlist | 2 |
| L | wheelchairAccessible | true/false | true |
| M | caregiverRequired | true/false | false |
| N | caregiverPaymentRequired | true/false | false |
| O | caregiverPaymentAmount | Amount in dollars | 20 |
| P | ageRestriction | Age requirements | 18+ |
| Q | skillLevel | all/beginner/intermediate/advanced | beginner |
| R | volunteersNeeded | Number needed | 3 |
| S | currentVolunteers | Current volunteers | 1 |
| T | recurringGroupId | Recurring event group | group_123 |
| U | isRecurring | true/false | true |

**Categories:** Sports, Arts, Education, Social, Health, Technology, Volunteer

## Sheet 2: Registrations

Create a sheet named **Registrations** with these column headers in Row 1:

| Column | Header | Description | Example |
|--------|--------|-------------|---------|
| A | id | Unique registration ID | reg_abc123 |
| B | eventId | Event ID | evt_abc123 |
| C | eventTitle | Event name | Art Workshop |
| D | userId | User ID from Clerk | user_abc123 |
| E | userName | Participant name | John Smith |
| F | userEmail | Email address | john@example.com |
| G | userPhone | Phone number | +65 9123 4567 |
| H | registrationType | participant/volunteer | participant |
| I | status | registered/waitlist/rejected/cancelled/attended/absent | registered |
| J | dietaryRequirements | Food restrictions | Vegetarian |
| K | specialNeeds | Accessibility needs | None |
| L | needsWheelchairAccess | true/false | false |
| M | hasCaregiverAccompanying | true/false | true |
| N | caregiverName | Caregiver's name | Jane Smith |
| O | caregiverPhone | Caregiver's phone | +65 9876 5432 |
| P | registeredAt | ISO timestamp | 2026-01-15T14:30:00Z |
| Q | waitlistPosition | Position in queue | 1 |
| R | promotedAt | Promotion timestamp | 2026-01-16T10:00:00Z |

**Status Values:**
- `registered` - Confirmed registration
- `waitlist` - On waitlist (with waitlistPosition) or pending request (no waitlistPosition)
- `rejected` - Waitlist request denied
- `cancelled` - Registration cancelled
- `attended` - Marked as attended
- `absent` - Marked as absent

## Sheet 3: Users

Create a sheet named **Users** with these column headers in Row 1:

| Column | Header | Description | Example |
|--------|--------|-------------|---------|
| A | id | User ID from Clerk | user_abc123 |
| B | name | Full name | John Smith |
| C | email | Email address | john@example.com |
| D | phone | Phone number | +65 9123 4567 |
| E | role | participant/volunteer/staff | participant |
| F | createdAt | ISO timestamp | 2026-01-15T10:00:00Z |
| G | membershipType | adhoc/once_weekly/twice_weekly/three_plus_weekly | once_weekly |
| H | skills | Volunteer skills | First Aid, Teaching |

**Membership Types:**
- `adhoc` - Ad-hoc engagement (no weekly limit)
- `once_weekly` - Can register for 1 event per week
- `twice_weekly` - Can register for 2 events per week
- `three_plus_weekly` - Can register for 3+ events per week (no limit)

**User Roles:**
- `participant` - Regular participant
- `volunteer` - Event volunteer
- `staff` - MINDS staff member

## Quick Setup Steps

1. **Create Google Cloud Project**
   - Go to https://console.cloud.google.com/
   - Create new project: "MINDS Schedule"

2. **Enable Google Sheets API**
   - APIs & Services → Library
   - Search "Google Sheets API" → Enable

3. **Create Service Account**
   - APIs & Services → Credentials
   - Create Credentials → Service Account
   - Name: `minds-schedule-service`
   - Create & download JSON key

4. **Create Google Sheet**
   - Go to https://sheets.google.com
   - Create new spreadsheet: "MINDS Events Database"
   - Create three sheets: "Events", "Registrations", and "Users"
   - Copy the column headers from tables above

5. **Share Sheet with Service Account**
   - Click Share button
   - Add service account email (from JSON file)
   - Give "Editor" permission
   - Uncheck "Notify people"

6. **Get Spreadsheet ID**
   - From URL: `https://docs.google.com/spreadsheets/d/[SPREADSHEET_ID]/edit`
   - Copy the ID between `/d/` and `/edit`

7. **Configure Environment Variables**
   - Open `.env.local` in your project
   - Replace `GOOGLE_SERVICE_ACCOUNT_KEY` with entire JSON content (one line)
   - Replace `GOOGLE_SPREADSHEET_ID` with your spreadsheet ID

8. **Restart Dev Server**
   ```bash
   # Stop current server (Ctrl+C)
   npm run dev
   ```

9. **Test the Integration**
   - Go to http://localhost:3000
   - Sign up for an event
   - Check your Google Sheet - registration should appear!

## Example Data

### Sample Event Row
```
evt_001 | Basketball Training | Learn basketball basics | 2026-01-25 | 2:00 PM | 4:00 PM | MINDS Sports Hall | Sports | 20 | 0 | 0 | true | false | false | | 12+ | beginner | 2 | 0 | | false
```

### Sample Registration Row
```
reg_001 | evt_001 | Basketball Training | user_abc123 | John Doe | john@example.com | +65 9123 4567 | participant | registered | None | None | false | false | | | 2026-01-15T10:00:00Z | |
```

## Troubleshooting

### "Google Sheets not configured" error
- ✅ Check `.env.local` exists and has both variables
- ✅ Restart dev server after adding variables
- ✅ Verify JSON key is valid (use a JSON validator)

### "Permission denied" error
- ✅ Share sheet with service account email
- ✅ Give "Editor" permissions (not "Viewer")
- ✅ Check service account email matches JSON file

### "Range not found" error
- ✅ Sheet must be named exactly "Events" and "Registrations"
- ✅ Column headers must be in Row 1
- ✅ Check for extra spaces in sheet names

### Data not appearing
- ✅ Check browser console for errors
- ✅ Verify sheet names are correct (case-sensitive)
- ✅ Make sure columns match the template exactly
- ✅ Test with a simple event first

## Security Notes

🔒 **NEVER commit `.env.local` to git** - It's in `.gitignore` by default

🔒 **Keep JSON key secure** - It's like a password for your Google Sheet

🔒 **Only share with service account** - Don't share with personal emails

🔒 **Rotate keys regularly** - Generate new keys every 90 days

## Need More Help?

Check these resources:
- Full setup guide: `GOOGLE_SHEETS_SETUP.md`
- Waitlist feature: `MANUAL_WAITLIST_APPROVAL.md`
- Multi-select feature: `MULTI_SELECT_FEATURE.md`
