const API_BASE_URL = process.env.REACT_APP_API_URL || "https://four80-nexus-arcade.onrender.com";

/**
 * Standardized utility for executing HTTP requests with JSON payloads.
 * Automatically injects JWT authorization tokens into request headers if a session exists.
 */
async function fetchWithJson(endpoint, options = {}) {
  const savedUser = localStorage.getItem('arcadeUser');
  let token = null;
  
  if (savedUser) {
    try {
      const parsedUser = JSON.parse(savedUser);
      token = parsedUser.token;
    } catch (error) {
      console.error("Session token parse error:", error);
    }
  }

  const headers = {
    'Content-Type': 'application/json',
    ...options.headers,
  };

  if (token) {
    headers['Authorization'] = `Bearer ${token}`;
  }

  const response = await fetch(`${API_BASE_URL}${endpoint}`, {
    ...options,
    headers,
  });

  const data = await response.json();

  if (!response.ok) {
    throw new Error(data.error || `HTTP error ${response.status}`);
  }

  return data;
}

export const authAPI = {
  register: (userData) => 
    fetchWithJson('/auth/register', {
      method: 'POST',
      body: JSON.stringify(userData),
    }),

  login: (credentials) => 
    fetchWithJson('/auth/login', {
      method: 'POST',
      body: JSON.stringify(credentials),
    }),
};

export const gameAPI = {
  recordMatch: (matchData) => 
    fetchWithJson('/games/record', {
      method: 'POST',
      body: JSON.stringify(matchData),
    }),

  getHistory: (userId) => 
    fetchWithJson(`/games/history/${userId}`, {
      method: 'GET',
    }),
};

export const chipAPI = {
  purchase: (purchaseData) => 
    fetchWithJson('/chips/purchase', {
      method: 'POST',
      body: JSON.stringify(purchaseData),
    }),

  sell: (sellData) => 
    fetchWithJson('/chips/sell', {
      method: 'POST',
      body: JSON.stringify(sellData),
    }),

  claimDailyReward: (userId) => 
    fetchWithJson('/chips/daily-reward', {
      method: 'POST',
      body: JSON.stringify({ userId }),
    }),
};