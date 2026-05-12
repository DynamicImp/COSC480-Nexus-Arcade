import './App.css';
import React, { useState, useEffect } from 'react';
import Auth from './pages/Auth';
import Lobby from './pages/Lobby';
import Store from './pages/Store';

// Import game components
import ConnectFour from './games/ConnectFour';
import HighLow from './games/HighLow';
import Pong from './games/Pong';
import ScratchOffs from './games/ScratchOffs';

const App = () => {
  // Initialize application state
  const [user, setUser] = useState(null);
  const [activeGame, setActiveGame] = useState(null);
  const [loading, setLoading] = useState(true); // Prevents login screen flashing on refresh

  // FIX 1: Session Persistence
  // Check for saved user session when the app first loads
  useEffect(() => {
    const savedUser = localStorage.getItem('arcadeUser');
    if (savedUser) {
      try {
        setUser(JSON.parse(savedUser));
      } catch (error) {
        console.error("Failed to parse user session");
        localStorage.removeItem('arcadeUser');
      }
    }
    setLoading(false);
  }, []);

  // Update user state upon successful authentication and save to LocalStorage
  const handleLoginSuccess = (userData) => {
    setUser(userData);
    localStorage.setItem('arcadeUser', JSON.stringify(userData));
  };

  // Clear user state and remove from LocalStorage to terminate session
  const handleLogout = () => {
    setUser(null);
    setActiveGame(null);
    localStorage.removeItem('arcadeUser');
  };

  // Update specific user attributes (like chips) and keep LocalStorage in sync
  const handleUpdateUser = (updatedData) => {
    const newUserState = { ...user, ...updatedData };
    setUser(newUserState);
    localStorage.setItem('arcadeUser', JSON.stringify(newUserState));
  };

  // Set the active module based on user selection
  const handleSelectGame = (gameId) => {
    setActiveGame(gameId);
  };

  // Reset active module to return to the main menu
  const handleBackToLobby = () => {
    setActiveGame(null);
  };

  // Show a brief loading screen while checking LocalStorage
  if (loading) {
    return <div style={{ color: 'white', textAlign: 'center', marginTop: '50px', backgroundColor: '#1a1a2e', minHeight: '100vh' }}>Loading Arcade...</div>;
  }

  return (
    // FIX 3: Dark Theme base layer to fix white-on-white text
    <div className="app-container" style={{ backgroundColor: '#1a1a2e', minHeight: '100vh', color: '#ffffff', fontFamily: 'sans-serif' }}>
      <header style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', padding: '15px 20px', backgroundColor: '#16213e', borderBottom: '2px solid #e94560' }}>
        <h1 style={{ margin: 0, color: '#e94560', textShadow: '2px 2px 4px rgba(0,0,0,0.5)' }}>🎮 Nexus Arcade</h1>
        
        {/* Render user profile data and navigation controls */}
        {user && (
          <div style={{ display: 'flex', alignItems: 'center' }}>
            <span style={{ marginRight: '20px', fontWeight: 'bold', fontSize: '18px', color: '#0f3460', backgroundColor: '#e94560', padding: '5px 15px', borderRadius: '20px' }}>
              Chips: {user.chips}
            </span>
            <button 
              onClick={() => handleSelectGame('store')} 
              style={{ marginRight: '15px', padding: '8px 15px', backgroundColor: '#f39c12', color: 'white', border: 'none', borderRadius: '4px', cursor: 'pointer', fontWeight: 'bold' }}
            >
              Get Chips
            </button>
            <button 
              onClick={handleLogout}
              style={{ padding: '8px 15px', backgroundColor: '#333', color: 'white', border: 'none', borderRadius: '4px', cursor: 'pointer' }}
            >
              Logout
            </button>
          </div>
        )}
      </header>

      <main style={{ padding: '20px', maxWidth: '1200px', margin: '0 auto' }}>
        {/* Application routing logic */}
        {!user ? (
          <Auth onLoginSuccess={handleLoginSuccess} />
        ) : !activeGame ? (
          <Lobby user={user} onSelectGame={handleSelectGame} />
        ) : (
          <div className="game-wrapper" style={{ backgroundColor: '#0f3460', padding: '20px', borderRadius: '10px', boxShadow: '0 4px 15px rgba(0,0,0,0.3)' }}>
            <button 
              onClick={handleBackToLobby} 
              style={{ marginBottom: '20px', padding: '8px 16px', cursor: 'pointer', backgroundColor: '#e94560', color: 'white', border: 'none', borderRadius: '5px', fontWeight: 'bold' }}
            >
              ⬅ Back to Lobby
            </button>
            
            {/* Render active component based on selection state */}
            {activeGame === 'store' && <Store user={user} onUpdateUser={handleUpdateUser} />}
            {/* Passed onUpdateUser so games can update the chip count in real-time */}
            {activeGame === 'connect-four' && <ConnectFour user={user} onUpdateUser={handleUpdateUser} />}
            {/* FIX 4: Changed 'dice' to 'high-low' */}
            {activeGame === 'high-low' && <HighLow user={user} onUpdateUser={handleUpdateUser} />}
            {activeGame === 'pong' && <Pong user={user} onUpdateUser={handleUpdateUser} />}
            {activeGame === 'scratch-offs' && <ScratchOffs user={user} onUpdateUser={handleUpdateUser} />}
          </div>
        )}
      </main>
    </div>
  );
};

export default App;