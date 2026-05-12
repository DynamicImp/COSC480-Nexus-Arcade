import React, { useState } from 'react';
import { authAPI } from '../api';

// Main authentication component handling both login and registration
const Auth = ({ onLoginSuccess }) => {
  // Toggle between Login and Register modes
  const [isLogin, setIsLogin] = useState(true);
  
  // State for form inputs
  const [username, setUsername] = useState('');
  const [password, setPassword] = useState('');
  const [walletAddress, setWalletAddress] = useState('');
  
  // State for UI feedback
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);

  // Handles form submission for both login and registration
  const handleSubmit = async (e) => {
    e.preventDefault();
    setError('');
    setLoading(true);

    try {
      let response;
      if (isLogin) {
        // Execute login request
        response = await authAPI.login({ username, password });
      } else {
        // Execute registration request
        response = await authAPI.register({ username, password, walletAddress });
      }
      
      // Pass the user data up to the main application state
      onLoginSuccess(response.user || { id: response.userId, chips: response.chips });
    } catch (err) {
      // Catch and display errors (e.g., "Invalid credentials", "Username taken")
      setError(err.message);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="auth-container">
      <h2>{isLogin ? 'Login to Nexus Arcade' : 'Register New Account'}</h2>
      
      {/* Display error messages if they exist */}
      {error && <div style={{ color: 'red' }}>{error}</div>}
      
      <form onSubmit={handleSubmit}>
        <div>
          <label>Username: </label>
          <input 
            type="text" 
            value={username} 
            onChange={(e) => setUsername(e.target.value)} 
            required 
          />
        </div>
        
        <div>
          <label>Password: </label>
          <input 
            type="password" 
            value={password} 
            onChange={(e) => setPassword(e.target.value)} 
            required 
          />
        </div>
        
        {/* Only show Wallet Address field during registration */}
        {!isLogin && (
          <div>
            <label>Wallet Address (Optional): </label>
            <input 
              type="text" 
              value={walletAddress} 
              onChange={(e) => setWalletAddress(e.target.value)} 
            />
          </div>
        )}
        
        <button type="submit" disabled={loading}>
          {loading ? 'Processing...' : (isLogin ? 'Login' : 'Register')}
        </button>
      </form>
      
      {/* Button to toggle the form mode */}
      <button onClick={() => setIsLogin(!isLogin)} style={{ marginTop: '10px' }}>
        {isLogin ? 'Need an account? Register' : 'Already have an account? Login'}
      </button>
    </div>
  );
};

export default Auth;