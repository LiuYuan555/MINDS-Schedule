# SMS & Email Notification Setup Guide

This guide explains how to set up SMS and Email confirmation messages for event registrations.

## Cost Summary
| Service | Free Tier | Monthly Cost (1000 msgs) |
|---------|-----------|--------------------------|
| **Twilio SMS** | Trial only | ~$58 |
| **Resend Email** | 3,000/month | $0 |

---

## SMS Setup (Twilio)

### 1. Create Twilio Account
1. Go to [twilio.com/try-twilio](https://www.twilio.com/try-twilio)
2. Sign up and verify your email/phone

### 2. Get Credentials
1. Go to [Twilio Console](https://console.twilio.com/)
2. Copy your **Account SID** and **Auth Token**

### 3. Buy a Phone Number
1. Go to **Phone Numbers** → **Buy a number**
2. Buy a **US number** (~$1.15/month) - works for sending to Singapore

### 4. Upgrade Account (Required for Production)
- Trial accounts can only send to verified numbers
- Click **Upgrade** in Twilio Console to send to any number

### 5. Add to `.env.local`
```bash
TWILIO_ACCOUNT_SID=ACxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxx
TWILIO_AUTH_TOKEN=xxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxx
TWILIO_PHONE_NUMBER=+14342786800
```

---

## Email Setup (Resend)

### 1. Create Resend Account
1. Go to [resend.com](https://resend.com)
2. Sign up with email

### 2. Get API Key
1. Go to **API Keys** in dashboard
2. Create a new API key
3. Copy the key (starts with `re_`)

### 3. Add to `.env.local`
```bash
RESEND_API_KEY=re_xxxxxxxxxxxxxxxxxxxxxxxxxx
```

### 4. (Optional) Custom Domain
For production, verify your domain to send from your own email:
```bash
FROM_EMAIL=notifications@minds.org.sg
```

Without a verified domain, emails are sent from `onboarding@resend.dev` (works for testing).

---

## Message Template Placeholders

Both SMS and Email use the same placeholders:

| Placeholder | Description | Example |
|-------------|-------------|---------|
| `{name}` | Registrant's name | John Doe |
| `{event}` | Event title | Art Workshop |
| `{date}` | Event date | 2026-01-20 |
| `{time}` | Event start time | 09:00 |
| `{location}` | Event location | MINDS Centre |

### Default Message
```
Hi {name}! You're confirmed for "{event}" on {date} at {time}. Location: {location}. See you there! - MINDS Singapore
```

---

## Google Sheets Column

Add column **U** with header `ConfirmationMessage` to your Events sheet.

---

## Testing

1. Create an event with a custom confirmation message
2. Register for the event
3. Check your phone for SMS and email inbox for confirmation

---

## Troubleshooting

### SMS not received
- **Trial account**: Only verified numbers receive SMS - upgrade to paid
- Check phone number format (8 digits for Singapore)

### Email not received
- Check spam folder
- Verify `RESEND_API_KEY` is correct
- Without domain verification, emails come from `onboarding@resend.dev`

---

## Non-Profit Discounts

- **Twilio**: Apply at [twilio.org](https://www.twilio.org/) for up to 25% off
- **Resend**: Contact support for non-profit pricing