import { SavedAccountProfile, SourceConfig } from '../types';

const STORAGE_KEY = 'iptv_manager_profiles_v2';
const ACTIVE_PROFILE_KEY = 'iptv_manager_active_profile_id';

export const DEFAULT_PROFILES: SavedAccountProfile[] = [
  {
    id: 'profile_demo_gr',
    name: 'Ελληνικά Κανάλια & Sports (Demo)',
    sourceConfig: {
      type: 'demo',
      m3uUrl: '',
      xtreamServer: '',
      xtreamUser: '',
      xtreamPass: '',
      epgUrl: 'https://iptv-manager.cloud/epg/greece.xml',
      customEpgUrl: '',
      epgPresetId: 'greek_default',
      epgSourceType: 'preset',
      loadedAt: 'Προεπιλεγμένο Demo',
    },
    notes: 'Περιλαμβάνει ΕΡΤ, Mega, Ant1, Cosmote Sport, Novasports',
    isFavorite: true,
    createdAt: '01/01/2026',
    updatedAt: '01/01/2026',
  },
];

/**
 * Load saved profiles from localStorage
 */
export function getSavedProfiles(): SavedAccountProfile[] {
  if (typeof window === 'undefined') return DEFAULT_PROFILES;
  try {
    const raw = localStorage.getItem(STORAGE_KEY);
    if (!raw) {
      // Save default profile initially
      localStorage.setItem(STORAGE_KEY, JSON.stringify(DEFAULT_PROFILES));
      return DEFAULT_PROFILES;
    }
    const parsed = JSON.parse(raw);
    if (Array.isArray(parsed) && parsed.length > 0) {
      return parsed;
    }
    return DEFAULT_PROFILES;
  } catch (err) {
    console.warn('Failed to load profiles from localStorage', err);
    return DEFAULT_PROFILES;
  }
}

/**
 * Save all profiles to localStorage
 */
export function saveProfilesToStorage(profiles: SavedAccountProfile[]): void {
  if (typeof window === 'undefined') return;
  try {
    localStorage.setItem(STORAGE_KEY, JSON.stringify(profiles));
  } catch (err) {
    console.error('Failed to save profiles to localStorage', err);
  }
}

/**
 * Add or update a profile
 */
export function upsertProfile(
  profileData: {
    id?: string;
    name: string;
    sourceConfig: SourceConfig;
    notes?: string;
    isFavorite?: boolean;
  }
): { updatedProfiles: SavedAccountProfile[]; savedProfile: SavedAccountProfile } {
  const currentProfiles = getSavedProfiles();
  const now = new Date().toLocaleDateString('el-GR', {
    day: '2-digit',
    month: '2-digit',
    year: 'numeric',
    hour: '2-digit',
    minute: '2-digit',
  });

  let savedProfile: SavedAccountProfile;

  if (profileData.id) {
    // Update existing
    const index = currentProfiles.findIndex((p) => p.id === profileData.id);
    if (index >= 0) {
      savedProfile = {
        ...currentProfiles[index],
        name: profileData.name.trim() || 'Χωρίς όνομα',
        sourceConfig: { ...profileData.sourceConfig },
        notes: profileData.notes,
        isFavorite: profileData.isFavorite ?? currentProfiles[index].isFavorite,
        updatedAt: now,
      };
      currentProfiles[index] = savedProfile;
    } else {
      savedProfile = {
        id: profileData.id,
        name: profileData.name.trim() || 'Χωρίς όνομα',
        sourceConfig: { ...profileData.sourceConfig },
        notes: profileData.notes,
        isFavorite: profileData.isFavorite ?? false,
        createdAt: now,
        updatedAt: now,
      };
      currentProfiles.unshift(savedProfile);
    }
  } else {
    // Create new
    const newId = `profile_${Date.now()}_${Math.random().toString(36).substring(2, 7)}`;
    savedProfile = {
      id: newId,
      name: profileData.name.trim() || 'Νέος Λογαριασμός IPTV',
      sourceConfig: { ...profileData.sourceConfig },
      notes: profileData.notes,
      isFavorite: profileData.isFavorite ?? false,
      createdAt: now,
      updatedAt: now,
    };
    currentProfiles.unshift(savedProfile);
  }

  saveProfilesToStorage(currentProfiles);
  setActiveProfileId(savedProfile.id);

  return { updatedProfiles: currentProfiles, savedProfile };
}

/**
 * Delete a profile by ID
 */
