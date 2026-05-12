import './App.css';
import React, { useState } from 'react';
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

  // Update user state upon successful authentication
  const handleLoginSuccess = (userData) => {
    setUser(userData);
  };

  // Clear user state to terminate session
  const handleLogout = () => {
    setUser(null);
    setActiveGame(null);
  };

  // Update specific user attributes such as chip balance
  const handleUpdateUser = (updatedData) => {
    setUser(updatedData);
  };

  // Set the active module based on user selection
  const handleSelectGame = (gameId) => {
    setActiveGame(gameId);
  };

  // Reset active module to return to the main menu
  const handleBackToLobby = () => {
    setActiveGame(null);
  };

  return (
    <div className="app-container">
      <header style={{ display: 'flex', justifyContent: 'space-between', padding: '10px 20px', borderBottom: '1px solid #ccc' }}>
        <h1>Nexus Arcade</h1>
        
        {/* Render user profile data and navigation controls */}
        {user && (
          <div>
            <span style={{ marginRight: '15px', fontWeight: 'bold' }}>
              Chips: {user.chips}
            </span>
            <button 
              onClick={() => handleSelectGame('store')} 
              style={{ marginRight: '15px', padding: '5px 10px', backgroundColor: '#f39c12', color: 'white', border: 'none', borderRadius: '4px', cursor: 'pointer' }}
            >
              Get Chips
            </button>
            <button onClick={handleLogout}>Logout</button>
          </div>
        )}
      </header>

      <main style={{ padding: '20px' }}>
        {/* Application routing logic */}
        {!user ? (
          <Auth onLoginSuccess={handleLoginSuccess} />
        ) : !activeGame ? (
          <Lobby user={user} onSelectGame={handleSelectGame} />
        ) : (
          <div className="game-wrapper">
            <button onClick={handleBackToLobby} style={{ marginBottom: '20px', padding: '8px 16px', cursor: 'pointer' }}>
              Back to Lobby
            </button>
            
            {/* Render active component based on selection state */}
            {activeGame === 'store' && <Store user={user} onUpdateUser={handleUpdateUser} />}
            {activeGame === 'connect-four' && <ConnectFour user={user} />}
            {activeGame === 'dice' && <HighLow user={user} />}
            {activeGame === 'pong' && <Pong user={user} />}
            {activeGame === 'scratch-offs' && <ScratchOffs user={user} />}
          </div>
        )}
      </main>
    </div>
  );
};

export default App;