# Caregiver Feature

## Overview

Caregivers can register on behalf of persons under their care. Staff dashboards display the **participant's name** (not caregiver name) for accurate attendance tracking.

## For Caregivers

### Registering on Behalf of Someone

1. Click on an event to open the registration form
2. Check **"I am a caregiver registering on behalf of someone under my care"**
3. Enter the **participant's name** in the new field
4. Complete registration with your contact details
5. Staff will see the participant's name in dashboards

### What Gets Stored

| Field | Value |
|-------|-------|
| User Name | Caregiver's name |
| Participant Name | Person under care's name |
| Contact Info | Caregiver's email/phone |
| Is Caregiver | TRUE |

## For Staff

### Dashboard Display

- **Participant name** is shown prominently (not caregiver name)
- **Purple "Caregiver" badge** indicates caregiver registration
- **Contact info** shows caregiver's details for communication
- Hover over badge to see caregiver name

### Example

> **John Smith** [👤 Caregiver]  
> jane.doe@email.com • 555-1234  
> 👥 Caregiver: Jane Doe

## Google Sheets Columns

Add to **Registrations** sheet:
- `IsCaregiver` - TRUE or FALSE
- `ParticipantName` - Name of person under care

## Notes

- When "I am a caregiver" is checked, the "Caregiver accompanying" section is hidden (since you ARE the caregiver)
- Form label changes from "Full Name" to "Caregiver Name"
- All existing registration features work with caregiver registrations

