// UI rendering module - handles all UI component rendering and tab management
// Renders user profiles, lists, search results, and handles tab interactions

import { formatDate, DEFAULT_PROFILE_IMAGE } from "./utils.js";

/**
 * Renders the user profile section with all user information and forms
 * @param {Object} user - The user object to display
 * @param {Object} currentUser - The currently logged-in user (for permission checks)
 * @returns {HTMLElement} - The rendered profile container
 */
function renderUser(user, currentUser) {
  const container = document.getElementById("userDetails");
  const posts = user.posts || user.tweets || [];
  const followingCount = user.following;
  const followersCount = user.followers;

  // Check if the current user is viewing their own profile
  const isOwnProfile =
    currentUser && user.screen_name === currentUser.screen_name;
  const editProfileButton = isOwnProfile
    ? `<button id="editProfileBtn" class="edit-profile-btn"><i class="fas fa-edit"></i> Edit Profile</button>`
    : "";

  // Render the complete profile UI
  container.innerHTML = `
    <div class="profile-header">
      <img src="${
        user.profile_image_url || DEFAULT_PROFILE_IMAGE
      }" alt="Profile Image" onerror="this.src='${DEFAULT_PROFILE_IMAGE}'"/>
      <div>
        <h2>${user.name || "No Name"} <span class="text-secondary">@${
    user.screen_name
  }</span></h2>
        <p class="location-info"> ${user.location || "Not specified"}</p>
        <div class="profile-stats">
          <div class="stat-item">
            <span class="stat-value">${followersCount}</span> Followers
          </div>
          <div class="stat-item">
            <span class="stat-value">${followingCount}</span> Following
          </div>
        </div>
        ${editProfileButton}
      </div>
    </div>

    <div id="editProfileForm" class="edit-profile-form hidden">
      <h3>Update Your Profile</h3>
      <form id="profileUpdateForm">
        <div class="form-group">
          <label for="updateName">Name</label>
          <input type="text" id="updateName" value="${
            user.name || ""
          }" required>
        </div>
        <div class="form-group">
          <label for="updateLocation">Location</label>
          <input type="text" id="updateLocation" value="${user.location || ""}">
        </div>
        <div class="form-group">
          <label for="updateProfileImage">Profile Image URL</label>
          <input type="text" id="updateProfileImage" value="${
            user.profile_image_url || ""
          }">
        </div>
        <div class="form-actions">
          <button type="submit" class="btn-primary"><i class="fas fa-save"></i> Save Changes</button>
          <button type="button" id="cancelProfileUpdate" class="btn-secondary"><i class="fas fa-times"></i> Cancel</button>
        </div>
      </form>
    </div>

    <div class="compose-tweet">
      <h3><i class="fas fa-feather"></i> Create Tweet</h3>
      <textarea id="newTweetText" rows="3" placeholder="What's happening?"></textarea>
      <div class="compose-actions">
        <button id="tweetSubmitBtn"><i class="fas fa-paper-plane"></i> Post</button>
        <p id="tweetStatus" style="color: green;"></p>
      </div>
    </div>

    <div class="recent-posts">
      <h3><i class="fas fa-history"></i> Recent Posts</h3>
      <div class="post-search">
        <input type="text" id="postSearch" placeholder="Search your posts..." />
      </div>
      <div id="postList" class="posts-list">
        ${renderPostList(posts, 5, false)}
      </div>
    </div>
  `;

  return container;
}

/**
 * Renders a list of users (for search results, followers, etc.)
 * @param {Array} users - Array of user objects to display
 * @param {Object} currentUser - The currently logged-in user
 * @returns {string} - HTML string for the user list
 */
function renderUserList(users = [], currentUser) {
  if (!users || users.length === 0) {
    return `<div class="empty-state"><i class="fas fa-users empty-icon"></i><p>No users found</p></div>`;
  }

  return users
    .map(
      (user) => `
      <div class="user-list-item">
        <img src="${user.profile_image_url || DEFAULT_PROFILE_IMAGE}" alt="${
        user.name
      }" onerror="this.src='${DEFAULT_PROFILE_IMAGE}'" />
        <div>
          <strong>${user.name || "No Name"}</strong> 
          <a href="#" class="user-link" data-screen-name="${
            user.screen_name
          }">@${user.screen_name}</a>
        </div>
      </div>
    `
    )
    .join("");
}

/**
 * Renders a list of posts/tweets with pagination support
 * @param {Array} posts - Array of post objects to display
 * @param {number} limit - Number of posts to show initially
 * @param {boolean} showAll - Whether to show all posts
 * @returns {string} - HTML string for the post list
 */
function renderPostList(posts = [], limit = 5, showAll = false) {
  if (!posts || posts.length === 0) {
    return `<div class="empty-state"><i class="fas fa-comment-slash empty-icon"></i><p>No posts found</p></div>`;
  }

  // Determine which posts to display
  const displayPosts = showAll ? posts : posts.slice(0, limit);
  const hasMorePosts = posts.length > displayPosts.length;

  // Render individual posts
  let html = displayPosts
    .map(
      (post) => `
    <div class="tweet-item">
      <p class="tweet-text">${post.text}</p>
      <small class="tweet-date"><i class="far fa-clock"></i> ${
        post.created_at ? formatDate(post.created_at) : "No date"
      }</small>
    </div>
  `
    )
    .join("");

  // Add show more/less buttons based on state
  if (hasMorePosts) {
    html += `
      <div class="tweet-item show-more">
        <button id="showMorePostsBtn" class="secondary">
          <i class="fas fa-plus"></i> Show More (${posts.length - limit} more)
        </button>
      </div>
    `;
  } else if (showAll && posts.length > limit) {
    html += `
      <div class="tweet-item show-more">
        <button id="showLessPostsBtn" class="secondary">
          <i class="fas fa-minus"></i> Show Less
        </button>
      </div>
    `;
  }

  return html;
}

