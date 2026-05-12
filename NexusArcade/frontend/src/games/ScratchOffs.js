import React, { useState, useEffect } from 'react';
import { chipAPI } from '../api';

const ScratchOffs = ({ user }) => {
  // Verify user subscription status for premium access
  const hasSubscription = user?.subscriptionExpiry && new Date(user.subscriptionExpiry) > new Date();

  // Initialize game state variables
  const [grid, setGrid] = useState([]);
  const [status, setStatus] = useState(hasSubscription ? 'playing' : 'locked');
  const [rewardAmount, setRewardAmount] = useState(0);
  const [error, setError] = useState('');
  const [coinsFound, setCoinsFound] = useState(0);

  // Generate a randomized 3x3 grid containing exactly 3 winning symbols
  useEffect(() => {
    if (!hasSubscription) return;

    const generateGrid = () => {
      const symbols = ['🪙', '🪙', '🪙', '❌', '❌', '❌', '❌', '❌', '❌'];
      
      // Fisher-Yates shuffle algorithm for cryptographic randomness
      for (let i = symbols.length - 1; i > 0; i--) {
        const j = Math.floor(Math.random() * (i + 1));
        [symbols[i], symbols[j]] = [symbols[j], symbols[i]];
      }
      
      setGrid(symbols.map((symbol, index) => ({
        id: index,
        symbol: symbol,
        isRevealed: false
      })));
    };

    generateGrid();
  }, [hasSubscription]);

  // Handle individual cell interaction and game progression
  const handleReveal = async (index) => {
    if (status !== 'playing' || grid[index].isRevealed) return;

    // Create a mutable copy of the grid state
    const newGrid = [...grid];
    newGrid[index].isRevealed = true;
    setGrid(newGrid);

    // Evaluate progression condition
    let currentCoins = coinsFound;
    if (newGrid[index].symbol === '🪙') {
      currentCoins += 1;
      setCoinsFound(currentCoins);
    }

    // Evaluate win condition
    if (currentCoins === 3) {
      setStatus('processing');
      try {
        // Execute API request to claim the daily premium reward
        const response = await chipAPI.claimDailyReward(user.id);
        setRewardAmount(response.rewardAmount);
        setStatus('won');
        
        // Reveal all remaining cells upon completion
        setGrid(prevGrid => prevGrid.map(cell => ({ ...cell, isRevealed: true })));
      } catch (err) {
        console.error('Reward claim failed:', err);
        setError('Failed to claim reward. You may have already claimed it today.');
        setStatus('error');
      }
    }
  };

  return (
    <div style={{ textAlign: 'center', maxWidth: '500px', margin: '0 auto', padding: '20px' }}>
      <h2>Daily Premium Scratch-Off</h2>
      <p>Find 3 Gold Coins (🪙) to claim your daily subscription reward!</p>

      {/* Access control rendering */}
      {!hasSubscription && (
        <div style={{ backgroundColor: '#f8d7da', padding: '20px', borderRadius: '8px', color: '#721c24' }}>
          <h3>Premium Feature Locked</h3>
          <p>You need an active Web3 subscription to access daily scratch-offs.</p>
        </div>
      )}

      {/* Error state rendering */}
      {error && <div style={{ color: 'red', marginBottom: '15px' }}>{error}</div>}

      {/* Main interactive grid rendering */}
      {hasSubscription && (
        <div style={{
          display: 'grid',
          gridTemplateColumns: 'repeat(3, 100px)',
          gap: '10px',
          justifyContent: 'center',
          marginTop: '30px'
        }}>
          {grid.map((cell, index) => (
            <div
              key={cell.id}
              onClick={() => handleReveal(index)}
              style={{
                width: '100px',
                height: '100px',
                backgroundColor: cell.isRevealed ? '#ecf0f1' : '#bdc3c7',
                border: '2px solid #95a5a6',
                borderRadius: '8px',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                fontSize: '40px',
                cursor: status === 'playing' && !cell.isRevealed ? 'pointer' : 'default',
                boxShadow: cell.isRevealed ? 'inset 0 0 10px rgba(0,0,0,0.1)' : '0 4px 6px rgba(0,0,0,0.1)',
                transition: 'background-color 0.3s'
              }}
            >
              {cell.isRevealed ? cell.symbol : ''}
            </div>
          ))}
        </div>
      )}

      {/* Completion state rendering */}
      {status === 'processing' && <h3 style={{ marginTop: '20px', color: '#888' }}>Verifying claim...</h3>}
      
      {status === 'won' && (
        <div style={{ marginTop: '30px', backgroundColor: '#d4edda', padding: '20px', borderRadius: '8px', color: '#155724' }}>
          <h2>Winner!</h2>
          <p>You have successfully claimed your daily reward of <strong>{rewardAmount} Chips</strong>.</p>
        </div>
      )}
    </div>
  );
};

export default ScratchOffs;