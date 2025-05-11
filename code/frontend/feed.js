// Feed management module - handles loading and displaying user feeds
// Manages timeline display, tweet rendering, and pagination for user feeds

import { formatDate, DEFAULT_PROFILE_IMAGE } from "./utils.js";

/**
 * Loads the main feed for the current user
 * Displays tweets from users they follow, or their own tweets if not following anyone
 * @param {Object} user - The current user object
 * @param {Function} fetchGraphQL - GraphQL query executor function
 */
async function loadFeed(user, fetchGraphQL) {
  const feedContainer = document.getElementById("tweetFeed");
  const tweetsPerPage = 5;

  // Validate user data
  if (!user) {
    feedContainer.innerHTML = `
      <div class="feed-empty">
        <i class="fas fa-exclamation-circle"></i>
        <p>No user data available.</p>
      </div>
    `;
    return;
  }

  // Show loading indicator
  feedContainer.innerHTML = `
    <div class="feed-empty">
      <i class="fas fa-spinner fa-pulse"></i>
      <p>Loading tweets...</p>
    </div>
  `;

  try {
    let allTweets = [];

    // If user is not following anyone, show their own tweets
    if (!user.follows || user.follows.length === 0) {
      allTweets = await loadUserOwnTweets(user, fetchGraphQL);

      if (allTweets.length === 0) {
        feedContainer.innerHTML = `
          <div class="feed-empty">
            <i class="fas fa-comment-slash"></i>
            <p>@${user.screen_name} hasn't posted any tweets yet.</p>
          </div>
        `;
        return;
      }
    } else {
      // Load tweets from users they follow
      allTweets = await loadFollowingTweets(user, fetchGraphQL);

      // Fallback to own tweets if no followed users have tweets
      if (!allTweets || allTweets.length === 0) {
        allTweets = await loadUserOwnTweets(user, fetchGraphQL);

        if (allTweets.length === 0) {
          feedContainer.innerHTML = `
            <div class="feed-empty">
              <i class="fas fa-comment-slash"></i>
              <p>No tweets found in your network.</p>
              <small>Try following more users or create your own tweets!</small>
            </div>
          `;
          return;
        }
      }
    }

    // Sort tweets by date (newest first)
    allTweets.sort(
      (a, b) => new Date(b.created_at || 0) - new Date(a.created_at || 0)
    );

    // Store tweets for pagination and render first page
    feedContainer.dataset.allTweets = JSON.stringify(allTweets);
    feedContainer.dataset.currentPage = "1";
    renderTweetsPage(feedContainer, allTweets, 1, tweetsPerPage);
  } catch (error) {
    console.error("Error loading feed:", error);
    // Show error state with retry option
    feedContainer.innerHTML = `
      <div class="feed-empty">
        <i class="fas fa-exclamation-triangle"></i>
        <p>Error loading tweets: ${error.message}</p>
        <button id="retryFeedBtn" class="secondary"><i class="fas fa-redo"></i> Retry</button>
      </div>
    `;

    // Add retry functionality
    document.getElementById("retryFeedBtn")?.addEventListener("click", () => {
      if (user) loadFeed(user, fetchGraphQL);
    });
  }
}

/**
 * Renders a specific page of tweets with pagination
 * @param {HTMLElement} container - Container element for the tweets
 * @param {Array} tweets - Full array of tweets
 * @param {number} page - Page number to render
 * @param {number} tweetsPerPage - Number of tweets per page
 */
function renderTweetsPage(container, tweets, page, tweetsPerPage) {
  const startIndex = (page - 1) * tweetsPerPage;
  const endIndex = startIndex + tweetsPerPage;
  const displayTweets = tweets.slice(startIndex, endIndex);
  const totalPages = Math.ceil(tweets.length / tweetsPerPage);

  // Clear container
  container.innerHTML = "";

  // Render individual tweets
  displayTweets.forEach((tweet) => {
    const tweetElement = document.createElement("div");
    tweetElement.className = "feed-tweet";
    tweetElement.innerHTML = renderTweet(tweet);
    container.appendChild(tweetElement);
  });

  // Add load more button if there are more tweets
  if (page < totalPages) {
    const loadMoreButton = document.createElement("button");
    loadMoreButton.id = "loadMoreTweetsBtn";
    loadMoreButton.className = "load-more-btn";
    loadMoreButton.innerHTML = `<i class="fas fa-plus"></i> Load More (${
      tweets.length - endIndex
    } remaining)`;

    // Handle load more button click
    loadMoreButton.addEventListener("click", () => {
      const nextPage = parseInt(container.dataset.currentPage) + 1;
      container.dataset.currentPage = nextPage.toString();
      renderTweetsPage(container, tweets, nextPage, tweetsPerPage);
    });

    container.appendChild(loadMoreButton);
  }
}

