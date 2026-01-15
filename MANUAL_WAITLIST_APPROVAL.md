# Manual Waitlist Approval System

## Overview
This system allows staff to manually review and approve waitlist requests for events that are at full capacity. Users submit waitlist requests, and staff decide who gets added to the waitlist queue.

## User Flow

### For Participants
1. User browses calendar and finds an event they want to attend
2. User clicks on the event and opens the sign-up modal
3. If event is full:
   - Modal shows "Event is Full - Request Waitlist" message
   - User fills out registration form
   - User clicks "Request Waitlist" button
   - Request is submitted with status='waitlist' and NO waitlistPosition
4. User receives confirmation that their request has been submitted
5. Staff reviews request and either approves or rejects it
6. If approved:
   - Request becomes an active waitlist entry with a position number
   - User can be promoted to registered when a spot opens

### For Staff
1. Staff accesses WaitlistManager component for an event
2. Staff sees three sections:
   - **Registered Participants**: Currently registered users
   - **On Waitlist**: Approved waitlist members with position numbers
   - **Pending Requests**: Submitted requests awaiting staff review
3. For pending requests, staff can:
   - Click "Approve" to add person to waitlist with next position number
   - Click "Reject" to deny the request (status changes to 'rejected')
4. For approved waitlist members, staff can:
   - Click "Promote" to move them to registered (if spots available)
5. For registered participants, staff can:
   - Click "Cancel" to remove them and open a spot for promotion

## Three-Tier Status System

### 1. Pending Request (status='waitlist', waitlistPosition=undefined)
- User has submitted a request but not yet reviewed by staff
- Shown in "Pending Waitlist Requests" section
- Staff can approve or reject

### 2. Approved Waitlist (status='waitlist', waitlistPosition=1,2,3...)
- Staff has approved the request and assigned a position
- Shown in "Waitlist" section with queue position
- Staff can promote to registered when spots open

### 3. Rejected (status='rejected')
- Staff has denied the waitlist request
- Not shown in WaitlistManager UI
- Could be displayed in a separate "Rejected Requests" section if needed

## Technical Implementation

### API Endpoints

#### POST /api/registrations/approve-waitlist
Approves a pending waitlist request and assigns a position.

**Request Body:**
```json
{
  "registrationId": "reg_123",
  "eventId": "evt_456",
  "waitlistPosition": 3
}
```

**Response:**
```json
{
  "success": true,
  "message": "Waitlist request approved"
}
```

**Actions:**
- Updates registration status to 'waitlist' with assigned position
- Increments event's currentWaitlist count
- Position is calculated as: `currentWaitlist.length + 1`

#### POST /api/registrations/reject-waitlist
Rejects a pending waitlist request.

**Request Body:**
```json
{
  "registrationId": "reg_123",
  "eventId": "evt_456"
}
```

**Response:**
```json
{
  "success": true,
  "message": "Waitlist request rejected"
}
```

**Actions:**
- Updates registration status to 'rejected'
- Does not affect event capacity or waitlist counts

### Component Updates

#### WaitlistManager.tsx
**New State:**
- `pendingRequests`: Array of registrations with status='waitlist' and no position
- `approving`: ID of request being approved
- `rejecting`: ID of request being rejected

**New Handlers:**
- `handleApproveRequest(registration)`: Approves and assigns position
- `handleRejectRequest(registration)`: Rejects the request

**UI Sections:**
1. Capacity Dashboard (4 columns):
   - Total Capacity
   - Registered
   - On Waitlist
   - Pending Requests

2. Registered Participants:
   - Shows confirmed attendees
   - Cancel button

3. On Waitlist:
   - Shows approved waitlist with position numbers
   - Promote button (enabled when spots available)

4. Pending Waitlist Requests:
   - Shows submitted requests awaiting review
   - Approve button (green)
   - Reject button (red)

#### SignUpModal.tsx
**Updated Text:**
- Button text: "Request Waitlist" (instead of "Join Waitlist")
- Loading text: "Submitting..." (instead of "Registering...")
- Notice text: "you'll submit a waitlist request" and "Staff will review requests and add selected participants to the waitlist"

