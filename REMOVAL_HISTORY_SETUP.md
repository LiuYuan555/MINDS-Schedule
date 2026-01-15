# Removal History Setup

## Overview
When staff remove participants from events, the system now **completely deletes** the registration (rather than just marking it as "cancelled"). To maintain an audit trail, all removed registrations are logged to a `RemovalHistory` sheet.

## Google Sheets Setup

### Create the RemovalHistory Sheet

1. Open your Google Spreadsheet (ID: `1mYjAHZdAeMPvjg222dh-9VAp-M5ybfWUO89XWKl6boE`)

2. Create a new sheet named exactly: **RemovalHistory**

3. Add the following headers in row 1 (columns A through N):

**Quick Copy-Paste (for Row 1):**
```
ID	OriginalRegistrationID	EventID	EventTitle	UserID	UserName	UserEmail	UserPhone	RegistrationType	IsCaregiver	ParticipantName	RemovedBy	Reason	RemovedAt
```

**Detailed Column Reference:**

| Column | Header | Description |
|--------|--------|-------------|
| A | ID | Unique ID for the removal record |
| B | OriginalRegistrationID | ID of the original registration |
| C | EventID | ID of the event |
| D | EventTitle | Title of the event |
| E | UserID | ID of the user who was removed |
| F | UserName | Name of the user/caregiver |
| G | UserEmail | Email address |
| H | UserPhone | Phone number |
| I | RegistrationType | Type (e.g., "participant", "volunteer") |
| J | IsCaregiver | TRUE if registrant was a caregiver |
| K | ParticipantName | Name of participant (if caregiver) |
| L | RemovedBy | Email of staff member who removed them |
| M | Reason | Optional reason for removal |
| N | RemovedAt | Timestamp of removal |

## How It Works

### For Staff

1. Go to the **Attendance** tab in the admin dashboard
2. Select an event from the dropdown
3. Find the participant you want to remove
4. Click the **Remove** button
5. Confirm the removal in the dialog
6. The participant is **completely removed** from the attendance list
7. A record is added to the **Removal History** section at the bottom

### Technical Details

- **DELETE Endpoint**: `/api/registrations?registrationId={id}&removedBy={email}`
- **History Endpoint**: `/api/registrations/history?eventId={id}`
- The DELETE operation:
  1. Fetches the registration data
  2. Logs it to RemovalHistory sheet
  3. Deletes the row from Registrations sheet
  4. Updates event capacity counts
  5. Returns success

### Display Logic

The removal history section shows:
- Participant name (or caregiver name if not a caregiver)
- Caregiver badge if applicable
- Contact information (email, phone)
- Reason for removal (if provided)
- Who removed them and when

## Benefits

✅ **Clean Attendance Lists**: Removed participants don't clutter the attendance sheet  
✅ **Audit Trail**: Complete history of all removals for reporting and accountability  
✅ **Caregiver Support**: Correctly displays participant names for caregiver registrations  
✅ **Staff Accountability**: Tracks which staff member made each removal  
✅ **Historical Reporting**: Can analyze removal patterns and reasons over time

## Example Data

Here's what a removal record looks like:

```
ID: rem_1234567890
OriginalRegistrationID: reg_abc123
EventID: evt_xyz789
EventTitle: Art Workshop - January 15
UserID: user_123
UserName: Jane Smith (Caregiver)
UserEmail: jane@example.com
UserPhone: (555) 123-4567
RegistrationType: participant
IsCaregiver: TRUE
ParticipantName: John Smith
RemovedBy: admin@minds.org
Reason: Participant no longer available
RemovedAt: 2024-01-10T14:30:00.000Z
```

## Migration Notes

- Existing "cancelled" registrations remain as-is
- New removals will completely delete the registration
- Consider running a script to move old cancelled registrations to RemovalHistory if desired
- The RemovalHistory sheet will be empty initially and populate as removals occur

## Future Enhancements

Potential additions:
- Bulk removal with reason
- Export removal history to CSV
- Removal analytics dashboard
- Restore removed registrations
- Email notifications for removals
