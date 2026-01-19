# SMS & Email Notification Setup

Set up automatic confirmation messages for event registrations.

## Cost Summary

| Service | Free Tier | Notes |
|---------|-----------|-------|
| **Resend Email** | 3,000/month | Recommended |
| **Twilio SMS** | Trial only | ~$0.06/SMS after trial |

## Email Setup (Resend) - Recommended

### 1. Create Account
1. Go to [resend.com](https://resend.com) and sign up
2. Go to **API Keys** → Create new key
3. Copy the key (starts with `re_`)

### 2. Configure Environment
Add to `.env.local`:
```bash
RESEND_API_KEY=re_xxxxxxxxxxxxxxxxxxxxxxxxxx
```

### 3. Custom Domain (Optional)
For production, verify your domain to send from your own email:
```bash
FROM_EMAIL=notifications@minds.org.sg
```

Without a verified domain, emails are sent from `onboarding@resend.dev` (works for testing).

## SMS Setup (Twilio) - Optional

### 1. Create Account
1. Go to [twilio.com/try-twilio](https://www.twilio.com/try-twilio)
2. Sign up and verify your phone

### 2. Get Credentials
1. Go to [Twilio Console](https://console.twilio.com/)
2. Copy **Account SID** and **Auth Token**
3. Buy a phone number (~$1.15/month)

### 3. Configure Environment
Add to `.env.local`:
```bash
TWILIO_ACCOUNT_SID=ACxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxx
TWILIO_AUTH_TOKEN=xxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxx
TWILIO_PHONE_NUMBER=+14342786800
```

> **Note:** Trial accounts can only send to verified numbers. Upgrade to send to any number.

## Custom Messages

Staff can set custom confirmation messages per event in the Admin panel. Messages support these placeholders:

| Placeholder | Example |
|-------------|---------|
| `{name}` | John Doe |
| `{event}` | Art Workshop |
| `{date}` | 2026-01-20 |
| `{time}` | 09:00 |
| `{location}` | MINDS Centre |

### Default Message
```
Hi {name}! You're confirmed for "{event}" on {date} at {time}. Location: {location}. See you there! - MINDS Singapore
```

## Troubleshooting

**SMS not received:**
- Trial account only sends to verified numbers - upgrade to paid
- Check phone number format (8 digits for Singapore)

**Email not received:**
- Check spam folder
- Verify `RESEND_API_KEY` is correct
