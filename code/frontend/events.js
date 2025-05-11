// Event handling module - manages all user interactions and event listeners
// Handles search, profile editing, tweeting, and authentication events

import {
  createTweet,
  createUser,
  searchPosts,
  searchUsers,
  updateUserProfile,
} from "./api.js";
import {
  renderPostList,
  renderTweetSearchResults,
  renderUserSearchResults,
} from "./ui.js";

/**
 * Sets up the search tab functionality for finding users
 * @param {Object} currentUser - The currently logged-in user object
 */
function setupSearchTab(currentUser) {
  const tabSearchBtn = document.getElementById("tabSearchBtn");
  const tabSearchInput = document.getElementById("tabSearchInput");
  const tabSearchResults = document.getElementById("tabSearchResults");

  if (tabSearchBtn && tabSearchInput && tabSearchResults) {
    // Handle search button click
    tabSearchBtn.addEventListener("click", async () => {
      const keyword = tabSearchInput.value.trim();
      if (!keyword) return;

      tabSearchResults.innerHTML = `<p>Searching for users matching "${keyword}"...</p>`;

      try {
        const users = await searchUsers(keyword);

        if (users.length === 0) {
          tabSearchResults.innerHTML = `<p>No users found matching "${keyword}".</p>`;
          return;
        }

        // Filter out the current user from search results
        const filteredUsers = users.filter(
          (user) => !currentUser || user.screen_name !== currentUser.screen_name
        );

        if (filteredUsers.length === 0) {
          tabSearchResults.innerHTML = `<p>No other users found matching "${keyword}" besides yourself.</p>`;
          return;
        }

        // Display search results
        tabSearchResults.innerHTML = `
          <h3>Found ${filteredUsers.length} users matching "${keyword}"</h3>
          <div class="user-results-list">
            ${renderUserSearchResults(filteredUsers, currentUser)}
          </div>
        `;
      } catch (error) {
        console.error("Error searching users:", error);
        tabSearchResults.innerHTML = `<p class="text-error">Error searching for users: ${error.message}</p>`;
      }
    });

    // Allow Enter key to trigger search
    tabSearchInput.addEventListener("keyup", (e) => {
      if (e.key === "Enter") tabSearchBtn.click();
    });
  }
}

/**
 * Attaches event listeners to profile-related elements
 * Handles post creation, search, profile editing, and post interactions
 * @param {Object} user - The user whose profile is being displayed
 * @param {Object} currentUser - The currently logged-in user
 * @param {Function} loadUser - Function to reload user data
 */
