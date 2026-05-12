const API_BASE_URL = 'http://localhost:5000/api';


// Helper function to handle standard JSON requests

async function fetchWithJson(endpoint, options = {}) {
  const response = await fetch(`${API_BASE_URL}${endpoint}`, {
    ...options,
    headers: {
      'Content-Type': 'application/json',
      ...options.headers,
    },
  });

  const data = await response.json();

  if (!response.ok) {
    throw new Error(data.error || `HTTP error ${response.status}`);
  }

  return data;
}


// Authentication Endpoints

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


// Game Economy Endpoints

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


// Chip Management Endpoints

export const chipAPI = {
  purchase: (purchaseData) => 
    fetchWithJson('/chips/purchase', {
      method: 'POST',
      body: JSON.stringify(purchaseData),
    }),

  claimDailyReward: (userId) => 
    fetchWithJson('/chips/daily-reward', {
      method: 'POST',
      body: JSON.stringify({ userId }),
    }),
};