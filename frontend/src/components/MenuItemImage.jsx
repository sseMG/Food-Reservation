import React, { useState } from 'react';
import { getCategoryEmoji } from '../lib/categories';

/**
 * MenuItemImage Component
 * Displays menu item image with automatic fallback to category emoji if image fails to load
 * 
 * @param {string} src - Image URL
 * @param {string} alt - Alt text for image
 * @param {string} category - Category name for emoji fallback
 * @param {number} iconID - Icon ID for category
 * @param {string} className - Additional CSS classes
 * @param {string} emojiSize - Tailwind text size class for emoji (e.g., 'text-4xl')
 */
export default function MenuItemImage({ 
  src, 
  alt, 
  category, 
  iconID, 
  className = "", 
  emojiSize = "text-4xl" 
}) {
  const [imageError, setImageError] = useState(false);

  // Show emoji if no image URL or image failed to load
  const showFallback = !src || imageError;

  if (showFallback) {
    return (
      <div className={`w-full h-full flex items-center justify-center ${emojiSize} ${className}`}>
        {getCategoryEmoji(category, iconID)}
      </div>
    );
  }

  return (
    <img
      src={src}
      alt={alt || "Menu item"}
      className={`w-full h-full object-cover ${className}`}
      onError={() => setImageError(true)}
      loading="lazy"
    />
  );
}
