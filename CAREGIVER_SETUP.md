# Caregiver Feature - Quick Setup Guide

## ✅ What's Been Implemented

The caregiver feature allows caregivers to register on behalf of persons under their care. Staff dashboards show the **participant's name** (not caregiver name) for accurate tracking.

## 🎯 Key Changes

### User Experience
1. **"I am a caregiver" checkbox** - Shown on registration forms
2. **Participant name field** - Appears when checkbox is checked
3. **Dynamic labels** - "Full Name" changes to "Caregiver Name"
4. **Staff dashboards** - Always show participant name
5. **Smart form** - "Caregiver accompanying" section hidden when registering as caregiver (since you ARE the caregiver)

### Google Sheets
**Add these columns to Registrations sheet:**
- **Column S**: `IsCaregiver` (values: "true" or "false")
- **Column T**: `ParticipantName` (name of person under care)

## 📋 Setup Steps

### 1. Update Google Sheets (REQUIRED)
```
1. Open your Google Sheets
2. Go to "Registrations" sheet
3. Add column header in S1: "IsCaregiver"
4. Add column header in T1: "ParticipantName"
5. Done!
```

### 2. Test the Feature
```
1. Go to homepage → Click any event
2. Check ☑️ "I am a caregiver registering on behalf of someone under my care"
3. Enter participant name in the new field
4. Complete registration
5. Go to Admin Dashboard → View event participants
6. Verify: Participant name is shown (not caregiver name)
```

## 💡 How It Works

**Example:**
- Caregiver: "Jane Doe" (caregiver@email.com)
- Participant: "John Smith"
- **Admin Dashboard Shows**: "John Smith"
- **Contact Info**: caregiver@email.com

## 📁 Files Modified

1. ✅ `src/types/index.ts` - Added isCaregiver and participantName fields
2. ✅ `src/components/SignUpModal.tsx` - Added caregiver checkbox and fields
3. ✅ `src/components/WaitlistManager.tsx` - Shows participant names in dashboards
4. ✅ `src/app/api/registrations/route.ts` - Stores caregiver data
5. ✅ `src/app/page.tsx` - Sends caregiver info during registration

## 🎉 Ready to Use!

Once you've added the two columns to Google Sheets (Step 1 above), the feature is fully functional!

For detailed documentation, see `CAREGIVER_FEATURE.md`
