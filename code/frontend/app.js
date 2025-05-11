// Main application controller - handles user session, navigation, and app initialization
// Manages user authentication state, tab navigation, and overall app lifecycle

import { fetchGraphQL, getUserByScreenName, createUser } from "./api.js";
import { renderUser, setupTabs, renderHeader } from "./ui.js";
import {
  attachProfileEventListeners,
  setupEventHandlers,
  attachAuthButtonListeners,
  setupSearchTab,
} from "./events.js";
import { loadFeed } from "./feed.js";

// Global state variables
let currentUser = null; // Currently logged-in user object
let currentTab = "profile"; // Currently active tab

/**
 * Checks if there's a logged-in user from localStorage
 * Handles different storage formats and migration of old user data
 * @returns {string|null} - Screen name of logged-in user or null
 */
function checkLoggedInUser() {
  const storedUser = localStorage.getItem("loggedInUser");
  if (storedUser) {
    try {
      const user = JSON.parse(storedUser);
      // Check if stored data is minimal format (legacy)
      if (user.screen_name && !user.follows && !user.followedBy) {
        return user.screen_name;
      }
      // Set current user if full data is available
      currentUser = user;
      return user.screen_name;
    } catch (e) {
      console.error("Error parsing stored user:", e);
      localStorage.removeItem("loggedInUser");
    }
  }
  return null;
}

/**
 * Loads a user's data and sets up their profile in the application
 * Handles localStorage storage with fallback for large data
 * @param {string} screen_name - The screen name of the user to load
 */
async function loadUser(screen_name) {
  try {
    // Fetch user data from the API
    const user = await getUserByScreenName(screen_name);

    if (user) {
      currentUser = user;

      // Attempt to store user data with fallback for quota exceeded
      try {
        localStorage.setItem("loggedInUser", JSON.stringify(user));
      } catch (storageError) {
        console.warn("Unable to store user data:", storageError.message);
        // Fall back to storing minimal user data
        const minimalUser = {
          screen_name: user.screen_name,
          name: user.name,
          profile_image_url: user.profile_image_url,
        };

        try {
          localStorage.setItem("loggedInUser", JSON.stringify(minimalUser));
        } catch (fallbackError) {
          console.warn(
            "Unable to store minimal user data:",
            fallbackError.message
          );
        }
      }

      // Update UI with user data
      renderUser(user, currentUser);
      renderHeader(user);
      attachProfileEventListeners(user, currentUser, loadUser);

      // Show dashboard and hide login forms
      document.getElementById("dashboardTabs").classList.remove("hidden");
      document.getElementById("loginForm").classList.add("hidden");
      document.getElementById("signupForm").classList.add("hidden");

      // Reset to profile tab and load initial data
      resetTabsToProfile();
      loadFeed(user, fetchGraphQL);
      setupEventHandlers(loadUser, logoutUser, currentUser);
      setupSearchTab(currentUser);
    } else {
      alert("User not found. Please check the screen name and try again.");
      document.getElementById("loginInput").value = "";
    }
  } catch (error) {
    console.error("Error fetching user:", error);
    alert(`Error logging in: ${error.message}`);
  }
}

/**
 * Resets all tabs to the profile tab state
 * Called after login to ensure consistent starting state
 */
function resetTabsToProfile() {
  document
    .querySelectorAll(".tab")
    .forEach((t) => t.classList.remove("active"));
  document
    .querySelectorAll(".tab-content")
    .forEach((c) => c.classList.remove("active"));
  document.querySelector('.tab[data-tab="profile"]').classList.add("active");
  document.getElementById("profileTab").classList.add("active");
  currentTab = "profile";
}

/**
 * Logs out the current user and resets the application state
 */
function logoutUser() {
  currentUser = null;
  localStorage.removeItem("loggedInUser");
  renderHeader(null);
  // Hide dashboard, show login form
  document.getElementById("dashboardTabs").classList.add("hidden");
  document.getElementById("loginForm").classList.remove("hidden");
  attachAuthButtonListeners(loadUser);
}

/**
 * Initializes the dashboard when the DOM is loaded
 * Sets up event listeners, checks for logged-in user, and initializes all tabs
 */
function initDashboard() {
  // Set up authentication button listeners
  attachAuthButtonListeners(loadUser);

  // Check if user is already logged in
  const loggedInUser = checkLoggedInUser();
  if (loggedInUser) {
    loadUser(loggedInUser);
  } else {
    document.getElementById("loginForm").classList.remove("hidden");
  }

  // Initialize tabs and search functionality
  setupTabs();
  setupSearchTab(currentUser);

  // Set up feed refresh button
  document.getElementById("refreshFeedBtn")?.addEventListener("click", () => {
    if (currentUser) loadFeed(currentUser, fetchGraphQL);
  });

  // Set up general event handlers
  setupEventHandlers(loadUser, logoutUser, currentUser);

  // Add event listeners for tab changes that require special handling
  document.querySelectorAll(".tab").forEach((tab) => {
    tab.addEventListener("click", () => {
      const tabName = tab.getAttribute("data-tab");
      // Reload feed when switching to feed tab
      if (tabName === "feed" && currentUser) {
        loadFeed(currentUser, fetchGraphQL);
      }
    });
  });
}

// Initialize the dashboard when DOM is fully loaded
document.addEventListener("DOMContentLoaded", initDashboard);

// Export functions for use in other modules
export { loadUser, logoutUser, currentUser };
