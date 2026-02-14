'use client';

import { useState, useEffect } from 'react';
import { getBooks, BibleBook } from '@/lib/bible';
import { getBookmarks, Bookmark } from '@/lib/storage';
import Link from 'next/link';

export default function BookmarksPage() {
  const [books, setBooks] = useState<BibleBook[]>([]);
  const [bookmarks, setBookmarks] = useState<Bookmark[]>([]);

  useEffect(() => {
    const loadData = async () => {
      try {
        const booksData = await getBooks();
        setBooks(booksData);
        setBookmarks(getBookmarks());
      } catch (err) {
        console.error('Failed to load data:', err);
      }
    };

    loadData();
  }, []);

  const getBookName = (bookId: string) => {
    return books.find((b) => b.id === bookId)?.name || bookId;
  };

  const sortedBookmarks = [...bookmarks].sort((a, b) => b.timestamp - a.timestamp);

  return (
    <div className="min-h-screen bg-gray-100">
      {/* Header */}
      <header className="bg-blue-600 text-white p-4 shadow">
        <div className="flex items-center gap-4">
          <Link href="/" className="text-blue-200 hover:text-white text-sm">
            ← Back to Reading
          </Link>
          <div>
            <h1 className="text-2xl font-bold">My Bookmarks</h1>
            <p className="text-blue-100">Verses you&apos;ve saved</p>
          </div>
        </div>
      </header>

      <main className="max-w-3xl mx-auto p-4">
        {bookmarks.length === 0 ? (
          <div className="p-8 text-center text-gray-600">
            <p>No bookmarks yet. Start reading and click the ★ icon to save verses!</p>
          </div>
        ) : (
          <div>
            <p className="mb-4 text-gray-700">
              {bookmarks.length} bookmark{bookmarks.length !== 1 ? 's' : ''}
            </p>
            <div className="space-y-4">
              {sortedBookmarks.map((bookmark) => (
                <div
                  key={`${bookmark.bookId}-${bookmark.chapter}-${bookmark.verse}`}
                  className="p-4 bg-white rounded border border-gray-200 shadow"
                >
                  <div className="flex justify-between items-start mb-2">
                    <Link
                      href={`/?book=${bookmark.bookId}&chapter=${bookmark.chapter}`}
                      className="font-semibold text-blue-600 hover:text-blue-800 hover:underline"
                    >
                      {getBookName(bookmark.bookId)} {bookmark.chapter}:{bookmark.verse}
                    </Link>
                    <span className="text-xs text-gray-500">
                      {new Date(bookmark.timestamp).toLocaleDateString()}
                    </span>
                  </div>
                  <p className="text-gray-800 leading-relaxed">{bookmark.text}</p>
                </div>
              ))}
            </div>
          </div>
        )}
      </main>
    </div>
  );
}
