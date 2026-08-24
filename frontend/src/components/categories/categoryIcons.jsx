import React from 'react';
import {
  UtensilsCrossed, Car, Home, Pill, Gamepad2, Plane, Dumbbell,
  PawPrint, BookOpen, ShoppingCart, Wallet, Music, Coffee, Tag, Folder,
} from 'lucide-react';

// Preset icon keys stored on categories (instead of emoji characters).
export const CATEGORY_ICONS = [
  { key: 'food', label: 'Food', icon: UtensilsCrossed },
  { key: 'transport', label: 'Transport', icon: Car },
  { key: 'home', label: 'Home', icon: Home },
  { key: 'health', label: 'Health', icon: Pill },
  { key: 'gaming', label: 'Gaming', icon: Gamepad2 },
  { key: 'travel', label: 'Travel', icon: Plane },
  { key: 'fitness', label: 'Fitness', icon: Dumbbell },
  { key: 'pets', label: 'Pets', icon: PawPrint },
  { key: 'books', label: 'Books', icon: BookOpen },
  { key: 'shopping', label: 'Shopping', icon: ShoppingCart },
  { key: 'finance', label: 'Finance', icon: Wallet },
  { key: 'music', label: 'Music', icon: Music },
  { key: 'coffee', label: 'Coffee', icon: Coffee },
];

const ICON_MAP = Object.fromEntries(CATEGORY_ICONS.map(i => [i.key, i.icon]));

// Legacy emoji values already persisted in the database → resolved to icons.
const LEGACY_EMOJI_MAP = {
  '🍔': 'food',
  '🚗': 'transport',
  '🏠': 'home',
  '💊': 'health',
  '🎮': 'gaming',
  '✈️': 'travel',
  '💪': 'fitness',
  '🐾': 'pets',
  '📚': 'books',
  '🛒': 'shopping',
  '💰': 'finance',
  '🎵': 'music',
  '☕': 'coffee',
};

export const DEFAULT_CATEGORY_ICON = Folder;

export const getCategoryIcon = (iconValue) => {
  if (!iconValue) return DEFAULT_CATEGORY_ICON;
  return ICON_MAP[LEGACY_EMOJI_MAP[iconValue] || iconValue] || DEFAULT_CATEGORY_ICON;
};

export const CategoryIcon = ({ icon, size = 16, color, style }) => {
  const Icon = getCategoryIcon(icon);
  return <Icon size={size} color={color} style={style} />;
};
