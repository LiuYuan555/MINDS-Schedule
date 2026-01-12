<!-- Use this file to provide workspace-specific custom instructions to Copilot. For more details, visit https://code.visualstudio.com/docs/copilot/copilot-customization#_use-a-githubcopilotinstructionsmd-file -->

# MINDS Singapore Event Scheduling Platform

This is a Next.js application for MINDS Singapore to manage event scheduling and sign-ups.

## Tech Stack
- Next.js 15 with App Router
- TypeScript
- Tailwind CSS
- Google Sheets API for backend storage

## Key Features
- Calendar month view for browsing events
- List view for detailed event browsing
- Event sign-up modal with form validation
- Google Sheets integration for storing registrations

## File Structure
- `src/app/page.tsx` - Main page component
- `src/components/` - Reusable UI components (Calendar, EventList, SignUpModal)
- `src/data/events.ts` - Event data and category colors
- `src/types/` - TypeScript type definitions
- `src/app/api/signup/route.ts` - API route for Google Sheets integration

## Development Guidelines
- Use Tailwind CSS for styling
- Keep components modular and reusable
- Ensure accessibility for users with disabilities
- Test on mobile devices for responsive design
