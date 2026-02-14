# Bible API Setup Guide

This app uses two Bible APIs to provide multiple translations:

## 📚 Available Versions

### English Versions (via Bible API - requires API key)
- **KJV** - King James Version
- **NIV** - New International Version
- **WEB** - World English Bible (modern English, similar to ESV)

**Note:** ESV is not available in the free Bible API. WEB is an excellent free alternative with modern English.

### Chinese Versions (via GetBible API - No setup needed)
- **CUNPSS** - 和合本简体
- **CUNP** - 和合本繁體
- **CNVS** - 新译本简体

## 🔑 Setup Instructions

### Step 1: Get Your Free API Key

1. Go to **https://scripture.api.bible**
2. Click "**Sign Up**" (top right)
3. Create a free account
4. After login, go to "**Applications**"
5. Click "**Create Application**"
6. Fill in:
   - **Name**: My Bible App
   - **Description**: Personal Bible reading app
7. Click "**Create**"
8. Copy your **API Key** (looks like: `abc123def456...`)

### Step 2: Configure Your App

1. In your project folder, create a file named `.env.local`
2. Add this line (replace with your actual API key):
   ```
   BIBLE_API_KEY=your_actual_api_key_here
   ```
3. Save the file

### Step 3: Restart Your Dev Server

```bash
# Stop the current server (Ctrl+C)
# Then restart:
npm run dev
```

## ✅ Check Available Versions

After setting up your API key, check what versions are actually available:

1. Visit: **http://localhost:3000/api/bible/list**
2. You'll see a JSON list of all available Bibles
3. Look for the `id` and `name` fields
4. Note which versions you have access to

**Common available versions:**
- KJV (King James Version) - Usually available
- ASV (American Standard Version) - Usually available
- Other versions depend on your API key access level

## ✅ Testing

1. Open http://localhost:3000
2. Select **KJV** from the version dropdown
3. Choose any book and chapter
4. Click "Project" to open the popup
5. Verses should load successfully!

## 🚨 Troubleshooting

### Error: "Bible API key not configured"
- Make sure `.env.local` file exists in the project root
- Check that the file contains: `BIBLE_API_KEY=your_key`
- Restart the dev server after creating the file

### Error: "Failed to fetch from Bible API"
- Check your API key is correct
- Make sure you have internet connection
- Verify your API key is active at https://scripture.api.bible

### Chinese versions not working
- Chinese versions use GetBible API (no key needed)
- They should work without any setup

## 📊 Rate Limits

**Free Tier:**
- 500 requests per day
- Perfect for personal use
- Resets daily

**If you need more:**
- Paid tiers start at $10/month
- 10,000 requests/day
- Only needed for public/popular apps

## 🔒 Security Notes

- **Never commit `.env.local` to git** (it's in .gitignore)
- API key is kept secret on the server (Next.js API routes)
- Safe to deploy to production

## 🌐 Deployment

When deploying to Vercel/Netlify:

1. Go to your project settings
2. Add environment variable:
   - Key: `BIBLE_API_KEY`
   - Value: Your API key
3. Redeploy

The app will work exactly the same online!

## 📖 About ESV

**Why isn't ESV available?**
- ESV is copyrighted by Crossway
- Not available in free Bible APIs
- Would require paid API access or licensing

**Alternatives:**
1. **WEB (World English Bible)** - Already included! Modern English, public domain
2. **BBE (Bible in Basic English)** - Available via GetBible (no API key needed)
3. **ASV (American Standard Version)** - Classic translation, available free

If you specifically need ESV, you would need:
- ESV.org API (requires permission from Crossway)
- Or use a paid Bible API service that has ESV licensed
