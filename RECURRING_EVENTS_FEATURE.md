# Recurring Events Feature

This document describes the recurring events feature that allows staff to create multiple event instances with the same settings across different dates.

## Overview

Staff can create an event once and schedule it to repeat on multiple dates. All recurring event instances share the same settings (time, location, capacity, volunteers needed, etc.) but have different dates.

## How It Works

### For Staff (Admin Panel)

1. **Create Event**: Go to `/admin` and fill out the event form
2. **Enable Recurring**: Check the "Recurring Event" checkbox
3. **Select Dates**: Use the date picker to select multiple dates
4. **Add Dates**: Click "Add Date" for each date you want
5. **Review**: See all selected dates in the list below
6. **Remove Dates**: Click "Remove" next to any date to delete it
7. **Submit**: Click "Add Event" - all events will be created at once

### Visual Indicators

Recurring events are marked with a 🔄 icon/badge throughout the app:

- **Admin Panel**: Purple "🔄 Recurring" badge in events list
- **Calendar View**: 🔄 icon before event title
- **Event List**: Purple "🔄 Recurring" badge next to event title
- **Sign Up Modal**: "🔄 Recurring Event" badge in event details

## Technical Implementation

### Database Schema (Google Sheets)

Two new columns were added to the Events sheet:

| Column | Field | Type | Description |
|--------|-------|------|-------------|
| S | RecurringGroupId | string | Unique ID linking all events in a recurring series |
| T | IsRecurring | boolean | Flag indicating if event is part of a recurring series |

### Data Structure

```typescript
interface Event {
  // ...existing fields...
  recurringGroupId?: string;  // Links related recurring events
  isRecurring?: boolean;       // Marks event as recurring
}
```

### API Changes

**POST /api/events**
- Accepts `isRecurring` (boolean) and `recurringDates` (string[]) parameters
- When creating a recurring event:
  - Generates unique `recurringGroupId` using timestamp
  - Creates one event for each date in `recurringDates`
  - Links all events with the same `recurringGroupId`
  - Sets `isRecurring: true` for all events
- Returns array of created events

**GET /api/events**
- Extended range from `A2:S` to `A2:T` to include recurring fields
- Maps columns 18-19 to `recurringGroupId` and `isRecurring`

**PUT /api/events**
- Preserves `recurringGroupId` and `isRecurring` when updating events
- Note: Editing a recurring event only updates that specific instance

**DELETE /api/events**
- Deletes individual event instances
- Note: Does not automatically delete other events in the series

### Frontend Components

**Admin Panel (`/src/app/admin/page.tsx`)**
- Added recurring checkbox and date picker UI
- Form validation ensures at least one date selected when recurring enabled
- Success message shows count of events created
- Visual badge for recurring events in events list

**Calendar (`/src/components/Calendar.tsx`)**
- Shows 🔄 icon before event title for recurring events

**Event List (`/src/components/EventList.tsx`)**
- Shows purple "🔄 Recurring" badge next to event title

**Sign Up Modal (`/src/components/SignUpModal.tsx`)**
- Shows "🔄 Recurring Event" badge in event details section

## Usage Examples

### Creating a Weekly Art Class

1. Fill out event details:
   - Title: "Beginner Painting Class"
   - Time: "2:00 PM - 4:00 PM"
   - Location: "Art Studio B"
   - Capacity: 15 participants
   
2. Check "Recurring Event"

3. Add dates for 4 consecutive Saturdays:
   - 2026-01-18
   - 2026-01-25
   - 2026-02-01
   - 2026-02-08

4. Submit - creates 4 separate events linked by `recurringGroupId`

### Benefits

- ✅ Save time creating similar events
- ✅ Maintain consistency across event series
- ✅ Easy to identify related events
- ✅ Users can sign up for individual sessions
- ✅ Each event tracks its own attendance

## Limitations & Notes

### Current Limitations

1. **No Bulk Editing**: Editing one recurring event doesn't update others in the series
2. **No Bulk Deletion**: Must delete each event instance individually
3. **Independent Signups**: Each event has its own sign-up list
4. **No Series Management**: Can't view/manage all events in a series together

### Design Decisions

- **Why separate events?** Allows flexibility - each session can have different attendance, be cancelled individually, etc.
- **Why not auto-delete series?** Prevents accidental deletion of all events when removing one instance
- **Why no bulk edit?** Keeps implementation simple and prevents complex conflict scenarios

## Future Enhancements

Potential improvements for future development:

1. **Series Management Panel**
   - View all events in a recurring series
   - Bulk edit/delete functionality
   - "Edit this event" vs "Edit series" options

2. **Smart Scheduling**
   - "Repeat every X days/weeks" instead of manual date selection
   - End date or occurrence count options
   - Skip holidays automatically

3. **Series-Level Operations**
   - Cancel entire series
   - Update all future events in series
   - Clone series to new dates

4. **Enhanced UI**
   - Group recurring events in calendar/list views
   - Show "1 of 4" indicator for series position
   - Link to view other events in series

## Files Modified

- `/src/types/index.ts` - Added recurring fields to Event interface
- `/src/app/api/events/route.ts` - Updated all CRUD endpoints
- `/src/app/admin/page.tsx` - Added recurring UI and logic
- `/src/components/Calendar.tsx` - Added recurring badge
- `/src/components/EventList.tsx` - Added recurring badge
- `/src/components/SignUpModal.tsx` - Added recurring badge

## Testing Checklist

- [ ] Create recurring event with multiple dates
- [ ] Verify all events created successfully
- [ ] Check recurring badges appear in all views
- [ ] Edit one recurring event - others unchanged
- [ ] Delete one recurring event - others remain
- [ ] Sign up for individual recurring event instances
- [ ] Verify Google Sheets shows correct recurringGroupId and isRecurring values
