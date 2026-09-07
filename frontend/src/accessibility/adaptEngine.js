import { ADAPT_PROFILES } from './profiles';

const STORAGE_KEY = 'veridoc_adapt_profile';

export const getSavedProfile = () => {
  try {
    const saved = localStorage.getItem(STORAGE_KEY);
    if (saved && ADAPT_PROFILES[saved]) {
      return saved;
    }
  } catch (e) {
    console.error(e);
  }
  return 'standard';
};

export const applyAdaptProfile = (profileId) => {
  const profile = ADAPT_PROFILES[profileId] || ADAPT_PROFILES.standard;
  
  // Remove existing profile classes
  Object.values(ADAPT_PROFILES).forEach(p => {
    if (p.className) {
      document.body.classList.remove(p.className);
    }
  });

  // Apply new class
  if (profile.className) {
    document.body.classList.add(profile.className);
  }

  // Adjust root font scale
  const root = document.documentElement;
  if (profile.fontSize === 'extra_large') {
    root.style.fontSize = '18px';
  } else if (profile.fontSize === 'large') {
    root.style.fontSize = '17px';
  } else {
    root.style.fontSize = '16px';
  }

  try {
    localStorage.setItem(STORAGE_KEY, profile.id);
  } catch (e) {
    console.error(e);
  }

  return profile;
};