function attachProfileEventListeners(user, currentUser, loadUser) {
  const postInput = document.getElementById("postSearch");
  const tweetBtn = document.getElementById("tweetSubmitBtn");
  const tweetInput = document.getElementById("newTweetText");
  const posts = user.posts || user.tweets || [];
  const postList = document.getElementById("postList");
  const editProfileBtn = document.getElementById("editProfileBtn");
  const editProfileForm = document.getElementById("editProfileForm");
  const cancelProfileUpdate = document.getElementById("cancelProfileUpdate");
  const profileUpdateForm = document.getElementById("profileUpdateForm");

  // Handle show more/less buttons for posts
  if (postList) {
    postList.addEventListener("click", (e) => {
      if (
        e.target.id === "showMorePostsBtn" ||
        e.target.closest("#showMorePostsBtn")
      ) {
        postList.innerHTML = renderPostList(posts, 10, true);
      }
      if (
        e.target.id === "showLessPostsBtn" ||
        e.target.closest("#showLessPostsBtn")
      ) {
        postList.innerHTML = renderPostList(posts, 10, false);
      }
    });
  }

  // Handle post search functionality
  if (postInput) {
    postInput.addEventListener("input", (e) => {
      const keyword = e.target.value.toLowerCase();
      const filtered = posts.filter((p) =>
        p.text.toLowerCase().includes(keyword)
      );

      if (postList) {
        postList.innerHTML =
          filtered.length === 0
            ? "<p>No matching posts found.</p>"
            : renderPostList(filtered, filtered.length, true);
      }
    });
  }

  // Handle new tweet submission
  if (tweetBtn && tweetInput) {
    tweetBtn.addEventListener("click", async () => {
      const text = tweetInput.value.trim();
      if (!text) return;

      const statusElement = document.getElementById("tweetStatus");
      if (!statusElement) return;

      statusElement.textContent = "Posting...";

      try {
        // Determine which user's account to post to
        const loggedInUserScreenName = currentUser
          ? currentUser.screen_name
          : user.screen_name;

        await createTweet(loggedInUserScreenName, text);
        tweetInput.value = "";
        statusElement.textContent = "Tweet posted successfully!";
        statusElement.style.color = "green";

        // Reload user data to show new tweet
        loadUser(loggedInUserScreenName);

        // Clear status message after 3 seconds
        setTimeout(() => {
          statusElement.textContent = "";
        }, 3000);
      } catch (error) {
        statusElement.textContent = `Error posting tweet: ${error.message}`;
        statusElement.style.color = "red";
      }
    });
  }

  // Handle edit profile button
  if (editProfileBtn) {
    editProfileBtn.addEventListener("click", () => {
      if (editProfileForm) editProfileForm.classList.toggle("hidden");
    });
  }

  // Handle cancel profile update
  if (cancelProfileUpdate) {
    cancelProfileUpdate.addEventListener("click", () => {
      if (editProfileForm) editProfileForm.classList.add("hidden");
    });
  }

  // Handle profile update form submission
  if (profileUpdateForm) {
    profileUpdateForm.addEventListener("submit", async (e) => {
      e.preventDefault();

      const updateName = document.getElementById("updateName");
      const updateLocation = document.getElementById("updateLocation");
      const updateProfileImage = document.getElementById("updateProfileImage");

      if (!updateName) return;

      // Collect form data
      const updates = {
        name: updateName.value.trim(),
        location: updateLocation ? updateLocation.value.trim() : "",
        profile_image_url: updateProfileImage
          ? updateProfileImage.value.trim()
          : "",
      };

      // Only allow users to update their own profile
      if (currentUser && user.screen_name === currentUser.screen_name) {
        try {
          const submitBtn = profileUpdateForm.querySelector(
            'button[type="submit"]'
          );
          const originalText = submitBtn.textContent;
          submitBtn.textContent = "Saving...";

          await updateUserProfile(user.screen_name, updates);

          submitBtn.textContent = originalText;
          editProfileForm.classList.add("hidden");
          loadUser(user.screen_name);

          // Show success message
          const statusElement = document.getElementById("tweetStatus");
          if (statusElement) {
            statusElement.textContent = "Profile updated successfully!";
            statusElement.style.color = "green";

            setTimeout(() => {
              statusElement.textContent = "";
            }, 3000);
          }
        } catch (error) {
          alert(`Error updating profile: ${error.message}`);
        }
      } else {
        alert("You can only update your own profile.");
      }
    });
  }
}

/**
 * Sets up general event handlers for the application
 * Handles user search, logout, and post search functionality
 * @param {Function} loadUser - Function to load a user's profile
 * @param {Function} logoutUser - Function to log out the current user
 * @param {Object} currentUser - The currently logged-in user object
 */
