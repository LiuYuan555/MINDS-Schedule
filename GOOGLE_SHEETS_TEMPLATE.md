# Google Sheets Template

Reference for setting up your Google Sheets database.

## Sheet 1: Events

| Column | Header | Example |
|--------|--------|---------|
| A | id | evt_abc123 |
| B | title | Art Workshop |
| C | description | Learn watercolor painting |
| D | date | 2026-01-20 |
| E | time | 10:00 AM |
| F | endTime | 12:00 PM |
| G | location | MINDS Training Centre |
| H | category | Arts |
| I | capacity | 15 |
| J | currentSignups | 10 |
| K | currentWaitlist | 2 |
| L | wheelchairAccessible | true |
| M | caregiverRequired | false |
| N | caregiverPaymentRequired | false |
| O | caregiverPaymentAmount | 20 |
| P | ageRestriction | 18+ |
| Q | skillLevel | beginner |
| R | volunteersNeeded | 3 |
| S | currentVolunteers | 1 |
| T | recurringGroupId | group_123 |
| U | isRecurring | true |
| V | confirmationMessage | Hi {name}! See you at {event}! |

**Categories:** Sports, Arts, Education, Social, Health, Technology, Volunteer, Workshop, Outdoor Activity, Fitness, Life Skills, Support Group, Festive, Employment

**Skill Levels:** all, beginner, intermediate, advanced

## Sheet 2: Registrations

| Column | Header | Example |
|--------|--------|---------|
| A | id | reg_abc123 |
| B | eventId | evt_abc123 |
| C | eventTitle | Art Workshop |
| D | userId | user_abc123 |
| E | userName | John Smith |
| F | userEmail | john@example.com |
| G | userPhone | +65 9123 4567 |
| H | registrationType | participant |
| I | status | registered |
| J | dietaryRequirements | Vegetarian |
| K | specialNeeds | None |
| L | needsWheelchairAccess | false |
| M | hasCaregiverAccompanying | true |
| N | caregiverName | Jane Smith |
| O | caregiverPhone | +65 9876 5432 |
| P | registeredAt | 2026-01-15T14:30:00Z |
| Q | waitlistPosition | 1 |
| R | promotedAt | 2026-01-16T10:00:00Z |
| S | isCaregiver | false |
| T | participantName | |

**Registration Types:** participant, volunteer

**Status Values:**
- `registered` - Confirmed
- `waitlist` - On waitlist (with position) or pending request (no position)
- `rejected` - Waitlist request denied
- `cancelled` - Cancelled
- `attended` - Marked attended
- `absent` - Marked absent

## Sheet 3: Users

| Column | Header | Example |
|--------|--------|---------|
| A | id | user_abc123 |
| B | name | John Smith |
| C | email | john@example.com |
| D | phone | +65 9123 4567 |
| E | role | participant |
| F | status | active |
| G | membershipType | once_weekly |
| H | isCaregiver | false |
| I | participantName | |
| J | createdAt | 2026-01-15T10:00:00Z |
| K | approvedAt | 2026-01-15T12:00:00Z |
| L | approvedBy | admin@minds.org |
| M | lastUpdatedAt | 2026-01-15T12:00:00Z |
| N | lastUpdatedBy | admin@minds.org |

**Roles:** participant, volunteer, staff

**Status:** pending, active, restricted

**Membership Types:**
- `adhoc` - No weekly limit
- `once_weekly` - 1 event per week
- `twice_weekly` - 2 events per week
- `three_plus_weekly` - No limit

## Sheet 4: RemovalHistory (Optional)

| Column | Header |
|--------|--------|
| A | id |
| B | originalRegistrationId |
| C | eventId |
| D | eventTitle |
| E | userId |
| F | userName |
| G | userEmail |
| H | userPhone |
| I | registrationType |
| J | isCaregiver |
| K | participantName |
| L | removedBy |
| M | reason |
| N | removedAt |

## Quick Copy-Paste Headers

**Events (Row 1):**
```
id	title	description	date	time	endTime	location	category	capacity	currentSignups	currentWaitlist	wheelchairAccessible	caregiverRequired	caregiverPaymentRequired	caregiverPaymentAmount	ageRestriction	skillLevel	volunteersNeeded	currentVolunteers	recurringGroupId	isRecurring	confirmationMessage
```

**Registrations (Row 1):**
```
id	eventId	eventTitle	userId	userName	userEmail	userPhone	registrationType	status	dietaryRequirements	specialNeeds	needsWheelchairAccess	hasCaregiverAccompanying	caregiverName	caregiverPhone	registeredAt	waitlistPosition	promotedAt	isCaregiver	participantName
```

**Users (Row 1):**
```
id	name	email	phone	role	status	membershipType	isCaregiver	participantName	createdAt	approvedAt	approvedBy	lastUpdatedAt	lastUpdatedBy
```

**RemovalHistory (Row 1):**
```
id	originalRegistrationId	eventId	eventTitle	userId	userName	userEmail	userPhone	registrationType	isCaregiver	participantName	removedBy	reason	removedAt
```

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
