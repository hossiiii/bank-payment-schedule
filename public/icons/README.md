# PWA Icons Generation Guide

## Source Files
- `icon.svg` - Main application icon (512x512 source)
- `../favicon.svg` - Favicon source (32x32)

## Required PNG Files
Generate the following PNG files from the SVG sources:

### Main PWA Icons (from icon.svg)
- `icon-72x72.png` (72x72px)
- `icon-96x96.png` (96x96px) 
- `icon-128x128.png` (128x128px)
- `icon-144x144.png` (144x144px)
- `icon-152x152.png` (152x152px)
- `icon-192x192.png` (192x192px) **Required for Android**
- `icon-384x384.png` (384x384px)
- `icon-512x512.png` (512x512px) **Required for Android**

### Apple Icons
- `apple-touch-icon.png` (180x180px) - For iOS devices
- `apple-touch-icon-precomposed.png` (180x180px) - For older iOS

### Favicon
- `favicon.ico` (16x16, 32x32, 48x48 multi-size ICO file)

### Screenshots (for app stores)
- `screenshot-wide.png` (1280x720px) - Desktop/tablet view
- `screenshot-narrow.png` (375x812px) - Mobile view

### Shortcuts
- `shortcut-transaction.png` (96x96px) - Transaction shortcut icon
- `shortcut-schedule.png` (96x96px) - Schedule shortcut icon

## Generation Commands

Using ImageMagick or similar tools:

```bash
# Generate main icons from SVG
for size in 72 96 128 144 152 192 384 512; do
  convert icon.svg -resize ${size}x${size} icon-${size}x${size}.png
done

# Generate Apple touch icon
convert icon.svg -resize 180x180 apple-touch-icon.png
cp apple-touch-icon.png apple-touch-icon-precomposed.png

# Generate favicon
convert ../favicon.svg -resize 16x16 favicon-16.png
convert ../favicon.svg -resize 32x32 favicon-32.png  
convert ../favicon.svg -resize 48x48 favicon-48.png
convert favicon-16.png favicon-32.png favicon-48.png ../favicon.ico
```

## Theme Colors
- Primary: #1f6feb (Blue)
- Background: #f6f7fb (Light Gray)
- Text: #ffffff (White on icons)