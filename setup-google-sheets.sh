#!/bin/bash

# MINDS Schedule - Google Sheets Setup Helper
# This script will guide you through the Google Sheets integration setup

echo "================================================"
echo "  MINDS Schedule - Google Sheets Setup Helper  "
echo "================================================"
echo ""

# Check if .env.local exists
if [ -f .env.local ]; then
    echo "✅ Found .env.local file"
else
    echo "❌ .env.local not found!"
    echo "   Creating .env.local file..."
    cat > .env.local << 'EOF'
# MINDS Schedule Environment Variables

# Clerk Authentication (Required)
NEXT_PUBLIC_CLERK_PUBLISHABLE_KEY=pk_...
CLERK_SECRET_KEY=sk_...

# Google Sheets Configuration (Required)
GOOGLE_SERVICE_ACCOUNT_KEY='PASTE_YOUR_JSON_KEY_HERE'
GOOGLE_SPREADSHEET_ID=PASTE_YOUR_SPREADSHEET_ID_HERE

# Optional: Email Notifications (Resend)
# RESEND_API_KEY=re_...

# Optional: SMS Notifications (Twilio)
# TWILIO_ACCOUNT_SID=AC...
# TWILIO_AUTH_TOKEN=...
# TWILIO_PHONE_NUMBER=+1...
EOF
    echo "✅ Created .env.local file"
fi

echo ""
echo "📋 Setup Checklist:"
echo ""
echo "1. Create Google Cloud Project"
echo "   → https://console.cloud.google.com/"
echo "   → Create new project: 'MINDS Schedule'"
echo ""
echo "2. Enable Google Sheets API"
echo "   → APIs & Services → Library"
echo "   → Search 'Google Sheets API' → Enable"
echo ""
echo "3. Create Service Account"
echo "   → APIs & Services → Credentials"
echo "   → Create Credentials → Service Account"
echo "   → Download JSON key file"
echo ""
echo "4. Create Google Spreadsheet"
echo "   → https://sheets.google.com"
echo "   → Create new spreadsheet: 'MINDS Events Database'"
echo "   → Create sheets: 'Events', 'Registrations', 'Users'"
echo "   → See GOOGLE_SHEETS_TEMPLATE.md for column headers"
echo ""
echo "5. Share Sheet with Service Account"
echo "   → Click Share button in Google Sheets"
echo "   → Add service account email (from JSON file)"
echo "   → Give 'Editor' permission"
echo ""
echo "6. Update .env.local"
echo "   → Open .env.local in your editor"
echo "   → Add Clerk API keys"
echo "   → Replace GOOGLE_SERVICE_ACCOUNT_KEY with JSON contents"
echo "   → Replace GOOGLE_SPREADSHEET_ID with your sheet ID"
echo ""
echo "7. Set Up Admin Access in Clerk"
echo "   → Go to Clerk Dashboard → Users"
echo "   → Select staff user → Edit Public metadata"
echo "   → Add: {\"role\": \"admin\"}"
echo ""
echo "8. Restart dev server"
echo "   → npm run dev"
echo ""
echo "================================================"
echo ""

# Check if variables are set
if grep -q "PASTE_YOUR_JSON_KEY_HERE" .env.local 2>/dev/null; then
    echo "⚠️  Action Required: Update .env.local with your credentials"
    echo ""
    echo "   Open .env.local and:"
    echo "   1. Add your Clerk API keys"
    echo "   2. Replace PASTE_YOUR_JSON_KEY_HERE with your service account JSON"
    echo "   3. Replace PASTE_YOUR_SPREADSHEET_ID_HERE with your spreadsheet ID"
    echo ""
else
    echo "✅ .env.local appears to be configured"
    echo ""
    echo "   Run 'npm run dev' to start the server"
    echo ""
fi

echo "📚 Documentation:"
echo "   - Full guide: GOOGLE_SHEETS_SETUP.md"
echo "   - Template: GOOGLE_SHEETS_TEMPLATE.md"
echo "   - Quick setup: QUICK_SETUP.md"
echo ""
echo "Need help? Check the documentation files above!"
echo ""