/**
 * Loads tweets from the current user only
 * Combines both 'tweets' and 'posts' fields for backwards compatibility
 * @param {Object} user - The user object
 * @param {Function} fetchGraphQL - GraphQL query executor function
 * @returns {Promise<Array>} - Array of user's tweets with user info attached
 */
async function loadUserOwnTweets(user, fetchGraphQL) {
  const userQuery = `
    query {
      users(where: { screen_name: "${user.screen_name}" }) {
        name screen_name profile_image_url
        tweets { id text created_at }
        posts { id text created_at }
      }
    }
  `;

  const userData = await fetchGraphQL(userQuery);
  let userTweets = [];

  if (userData.users?.[0]) {
    const currentUser = userData.users[0];

    // Process tweets field
    if (currentUser.tweets?.length) {
      currentUser.tweets.forEach((tweet) => {
        userTweets.push({
          ...tweet,
          user: {
            name: currentUser.name,
            screen_name: currentUser.screen_name,
            profile_image_url: currentUser.profile_image_url,
          },
        });
      });
    }

    // Process posts field (backwards compatibility)
    if (currentUser.posts?.length) {
      currentUser.posts.forEach((post) => {
        userTweets.push({
          ...post,
          user: {
            name: currentUser.name,
            screen_name: currentUser.screen_name,
            profile_image_url: currentUser.profile_image_url,
          },
        });
      });
    }
  }

  return userTweets;
}

/**
 * Loads tweets from all users that the current user follows
 * @param {Object} user - The current user object
 * @param {Function} fetchGraphQL - GraphQL query executor function
 * @returns {Promise<Array>} - Array of tweets from followed users
 */
async function loadFollowingTweets(user, fetchGraphQL) {
  // Extract screen names of followed users
  const followingScreenNames = user.follows.map(
    (followedUser) => followedUser.screen_name
  );

  // Query for tweets from all followed users
  const query = `
    query {
      users(where: { screen_name_IN: [${followingScreenNames
        .map((name) => `"${name}"`)
        .join(", ")}] }) {
        name screen_name profile_image_url
        tweets { id text created_at }
        posts { id text created_at }
      }
    }
  `;

  const data = await fetchGraphQL(query);
  let allTweets = [];

  if (data.users?.length) {
    data.users.forEach((followedUser) => {
      const userTweets = [];

      // Process tweets field
      if (followedUser.tweets?.length) {
        followedUser.tweets.forEach((tweet) => {
          userTweets.push({
            ...tweet,
            user: {
              name: followedUser.name,
              screen_name: followedUser.screen_name,
              profile_image_url: followedUser.profile_image_url,
            },
          });
        });
      }

      // Process posts field (backwards compatibility)
      if (followedUser.posts?.length) {
        followedUser.posts.forEach((post) => {
          userTweets.push({
            ...post,
            user: {
              name: followedUser.name,
              screen_name: followedUser.screen_name,
              profile_image_url: followedUser.profile_image_url,
            },
          });
        });
      }

      // Combine all tweets
      allTweets = [...allTweets, ...userTweets];
    });
  }

  return allTweets;
}

/**
 * Renders a single tweet in the feed format
 * @param {Object} tweet - Tweet object with user information
 * @returns {string} - HTML string for the tweet
 */
function renderTweet(tweet) {
  return `
    <div class="feed-tweet-header">
      <div class="feed-tweet-user">
        <img src="${
          tweet.user.profile_image_url || DEFAULT_PROFILE_IMAGE
        }" alt="${
    tweet.user.name
  }" onerror="this.src='${DEFAULT_PROFILE_IMAGE}'" />
        <div class="feed-tweet-user-info">
          <span class="feed-tweet-name">${tweet.user.name || "No Name"}</span>
          <a href="#" class="feed-tweet-handle user-link" data-screen-name="${
            tweet.user.screen_name
          }">@${tweet.user.screen_name}</a>
        </div>
      </div>
    </div>
    <div class="feed-tweet-content">
      ${tweet.text}
    </div>
    <div class="feed-tweet-date">
      <i class="far fa-clock"></i> ${
        tweet.created_at ? formatDate(tweet.created_at) : "No date"
      }
    </div>
    <div class="feed-tweet-actions">
      <button class="tweet-action like-btn"><i class="far fa-heart"></i></button>
      <button class="tweet-action retweet-btn"><i class="fas fa-retweet"></i></button>
      <button class="tweet-action reply-btn"><i class="far fa-comment"></i></button>
    </div>
  `;
}

// Export feed-related functions for use in other modules
export { loadFeed, renderTweet };
