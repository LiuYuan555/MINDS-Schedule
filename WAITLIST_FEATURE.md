# Waitlist Feature

## Overview

The waitlist system manages event capacity overflow. When an event is full, users can request to join the waitlist. Staff review and approve requests, then promote waitlist members when spots become available.

## For Participants

### Joining the Waitlist
1. Click on an event that's at full capacity
2. You'll see an "Event is Full - Request Waitlist" message
3. Fill out the registration form as usual
4. Click **"Request Waitlist"** button
5. Staff will review your request and notify you if approved

### Multi-Select with Waitlist
- Multi-select registration works with full events
- Select any combination of available and full events
- Available events register immediately
- Full events are added as waitlist requests

## For Staff

### Managing Waitlist (Admin Dashboard)

Access the **Waitlist Manager** from the Attendance tab:

1. **Capacity Dashboard** - Shows total capacity, registered count, and waitlist count
2. **Registered Participants** - View confirmed registrations with cancel option
3. **On Waitlist** - Approved waitlist members with position numbers
4. **Pending Requests** - New requests awaiting staff review

### Workflow

1. **Review Requests**: See new waitlist requests in "Pending Requests"
2. **Approve/Reject**: Click approve to add to waitlist queue, or reject to deny
3. **Promote**: When spots open, click "Promote" to move waitlist members to registered

## Status Reference

| Status | Description |
|--------|-------------|
| `waitlist` (no position) | Pending request awaiting staff review |
| `waitlist` (with position) | Approved and in queue |
| `registered` | Confirmed registration |
| `rejected` | Request denied by staff |

## Google Sheets Columns

**Registrations Sheet:**
- `Status` - Include 'waitlist' and 'rejected' options
- `WaitlistPosition` - Position in queue (1, 2, 3...)
- `PromotedAt` - Timestamp when promoted from waitlist

**Events Sheet:**
- `CurrentWaitlist` - Count of approved waitlist members


## User Stories

### Story 1: User Joins Waitlist
**Given** an event is at full capacity  
**When** a user tries to register  
**Then** they are added to waitlist with position number  
**And** they receive confirmation of waitlist status

### Story 2: Staff Promotes from Waitlist
**Given** a registered participant cancels  
**When** staff opens waitlist manager  
**Then** they see promotion is available  
**And** they can promote the first person in queue  
**And** that person's status changes to registered

### Story 3: Multi-Event with Waitlist
**Given** user selects 5 events, 2 are full  
**When** they submit bulk registration  
**Then** they are registered for 3 available events  
**And** waitlisted for 2 full events  
**And** success message reflects both outcomes

## UI/UX Highlights

### Visual Indicators:
- 🔴 **Red text**: "Event is full"
- 🟡 **Yellow badge**: Waitlist status
- 🟢 **Green badge**: Spots available
- 📍 **Position number**: Circular badge showing queue position

### Color Coding:
- **Blue buttons**: Regular registration
- **Yellow buttons**: Join waitlist
- **Green buttons**: Promote action
- **Red buttons**: Cancel action

### Accessibility:
- Clear status messages
- Position indicators
- Confirmation dialogs
- Disabled states when actions unavailable

## Staff Workflow

### Managing Full Events:
1. **Monitor capacity** through admin dashboard
2. When event fills:
   - Waitlist automatically starts accepting
   - No action needed by staff
3. When spot opens:
   - Open Waitlist Manager for event
   - Review waitlist queue
   - Click "Promote" for next person
   - Contact promoted person to confirm

### Proactive Management:
- Review waitlists regularly
- Contact waitlist members about status
- Increase capacity if possible
- Create additional event dates for high-demand activities

## Future Enhancements

Possible additions:
- **Automated promotion**: Auto-promote when spot opens
- **Email notifications**: Alert waitlist members of promotion
- **SMS notifications**: Text when spot becomes available
- **Waitlist preferences**: Let users set max wait time
- **Bulk promotion**: Promote multiple at once when capacity increases
- **Waitlist analytics**: Track conversion rates and wait times
- **Priority waitlist**: VIP or membership-based priority

## Testing Checklist

- [ ] User can join waitlist for full event
- [ ] Waitlist position is correct
- [ ] Multi-select works with waitlisted events
- [ ] Staff can view waitlist in manager
- [ ] Promotion changes status correctly
- [ ] Event counts update accurately
- [ ] Position reordering works
- [ ] Cancellation opens spot for promotion
- [ ] UI shows correct button text and colors
- [ ] Capacity summary displays correctly
- [ ] Mobile responsive waitlist manager

## Google Sheets Setup

### New Columns to Add:

**Registrations Sheet:**
- Column J: `waitlistPosition` (number)
- Column Q: `promotedAt` (datetime)

**Events Sheet:**
- Column U: `currentWaitlist` (number)

### Formula Updates:
The currentWaitlist count can be calculated with:
```
=COUNTIFS(Registrations!B:B, A2, Registrations!I:I, "waitlist")
```
