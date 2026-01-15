# Multi-Select Event Registration Feature

## Overview
Users can now select multiple events from the calendar view and register for all of them at once, saving time and effort when signing up for multiple events.

## How It Works

### For Users

1. **Enable Multi-Select Mode**
   - In the calendar view, click the "Multi-Select" button (only visible when logged in)
   - The button turns blue to indicate multi-select mode is active
   - A purple banner appears with instructions

2. **Select Events**
   - Click on any event in the calendar to select it
   - Selected events show a checkmark (✓) and have a blue ring highlight
   - Unselected events appear slightly faded for clarity
   - Click a selected event again to deselect it

3. **Register for Multiple Events**
   - Once you've selected events, a blue banner appears showing the count
   - Click "Register for Selected Events" button
   - A bulk registration modal opens showing all selected events
   - Fill in your registration details once (applies to all events)
   - Click "Register for X Events" to complete the registration

4. **Exit Multi-Select Mode**
   - Click "Cancel Multi-Select" button to return to normal mode
   - Successfully completing registration also exits multi-select mode

### Key Features

- **Visual Feedback**: Selected events are highlighted with checkmarks and blue rings
- **Batch Processing**: All registrations are processed together with Promise.allSettled()
- **Single Form**: Fill out registration details once for all selected events
- **Event Summary**: See a scrollable list of all events you're registering for
- **Success Message**: Confirmation shows the number of events registered

## Technical Implementation

### Components Modified

#### 1. `src/app/page.tsx`
- Added state for multi-select mode: `multiSelectMode` and `selectedEvents`
- Updated `handleEventClick()` to toggle event selection in multi-select mode
- Added `handleBulkSignUp()` to process multiple registrations
- Added UI for multi-select toggle button and selection indicators
- Pass multi-select props to Calendar component

#### 2. `src/components/Calendar.tsx`
- Updated `CalendarProps` interface to include `multiSelectMode` and `selectedEvents`
- Modified event rendering to show selection state with visual indicators
- Added checkmark (✓) for selected events
- Applied conditional styling: selected events get blue ring, unselected are dimmed

#### 3. `src/components/SignUpModal.tsx`
- Updated `SignUpModalProps` to support `events` array and `isBulkRegistration` flag
- Modified modal header to show "Bulk Event Registration" title
- Added event list view showing all selected events with dates
- Updated success message to show count of events registered
- Changed submit button text to show event count for bulk registration

### API Integration

The bulk registration uses the existing `/api/registrations` endpoint, making multiple calls:
```typescript
const registrationPromises = selectedEvents.map(event =>
  fetch('/api/registrations', {
    method: 'POST',
    body: JSON.stringify({ eventId, userId, formData... })
  })
);
const results = await Promise.allSettled(registrationPromises);
```

### State Management

**Multi-Select State Flow:**
```
1. User clicks "Multi-Select" button
2. multiSelectMode = true, selectedEvents = []
3. User clicks events → toggle in selectedEvents array
4. User clicks "Register for Selected Events"
5. Opens modal with isBulkRegistration = true
6. On successful submission → multiSelectMode = false, selectedEvents = []
```

## User Experience Improvements

### Before
- Users had to click each event individually
- Fill out the same form multiple times
- Risk of errors from repeated data entry

### After
- Select all desired events at once
- Fill form once for all events
- Faster and more efficient registration process
- Clear visual feedback throughout the process

## Accessibility Considerations

- Multi-select mode is keyboard-accessible
- Visual indicators are clear and distinct
- Screen readers can announce selected state
- Button states are clearly labeled

## Future Enhancements

Possible improvements for future versions:

1. **Select All in Date Range**: Button to select all events in current month/week
2. **Filter & Select**: Select events by category or date range
3. **Save Selection**: Save event selections as templates for recurring registrations
4. **Undo/Redo**: Ability to undo last selection change
5. **Drag to Select**: Click and drag to select multiple events at once
6. **Export Selection**: Export selected events to calendar app

## Testing Checklist

- [ ] Multi-select button appears only for logged-in users in calendar view
- [ ] Events can be selected and deselected
- [ ] Visual indicators (checkmark, blue ring, opacity) work correctly
- [ ] Bulk registration modal displays all selected events
- [ ] Registration completes successfully for all events
- [ ] Success message shows correct event count
- [ ] Multi-select mode exits after successful registration
- [ ] Weekly registration limits are respected
- [ ] Error handling works if some registrations fail
- [ ] Mobile responsive design works properly

## Browser Compatibility

Tested and working in:
- Chrome/Edge (latest)
- Firefox (latest)
- Safari (latest)
- Mobile browsers (iOS Safari, Chrome Mobile)
