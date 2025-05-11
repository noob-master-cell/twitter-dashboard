// Utility functions - shared helper functions used throughout the application

/**
 * Default profile image URL used when a user doesn't have a profile image
 * This ensures all users have a visual representation even without an uploaded image
 */
const DEFAULT_PROFILE_IMAGE =
  "https://static.vecteezy.com/system/resources/thumbnails/009/292/244/small/default-avatar-icon-of-social-media-user-vector.jpg";

/**
 * Formats a date string into a human-readable format
 * Converts ISO date strings to localized date and time display
 * @param {string} dateString - ISO date string from the database
 * @returns {string} - Formatted date string in "MM/DD/YYYY - HH:MM:SS" format
 */
function formatDate(dateString) {
  if (!dateString) return "No date";

  // Parse the date string and convert to local format
  const date = new Date(dateString);
  return date.toLocaleDateString() + " - " + date.toLocaleTimeString();
}

// Export utility functions and constants for use throughout the application
export { formatDate, DEFAULT_PROFILE_IMAGE };
