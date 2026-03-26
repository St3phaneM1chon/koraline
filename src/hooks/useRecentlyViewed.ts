'use client';

import { useState, useCallback, useEffect, useRef } from 'react';

const STORAGE_KEY = 'attitudes-recently-viewed';
const MAX_ITEMS = 20;
const DEBOUNCE_MS = 500;

/**
 * Hook to manage recently viewed product slugs in localStorage.
 * Stores up to 20 slugs, deduplicated, most recent first.
 * localStorage writes are debounced to avoid excessive I/O.
 */
export function useRecentlyViewed() {
  const [recentSlugs, setRecentSlugs] = useState<string[]>([]);
  const debounceRef = useRef<ReturnType<typeof setTimeout> | null>(null);

  // Load from localStorage on mount
  useEffect(() => {
    try {
      const stored = localStorage.getItem(STORAGE_KEY);
      if (stored) {
        const parsed = JSON.parse(stored);
        if (Array.isArray(parsed)) {
          // Prune to max items on load in case stored data exceeds limit
          setRecentSlugs(parsed.slice(0, MAX_ITEMS));
        }
      }
    } catch {
      // Ignore parse errors
    }
  }, []);

  // Debounce localStorage writes whenever recentSlugs changes
  useEffect(() => {
    // Skip the initial mount (empty array from useState default)
    if (recentSlugs.length === 0) return;

    if (debounceRef.current) {
      clearTimeout(debounceRef.current);
    }

    debounceRef.current = setTimeout(() => {
      try {
        localStorage.setItem(STORAGE_KEY, JSON.stringify(recentSlugs));
      } catch {
        // Ignore storage errors (e.g. quota exceeded)
      }
    }, DEBOUNCE_MS);

    return () => {
      if (debounceRef.current) {
        clearTimeout(debounceRef.current);
      }
    };
  }, [recentSlugs]);

  // Add a viewed product slug (deduplicates, most recent first)
  const addViewed = useCallback((slug: string) => {
    setRecentSlugs((prev) => {
      // Remove slug if already present, then prepend it
      const filtered = prev.filter((s) => s !== slug);
      return [slug, ...filtered].slice(0, MAX_ITEMS);
    });
  }, []);

  return { recentSlugs, addViewed };
}
