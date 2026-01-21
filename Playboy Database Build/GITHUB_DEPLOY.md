# GitHub Pages Deployment - Step by Step

## Step 1: Create Repository

1. Go to https://github.com/new
2. Repository name: `playboy-database` (or whatever you want)
3. Make it **Public** (required for free GitHub Pages)
4. **DON'T** check "Add a README file"
5. Click **Create repository**

## Step 2: Upload Your Files

### Option A: Drag & Drop (Easiest)

1. On your new repository page, click **"uploading an existing file"**
2. Drag your entire project folder ("Playboy Database Build") onto the page
3. Scroll down, add commit message: "Initial commit"
4. Click **"Commit changes"**

### Option B: Using Git (Command Line)

If you have Git installed on your computer:

```bash
# Navigate to your project folder
cd "f:\Playboy Project\Playboy Database Build"

# Initialize git (if not already done)
git init

# Add all files
git add .

# Commit files
git commit -m "Initial commit"

# Add your GitHub repository as remote
git remote add origin https://github.com/YOUR_USERNAME/playboy-database.git

# Push to GitHub
git branch -M main
git push -u origin main
```

Replace `YOUR_USERNAME` with your actual GitHub username.

## Step 3: Enable GitHub Pages

1. In your repository, click **Settings** (top menu)
2. Scroll down to **Pages** (left sidebar)
3. Under "Source", select:
   - Branch: **main**
   - Folder: **/ (root)**
4. Click **Save**

## Step 4: Get Your URL

- Your app will be live at: `https://YOUR_USERNAME.github.io/playboy-database/`
- It may take 1-2 minutes to be available
- Refresh if you get a 404 error initially

## Step 5: Access on Your Phone

1. Open your phone's browser
2. Go to: `https://YOUR_USERNAME.github.io/playboy-database/`
3. Bookmark it or add to home screen (see below)

## Installing as App on Phone

### iPhone (Safari):
1. Open the URL in Safari
2. Tap **Share** button (square with arrow)
3. Tap **Add to Home Screen**
4. Customize name if desired
5. Tap **Add**

### Android (Chrome):
1. Open the URL in Chrome
2. Tap **Menu** (three dots)
3. Tap **Add to Home Screen** or **Install App**
4. Confirm

## Updating Your App

If you make changes:

### Using GitHub Web Interface:
1. Go to your repository
2. Click on the file you want to change
3. Click the pencil icon (Edit)
4. Make changes
5. Scroll down, add commit message
6. Click **Commit changes**
7. GitHub Pages will automatically update in ~1 minute

### Using Git:
```bash
git add .
git commit -m "Update description"
git push
```

## Troubleshooting

- **404 Error**: Wait 1-2 minutes after enabling Pages, then refresh
- **Can't find Pages**: Make sure repository is **Public**
- **Files not showing**: Make sure `index.html` is in the root folder
- **Service Worker not working**: Make sure you're using `https://` (not `http://`)