### Google Sheets Schema

#### Registrations Sheet
- `status`: 'registered' | 'waitlist' | 'rejected' | 'attended' | 'absent' | 'cancelled'
- `waitlistPosition`: Number (only set when staff approves, blank for pending)

**Status Meanings:**
- `waitlist` + no position = Pending request
- `waitlist` + has position = Approved waitlist member
- `rejected` = Staff denied the request

## Staff Workflow Example

### Scenario: Managing a Full Art Workshop

1. **Event State:**
   - Capacity: 10
   - Registered: 10 (FULL)
   - Pending Requests: 5

2. **Staff Reviews Pending Requests:**
   - Alice submitted request 2 days ago
   - Bob submitted request yesterday
   - Carol submitted request today
   - David submitted request today
   - Emily submitted request today

3. **Staff Decisions:**
   - Approve Alice → Position 1
   - Approve Bob → Position 2
   - Reject Carol (doesn't meet criteria)
   - Approve David → Position 3
   - Pending Emily (will decide later)

4. **Updated State:**
   - Registered: 10 (FULL)
   - On Waitlist: 3 (Alice #1, Bob #2, David #3)
   - Pending: 1 (Emily)
   - Rejected: 1 (Carol)

5. **Cancellation Occurs:**
   - One registered participant cancels
   - Registered: 9 (1 spot available)
   - Staff promotes Alice from waitlist
   - Registered: 10 (FULL again)
   - On Waitlist: 2 (Bob #1, David #2) - positions reordered

## Benefits of Manual Approval

1. **Quality Control**: Staff can ensure participants meet requirements
2. **Fairness**: Staff can prioritize based on criteria (e.g., first-timers, seniority)
3. **Capacity Management**: Prevents automatic over-commitment
4. **Flexibility**: Staff can adjust waitlist based on event specifics
5. **Communication**: Staff can contact requesters before approving/rejecting

## Future Enhancements

1. **Email Notifications:**
   - Notify users when request is approved/rejected
   - Notify users when promoted from waitlist

2. **Rejection Reasons:**
   - Add optional reason field when rejecting
   - Store reason for future reference

3. **Bulk Actions:**
   - Approve/reject multiple requests at once
   - Auto-promote multiple waitlist members

4. **Request Notes:**
   - Allow users to add notes with their request
   - Help staff make approval decisions

5. **Priority Levels:**
   - Mark certain requests as high-priority
   - Sort by priority in staff view

6. **Request Expiry:**
   - Auto-reject requests older than X days
   - Clean up stale pending requests

## Integration with Admin Dashboard

To use the WaitlistManager in your admin dashboard:

```tsx
import WaitlistManager from '@/components/WaitlistManager';

// In your admin event view
const [showWaitlistManager, setShowWaitlistManager] = useState(false);

return (
  <>
    <button onClick={() => setShowWaitlistManager(true)}>
      Manage Waitlist
    </button>
    
    {showWaitlistManager && (
      <WaitlistManager
        event={currentEvent}
        onClose={() => setShowWaitlistManager(false)}
        onRefresh={fetchEvents}
      />
    )}
  </>
);
```

## Testing Checklist

- [ ] User can submit waitlist request for full event
- [ ] Request appears in "Pending Requests" section
- [ ] Staff can approve request and assign position
- [ ] Approved request moves to "On Waitlist" section with position
- [ ] Staff can reject request
- [ ] Rejected request disappears from UI
- [ ] Staff can promote from approved waitlist when spots available
- [ ] Position numbers update correctly after promotion
- [ ] Staff can cancel registered participant to open spot
- [ ] Capacity dashboard shows correct counts for all categories
- [ ] Multi-select works with full events (creates pending requests)
- [ ] Bulk registration handles mix of available and full events

## Conclusion

This manual waitlist approval system gives MINDS Singapore staff full control over event capacity management while providing a clear, fair process for participants who want to join full events.
