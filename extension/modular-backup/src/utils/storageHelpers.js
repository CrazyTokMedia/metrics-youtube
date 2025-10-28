/**
 * Chrome Storage API helpers with error handling
 */

export const safeStorage = {
  get: async (keys) => {
    try {
      return await chrome.storage.local.get(keys);
    } catch (error) {
      console.error('Storage get error:', error);
      return {};
    }
  },

  set: async (items) => {
    try {
      await chrome.storage.local.set(items);
    } catch (error) {
      console.error('Storage set error:', error);
    }
  },

  remove: async (keys) => {
    try {
      await chrome.storage.local.remove(keys);
    } catch (error) {
      console.error('Storage remove error:', error);
    }
  },
};

/**
 * Check if extension context is still valid
 */
export function isExtensionContextValid() {
  try {
    return chrome.runtime && chrome.runtime.id;
  } catch (e) {
    return false;
  }
}
