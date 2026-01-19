# Hack4Good 2026 MINDS Problem Statement:

How might we reduce friction in activity sign-ups for both individuals and caregivers, while reducing manual effort for staff in managing and consolidating registration data?

# MINDS Singapore Event Scheduling Platform

A modern, accessible event scheduling and registration platform built for MINDS Singapore (Movement for the Intellectually Disabled of Singapore). This platform enables participants to browse and register for events, volunteers to sign up for helping opportunities, and staff to manage events and track attendance.

## 🌟 Features Overview

### For Participants
- 📅 **Calendar View** - Browse events in a monthly calendar format with color-coded categories
- 📋 **List View** - View upcoming events in a detailed list with filtering
- ✍️ **Event Registration** - Easy sign-up with accessibility and dietary requirements
- 📱 **Multi-Select Registration** - Register for multiple events at once
- 👥 **Caregiver Support** - Caregivers can register participants under their care
- ♿ **Accessibility Options** - Wheelchair access requests and special needs support
- 🎫 **Membership System** - Different membership tiers with weekly registration limits
- 📋 **My Events** - Personal dashboard to view and manage registrations
- ⏳ **Waitlist System** - Join waitlist when events are full, automatic promotion when spots open
- 🌐 **Bilingual Support** - English and Chinese (中文) language toggle
- 📧 **Email Confirmations** - Automatic email notifications upon registration
- 📱 **SMS Confirmations** - Automatic SMS reminders (optional, with Twilio)

### For Volunteers
- 🤝 **Volunteer Portal** - Dedicated page for volunteer opportunities
- 📝 **Volunteer Registration** - Quick sign up for events needing volunteers
- 🔍 **Smart Filtering** - Filter to show only events needing volunteers
- 📊 **Volunteer Dashboard** - Track registered events and volunteer commitments

### For Staff/Administrators
- 🔐 **Secure Admin Panel** - Password-protected staff portal
- ➕ **Event Management** - Create, edit, and delete events with full control
- 🔄 **Recurring Events** - Create recurring event series
- ✅ **Attendance Tracking** - Mark participants as attended, absent, or cancelled
- 📆 **Calendar Overview** - Visual calendar with registration counts
- 📈 **Statistics Dashboard** - Comprehensive metrics and analytics
- 👥 **User Management** - Manage users, approve registrations, handle membership
- ⏳ **Waitlist Management** - Approve, reject, or promote waitlist entries
- 📝 **Custom SMS Messages** - Set custom confirmation messages per event
- 📊 **Removal History** - Track participant removals and cancellations

## 🔐 Authentication

This platform uses **Clerk** for authentication, providing:
- Secure sign-in/sign-up flows
- Social login options
- User profile management
- Session management

## 🚀 Getting Started

### Prerequisites

- Node.js 18+ installed
- npm or yarn package manager
- Google Cloud account (for Google Sheets integration)
- Clerk account (for authentication)
- Optional: Twilio account (for SMS notifications)
- Optional: Resend account (for email notifications)

### Installation

1. Clone the repository and install dependencies:

```bash
npm install
```

2. Set up environment variables (see Configuration below)

3. Start the development server:

```bash
npm run dev
```

