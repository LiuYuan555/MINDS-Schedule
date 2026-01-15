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
ADMIN_PASSWORD=mindspassword

# Google Sheets Configuration
GOOGLE_SERVICE_ACCOUNT_KEY='PASTE_YOUR_JSON_KEY_HERE'
GOOGLE_SPREADSHEET_ID=PASTE_YOUR_SPREADSHEET_ID_HERE
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
echo "   → Create two sheets: 'Events' and 'Registrations'"
echo "   → See GOOGLE_SHEETS_TEMPLATE.md for column headers"
echo ""
echo "5. Share Sheet with Service Account"
echo "   → Click Share button in Google Sheets"
echo "   → Add service account email (from JSON file)"
echo "   → Give 'Editor' permission"
echo ""
echo "6. Update .env.local"
echo "   → Open .env.local in your editor"
echo "   → Replace GOOGLE_SERVICE_ACCOUNT_KEY with JSON contents"
echo "   → Replace GOOGLE_SPREADSHEET_ID with your sheet ID"
echo ""
echo "7. Restart dev server"
echo "   → npm run dev"
echo ""
echo "================================================"
echo ""

# Check if variables are set
if grep -q "PASTE_YOUR_JSON_KEY_HERE" .env.local 2>/dev/null; then
    echo "⚠️  Action Required: Update .env.local with your credentials"
    echo ""
    echo "   Open .env.local and:"
    echo "   1. Replace PASTE_YOUR_JSON_KEY_HERE with your service account JSON"
    echo "   2. Replace PASTE_YOUR_SPREADSHEET_ID_HERE with your spreadsheet ID"
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
echo "   - Waitlist: MANUAL_WAITLIST_APPROVAL.md"
echo ""
echo "Need help? Check the documentation files above!"
echo ""
