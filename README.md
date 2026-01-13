# MINDS Singapore Event Scheduling Platform

A modern event scheduling and registration platform built for MINDS Singapore (Movement for the Intellectually Disabled of Singapore). This platform enables participants to browse and register for events, volunteers to sign up for helping opportunities, and staff to manage events and track attendance.

## 🌟 Features Overview

### For Participants
- 📅 **Calendar View** - Browse events in a monthly calendar format
- 📋 **List View** - View upcoming events in a detailed list with filtering
- ✍️ **Event Registration** - Easy sign-up with accessibility and dietary requirements
- 👥 **Caregiver Support** - Register caregivers alongside participants
- ♿ **Accessibility Options** - Wheelchair access requests and special needs support
- 🎫 **Membership System** - Different membership tiers with weekly registration limits

### For Volunteers
- 🤝 **Volunteer Portal** - Dedicated page for volunteer opportunities
- 📝 **Volunteer Registration** - Sign up with skills, availability, and experience
- 📊 **Volunteer Dashboard** - Track registered events and volunteer activities

### For Staff/Administrators
- 🔐 **Secure Admin Panel** - Password-protected staff portal
- ➕ **Event Management** - Create, edit, and delete events with full control
- ✅ **Attendance Tracking** - Mark participants as attended, absent, or cancelled
- 📆 **Calendar Overview** - Visual calendar with registration counts
- 📈 **Statistics Dashboard** - View registration and attendance metrics

## 🚀 Getting Started

### Prerequisites

- Node.js 18+ installed
- npm or yarn package manager
- Google Cloud account (for Google Sheets integration)

### Installation

1. Clone the repository and install dependencies:

```bash
npm install
```

2. Set up environment variables (see Google Sheets Setup below)

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

2. **Create an Account**
   - Click "Register" in the top right
   - Fill in your details and select a membership type:
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

### Volunteer Portal

**URL:** `http://localhost:3000/volunteer`

1. **Browse Volunteer Opportunities**
   - View events that need volunteer support
   - See volunteer slots available for each event

2. **Sign Up as a Volunteer**
   - Click "Volunteer" on any event card
   - Fill in your details:
     - Personal information
     - Skills and relevant experience
     - Availability and emergency contact
   - Submit your volunteer application

3. **View Your Registrations**
   - Logged-in volunteers can see their registered events
   - Track upcoming volunteer commitments

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
   - Click "Add Event" to save

2. **Edit Event**
   - Click "Edit" on any event card
   - Modify details and save

3. **Delete Event**
   - Click "Delete" on any event card
   - Confirm deletion

#### Attendance Tab
1. **Select an Event** from the dropdown
2. **View Registrations** - See all participants and volunteers
3. **Update Status** - Change each registration to:
   - Registered (default)
   - Attended
   - Absent
   - Cancelled
4. **View Statistics** - See totals for registered, attended, participants, volunteers

#### Calendar View Tab
- Visual monthly calendar showing all events
- Click on an event to jump to attendance tracking
- Navigate between months using Prev/Next buttons

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
ID | Title | Description | Date | Time | EndTime | Location | Category | Capacity | CurrentSignups | WheelchairAccessible | CaregiverRequired | CaregiverPaymentRequired | CaregiverPaymentAmount | AgeRestriction | SkillLevel | VolunteersNeeded | CurrentVolunteers
```

#### Sheet 2: "Registrations"
Headers (Row 1):
```
ID | EventID | EventTitle | UserID | UserName | UserEmail | UserPhone | RegistrationType | Status | DietaryRequirements | SpecialNeeds | NeedsWheelchairAccess | HasCaregiverAccompanying | CaregiverName | CaregiverPhone | RegisteredAt
```

#### Sheet 3: "Users"
Headers (Row 1):
```
ID | Name | Email | Phone | Password | Role | MembershipType | CreatedAt
```

### Step 4: Share the Sheet

Share the Google Sheet with the service account email (found in the JSON file as `client_email`) with **Editor** access.

### Step 5: Configure Environment Variables

Create a `.env.local` file:

```bash
GOOGLE_SERVICE_ACCOUNT_KEY={"type":"service_account",...}  # Paste entire JSON as one line
GOOGLE_SPREADSHEET_ID=your_spreadsheet_id  # From the sheet URL
ADMIN_PASSWORD=your_secure_password  # For admin panel access
```

The spreadsheet ID is found in the URL: `https://docs.google.com/spreadsheets/d/SPREADSHEET_ID/edit`

## 📁 Project Structure

```
src/
├── app/
│   ├── page.tsx              # Main participant page
│   ├── layout.tsx            # Root layout with providers
│   ├── globals.css           # Global styles
│   ├── admin/
│   │   └── page.tsx          # Admin panel
│   ├── volunteer/
│   │   └── page.tsx          # Volunteer portal
│   └── api/
│       ├── events/
│       │   └── route.ts      # Events CRUD API
│       ├── registrations/
│       │   └── route.ts      # Registrations API
│       ├── auth/
│       │   ├── login/
│       │   │   └── route.ts  # User login
│       │   └── register/
│       │       └── route.ts  # User registration
│       └── admin/
│           └── auth/
│               └── route.ts  # Admin authentication
├── components/
│   ├── Calendar.tsx          # Calendar view component
│   ├── EventList.tsx         # List view component
│   └── SignUpModal.tsx       # Registration modal
├── context/
│   └── AuthContext.tsx       # Authentication context
├── data/
│   └── events.ts             # Category colors and sample data
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

## 🔒 Security Notes

For production deployment:

1. **Change the admin password** - Update `ADMIN_PASSWORD` in environment variables
2. **Use HTTPS** - Ensure all traffic is encrypted
3. **Implement proper authentication** - Consider adding JWT tokens or session management
4. **Rate limiting** - Add rate limiting to API routes
5. **Input validation** - All user inputs are validated but review for your needs

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
- [date-fns](https://date-fns.org/) - Date manipulation
- [Google Sheets API](https://developers.google.com/sheets/api) - Backend storage


## 📄 License

Built for MINDS Singapore Hack4Good 2026.
