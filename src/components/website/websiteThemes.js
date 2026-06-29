export const WEBSITE_THEMES = {
  'classic-rose': {
    key: 'classic-rose',
    name: 'Classic Rose',
    description: 'Soft florals, romantic blush, and timeless elegance.',
    primary: '#be123c',
    accent: '#fda4af',
    background: '#fff1f2',
    surface: '#ffffff',
    text: '#4c0519',
    muted: '#9f1239',
    fontName: 'Playfair Display',
    fontFamily: '"Playfair Display", Georgia, serif',
    fontUrl: 'https://fonts.googleapis.com/css2?family=Playfair+Display:wght@500;600;700&display=swap',
    heroOverlay: 'linear-gradient(135deg, rgba(76, 5, 25, 0.72), rgba(190, 24, 93, 0.45))',
  },
  'royal-gold': {
    key: 'royal-gold',
    name: 'Royal Gold',
    description: 'Warm gold accents with a luxurious celebration feel.',
    primary: '#92400e',
    accent: '#fbbf24',
    background: '#fffbeb',
    surface: '#fffdf7',
    text: '#451a03',
    muted: '#a16207',
    fontName: 'Cormorant Garamond',
    fontFamily: '"Cormorant Garamond", Georgia, serif',
    fontUrl: 'https://fonts.googleapis.com/css2?family=Cormorant+Garamond:wght@500;600;700&display=swap',
    heroOverlay: 'linear-gradient(135deg, rgba(69, 26, 3, 0.76), rgba(146, 64, 14, 0.42))',
  },
  'garden-green': {
    key: 'garden-green',
    name: 'Garden Green',
    description: 'Fresh botanical tones with an airy outdoor vibe.',
    primary: '#166534',
    accent: '#86efac',
    background: '#f0fdf4',
    surface: '#ffffff',
    text: '#052e16',
    muted: '#15803d',
    fontName: 'Lora',
    fontFamily: '"Lora", Georgia, serif',
    fontUrl: 'https://fonts.googleapis.com/css2?family=Lora:wght@500;600;700&display=swap',
    heroOverlay: 'linear-gradient(135deg, rgba(5, 46, 22, 0.74), rgba(22, 101, 52, 0.44))',
  },
  'modern-minimal': {
    key: 'modern-minimal',
    name: 'Modern Minimal',
    description: 'Clean slate neutrals with a refined editorial look.',
    primary: '#1e293b',
    accent: '#94a3b8',
    background: '#f8fafc',
    surface: '#ffffff',
    text: '#0f172a',
    muted: '#475569',
    fontName: 'Inter',
    fontFamily: '"Inter", system-ui, sans-serif',
    fontUrl: 'https://fonts.googleapis.com/css2?family=Inter:wght@400;500;600;700&display=swap',
    heroOverlay: 'linear-gradient(135deg, rgba(15, 23, 42, 0.84), rgba(51, 65, 85, 0.45))',
  },
};

export function getThemeConfig(themeKey) {
  return WEBSITE_THEMES[themeKey] || WEBSITE_THEMES['classic-rose'];
}

export function getCoupleDisplayName(wedding) {
  return wedding?.coupleName || [wedding?.coupleName1, wedding?.coupleName2].filter(Boolean).join(' & ') || 'Our Wedding';
}

export function createDefaultWebsiteConfig(eventIds = []) {
  return {
    websiteTheme: 'classic-rose',
    websiteHero: {
      date: '',
      tagline: '',
      backgroundImage: '',
    },
    websiteStory: {
      enabled: false,
      text: '',
    },
    websiteHotels: {
      enabled: false,
      items: [],
    },
    websiteRegistry: {
      enabled: false,
      items: [],
    },
    websiteFooter: "We can't wait to celebrate with you!",
    websitePublished: false,
    websiteEventIds: eventIds,
  };
}

export function normalizeWebsiteConfig(wedding = {}, eventIds = []) {
  const defaults = createDefaultWebsiteConfig(eventIds);

  return {
    websiteTheme: wedding.websiteTheme || defaults.websiteTheme,
    websiteHero: {
      date: wedding.websiteHero?.date || wedding.weddingDate || defaults.websiteHero.date,
      tagline: wedding.websiteHero?.tagline || defaults.websiteHero.tagline,
      backgroundImage: wedding.websiteHero?.backgroundImage || defaults.websiteHero.backgroundImage,
    },
    websiteStory: {
      enabled: Boolean(wedding.websiteStory?.enabled),
      text: wedding.websiteStory?.text || '',
    },
    websiteHotels: {
      enabled: Boolean(wedding.websiteHotels?.enabled),
      items: Array.isArray(wedding.websiteHotels?.items)
        ? wedding.websiteHotels.items.map((item) => ({
            name: item?.name || '',
            address: item?.address || '',
            link: item?.link || '',
            groupRateCode: item?.groupRateCode || '',
          }))
        : [],
    },
    websiteRegistry: {
      enabled: Boolean(wedding.websiteRegistry?.enabled),
      items: Array.isArray(wedding.websiteRegistry?.items)
        ? wedding.websiteRegistry.items.map((item) => ({
            name: item?.name || '',
            url: item?.url || '',
          }))
        : [],
    },
    websiteFooter: wedding.websiteFooter || defaults.websiteFooter,
    websitePublished: Boolean(wedding.websitePublished),
    websiteEventIds: Array.isArray(wedding.websiteEventIds) ? wedding.websiteEventIds : defaults.websiteEventIds,
  };
}

export function sanitizeWebsiteConfig(config) {
  return {
    websiteTheme: config.websiteTheme || 'classic-rose',
    websiteHero: {
      date: config.websiteHero?.date || '',
      tagline: config.websiteHero?.tagline?.trim() || '',
      backgroundImage: config.websiteHero?.backgroundImage || '',
    },
    websiteStory: {
      enabled: Boolean(config.websiteStory?.enabled),
      text: config.websiteStory?.text?.trim() || '',
    },
    websiteHotels: {
      enabled: Boolean(config.websiteHotels?.enabled),
      items: (config.websiteHotels?.items || [])
        .map((item) => ({
          name: item?.name?.trim() || '',
          address: item?.address?.trim() || '',
          link: item?.link?.trim() || '',
          groupRateCode: item?.groupRateCode?.trim() || '',
        }))
        .filter((item) => item.name || item.address || item.link || item.groupRateCode),
    },
    websiteRegistry: {
      enabled: Boolean(config.websiteRegistry?.enabled),
      items: (config.websiteRegistry?.items || [])
        .map((item) => ({
          name: item?.name?.trim() || '',
          url: item?.url?.trim() || '',
        }))
        .filter((item) => item.name || item.url),
    },
    websiteFooter: config.websiteFooter?.trim() || "We can't wait to celebrate with you!",
    websitePublished: Boolean(config.websitePublished),
    websiteEventIds: Array.from(new Set((config.websiteEventIds || []).filter(Boolean))),
  };
}

export function getPublicWeddingWebsiteLink(weddingId) {
  return `${window.location.origin}/w/${weddingId}`;
}