/**
 * Renders user search results with follower/following counts
 * @param {Array} users - Array of user objects from search
 * @param {Object} currentUser - The currently logged-in user
 * @returns {string} - HTML string for user search results
 */
function renderUserSearchResults(users, currentUser) {
  if (!users || users.length === 0) {
    return `<div class="empty-state"><i class="fas fa-search"></i><p>No users found</p></div>`;
  }

  return users
    .map((user) => {
      const followingCount = user.following;
      const followersCount = user.followers;
      return `
      <div class="user-list-item">
        <img src="${user.profile_image_url || DEFAULT_PROFILE_IMAGE}" alt="${
        user.name
      }" onerror="this.src='${DEFAULT_PROFILE_IMAGE}'" />
        <div>
          <div class="user-info">
            <strong>${user.name || "No Name"}</strong> 
            <a href="#" class="user-link" data-screen-name="${
              user.screen_name
            }">@${user.screen_name}</a>
          </div>
          <p class="user-stats"><i class="fas fa-users"></i> ${followersCount} Followers · ${followingCount} Following</p>
        </div>
      </div>
    `;
    })
    .join("");
}

/**
 * Renders tweet search results with author information
 * @param {Array} tweets - Array of tweet objects from search
 * @returns {string} - HTML string for tweet search results
 */
function renderTweetSearchResults(tweets) {
  if (!tweets || tweets.length === 0) {
    return `<div class="empty-state"><i class="fas fa-search"></i><p>No tweets found</p></div>`;
  }

  return tweets
    .map(
      (tweet) => `
    <div class="tweet-item">
      <div class="user-list-item">
        <img src="${
          tweet.posted_by?.profile_image_url || DEFAULT_PROFILE_IMAGE
        }" width="30" height="30" onerror="this.src='${DEFAULT_PROFILE_IMAGE}'" />
        <div>
          <strong>${tweet.posted_by?.name || "No Name"}</strong> 
          <a href="#" class="user-link" data-screen-name="${
            tweet.posted_by?.screen_name
          }">@${tweet.posted_by?.screen_name}</a>
        </div>
      </div>
      <p class="tweet-text">${tweet.text}</p>
      <small class="tweet-date"><i class="far fa-clock"></i> ${
        tweet.created_at ? formatDate(tweet.created_at) : "No date"
      }</small>
    </div>
  `
    )
    .join("");
}

/**
 * Renders the header with user information or login buttons
 * @param {Object} user - The currently logged-in user (null if not logged in)
 */
function renderHeader(user) {
  const headerContainer = document.querySelector(".header");
  if (!headerContainer) return;

  if (user) {
    // Render logged-in header
    headerContainer.innerHTML = `
      <div class="header-brand">
        <i class="fab fa-twitter header-icon"></i>
        <h1>Twitter Dashboard</h1>
      </div>
      <div class="header-user">
        <img src="${user.profile_image_url || DEFAULT_PROFILE_IMAGE}" alt="${
      user.name
    }" class="avatar" onerror="this.src='${DEFAULT_PROFILE_IMAGE}'" />
        <span>@${user.screen_name}</span>
        <button id="logoutBtn" class="secondary">
          <i class="fas fa-sign-out-alt"></i> Logout
        </button>
      </div>
    `;
  } else {
    // Render logged-out header
    headerContainer.innerHTML = `
      <div class="header-brand">
        <i class="fab fa-twitter header-icon"></i>
        <h1>Twitter Dashboard</h1>
      </div>
      <div id="navButtons" class="nav-buttons">
        <button id="loginBtn" class="nav-btn">
          <i class="fas fa-sign-in-alt"></i> Login
        </button>
        <button id="signupBtn" class="nav-btn">
          <i class="fas fa-user-plus"></i> Sign Up
        </button>
      </div>
    `;
  }
}

/**
 * Sets up tab functionality for switching between different views
 * Manages active tab states and content visibility
 */
function setupTabs() {
  const tabs = document.querySelectorAll(".tab");

  tabs.forEach((tab) => {
    tab.addEventListener("click", () => {
      // Remove active class from all tabs and content
      document
        .querySelectorAll(".tab")
        .forEach((t) => t.classList.remove("active"));
      document
        .querySelectorAll(".tab-content")
        .forEach((c) => c.classList.remove("active"));

      // Activate clicked tab and corresponding content
      tab.classList.add("active");
      const currentTab = tab.getAttribute("data-tab");
      document.getElementById(`${currentTab}Tab`).classList.add("active");
    });
  });
}

// Export all UI rendering functions for use in other modules
export {
  renderUser,
  renderUserList,
  renderPostList,
  renderUserSearchResults,
  renderTweetSearchResults,
  renderHeader,
  setupTabs,
};
