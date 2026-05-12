import React, { useState } from 'react';
import { ethers } from 'ethers';

const availableGames = [
  { 
    id: 'connect-four', 
    name: 'Connect Four', 
    type: 'Strategy (Free)', 
    description: 'Classic 4-in-a-row grid strategy against the CPU.' 
  },
  { 
    id: 'high-low', 
    name: 'High/Low', 
    type: 'Probability (Wager)', 
    description: 'Bet chips and guess the next roll to double your wager.' 
  },
  { 
    id: 'pong', 
    name: 'Pong', 
    type: 'Physics (Free)', 
    description: 'Classic arcade physics and paddle action.' 
  },
  { 
    id: 'scratch-offs', 
    name: 'Scratch-Offs', 
    type: 'Reward (VIP Exclusive)', 
    description: 'Daily instant-reveal chip prizes for VIP members.' 
  }
];

const Lobby = ({ user, onSelectGame, onUpdateUser }) => {
  const [isConnecting, setIsConnecting] = useState(false);
  const [walletError, setWalletError] = useState('');

  /**
   * Requests wallet connection via injected Web3 provider (MetaMask)
   * and updates the user profile with the returned address.
   */
  const handleConnectWallet = async () => {
    setIsConnecting(true);
    setWalletError('');

    try {
      if (!window.ethereum) {
        throw new Error("Digital wallet provider not found.");
      }

      const provider = new ethers.BrowserProvider(window.ethereum);
      const accounts = await provider.send("eth_requestAccounts", []);
      
      if (accounts && accounts.length > 0) {
        const walletAddress = accounts[0];
        if (onUpdateUser) {
          onUpdateUser({ ...user, walletAddress });
        }
      }
    } catch (error) {
      console.error("Wallet connection error:", error);
      setWalletError("Failed to connect wallet. Please try again.");
    } finally {
      setIsConnecting(false);
    }
  };

  return (
    <div className="lobby-container" style={{ padding: '20px', color: '#fff' }}>
      
      <div 
        className="user-dashboard" 
        style={{ 
          marginBottom: '30px', 
          padding: '20px', 
          backgroundColor: '#16213e', 
          borderRadius: '8px',
          border: '1px solid #e94560'
        }}
      >
        <h2 style={{ marginTop: 0, color: '#f39c12' }}>Welcome, {user?.username || 'Player'}</h2>
        
        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(200px, 1fr))', gap: '15px', marginTop: '15px' }}>
          <div>
            <p style={{ margin: '5px 0', color: '#aaa' }}>Available Chips</p>
            <p style={{ margin: 0, fontSize: '24px', fontWeight: 'bold', color: '#2ecc71' }}>{user?.chips || 0}</p>
          </div>
          
          <div>
            <p style={{ margin: '5px 0', color: '#aaa' }}>Account Status</p>
            <p style={{ margin: 0, fontSize: '18px', fontWeight: 'bold', color: user?.isVip ? '#f39c12' : '#fff' }}>
              {user?.isVip ? 'VIP Member' : 'Standard Tier'}
            </p>
          </div>

          <div>
            <p style={{ margin: '5px 0', color: '#aaa' }}>Linked Wallet</p>
            {user?.walletAddress ? (
              <p style={{ margin: 0, fontSize: '14px', fontFamily: 'monospace', color: '#3498db', wordBreak: 'break-all' }}>
                {user.walletAddress.substring(0, 6)}...{user.walletAddress.substring(user.walletAddress.length - 4)}
              </p>
            ) : (
              <div>
                <button 
                  onClick={handleConnectWallet}
                  disabled={isConnecting}
                  style={{
                    padding: '8px 12px',
                    backgroundColor: isConnecting ? '#555' : '#3498db',
                    color: '#fff',
                    border: 'none',
                    borderRadius: '4px',
                    cursor: isConnecting ? 'not-allowed' : 'pointer',
                    fontWeight: 'bold'
                  }}
                >
                  {isConnecting ? 'Connecting...' : 'Link MetaMask'}
                </button>
                {walletError && <p style={{ color: '#e74c3c', fontSize: '12px', margin: '5px 0 0 0' }}>{walletError}</p>}
              </div>
            )}
          </div>
        </div>
      </div>

      <h3 style={{ color: '#e94560', borderBottom: '1px solid #333', paddingBottom: '10px' }}>Arcade Floor</h3>
      
      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(280px, 1fr))', gap: '20px', marginTop: '20px' }}>
        {availableGames.map((game) => (
          <div 
            key={game.id} 
            className="game-card"
            style={{ 
              border: '1px solid #333', 
              borderRadius: '8px', 
              padding: '20px', 
              cursor: 'pointer',
              backgroundColor: '#1a1a2e',
              boxShadow: '0 4px 6px rgba(0,0,0,0.3)',
              display: 'flex',
              flexDirection: 'column'
            }}
            onClick={() => onSelectGame(game.id)}
            onMouseOver={(e) => e.currentTarget.style.borderColor = '#e94560'}
            onMouseOut={(e) => e.currentTarget.style.borderColor = '#333'}
          >
            <h4 style={{ margin: '0 0 10px 0', color: '#fff', fontSize: '20px' }}>{game.name}</h4>
            <span style={{ fontSize: '12px', color: '#f39c12', fontWeight: 'bold', marginBottom: '15px', display: 'inline-block' }}>
              {game.type}
            </span>
            <p style={{ margin: 0, color: '#aaa', fontSize: '14px', lineHeight: '1.4' }}>{game.description}</p>
          </div>
        ))}
      </div>
      
    </div>
  );
};

export default Lobby;