function setupEventHandlers(loadUser, logoutUser, currentUser) {
  // Handle user search in header
  const searchBtn = document.getElementById("searchBtn");
  if (searchBtn) {
    searchBtn.addEventListener("click", () => {
      const searchInput = document.getElementById("searchInput");
      if (!searchInput) return;

      const screenName = searchInput.value.trim();
      if (screenName) loadUser(screenName);
    });
  }

  // Handle logout button clicks (delegated event handling)
  document.body.addEventListener("click", (e) => {
    if (e.target.id === "logoutBtn" || e.target.closest("#logoutBtn")) {
      e.preventDefault();
      logoutUser();
    }
  });

  // Handle tweet search functionality
  const postSearchBtn = document.getElementById("postSearchBtn");
  if (postSearchBtn) {
    postSearchBtn.addEventListener("click", async () => {
      const postSearchInput = document.getElementById("postSearchInput");
      if (!postSearchInput) return;

      const keyword = postSearchInput.value.trim();
      if (keyword) {
        try {
          const tweets = await searchPosts(keyword);
          const resultsContainer = document.getElementById("postSearchResults");
          if (!resultsContainer) return;

          resultsContainer.classList.remove("hidden");

          if (tweets.length === 0) {
            resultsContainer.innerHTML = `<p>No tweets found containing "${keyword}"</p>`;
            return;
          }

          // Display search results
          resultsContainer.innerHTML = `
            <h2>Tweets containing "${keyword}"</h2>
            <p>Found ${tweets.length} tweets</p>
            <div id="tweetResults">${renderTweetSearchResults(tweets)}</div>
          `;
        } catch (error) {
          const resultsContainer = document.getElementById("postSearchResults");
          if (resultsContainer) {
            resultsContainer.innerHTML = `<p>Error searching for posts: ${error.message}</p>`;
          }
        }
      }
    });
  }

  // Handle clicks on user links (delegated event handling)
  document.body.addEventListener("click", async (e) => {
    if (e.target.classList.contains("user-link")) {
      e.preventDefault();
      const screenName = e.target.getAttribute("data-screen-name");
      if (screenName) loadUser(screenName);
    }
  });
}

/**
 * Attaches event listeners to authentication-related buttons
 * Handles login, signup form toggles, and new user creation
 * @param {Function} loadUser - Function to load a user's profile after login
 */
function attachAuthButtonListeners(loadUser) {
  // Handle login button click
  const loginBtn = document.getElementById("loginBtn");
  if (loginBtn) {
    loginBtn.addEventListener("click", () => {
      document.getElementById("signupForm").classList.add("hidden");
      document.getElementById("loginForm").classList.toggle("hidden");
    });
  }

  // Handle signup button click
  const signupBtn = document.getElementById("signupBtn");
  if (signupBtn) {
    signupBtn.addEventListener("click", () => {
      document.getElementById("loginForm").classList.add("hidden");
      document.getElementById("signupForm").classList.toggle("hidden");
    });
  }

  // Handle login form submission
  const loginSubmitBtn = document.getElementById("loginSubmitBtn");
  if (loginSubmitBtn) {
    loginSubmitBtn.addEventListener("click", () => {
      const screenName = document.getElementById("loginInput").value.trim();
      if (screenName) {
        loadUser(screenName);
      } else {
        alert("Please enter a screen name");
      }
    });

    // Allow Enter key to submit login
    const loginInput = document.getElementById("loginInput");
    if (loginInput) {
      loginInput.addEventListener("keyup", (e) => {
        if (e.key === "Enter") loginSubmitBtn.click();
      });
    }
  }

  // Handle new user form submission
  const newUserForm = document.getElementById("newUserForm");
  if (newUserForm) {
    newUserForm.addEventListener("submit", async (e) => {
      e.preventDefault();

      // Get form inputs
      const nameInput = document.getElementById("newName");
      const screenNameInput = document.getElementById("newScreenName");
      const locationInput = document.getElementById("newLocation");
      const profileImageInput = document.getElementById("newProfileImage");

      if (!nameInput || !screenNameInput) return;

      // Collect form data
      const name = nameInput.value.trim();
      const screenName = screenNameInput.value.trim();
      const location = locationInput ? locationInput.value.trim() : "";
      const profileImage = profileImageInput
        ? profileImageInput.value.trim()
        : "";

      // Validate required fields
      if (!name || !screenName) {
        alert("Name and Screen Name are required");
        return;
      }

      try {
        // Create new user
        await createUser(name, screenName, location, profileImage);
        alert("User created successfully! You can now log in.");

        // Reset form and show login
        newUserForm.reset();
        document.getElementById("signupForm").classList.add("hidden");
        document.getElementById("loginForm").classList.remove("hidden");
        document.getElementById("loginInput").value = screenName;
      } catch (error) {
        alert(`Error creating user: ${error.message}`);
      }
    });
  }
}

