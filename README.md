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
- 🔐 **Secure Admin Panel** - Role-based access control via Clerk authentication
- ➕ **Event Management** - Create, edit, and delete events with full control
- 🔄 **Recurring Events** - Create recurring event series
- ✅ **Attendance Tracking** - Mark participants as attended, absent, or cancelled
- 📆 **Calendar Overview** - Visual calendar with registration counts
- 📈 **Statistics Dashboard** - Comprehensive metrics and analytics
- 👥 **User Management** - Manage users, approve registrations, handle membership
- ⏳ **Waitlist Management** - Approve, reject, or promote waitlist entries
- 📝 **Custom SMS Messages** - Set custom confirmation messages per event
- 📊 **Removal History** - Track participant removals and cancellations

## 🔐 Authentication & Security

This platform uses **Clerk** for authentication, providing:
- Secure sign-in/sign-up flows
- Social login options (Google, etc.)
- User profile management
- Session management
- **Role-based access control** for admin features

### Security Features

- **🔒 Role-Based Admin Access** - Admin panel requires `role: admin` in Clerk user metadata
- **🛡️ Server-Side Authorization** - All admin API routes verify user roles server-side
- **🚫 No Hardcoded Credentials** - No passwords stored in code or environment variables for admin access
- **✅ Protected API Endpoints** - POST/PUT/DELETE operations on sensitive routes require admin authentication
- **🔑 Clerk-Managed Sessions** - Secure session handling with automatic token refresh
- **⚡ Rate Limiting** - API endpoints protected against brute force and DDoS attacks
- **🧹 Input Validation & Sanitization** - All user inputs validated with Zod and sanitized to prevent injection attacks

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

**Access:** Requires Clerk account with `role: admin` in public metadata (see Admin Setup below)

#### Admin Setup

1. Sign in to [Clerk Dashboard](https://dashboard.clerk.com/)
2. Go to **Users** and select the staff user
3. Scroll to **Public metadata** and click **Edit**
4. Add the following JSON:
   ```json
   {
     "role": "admin"
   }
   ```
5. Click **Save**

The user can now access the admin panel at `/admin`.

#### Events Tab
- **Add New Event** - Create events with full details
- **Edit Event** - Modify existing events
- **Delete Event** - Remove events
- **Recurring Events** - Create event series

#### Attendance Tab
- **View Registrations** - See all participants and volunteers
- **Update Status** - Mark as Registered, Attended, Absent, Cancelled
- **Manage Waitlist** - Promote or reject waitlist entries

#### Users Tab
- View and manage all users
- Approve pending user registrations
- Update membership types
- Restrict or activate users

#### Statistics Tab
- Week-over-week performance comparison
- Attendance rates and cancellation rates
- Category performance breakdown
- Top performing events

## ⚙️ Configuration

### Environment Variables

Create a `.env.local` file with the following:

```bash
# Google Sheets (Required)
GOOGLE_SERVICE_ACCOUNT_KEY={"type":"service_account",...}  # Paste entire JSON as one line
GOOGLE_SPREADSHEET_ID=your_spreadsheet_id  # From the sheet URL

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
│       └── user/
│           ├── membership/route.ts
│           └── status/route.ts
├── components/
│   ├── Calendar.tsx          # Calendar view component
│   ├── EventList.tsx         # List view component
│   ├── SignUpModal.tsx       # Registration modal (single & bulk)
│   ├── EventFormModal.tsx    # Admin event form
│   ├── WaitlistManager.tsx   # Waitlist management component
│   ├── UserManagement.tsx    # User management component
│   ├── LanguageProvider.tsx  # i18n context provider
│   ├── AccessControlProvider.tsx  # User access control
│   └── AccessControlWrapper.tsx   # Access control HOC
├── data/
│   └── events.ts             # Category colors and configuration
├── lib/
│   ├── adminAuth.ts          # Admin role verification
│   ├── translations.ts       # English/Chinese translations
│   ├── email.ts              # Resend email integration
│   └── sms.ts                # Twilio SMS integration
└── types/
    └── index.ts              # TypeScript type definitions
```

## 🔒 Security Architecture

### Authentication Flow

```
User Request → Clerk Authentication → Role Verification → API Access
```

### Admin Access Control

| Layer | Protection |
|-------|------------|
| **Frontend** | Admin page checks `user.publicMetadata.role === 'admin'` |
| **API Routes** | Server-side `isAdmin()` function verifies Clerk session and role |
| **Database** | Google Sheets accessed only via authenticated service account |

### Protected API Endpoints

| Endpoint | GET | POST | PUT | DELETE |
|----------|-----|------|-----|--------|
| `/api/events` | Public | Admin | Admin | Admin |
| `/api/registrations` | Auth | Auth | Admin | Admin |
| `/api/users` | Admin | Auth | Admin | Admin |
| `/api/registrations/approve-waitlist` | - | Admin | - | - |
| `/api/registrations/reject-waitlist` | - | Admin | - | - |
| `/api/registrations/promote` | - | Admin | - | - |

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

Users can toggle language using the language switcher in the header.

## 📧 Notifications

### Email (Resend)
- Free tier: 3,000 emails/month
- Automatic confirmation emails on registration

### SMS (Twilio)
- Requires Twilio account
- SMS confirmations sent to Singapore phone numbers (+65)

## 🚀 Deployment

### Vercel (Recommended)

1. Push code to GitHub
2. Connect repository to Vercel
3. Add environment variables in Vercel dashboard
4. Deploy

```bash
npm run build
```

### Security Checklist for Production

- [ ] Configure Clerk production keys
- [ ] Set up allowed domains in Clerk
- [ ] Add admin role to staff users in Clerk Dashboard
- [ ] Use HTTPS for all traffic
- [ ] Review and restrict Google Sheets service account permissions
- [ ] Never commit `.env.local` to version control

## 🛠 Tech Stack

- [Next.js 15](https://nextjs.org/) - React framework with App Router
- [TypeScript](https://www.typescriptlang.org/) - Type safety
- [Tailwind CSS](https://tailwindcss.com/) - Utility-first styling
- [Clerk](https://clerk.dev/) - Authentication & role-based access control
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

## 📄 License

Built for MINDS Singapore Hack4Good 2026.
