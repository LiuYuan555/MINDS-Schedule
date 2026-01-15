# Waitlist Feature Documentation

## Overview
The waitlist feature automatically manages event capacity overflow by allowing users to join a waitlist when an event is full. Staff can then promote waitlist members when spots become available.

## User Experience

### For Participants

#### Registering for a Full Event:
1. When viewing an event that's at capacity, users see:
   - **"Event is full - Join waitlist"** badge
   - Number of people currently on waitlist
   - **Yellow notice banner** explaining they'll be added to waitlist
   - Estimated waitlist position

2. The registration form remains the same, but:
   - Submit button changes to **"Join Waitlist"** (yellow color)
   - Same information collected for waitlist members

3. After joining waitlist:
   - Success message confirms waitlist registration
   - Staff will be notified to contact them if spots open up

#### Multi-Select with Full Events:
- Multi-select feature works with waitlist
- Users can select mix of available events and full events
- Bulk registration will:
  - Register for available events
  - Add to waitlist for full events

### For Staff/Admin

#### Waitlist Management Interface:
Staff can access the **Waitlist Manager** for any event:

**Dashboard Shows:**
- 📊 **Capacity Summary**
  - Total capacity
  - Number registered
  - Number on waitlist
  - Available spots for promotion

- ✅ **Registered Participants List**
  - All confirmed registrations
  - Option to cancel registrations (opens spot for waitlist)

- ⏰ **Waitlist Queue**
  - Ordered list by join time
  - Position numbers (1st, 2nd, 3rd, etc.)
  - One-click promotion to registered status

#### Promoting from Waitlist:
1. When a spot opens (via cancellation or capacity increase):
   - Staff sees promotion is available
   - Click **"Promote"** button next to waitlist member
   - System automatically:
     - Changes status from 'waitlist' to 'registered'
     - Updates event capacity counts
     - Reorders remaining waitlist positions
     - Records promotion timestamp

2. The promoted user:
   - Moves from waitlist to registered list
   - Can be contacted by staff about the spot opening

## Technical Implementation

### Database Schema (Google Sheets)

#### Registrations Sheet - New Columns:
- **Column I**: `status` - Now includes 'waitlist' option
- **Column J**: `waitlistPosition` - Position in queue (1, 2, 3, etc.)
- **Column Q**: `promotedAt` - Timestamp when promoted from waitlist

#### Events Sheet - New Column:
- **Column U**: `currentWaitlist` - Count of waitlist members

### API Endpoints

#### POST `/api/registrations`
**Enhanced to handle waitlist:**
```typescript
// When event is full:
- Set status = 'waitlist'
- Calculate waitlistPosition
- Increment event.currentWaitlist
- Don't increment event.currentSignups
```

#### POST `/api/registrations/promote`
**New endpoint for promotion:**
```typescript
{
  registrationId: string,
  eventId: string
}
// Returns: Success/error message
```

#### PATCH `/api/registrations/:id`
**Cancel registration:**
- Changes status to 'cancelled'
- Decrements event.currentSignups
- Opens spot for promotion

### Components

#### `WaitlistManager.tsx`
**Admin interface showing:**
- Registered participants with cancel option
- Waitlist queue with promote option
- Real-time capacity tracking
- Visual position indicators

#### `SignUpModal.tsx`
**Enhanced with:**
- Full event detection
- Waitlist notice banner
- Dynamic button text and color
- Waitlist position estimation

### Business Logic

#### Automatic Waitlist Assignment:
```typescript
if (eventCapacity && currentSignups >= eventCapacity) {
  status = 'waitlist';
  waitlistPosition = currentWaitlist + 1;
} else {
  status = 'registered';
}
```

#### Promotion Logic:
```typescript
// When promoting:
1. Check event has available capacity
2. Change registration status: waitlist → registered
3. Increment event.currentSignups
4. Decrement event.currentWaitlist
5. Reorder remaining waitlist positions
6. Record promotedAt timestamp
```

#### Position Reordering:
When someone is promoted or leaves waitlist:
- All members below them move up one position
- Maintains FIFO (First In, First Out) order

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
