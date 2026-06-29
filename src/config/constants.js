// App-wide constants

export const APP_NAME = 'Vaaru';
export const APP_TAGLINE = 'Indian Wedding Planning, Perfected';

// Firestore collection paths
export const COLLECTIONS = {
  USERS: 'users',
  WEDDINGS: 'weddings',
  EVENTS: 'events',
  GUESTS: 'guests',
  FAMILIES: 'families',
  SEATING: 'seating',
  PHOTO_GROUPS: 'photoGroups',
  BETS: 'bets',
};

// Indian wedding event templates
export const EVENT_TEMPLATES = [
  { name: 'Mehndi', icon: '🌿', defaultDressCode: 'Colorful / Traditional' },
  { name: 'Sangeet', icon: '🎶', defaultDressCode: 'Semi-formal / Festive' },
  { name: 'Haldi', icon: '💛', defaultDressCode: 'Yellow / White' },
  { name: 'Garba', icon: '💃', defaultDressCode: 'Chaniya Choli / Kurta' },
  { name: 'Baraat', icon: '🐴', defaultDressCode: 'Formal Indian' },
  { name: 'Wedding Ceremony', icon: '🔥', defaultDressCode: 'Formal Indian Attire' },
  { name: 'Reception', icon: '🎉', defaultDressCode: 'Formal / Cocktail' },
  { name: 'Vidaai', icon: '🙏', defaultDressCode: 'Formal Indian' },
];

// Table configurations for seating
export const TABLE_SHAPES = {
  ROUND: 'round',
  RECTANGLE: 'rectangle',
  SQUARE: 'square',
};

export const TABLE_DEFAULTS = {
  round: { capacity: 10, width: 120, height: 120 },
  rectangle: { capacity: 8, width: 160, height: 80 },
  square: { capacity: 4, width: 100, height: 100 },
};

// Freemium tier limits
export const TIERS = {
  FREE: {
    maxGuests: 50,
    maxEvents: 2,
    maxTables: 5,
    features: ['guest-list', 'rsvp-basic', 'seating-basic'],
  },
  PREMIUM: {
    maxGuests: Infinity,
    maxEvents: Infinity,
    maxTables: Infinity,
    features: ['guest-list', 'rsvp-full', 'seating-full', 'photo-groups', 'bets', 'website', 'print', 'excel-import'],
  },
};

// Guest tags
export const GUEST_TAGS = ['VIP', 'Elderly', 'Kids', 'Vegetarian', 'Vegan', 'Wheelchair', 'Family Friend', 'College Friend', 'Work'];

// Dietary options (Indian-specific)
export const DIETARY_OPTIONS = [
  { value: 'vegetarian', label: 'Vegetarian' },
  { value: 'vegan', label: 'Vegan' },
  { value: 'non-veg', label: 'Non-Vegetarian' },
  { value: 'jain', label: 'Jain (No onion/garlic)' },
  { value: 'other', label: 'Other' },
];

// Supported languages for bilingual guest pages
export const LANGUAGES = [
  { code: 'en', label: 'English', nativeLabel: 'English' },
  { code: 'hi', label: 'Hindi', nativeLabel: 'हिन्दी' },
  { code: 'gu', label: 'Gujarati', nativeLabel: 'ગુજરાતી' },
  { code: 'ta', label: 'Tamil', nativeLabel: 'தமிழ்' },
  { code: 'te', label: 'Telugu', nativeLabel: 'తెలుగు' },
  { code: 'pa', label: 'Punjabi', nativeLabel: 'ਪੰਜਾਬੀ' },
  { code: 'mr', label: 'Marathi', nativeLabel: 'मराठी' },
  { code: 'bn', label: 'Bengali', nativeLabel: 'বাংলা' },
];

// Seating rules types
export const SEATING_RULE_TYPES = {
  KEEP_TOGETHER: 'keep_together',
  KEEP_APART: 'keep_apart',
  NEAR_STAGE: 'near_stage',
  ACCESSIBILITY: 'accessibility',
};

// RSVP statuses
export const RSVP_STATUS = {
  PENDING: 'pending',
  ACCEPTED: 'accepted',
  DECLINED: 'declined',
};

// Guest sides
export const SIDES = ['bride', 'groom'];
