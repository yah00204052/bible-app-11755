# Bible Reading App

A modern web-based Bible reading application built with Next.js, React, and TypeScript.

## Features

✅ **Read the Bible** - Navigate through all 66 books of the Bible (Old and New Testament) with easy chapter navigation
✅ **Bookmarks** - Click the star icon (★/☆) on any verse to save your favorites
✅ **Reading History** - Your last reading position is automatically saved and restored when you return
✅ **Search** - Find verses by keywords across the entire Bible
✅ **Responsive Design** - Works great on desktop, tablet, and mobile devices
✅ **Offline-first** - Bookmarks and history are stored locally in your browser (no database needed)

## Tech Stack

- **Frontend**: Next.js 16+ with React 19
- **Styling**: Tailwind CSS
- **Language**: TypeScript
- **Data Source**: Free Bible API (KJV version)
- **Storage**: Browser localStorage (no backend/database required)

## Getting Started

### Prerequisites
- Node.js 18+ and npm

### Installation

```bash
# Navigate to project directory
cd bible-app

# Install dependencies (already done if just created)
npm install

# Run development server
npm run dev
```

Open [http://localhost:3000](http://localhost:3000) in your browser.

## Project Structure

```
src/
├── app/
│   ├── page.tsx           # Main reading view
│   ├── search/
│   │   └── page.tsx       # Search functionality
│   ├── bookmarks/
│   │   └── page.tsx       # View saved bookmarks
│   └── layout.tsx         # Root layout
├── components/
│   ├── BookSelector.tsx   # Book/chapter dropdown selector
│   └── VerseDisplay.tsx   # Individual verse renderer
├── lib/
│   ├── bible.ts           # Bible data fetching and search
│   └── storage.ts         # localStorage utilities
└── styles/
    └── globals.css        # Tailwind CSS styles
```

## Key Features Explained

### 1. **Main Reading Page**
- Left sidebar: Quick book navigation (abbreviations)
- Top selector: Book and chapter dropdowns
- Main area: Full chapter text with verse numbers
- Quick chapter buttons for fast navigation
- Previous/Next buttons for chapter navigation

### 2. **Bookmarks**
- Click the star icon on any verse to bookmark it
- View all bookmarks on the `/bookmarks` page
- Sorted by most recent first
- Click on bookmarked verse to jump to that chapter

### 3. **Search**
- Search for keywords across the entire Bible
- Returns up to 20 matching verses
- Shows book, chapter, and verse references

### 4. **Reading History**
- App remembers your last reading location
- Returns to last chapter automatically on reload
- History limited to last 30 chapters for performance

## Data Persistence

All data is stored locally in your browser using `localStorage`:
- **Bookmarks**: Stored with timestamp for sorting
- **Reading History**: Last 30 chapters you've read
- No server, no database, completely private

## Future Enhancements

Possible additions:
- Dark mode toggle
- Different Bible versions (ESV, NIV, etc.)
- Note-taking on verses
- Reading plans/schedules
- Export bookmarks to PDF
- Share verses via link

## Build for Production

```bash
npm run build
npm run start
```

## Troubleshooting

### No verses loading?
- Check browser console (F12 → Console tab) for errors
- Ensure you have internet connection (Bible API requires it)
- Clear browser cache and reload

### Bookmarks not saving?
- Check if localStorage is enabled in browser settings
- Private/Incognito mode may not persist data
- Try refreshing the page

## License

This project uses publicly available Bible data. For production use, ensure you comply with any licensing requirements of your data source.

## Questions?

For help developing this further, check the [Next.js documentation](https://nextjs.org/docs).