4. Open [http://localhost:3000](http://localhost:3000) in your browser

## 📱 How to Use

### Main Page (Participants)

**URL:** `http://localhost:3000`

1. **Browse Events**
   - Use the Calendar/List toggle to switch between views
   - Click on any event to view details and register
   - Toggle language between English and 中文 (Chinese)

2. **Sign In / Create an Account**
   - Click "Sign In" or "Sign Up" in the top right
   - Clerk handles secure authentication
   - Select a membership type:
     - **Ad-hoc Engagement** - No weekly limit
     - **Once a Week** - 1 event per week
     - **Twice a Week** - 2 events per week
     - **3+ Times a Week** - No limit

3. **Register for Events**
   - Click on an event to open the registration modal
   - Fill in required information (name, email, phone)
   - Select accessibility options if needed
   - Add caregiver details if required/accompanying
   - Submit registration
   - Receive email/SMS confirmation (if configured)

4. **Multi-Select Registration**
   - Click "Multi-Select" button to enable multi-select mode
   - Click multiple events to select them
   - Click "Register for Selected Events" to sign up for all at once

5. **My Events**
   - Navigate to "My Events" to see all your registrations
   - Filter by upcoming, past, or all events
   - Cancel registrations if needed

### Volunteer Portal

**URL:** `http://localhost:3000/volunteer`

1. **Browse Volunteer Opportunities**
   - View events that need volunteer support
   - Filter to show only events needing volunteers
   - See volunteer slots available for each event

2. **Sign Up as a Volunteer**
   - Click "Volunteer" on any event card
   - Confirm your volunteer registration
   - View your volunteer commitments

### Admin Panel (Staff)

**URL:** `http://localhost:3000/admin`

**Default Password:** `mindspassword` (change in production!)

#### Events Tab
1. **Add New Event**
   - Click "+ Add New Event"
   - Fill in event details:
     - Title, Description, Category
     - Date, Start Time, End Time
     - Location, Capacity
     - Volunteer slots needed
     - Skill level requirement
     - Age restrictions
   - Set accessibility options:
     - ♿ Wheelchair Accessible
     - 👥 Caregiver Required
     - 💰 Caregiver Payment Required (with amount)
   - Set custom SMS/Email confirmation message
   - Click "Add Event" to save

2. **Edit Event**
   - Click "Edit" on any event card
   - Modify details and save

3. **Delete Event**
   - Click "Delete" on any event card
   - Confirm deletion

4. **Recurring Events**
   - Create events that repeat on a schedule
   - Manage the entire series or individual occurrences

#### Attendance Tab
1. **Select an Event** from the dropdown
2. **View Registrations** - See all participants and volunteers
3. **Update Status** - Change each registration to:
   - Registered (default)
   - Waitlist
   - Attended
   - Absent
   - Cancelled
   - Rejected
4. **Manage Waitlist** - Promote or reject waitlist entries
5. **View Statistics** - See totals for registered, attended, participants, volunteers

#### Users Tab
- View and manage all users
- Approve pending user registrations
- Update membership types
- Restrict or activate users

#### Calendar View Tab
- Visual monthly calendar showing all events
- Click on an event to jump to attendance tracking
- Navigate between months using Prev/Next buttons

#### Statistics Tab
- Week-over-week performance comparison
- Attendance rates and cancellation rates
- Category performance breakdown
- Top performing events
- Inactive participant tracking
- Caregiver vs self-registration breakdown

## 📊 Event Fields Reference

| Field | Description | Required |
|-------|-------------|----------|
| Title | Event name | Yes |
| Description | Event details | Yes |
| Category | Workshop, Outdoor Activity, Fitness, etc. | Yes |
| Date | Event date (YYYY-MM-DD) | Yes |
| Time | Start time (e.g., "10:00 AM") | Yes |
| End Time | End time | No |
| Location | Venue/address | Yes |
| Capacity | Maximum participants | No |
| Volunteers Needed | Number of volunteer slots | No |
| Skill Level | all, beginner, intermediate, advanced | No |
| Age Restriction | e.g., "18+", "12-18" | No |
| Wheelchair Accessible | Boolean | No (default: true) |
| Caregiver Required | Boolean | No (default: false) |
| Caregiver Payment Required | Boolean | No (default: false) |
| Caregiver Payment Amount | Amount in dollars | No |
| Confirmation Message | Custom SMS/Email message | No |

## ⚙️ Configuration

### Environment Variables

Create a `.env.local` file with the following:

```bash
# Google Sheets (Required)
GOOGLE_SERVICE_ACCOUNT_KEY={"type":"service_account",...}  # Paste entire JSON as one line
GOOGLE_SPREADSHEET_ID=your_spreadsheet_id  # From the sheet URL

# Admin Panel (Required)
ADMIN_PASSWORD=your_secure_password  # For admin panel access

# Clerk Authentication (Required)
NEXT_PUBLIC_CLERK_PUBLISHABLE_KEY=pk_...
CLERK_SECRET_KEY=sk_...
NEXT_PUBLIC_CLERK_SIGN_IN_URL=/sign-in
NEXT_PUBLIC_CLERK_SIGN_UP_URL=/sign-up
NEXT_PUBLIC_CLERK_AFTER_SIGN_IN_URL=/
NEXT_PUBLIC_CLERK_AFTER_SIGN_UP_URL=/

# Email Notifications - Resend (Optional)
RESEND_API_KEY=re_xxxxxxxxxxxxxxxxxxxxxxxxxx
FROM_EMAIL=MINDS Singapore <notifications@yourdomain.com>

# SMS Notifications - Twilio (Optional)
TWILIO_ACCOUNT_SID=your_account_sid
TWILIO_AUTH_TOKEN=your_auth_token
TWILIO_PHONE_NUMBER=+1234567890
```

## 🔧 Google Sheets Setup

### Step 1: Create a Google Cloud Project

1. Go to [Google Cloud Console](https://console.cloud.google.com/)
2. Create a new project
3. Enable the **Google Sheets API**

### Step 2: Create a Service Account

1. Go to **APIs & Services** > **Credentials**
2. Click **Create Credentials** > **Service Account**
3. Fill in the details and create
4. Click on the service account, go to **Keys** tab
5. Add Key > Create new key > JSON
6. Download the JSON file

### Step 3: Create Google Sheets

Create a Google Sheet with the following tabs (sheets):

#### Sheet 1: "Events"
Headers (Row 1):
```
ID | Title | Description | Date | Time | EndTime | Location | Category | Capacity | CurrentSignups | CurrentWaitlist | WheelchairAccessible | CaregiverRequired | CaregiverPaymentRequired | CaregiverPaymentAmount | AgeRestriction | SkillLevel | VolunteersNeeded | CurrentVolunteers | RecurringGroupId | IsRecurring | ConfirmationMessage
```

#### Sheet 2: "Registrations"
Headers (Row 1):
```
ID | EventID | EventTitle | UserID | UserName | UserEmail | UserPhone | RegistrationType | Status | WaitlistPosition | IsCaregiver | ParticipantName | DietaryRequirements | SpecialNeeds | NeedsWheelchairAccess | HasCaregiverAccompanying | CaregiverName | CaregiverPhone | RegisteredAt | AttendedAt | PromotedAt
```

#### Sheet 3: "Users"
Headers (Row 1):
```
ID | Name | Email | Phone | Role | Status | MembershipType | IsCaregiver | ParticipantName | CreatedAt | ApprovedAt | ApprovedBy | LastUpdatedAt | LastUpdatedBy
```

#### Sheet 4: "RemovalHistory" (Optional)
Headers (Row 1):
```
ID | EventID | EventTitle | UserID | UserName | UserEmail | RemovedAt | RemovedBy | Reason
```

### Step 4: Share the Sheet

Share the Google Sheet with the service account email (found in the JSON file as `client_email`) with **Editor** access.

### Step 5: Configure Environment Variables

The spreadsheet ID is found in the URL: `https://docs.google.com/spreadsheets/d/SPREADSHEET_ID/edit`

## 📁 Project Structure

```
src/
├── app/
│   ├── page.tsx              # Main participant page
│   ├── layout.tsx            # Root layout with Clerk provider
│   ├── globals.css           # Global styles
│   ├── admin/
│   │   └── page.tsx          # Admin panel (Events, Attendance, Users, Stats)
│   ├── my-events/
│   │   └── page.tsx          # User's personal event dashboard
│   ├── volunteer/
│   │   └── page.tsx          # Volunteer portal
│   └── api/
│       ├── events/
│       │   └── route.ts      # Events CRUD API
│       ├── registrations/
│       │   ├── route.ts      # Registrations API
│       │   ├── [id]/route.ts # Single registration management
│       │   ├── approve-waitlist/route.ts
│       │   ├── reject-waitlist/route.ts
│       │   ├── promote/route.ts
│       │   └── history/route.ts
│       ├── users/
│       │   └── route.ts      # Users management API
│       ├── user/
│       │   ├── membership/route.ts
│       │   └── status/route.ts
│       └── admin/
│           └── auth/
│               └── route.ts  # Admin authentication
├── components/
│   ├── Calendar.tsx          # Calendar view component
│   ├── EventList.tsx         # List view component
│   ├── SignUpModal.tsx       # Registration modal (single & bulk)
│   ├── EventFormModal.tsx    # Admin event form
│   ├── WaitlistManager.tsx   # Waitlist management component
│   ├── UserManagement.tsx    # User management component
│   ├── LanguageProvider.tsx  # i18n context provider
│   ├── AccessControlProvider.tsx
│   └── AccessControlWrapper.tsx
├── data/
│   └── events.ts             # Category colors and configuration
├── lib/
│   ├── translations.ts       # English/Chinese translations
│   ├── email.ts              # Resend email integration
│   └── sms.ts                # Twilio SMS integration
└── types/
    └── index.ts              # TypeScript type definitions
```

## 🎨 Categories

Events can be categorized into:
- Workshop
- Outdoor Activity
- Fitness
- Life Skills
- Social
- Education
- Support Group
- Sports
- Festive
- Employment

Each category has a distinct color scheme for easy identification.

## 🌐 Internationalization

The platform supports:
- **English** (default)
- **Chinese (中文)**

Users can toggle language using the language switcher in the header. Translations are managed in `src/lib/translations.ts`.

## 📧 Notifications

### Email (Resend)
- Free tier: 3,000 emails/month
- Automatic confirmation emails on registration
- Customizable message templates

### SMS (Twilio)
- Requires Twilio account
- SMS confirmations sent to Singapore phone numbers (+65)
- Custom per-event confirmation messages

## 🔒 Security Notes

For production deployment:

1. **Change the admin password** - Update `ADMIN_PASSWORD` in environment variables
2. **Use HTTPS** - Ensure all traffic is encrypted
3. **Configure Clerk properly** - Set up allowed domains and authentication rules
4. **Rate limiting** - Add rate limiting to API routes
5. **Input validation** - All user inputs are validated but review for your needs
6. **Environment variables** - Never commit `.env.local` to version control

## 🚀 Deployment

This app can be deployed to Vercel, Netlify, or any platform that supports Next.js:

```bash
npm run build
```

### Vercel (Recommended)
1. Push code to GitHub
2. Connect repository to Vercel
3. Add environment variables in Vercel dashboard
4. Deploy

Remember to set all environment variables in your hosting platform's settings.

## 🛠 Tech Stack

- [Next.js 15](https://nextjs.org/) - React framework with App Router
- [TypeScript](https://www.typescriptlang.org/) - Type safety
- [Tailwind CSS](https://tailwindcss.com/) - Utility-first styling
- [Clerk](https://clerk.dev/) - Authentication & user management
- [date-fns](https://date-fns.org/) - Date manipulation
- [Google Sheets API](https://developers.google.com/sheets/api) - Backend storage
- [Resend](https://resend.com/) - Email notifications
- [Twilio](https://www.twilio.com/) - SMS notifications

## 📚 Additional Documentation

- [Google Sheets Setup](GOOGLE_SHEETS_SETUP.md)
- [Google Sheets Template](GOOGLE_SHEETS_TEMPLATE.md)
- [SMS & Email Setup](SMS_SETUP.md)
- [Waitlist Feature](WAITLIST_FEATURE.md)
- [Caregiver Feature](CAREGIVER_FEATURE.md)
- [Multi-Select Feature](MULTI_SELECT_FEATURE.md)
- [Recurring Events](RECURRING_EVENTS_FEATURE.md)
- [User Management](FIX_USERS_SHEET.md)

## 📄 License

Built for MINDS Singapore Hack4Good 2026.
