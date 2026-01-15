# Quick Fix: Add Users Sheet to Your Google Spreadsheet

## The Problem
You're getting this error:
```
Error: Unable to parse range: Users!A:H
```

This means your Google Spreadsheet is missing the **Users** sheet that the app needs to track user membership types.

## Quick Solution (2 minutes)

### Step 1: Open Your Google Spreadsheet
Go to: https://docs.google.com/spreadsheets/d/1mYjAHZdAeMPvjg222dh-9VAp-M5ybfWUO89XWKl6boE/edit

### Step 2: Create a New Sheet
1. Click the **+** button at the bottom left (next to your existing sheets)
2. Right-click the new sheet tab
3. Click **Rename**
4. Name it exactly: **Users** (capital U)

### Step 3: Add Column Headers
In Row 1, paste these headers (separated by tabs):

```
id	name	email	phone	role	createdAt	membershipType	skills
```

Or manually type them in:
- **A1**: id
- **B1**: name
- **C1**: email
- **D1**: phone
- **E1**: role
- **F1**: createdAt
- **G1**: membershipType
- **H1**: skills

### Step 4: Test Again!
1. Go back to your app: http://localhost:3000
2. Try registering for an event
3. It should work now! ✅

## What This Sheet Does

The **Users** sheet tracks:
- User information (id, name, email, phone)
- User role (participant, volunteer, staff)
- Membership type (adhoc, once_weekly, twice_weekly, three_plus_weekly)
- Skills (for volunteers)

When a user registers, the app:
1. Creates/updates their user record
2. Checks their membership type
3. Enforces weekly registration limits based on membership

## Membership Types Explained

| Type | Meaning | Weekly Limit |
|------|---------|--------------|
| `adhoc` | Ad-hoc engagement | No limit |
| `once_weekly` | Once a week | 1 event per week |
| `twice_weekly` | Twice a week | 2 events per week |
| `three_plus_weekly` | 3+ times a week | No limit |

## All Three Required Sheets

Your Google Spreadsheet should now have these three sheets:
1. ✅ **Events** - Stores all events
2. ✅ **Registrations** - Stores all sign-ups
3. ✅ **Users** - Stores user information and membership types

## Testing

After adding the Users sheet, test by:
1. Registering for an event
2. Check the Registrations sheet - your registration should appear
3. Check the Users sheet - your user record should appear
4. Try registering for multiple events in the same week
5. The app will track your weekly registration count

## That's It!

Your Google Sheets integration should now work properly. The registration will succeed and data will save to your spreadsheet.

## Still Having Issues?

If you still see errors, check:
- ✅ Sheet is named exactly **Users** (case-sensitive)
- ✅ Column headers are in Row 1
- ✅ Service account has Editor permission
- ✅ Dev server was restarted after adding the sheet
