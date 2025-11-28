import React, { useEffect, useState, useCallback } from 'react';
import { api } from './api';

export const FOOD_ICONS = [
  '🍽️', '🍪', '🥤', '🍚', '🍱', '🍔','🍟','🍕','🌭','🥪','🌮','🍣','🍜','🍩','🧁','🍰','🍦','🥤','🧃','☕️','🍺'
];

export function getCategoryEmoji(name, iconID) {
  if (typeof iconID === 'number' && iconID >= 0 && iconID < FOOD_ICONS.length) {
    return FOOD_ICONS[iconID];
  }
  return '🍽️';
}

export function getIconPalette() { return FOOD_ICONS; }

export function CategoryIcon({ name, iconID, className = '' }) {
  return <span className={className}>{getCategoryEmoji(name, iconID)}</span>;
}

let __categories_last_fetch = 0;
let __categories_inflight = null;

export function useCategories(initial = []) {
  const [categories, setCategories] = useState(initial);
  const [loading, setLoading] = useState(false);
  const fetchAll = useCallback(async () => {
    // Throttle / debounce rapid calls and dedupe in-flight requests
    const now = Date.now();
    const THROTTLE_MS = 200; // suppress calls within 200ms
    if (now - __categories_last_fetch < THROTTLE_MS && __categories_inflight) {
      return __categories_inflight;
    }
    if (__categories_inflight) return __categories_inflight;

    __categories_inflight = (async () => {
      setLoading(true);
      try {
        const res = await api.get('/categories');
        if (Array.isArray(res)) setCategories(res);
        __categories_last_fetch = Date.now();
        return res;
      } catch (e) {
        console.error('Failed to fetch categories', e);
        setCategories(initial);
        throw e;
      } finally {
        setLoading(false);
        __categories_inflight = null;
      }
    })();

    return __categories_inflight;
  }, [initial]);

  useEffect(() => {
    fetchAll();
    const handler = async () => fetchAll();
    window.addEventListener('categories:updated', handler);
    return () => window.removeEventListener('categories:updated', handler);
  }, [fetchAll]);

  return { categories, loading, refresh: fetchAll };
}

export default CategoryIcon;