export function deleteProfile(id: string): SavedAccountProfile[] {
  const currentProfiles = getSavedProfiles();
  const filtered = currentProfiles.filter((p) => p.id !== id);
  saveProfilesToStorage(filtered);

  const activeId = getActiveProfileId();
  if (activeId === id) {
    if (filtered.length > 0) {
      setActiveProfileId(filtered[0].id);
    } else {
      localStorage.removeItem(ACTIVE_PROFILE_KEY);
    }
  }

  return filtered;
}

/**
 * Duplicate an existing profile
 */
export function duplicateProfile(id: string): { updatedProfiles: SavedAccountProfile[]; duplicated: SavedAccountProfile | null } {
  const currentProfiles = getSavedProfiles();
  const target = currentProfiles.find((p) => p.id === id);
  if (!target) return { updatedProfiles: currentProfiles, duplicated: null };

  const now = new Date().toLocaleDateString('el-GR', {
    day: '2-digit',
    month: '2-digit',
    year: 'numeric',
    hour: '2-digit',
    minute: '2-digit',
  });

  const duplicated: SavedAccountProfile = {
    ...target,
    id: `profile_${Date.now()}_${Math.random().toString(36).substring(2, 7)}`,
    name: `${target.name} (Αντίγραφο)`,
    createdAt: now,
    updatedAt: now,
  };

  const newProfiles = [duplicated, ...currentProfiles];
  saveProfilesToStorage(newProfiles);
  return { updatedProfiles: newProfiles, duplicated };
}

/**
 * Active profile tracking
 */
export function getActiveProfileId(): string | null {
  if (typeof window === 'undefined') return null;
  return localStorage.getItem(ACTIVE_PROFILE_KEY);
}

export function setActiveProfileId(id: string): void {
  if (typeof window === 'undefined') return;
  localStorage.setItem(ACTIVE_PROFILE_KEY, id);
}

/**
 * Export all profiles as JSON file string
 */
export function exportProfilesJson(profiles: SavedAccountProfile[]): string {
  return JSON.stringify(
    {
      app: 'iPTV Manager Pro',
      version: '2.5',
      exportDate: new Date().toISOString(),
      profilesCount: profiles.length,
      profiles,
    },
    null,
    2
  );
}

/**
 * Import profiles from JSON string with validation
 */
export function importProfilesJson(jsonStr: string): {
  success: boolean;
  importedCount: number;
  updatedProfiles: SavedAccountProfile[];
  errorMessage?: string;
} {
  try {
    const data = JSON.parse(jsonStr);
    let incomingProfiles: any[] = [];

    if (Array.isArray(data)) {
      incomingProfiles = data;
    } else if (data && Array.isArray(data.profiles)) {
      incomingProfiles = data.profiles;
    } else {
      return {
        success: false,
        importedCount: 0,
        updatedProfiles: getSavedProfiles(),
        errorMessage: 'Μη έγκυρη μορφή αρχείου backup. Δεν βρέθηκε λίστα προφίλ.',
      };
    }

    // Validate and sanitize profiles
    const validProfiles: SavedAccountProfile[] = [];
    const existingProfiles = getSavedProfiles();

    for (const item of incomingProfiles) {
      if (item && item.name && item.sourceConfig) {
        validProfiles.push({
          id: item.id || `profile_${Date.now()}_${Math.random().toString(36).substring(2, 7)}`,
          name: String(item.name).trim(),
          sourceConfig: item.sourceConfig,
          notes: item.notes ? String(item.notes) : '',
          isFavorite: Boolean(item.isFavorite),
          createdAt: item.createdAt || new Date().toLocaleDateString('el-GR'),
          updatedAt: new Date().toLocaleDateString('el-GR'),
        });
      }
    }

    if (validProfiles.length === 0) {
      return {
        success: false,
        importedCount: 0,
        updatedProfiles: existingProfiles,
        errorMessage: 'Δεν βρέθηκαν έγκυρα προφίλ στο αρχείο.',
      };
    }

    // Merge: replace existing with same ID or add
    const mergedMap = new Map<string, SavedAccountProfile>();
    existingProfiles.forEach((p) => mergedMap.set(p.id, p));
    validProfiles.forEach((p) => mergedMap.set(p.id, p));

    const updated = Array.from(mergedMap.values());
    saveProfilesToStorage(updated);

    return {
      success: true,
      importedCount: validProfiles.length,
      updatedProfiles: updated,
    };
  } catch (err: any) {
    return {
      success: false,
      importedCount: 0,
      updatedProfiles: getSavedProfiles(),
      errorMessage: `Σφάλμα ανάγνωσης αρχείου JSON: ${err.message || err}`,
    };
  }
}
