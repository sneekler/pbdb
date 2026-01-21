# Deployment Guide - Playboy Magazine Database

This guide will help you deploy the Playboy Magazine Database to make it accessible on your phone and other devices.

## Option 1: GitHub Pages (Free & Easy)

### Steps:

1. **Create a GitHub account** (if you don't have one): https://github.com

2. **Create a new repository**:
   - Go to GitHub and click "New repository"
   - Name it something like `playboy-database`
   - Make it **Public** (required for free GitHub Pages)
   - Don't initialize with README

3. **Upload your files**:
   ```bash
   # In your project folder, initialize git (if not already done)
   git init
   git add .
   git commit -m "Initial commit"
   git branch -M main
   git remote add origin https://github.com/YOUR_USERNAME/playboy-database.git
   git push -u origin main
   ```

4. **Enable GitHub Pages**:
   - Go to your repository on GitHub
   - Click **Settings** → **Pages**
   - Under "Source", select **main branch** and **/ (root)**
   - Click **Save**

5. **Access your app**:
   - Your app will be available at: `https://YOUR_USERNAME.github.io/playboy-database/`
   - Open this URL on your phone's browser
   - You can "Add to Home Screen" for app-like experience

## Option 2: Netlify (Free & Very Easy)

### Steps:

1. **Create a Netlify account**: https://www.netlify.com

2. **Drag and drop deployment**:
   - Go to https://app.netlify.com/drop
   - Drag your entire project folder onto the page
   - Netlify will automatically deploy it
   - You'll get a URL like: `https://random-name-12345.netlify.app`

3. **Or use Netlify CLI**:
   ```bash
   npm install -g netlify-cli
   netlify deploy
   netlify deploy --prod
   ```

## Option 3: Vercel (Free & Easy)

### Steps:

1. **Create a Vercel account**: https://vercel.com

2. **Install Vercel CLI**:
   ```bash
   npm install -g vercel
   ```

3. **Deploy**:
   ```bash
   vercel
   ```

## Option 4: Local Network Access (No Internet Required)

If you want to access it on your phone while on the same WiFi network:

1. **Install a simple HTTP server**:
   ```bash
   # Using Python (if installed)
   python -m http.server 8000
   
   # Or using Node.js
   npx http-server -p 8000
   ```

2. **Find your computer's IP address**:
   - Windows: Open Command Prompt, type `ipconfig`, look for IPv4 Address
   - Mac/Linux: Open Terminal, type `ifconfig` or `ip addr`

3. **Access on phone**:
   - Make sure phone is on same WiFi network
   - Open browser on phone
   - Go to: `http://YOUR_IP_ADDRESS:8000`

## Installing as PWA on Phone

Once deployed, you can install it as an app:

### iPhone (Safari):
1. Open the website in Safari
2. Tap the **Share** button (square with arrow)
3. Tap **Add to Home Screen**
4. Customize the name and tap **Add**

### Android (Chrome):
1. Open the website in Chrome
2. Tap the **Menu** (three dots)
3. Tap **Add to Home Screen** or **Install App**
4. Confirm the installation

## Notes

- **Data Storage**: All data is stored locally on each device using IndexedDB
- **No Server Needed**: The app works completely offline after first load
- **Privacy**: Your data never leaves your device
- **Icons**: You may want to create custom icons (icon-192.png and icon-512.png) for a better app experience

## Creating App Icons

To create icons for the PWA:

1. Create a square image (512x512 pixels recommended)
2. Save as `icon-512.png` and `icon-192.png` (resize the 512px version)
3. Place both files in the root directory
4. The manifest.json is already configured to use them

You can use online tools like:
- https://realfavicongenerator.net/
- https://www.pwabuilder.com/imageGenerator
