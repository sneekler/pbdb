# Troubleshooting 404 Error on GitHub Pages

## Quick Checklist

### 1. Check Repository is Public
- Go to your repository on GitHub
- Look at the top - does it say "Public" or "Private"?
- If Private: Go to Settings → scroll down → Change visibility → Make public

### 2. Verify GitHub Pages is Enabled
- Go to your repository
- Click **Settings** (top menu)
- Click **Pages** (left sidebar)
- Under "Source", it should say:
  - Branch: **main** (or **master**)
  - Folder: **/ (root)**
- If it says "None", select **main** branch and **/ (root)**
- Click **Save**

### 3. Check Files Are in Root Directory
Your repository should have these files **directly** in the root (not in a subfolder):
- ✅ `index.html`
- ✅ `manifest.json`
- ✅ `service-worker.js`
- ✅ `css/` folder
- ✅ `js/` folder

**To check:**
- Go to your repository on GitHub
- You should see `index.html` listed directly (not inside a folder)
- If files are inside a folder like "Playboy Database Build", that's the problem!

### 4. Verify Correct URL
Your URL should be:
- `https://YOUR_USERNAME.github.io/REPOSITORY_NAME/`

**Common mistakes:**
- ❌ `https://github.com/YOUR_USERNAME/REPOSITORY_NAME` (this is the repo, not the site)
- ❌ Missing `.github.io` in the URL
- ❌ Wrong repository name

### 5. Wait and Refresh
- After enabling Pages, wait **2-5 minutes**
- Clear your browser cache (Ctrl+F5 or Cmd+Shift+R)
- Try incognito/private browsing mode

### 6. Check GitHub Pages Status
- Go to Settings → Pages
- Look for a green checkmark or "Your site is live at..."
- If you see an error message, that will tell you what's wrong

## Common Issues & Solutions

### Issue: Files Uploaded to Wrong Location
**Problem:** Files are inside a subfolder instead of root

**Solution:**
1. Go to your repository
2. Click into the folder (e.g., "Playboy Database Build")
3. Select all files
4. Click "..." menu → "Move"
5. Move them to root directory

### Issue: Wrong Branch Selected
**Problem:** Pages is looking at wrong branch

**Solution:**
1. Settings → Pages
2. Change branch from "master" to "main" (or vice versa)
3. Save

### Issue: Repository Name Mismatch
**Problem:** URL doesn't match repository name

**Solution:**
- Repository name: `playboy-database`
- URL should be: `https://USERNAME.github.io/playboy-database/`
- Make sure spelling matches exactly (case-sensitive)

## Still Not Working?

Try this step-by-step fix:

1. **Delete and recreate the repository** (if you haven't added much)
2. **Make sure it's Public**
3. **Upload files directly to root** (not in a folder)
4. **Enable Pages immediately**
5. **Wait 5 minutes**
6. **Try the URL**

## Test Your Setup

After fixing, you should see:
- ✅ Green checkmark in Settings → Pages
- ✅ Message: "Your site is live at https://..."
- ✅ When you visit the URL, you see your app (not 404)
