# SMS Notification Setup Guide

This guide explains how to set up SMS confirmation messages for event registrations using Twilio.

## Cost Estimate
- **Twilio SMS to Singapore:** ~$0.0579/message
- **Monthly cost (1000 messages):** ~$58/month
- **Twilio Phone Number:** ~$1-2/month (US number)
- **Total:** ~$60/month

## Setup Steps

### 1. Create a Twilio Account
1. Go to [https://www.twilio.com/try-twilio](https://www.twilio.com/try-twilio)
2. Sign up for a free account (includes trial credits)
3. Verify your email and phone number

### 2. Get Your Twilio Credentials
1. Go to the [Twilio Console](https://console.twilio.com/)
2. Find your **Account SID** and **Auth Token** on the dashboard
3. Copy these values

### 3. Get a Phone Number

**Option A: US Number (Recommended - Always Available)**
1. In Twilio Console, go to **Phone Numbers** → **Buy a number**
2. Select a US number (e.g., +1 area code)
3. Purchase the number (~$1.15/month)
4. US numbers can send international SMS to Singapore

**Option B: Alphanumeric Sender ID (Best for Branding)**
- Singapore numbers are rarely available on Twilio
- If needed, contact Twilio Sales for a dedicated Singapore number
- Alternatively, use a US number - recipients will see the US number but SMS will still be delivered

**Option C: Alphanumeric Sender ID (Best for Branding)**
1. Instead of a phone number, use "MINDS" as the sender
2. Go to **Messaging** → **Services** → **Create Messaging Service**
3. Enable "Alphanumeric Sender ID"
4. Set sender as `MINDS` (max 11 characters)
5. Note: Recipients cannot reply to alphanumeric senders

> ⚠️ **Important:** For alphanumeric sender IDs to Singapore, you may need to register with SGNIC. See [Twilio's Singapore regulations](https://www.twilio.com/docs/sms/guidelines-and-regulations/singapore-sms-guidelines).

### 4. Add Environment Variables
Add the following to your `.env.local` file:

```bash
# Twilio SMS Configuration
TWILIO_ACCOUNT_SID=your_account_sid_here
TWILIO_AUTH_TOKEN=your_auth_token_here
TWILIO_PHONE_NUMBER=+1xxxxxxxxxx  # US number works fine for Singapore
```

For alphanumeric sender ID:
```bash
TWILIO_PHONE_NUMBER=MINDS
```

### 5. Test the Setup
1. Create a new event with a custom confirmation message
2. Register for the event with a valid Singapore phone number
3. Check if SMS is received

## Message Template Placeholders

When creating events, admins can customize the SMS confirmation message using these placeholders:

| Placeholder | Description | Example |
|-------------|-------------|---------|
| `{name}` | Registrant's name | John Doe |
| `{event}` | Event title | Art Workshop |
| `{date}` | Event date | 2026-01-20 |
| `{time}` | Event start time | 09:00 |
| `{location}` | Event location | MINDS Centre |

### Default Message Template
```
Hi {name}! You're confirmed for "{event}" on {date} at {time}. Location: {location}. See you there! - MINDS Singapore
```

### Example Custom Message
```
Dear {name}, thank you for signing up for {event}! We look forward to seeing you on {date} at {time}. Please arrive 15 minutes early at {location}. - MINDS Singapore
```

## Troubleshooting

### SMS Not Sending
1. Check that all environment variables are set correctly
2. Verify your Twilio account has sufficient credits
3. Ensure the phone number format is correct (8 digits for Singapore)
4. Check the server logs for error messages

### Invalid Phone Number
The system automatically formats Singapore phone numbers:
- `91234567` → `+6591234567`
- `6591234567` → `+6591234567`
- `+6591234567` → `+6591234567`

### Trial Account Limitations
On a Twilio trial account:
- You can only send SMS to verified phone numbers
- Messages include a "Sent from a Twilio trial account" prefix
- Upgrade to a paid account to remove these limitations

## Google Sheets Column Update

A new column **U (ConfirmationMessage)** has been added to the Events sheet. If you have an existing sheet, add this column header:

| Column | Header |
|--------|--------|
| U | ConfirmationMessage |

## Non-Profit Discount

Twilio offers discounts for non-profit organizations. Apply at:
[https://www.twilio.org/](https://www.twilio.org/)

This could reduce your costs by up to 25%.

## Alternative: Lower-Cost Options

If Twilio costs are too high, consider these alternatives:

| Service | Cost per SMS (SG) | Notes |
|---------|-------------------|-------|