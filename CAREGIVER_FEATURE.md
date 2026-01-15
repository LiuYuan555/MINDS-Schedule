# Caregiver Feature Implementation

## Overview
This feature allows caregivers to register on behalf of persons under their care. When caregivers register, the participant's name (not the caregiver's name) is displayed in staff dashboards for accurate attendance tracking.

## How It Works

### For Caregivers
1. **Account Creation**: When creating an account or registering for an event, check the **"I am a caregiver registering on behalf of someone under my care"** checkbox
2. **Participant Name**: Enter the name of the person under your care
3. **Registration**: The caregiver's contact information is saved, but the participant's name is what staff will see

### For Participants (Self-Registration)
1. **No Change**: If not a caregiver, leave the checkbox unchecked
2. **Own Name**: Your own name will be displayed in staff dashboards

### For Staff
1. **Dashboard Display**: The admin dashboard shows the **participant's name** (person under care) instead of the caregiver's name
2. **Contact Information**: Contact details (email, phone) remain the caregiver's information for communication

## User Interface

### Registration Form
When the "I am a caregiver" checkbox is checked:
- The form shows **"Caregiver Name"** label (instead of "Full Name")
- A new field appears: **"Name of Person Under Your Care"**  (required)
- This participant name will be shown to staff

## Google Sheets Structure

### New Columns Added to Registrations Sheet

| Column | Name | Data Type | Description |
|--------|------|-----------|-------------|
| S | isCaregiver | Boolean | "true" if registrant is a caregiver, "false" otherwise |
| T | participantName | String | Name of the actual participant (if registered by caregiver) |

### Updated Range
- **Old**: `Registrations!A:P` (16 columns)
- **New**: `Registrations!A:T` (20 columns)

### Full Column Structure (Registrations Sheet)
```
A: ID
B: EventID
C: EventTitle
D: UserID
E: UserName (caregiver name if isCaregiver=true)
F: UserEmail
G: UserPhone
H: RegistrationType
I: Status
J: DietaryRequirements
K: SpecialNeeds
L: NeedsWheelchairAccess
M: HasCaregiverAccompanying
N: CaregiverName
O: CaregiverPhone
P: RegisteredAt
Q: WaitlistPosition
R: PromotedAt
S: IsCaregiver (NEW)
T: ParticipantName (NEW)
```

## Display Logic

The system uses this logic to determine which name to display:

```typescript
const getDisplayName = (registration: Registration): string => {
  return registration.isCaregiver && registration.participantName 
    ? registration.participantName 
    : registration.userName;
};
```

**Examples:**
- Caregiver "Jane Doe" registers for "John Smith" → Staff sees **"John Smith"**
- Participant "Mary Lee" registers for herself → Staff sees **"Mary Lee"**

## Components Updated

### 1. SignUpModal.tsx
- Added `isCaregiver` checkbox
- Added `participantName` input field (shown when checkbox is checked)
- Updated form data interface to include new fields
- Label changes dynamically ("Full Name" vs "Caregiver Name")

### 2. WaitlistManager.tsx
- Added `getDisplayName()` helper function
- All participant lists now show participant name (not caregiver name)
- Updated confirmation dialogs to use display name
- Applies to: registered list, waitlist, and pending requests

### 3. Types (index.ts)
- Updated `User` interface with `isCaregiver` and `participantName`
- Updated `Registration` interface with `isCaregiver` and `participantName`
- Updated `SignUpFormData` interface with new fields

### 4. API Routes
- `/api/registrations` POST endpoint now accepts and stores caregiver data
- New columns (S and T) added to Google Sheets integration

### 5. Main Page (page.tsx)
- Both single and bulk registration now send caregiver information
- Data is passed through to API correctly

## Benefits

✅ **Accurate Attendance**: Staff see the actual participant names  
✅ **Easy Communication**: Caregiver contact information retained  
✅ **Flexibility**: Works for both caregiver and self-registration  
✅ **Consistent Experience**: Same registration flow, just with optional checkbox  
✅ **Data Integrity**: Clear distinction between caregiver and participant in database  

## Setup Instructions

### 1. Update Google Sheets
Add two new columns to your `Registrations` sheet:
1. **Column S**: Header "IsCaregiver"
2. **Column T**: Header "ParticipantName"

### 2. No Code Changes Needed
All code changes have been implemented. The feature is ready to use!

### 3. Test the Feature
1. Go to homepage and click on an event
2. Check the "I am a caregiver" checkbox
3. Enter participant name
4. Submit registration
5. Go to admin dashboard and verify participant name is displayed

## Example Scenarios

### Scenario 1: Caregiver Registration
- **User**: Jane Doe (caregiver)
- **Participant**: John Smith (person under care)
- **Staff Dashboard Shows**: "John Smith"
- **Contact**: jane.doe@example.com, 555-0123

### Scenario 2: Self Registration
- **User**: Mary Lee (participant herself)
- **Participant**: Mary Lee
- **Staff Dashboard Shows**: "Mary Lee"
- **Contact**: mary.lee@example.com, 555-0456

## Future Enhancements

Potential improvements for this feature:

1. **User Profile**: Save caregiver/participant relationship in User account
2. **Auto-fill**: Automatically fill participant name from saved profile
3. **Multiple Participants**: Allow one caregiver to manage multiple participants
4. **Relationships**: Track relationship type (parent, guardian, aide, etc.)
5. **Participant Profiles**: Create separate profiles for participants under care

## Support

If you encounter any issues:
1. Verify Google Sheets has columns S and T in Registrations sheet
2. Check that "IsCaregiver" column has "true"/"false" values
3. Ensure "ParticipantName" column contains participant names for caregiver registrations
4. Review browser console for any errors during registration
