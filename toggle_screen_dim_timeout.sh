#!/bin/bash

# Get the current timeout setting (removes any hidden carriage returns from ADB output)
CURRENT_TIMEOUT=$(adb shell settings get system screen_off_timeout | tr -d '\r')

# 86400000 ms = 24 hours
if [ "$CURRENT_TIMEOUT" = "86400000" ]; then
    echo "Currently set to 24 hours. Reverting to 30 seconds..."
    # 30000 ms = 30 seconds. Change this to 60000 for 1 minute, etc.
    adb shell settings put system screen_off_timeout 30000
    echo "Done! Screen will now sleep normally."
else
    echo "Currently set to $CURRENT_TIMEOUT ms. Forcing to 24 hours..."
    adb shell settings put system screen_off_timeout 86400000
    echo "Done! Screen will stay awake."
fi
