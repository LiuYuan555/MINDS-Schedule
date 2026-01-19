# Removal History Setup

When staff remove participants, registrations are deleted and logged to a **RemovalHistory** sheet for audit purposes.

## Google Sheets Setup

### Create the RemovalHistory Sheet

1. Open your Google Spreadsheet
2. Create a new sheet named exactly: **RemovalHistory**
3. Add these headers in Row 1:

```
ID	OriginalRegistrationID	EventID	EventTitle	UserID	UserName	UserEmail	UserPhone	RegistrationType	IsCaregiver	ParticipantName	RemovedBy	Reason	RemovedAt
```

| Column | Header | Description |
|--------|--------|-------------|
| A | ID | Unique removal record ID |
| B | OriginalRegistrationID | Original registration ID |
| C | EventID | Event ID |
| D | EventTitle | Event title |
| E | UserID | User's ID |
| F | UserName | User/caregiver name |
| G | UserEmail | Email address |
| H | UserPhone | Phone number |
| I | RegistrationType | participant or volunteer |
| J | IsCaregiver | TRUE if caregiver |
| K | ParticipantName | Participant name (if caregiver) |
| L | RemovedBy | Staff member email |
| M | Reason | Removal reason |
| N | RemovedAt | Timestamp |

## How It Works

1. Staff clicks **Remove** on a participant in the Attendance tab
2. Confirms the removal
3. System:
   - Logs the registration to RemovalHistory
   - Deletes from Registrations sheet
   - Updates event capacity counts
4. Removal history appears at bottom of Attendance tab


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
