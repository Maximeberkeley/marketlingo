#!/bin/bash
# Force dark mode for MarketLingo iOS app

PLIST_PATH="ios/App/App/Info.plist"

if [ -f "$PLIST_PATH" ]; then
  # Check if UIUserInterfaceStyle already exists
  if /usr/libexec/PlistBuddy -c "Print :UIUserInterfaceStyle" "$PLIST_PATH" 2>/dev/null; then
    echo "UIUserInterfaceStyle already set"
  else
    /usr/libexec/PlistBuddy -c "Add :UIUserInterfaceStyle string Dark" "$PLIST_PATH"
    echo "✅ Dark mode forced for iOS app"
  fi
else
  echo "❌ Info.plist not found at $PLIST_PATH"
  echo "Run 'npx cap sync ios' first"
fi
