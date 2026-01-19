// Cache busting utility
export const clearCache = () => {
  // Clear localStorage
  localStorage.clear();
  
  // Clear session storage
  sessionStorage.clear();
  
  // Force reload without cache
  window.location.reload(true);
};

// Add version to force cache refresh
export const APP_VERSION = '1.0.1';