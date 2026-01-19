# Recurring Events Feature

## Overview

Staff can create multiple event instances with the same settings across different dates. All recurring events share the same details but have independent registrations.

## For Staff (Admin Panel)

### Creating Recurring Events

1. Go to **Admin Dashboard** → **Events** tab
2. Click **"+ Add New Event"**
3. Fill in event details (title, time, location, etc.)
4. Check **"Recurring Event"** checkbox
5. Use the date picker to add multiple dates
6. Click **"Add Event"** - creates all events at once

### Visual Indicators

Recurring events are marked with a **🔄** icon throughout the app:
- Admin Panel: Purple "🔄 Recurring" badge
- Calendar View: 🔄 icon before event title
- Event List: Purple "🔄 Recurring" badge
- Sign Up Modal: "🔄 Recurring Event" badge

## How It Works

- Each date creates a separate event linked by `recurringGroupId`
- Events have independent sign-ups and attendance
- Edit/delete individual events (doesn't affect others in series)

## Example: Weekly Art Class

1. Create event: "Beginner Painting Class"
2. Check "Recurring Event"
3. Add 4 consecutive Saturdays
4. Submit → Creates 4 linked events

## Google Sheets Columns

**Events Sheet:**
- `RecurringGroupId` - Links events in a series
- `IsRecurring` - TRUE/FALSE flag

## Notes

- **No bulk editing**: Editing one event doesn't update others
- **No bulk deletion**: Delete each event individually
- **Independent signups**: Each event tracks its own registrations

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
