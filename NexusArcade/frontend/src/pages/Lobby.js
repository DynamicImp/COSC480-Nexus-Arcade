import React from 'react';

// Defines the array of available games for the arcade
const availableGames = [
  { 
    id: 'connect-four', 
    name: 'Connect Four', 
    type: 'Strategy (Free)', 
    description: 'Classic 4-in-a-row grid strategy against the CPU.' 
  },
  { 
    id: 'dice', 
    name: 'Crypto Dice', 
    type: 'Probability (Wager)', 
    description: 'Bet chips on a secure server-side High/Low roll.' 
  },
  { 
    id: 'pong', 
    name: 'Pong', 
    type: 'Physics (Free)', 
    description: 'Real-time classic arcade physics.' 
  },
  { 
    id: 'scratch-offs', 
    name: 'Scratch-Offs', 
    type: 'Reward (Subscription)', 
    description: 'Daily instant-reveal chip prizes.' 
  }
];

// Renders the main Lobby component
const Lobby = ({ user, onSelectGame }) => {
  return (
    <div className="lobby-container" style={{ padding: '20px' }}>
      
      {/* Displays user statistics and current economy standing */}
      <div 
        className="user-dashboard" 
        style={{ marginBottom: '30px', padding: '15px', backgroundColor: '#f5f5f5', borderRadius: '8px' }}
      >
        <h2>Welcome, {user?.username || 'Player'}</h2>
        <p><strong>Available Chips:</strong> {user?.chips || 0}</p>
        <p><strong>Subscription:</strong> {user?.subscriptionExpiry ? new Date(user.subscriptionExpiry).toLocaleDateString() : 'Free Tier'}</p>
      </div>

      <h3>Arcade Floor</h3>
      
      {/* Maps over available games in a 2-column grid */}
      <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '20px', marginTop: '20px' }}>
        {availableGames.map((game) => (
          <div 
            key={game.id} 
            className="game-card"
            style={{ 
              border: '2px solid #ddd', 
              borderRadius: '8px', 
              padding: '20px', 
              cursor: 'pointer',
              transition: 'transform 0.2s'
            }}
            onClick={() => onSelectGame(game.id)}
          >
            <h4>{game.name}</h4>
            <span style={{ fontSize: '0.85em', color: '#666' }}>{game.type}</span>
            <p style={{ marginTop: '10px' }}>{game.description}</p>
          </div>
        ))}
      </div>
      
    </div>
  );
};

export default Lobby;