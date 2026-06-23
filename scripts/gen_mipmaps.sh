#!/bin/bash

# Check if an argument is provided
if [ -z "$1" ]; then
    echo "Usage: $0 <path-to-image>"
    exit 1
fi

INPUT_IMAGE="$1"

# Check if the file exists
if [ ! -f "$INPUT_IMAGE" ]; then
    echo "Error: File '$INPUT_IMAGE' does not exist."
    exit 1
fi

# Extract directory, filename, basename, and extension
DIR=$(dirname "$INPUT_IMAGE")
FILENAME=$(basename "$INPUT_IMAGE")

# Handle files with or without an extension
if [[ "$FILENAME" == *.* ]]; then
    BASENAME="${FILENAME%.*}"
    EXT=".${FILENAME##*.}"
else
    BASENAME="$FILENAME"
    EXT=""
fi

# Get the original width and height of the image.
# Using [0] to safely handle multi-frame images (like GIFs or multi-layer formats).
DIMENSIONS=$(magick identify -format "%w %h\n" "$INPUT_IMAGE[0]" 2>/dev/null | head -n 1)

read -r W H <<< "$DIMENSIONS"

if [ -z "$W" ] || [ -z "$H" ]; then
    echo "Error: Could not determine dimensions of '$INPUT_IMAGE'. Is it a valid image?"
    exit 1
fi

echo "Original dimensions: ${W}x${H}"

# Check if the image is already 1x1
if [ "$W" -eq 1 ] && [ "$H" -eq 1 ]; then
    echo "Image is already 1x1. No mipmaps to generate."
    exit 0
fi

# Loop to generate mipmap layers
while [ "$W" -gt 1 ] || [ "$H" -gt 1 ]; do
    # Halve the dimensions (Bash uses integer division by default)
    W=$(( W / 2 ))
    H=$(( H / 2 ))

    # Minimum dimension size is 1x1
    [ "$W" -lt 1 ] && W=1
    [ "$H" -lt 1 ] && H=1

    # Construct the output filename
    OUTPUT_IMAGE="${DIR}/${BASENAME}_${W}x${H}${EXT}"

    echo "Generating mipmap: $OUTPUT_IMAGE"
    
    # Generate the resized image.
    # The '!' forces exact dimensions, ignoring the original aspect ratio 
    # to perfectly match standard mipmapping division rules.
    magick "$INPUT_IMAGE" -resize "${W}x${H}!" "$OUTPUT_IMAGE"

    # Stop once the 1x1 mipmap has been generated
    if [ "$W" -eq 1 ] && [ "$H" -eq 1 ]; then
        break
    fi
done

echo "Mipmap generation complete."
