const GRAPHQL_ENDPOINT = "http://localhost:4000";

/**
 * Generic GraphQL query executor
 * @param {string} query - The GraphQL query or mutation string
 * @param {Object} variables - Optional variables for the GraphQL operation
 * @returns {Promise<Object>} - The data returned from GraphQL operation
 */
async function fetchGraphQL(query, variables = {}) {
  try {
    const res = await fetch(GRAPHQL_ENDPOINT, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ query, variables }),
    });

    const json = await res.json();
    // Handle GraphQL errors by throwing them as JavaScript errors
    if (json.errors) throw new Error(json.errors[0].message);
    return json.data;
  } catch (error) {
    console.error("GraphQL error:", error);
    throw error;
  }
}

/**
 * Fetches a user's complete profile data including tweets, followers, and following
 * @param {string} screen_name - The screen name of the user to fetch
 * @returns {Promise<Object>} - User object with all related data
 */
async function getUserByScreenName(screen_name) {
  const query = `
    query {
      users(where: { screen_name: "${screen_name}" }) {
        name screen_name location profile_image_url followers following
        follows { screen_name name profile_image_url }
        followedBy { screen_name name profile_image_url }
        tweets { id text created_at }
        posts { id text created_at }
      }
    }
  `;

  const data = await fetchGraphQL(query);
  const user = data.users?.[0];

  // Add convenience properties for consistent access to counts
  if (user) {
    user.followingCount = user.following;
    user.followerCount = user.followers;
  }

  return user;
}

/**
 * Updates a user's profile information
 * @param {string} screenName - The screen name of the user to update
 * @param {Object} updates - Object containing fields to update (name, location, profile_image_url)
 * @returns {Promise<Object>} - Updated user object
 */
async function updateUserProfile(screenName, updates) {
  // Create a clean object with only the fields that have been provided
  const cleanUpdates = {};
  if (updates.name !== undefined) cleanUpdates.name = updates.name;
  if (updates.location !== undefined) cleanUpdates.location = updates.location;
  if (updates.profile_image_url !== undefined)
    cleanUpdates.profile_image_url = updates.profile_image_url;

  // Build the GraphQL update query dynamically based on provided fields
  const updateFields = Object.entries(cleanUpdates)
    .map(([key, value]) => `${key}: "${value}"`)
    .join(", ");

  // Execute the mutation to update user profile
  const mutation = `
    mutation {
      updateUsers(where: { screen_name: "${screenName}" }, update: { ${updateFields} }) {
        users { name screen_name location profile_image_url followers following }
      }
    }
  `;

  await fetchGraphQL(mutation);
  // Return the updated user data
  return await getUserByScreenName(screenName);
}

/**
 * Creates a new tweet for a specific user
 * @param {string} userScreenName - Screen name of the user posting the tweet
 * @param {string} text - Content of the tweet
 * @returns {Promise<Object>} - The created tweet object
 */
async function createTweet(userScreenName, text) {
  const mutation = `
    mutation { createTweet(text: "${text}", screen_name: "${userScreenName}") { id text created_at } }
  `;
  const result = await fetchGraphQL(mutation);
  return result.createTweet;
}

/**
 * Creates a new user account
 * @param {string} name - Full name of the user
 * @param {string} screenName - Unique screen name for the user
 * @param {string} location - Optional location information
 * @param {string} profileImage - Optional profile image URL
 * @returns {Promise<Object>} - The created user object
 */
async function createUser(name, screenName, location, profileImage) {
  const mutation = `
    mutation {
      createUsers(input: [{ 
        name: "${name}", 
        screen_name: "${screenName}", 
        location: "${location || ""}",
        profile_image_url: "${
          profileImage || "https://via.placeholder.com/150"
        }",
        followers: 0,
        following: 0
      }]) {
        users { name screen_name followers following }
      }
    }
  `;

  const result = await fetchGraphQL(mutation);
  return result.createUsers.users[0];
}

/**
 * Searches for tweets containing a specific keyword
 * @param {string} keyword - The keyword to search for in tweet text
 * @returns {Promise<Array>} - Array of tweets matching the search
 */
async function searchPosts(keyword) {
  const query = `
    query {
      tweets(where: {text_CONTAINS: "${keyword}"}) {
        id text created_at
        posted_by { name screen_name profile_image_url }
      }
    }
  `;

  const data = await fetchGraphQL(query);
  return data.tweets || [];
}

/**
 * Searches for users with screen names containing a keyword
 * Includes fallback logic to try exact match if partial search fails
 * @param {string} keyword - The keyword to search for in screen names
 * @returns {Promise<Array>} - Array of users matching the search
 */
async function searchUsers(keyword) {
  const query = `
    query {
      users(where: { screen_name_CONTAINS: "${keyword}" }) {
        name screen_name profile_image_url followers following
        follows { screen_name }
        followedBy { screen_name }
      }
    }
  `;

  try {
    const data = await fetchGraphQL(query);
    const users = data.users || [];
    // Add convenience properties for consistent access to counts
    users.forEach((user) => {
      user.followingCount = user.following;
      user.followerCount = user.followers;
    });
    return users;
  } catch (error) {
    console.error("Error searching users:", error);
    // Fallback: try exact match if partial search fails
    try {
      const exactQuery = `
        query {
          users(where: { screen_name: "${keyword}" }) {
            name screen_name profile_image_url followers following
            follows { screen_name }
            followedBy { screen_name }
          }
        }
      `;

      const exactData = await fetchGraphQL(exactQuery);
      const exactUsers = exactData.users || [];
      exactUsers.forEach((user) => {
        user.followingCount = user.following;
        user.followerCount = user.followers;
      });
      return exactUsers;
    } catch (fallbackError) {
      return [];
    }
  }
}

// Export all API functions for use in other modules
export {
  fetchGraphQL,
  getUserByScreenName,
  createTweet,
  createUser,
  searchPosts,
  searchUsers,
  updateUserProfile,
};
