# Remove Participant Feature

## Overview

Staff can remove participants from events through the Admin Dashboard. Removed registrations are logged to a removal history for audit purposes.

## How to Use

1. Go to **Admin Dashboard** → **Attendance** tab
2. Select an event from the dropdown
3. Find the participant to remove
4. Click the **red "Remove" button**
5. Confirm the removal

## Visual Indicators

| State | Display |
|-------|---------|
| Active Registration | White background, status dropdown enabled |
| Cancelled/Removed | Red background, strikethrough name, "Cancelled" badge |
| Caregiver Registration | Purple "👤 Caregiver" badge, participant name shown |

## Removal History

When participants are removed:
- Registration is deleted from the active list
- A record is logged to the **RemovalHistory** sheet
- History shows: who was removed, by whom, when, and reason

### View Removal History
Scroll to the bottom of the Attendance tab to see removal history for the selected event.

## Google Sheets Setup

Add a **RemovalHistory** sheet with these headers:

```
ID | OriginalRegistrationID | EventID | EventTitle | UserID | UserName | UserEmail | UserPhone | RegistrationType | IsCaregiver | ParticipantName | RemovedBy | Reason | RemovedAt
```

- ✅ Waitlist management (removing opens spots)
- ✅ Event capacity counts
- ✅ Registration status updates

## 📊 Impact on Data

When a participant is removed:
1. Registration status → `'cancelled'`
2. Event capacity count decreases
3. Spot becomes available for waitlist promotion
4. Record is preserved in Google Sheets (not deleted)

## 🎉 Ready to Use!

The feature is fully implemented and ready to use in the Admin Dashboard's Attendance tab!
