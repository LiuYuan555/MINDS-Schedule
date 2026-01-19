<!-- Use this file to provide workspace-specific custom instructions to Copilot. For more details, visit https://code.visualstudio.com/docs/copilot/copilot-customization#_use-a-githubcopilotinstructionsmd-file -->

# MINDS Singapore Event Scheduling Platform

A Next.js application for MINDS Singapore to manage event scheduling, registrations, and volunteer coordination.

## Tech Stack
- Next.js 15 with App Router
- TypeScript
- Tailwind CSS
- Clerk for authentication
- Google Sheets API for backend storage
- Resend for email notifications
- Twilio for SMS notifications

## Key Features
- Calendar and list views for browsing events
- Multi-select event registration
- Waitlist management with staff approval
- Caregiver registration support
- Recurring events
- Volunteer portal
- Admin dashboard with statistics
- Bilingual support (English/Chinese)

## File Structure
- `src/app/page.tsx` - Main participant page
- `src/app/admin/page.tsx` - Admin dashboard
- `src/app/volunteer/page.tsx` - Volunteer portal
- `src/app/my-events/page.tsx` - User's event dashboard
- `src/components/` - Reusable UI components
- `src/app/api/` - API routes for CRUD operations
- `src/lib/` - Utilities (translations, email, SMS)
- `src/types/index.ts` - TypeScript type definitions

## Development Guidelines
- Use Tailwind CSS for styling
- Keep components modular and reusable
- Ensure accessibility for users with disabilities
- Test on mobile devices for responsive design
- Use Clerk hooks for authentication (`useUser`)
- Follow existing patterns for Google Sheets integration