/**
 * Loads and displays recent tweets in the tweets tab
 * Implements pagination for large result sets
 * @param {number} limit - Initial number of tweets to load
 */
async function loadRecentTweets(limit = 10) {
  const resultsContainer = document.getElementById("postSearchResults");
  if (!resultsContainer) return;

  // Show loading indicator
  resultsContainer.innerHTML = `
    <div class="loading-indicator">
      <i class="fas fa-spinner fa-pulse"></i> Loading recent tweets...
    </div>
  `;
  resultsContainer.classList.remove("hidden");

  try {
    // Search for all tweets (empty keyword returns all)
    const tweets = await searchPosts("");

    if (tweets.length === 0) {
      resultsContainer.innerHTML = `
        <div class="empty-state">
          <i class="fas fa-comment-slash empty-icon"></i>
          <p>No tweets found</p>
        </div>
      `;
      return;
    }

    // Sort tweets by date (newest first)
    tweets.sort(
      (a, b) => new Date(b.created_at || 0) - new Date(a.created_at || 0)
    );
    const displayTweets = tweets.slice(0, limit);
    const hasMoreTweets = tweets.length > limit;

    // Display tweets with load more button if needed
    resultsContainer.innerHTML = `
      <h3><i class="fas fa-clock"></i> Recent Tweets</h3>
      <div id="tweetResults">${renderTweetSearchResults(displayTweets)}</div>
      ${
        hasMoreTweets
          ? `<button id="loadMoreTweetsBtn" class="load-more-btn">
             <i class="fas fa-plus"></i> Load More (${
               tweets.length - limit
             } remaining)
           </button>`
          : ""
      }
    `;

    // Store all tweets for pagination
    resultsContainer.dataset.allTweets = JSON.stringify(tweets);
    resultsContainer.dataset.currentLimit = limit.toString();

    // Handle load more button
    const loadMoreBtn = document.getElementById("loadMoreTweetsBtn");
    if (loadMoreBtn) {
      loadMoreBtn.addEventListener("click", () => {
        const newLimit = parseInt(resultsContainer.dataset.currentLimit) + 10;
        const allTweets = JSON.parse(resultsContainer.dataset.allTweets);

        const displayTweets = allTweets.slice(0, newLimit);
        const hasMoreTweets = allTweets.length > newLimit;

        // Update tweet display
        document.getElementById("tweetResults").innerHTML =
          renderTweetSearchResults(displayTweets);

        // Update or remove load more button
        if (hasMoreTweets) {
          loadMoreBtn.innerHTML = `<i class="fas fa-plus"></i> Load More (${
            allTweets.length - newLimit
          } remaining)`;
          resultsContainer.dataset.currentLimit = newLimit.toString();
        } else {
          loadMoreBtn.remove();
        }
      });
    }
  } catch (error) {
    resultsContainer.innerHTML = `
      <div class="empty-state">
        <i class="fas fa-exclamation-triangle empty-icon"></i>
        <p>Error loading tweets: ${error.message}</p>
      </div>
    `;
  }
}

// Handle tweets tab activation to load recent tweets
document.querySelectorAll(".tab").forEach((tab) => {
  tab.addEventListener("click", () => {
    const tabName = tab.getAttribute("data-tab");
    if (tabName === "tweets") {
      loadRecentTweets(10);
    }
  });
});

// Load recent tweets if tweets tab is active on page load
document.addEventListener("DOMContentLoaded", () => {
  const tweetsTab = document.querySelector('.tab[data-tab="tweets"]');
  if (tweetsTab && tweetsTab.classList.contains("active")) {
    loadRecentTweets(10);
  }
});

// Export all event handling functions for use in other modules
export {
  attachProfileEventListeners,
  setupEventHandlers,
  attachAuthButtonListeners,
  setupSearchTab,
};
