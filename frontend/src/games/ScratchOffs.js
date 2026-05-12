import React, { useState, useEffect } from 'react';
import { chipAPI } from '../api';

const ScratchOffs = ({ user, onUpdateUser }) => {
  const isVip = user?.isVip || (user?.subscriptionExpiry && new Date(user.subscriptionExpiry) > new Date());

  const [grid, setGrid] = useState([]);
  const [status, setStatus] = useState(isVip ? 'playing' : 'locked');
  const [rewardAmount, setRewardAmount] = useState(0);
  const [error, setError] = useState('');
  const [coinsFound, setCoinsFound] = useState(0);

  useEffect(() => {
    if (!isVip) return;

    const generateGrid = () => {
      const symbols = ['🪙', '🪙', '🪙', '❌', '❌', '❌', '❌', '❌', '❌'];
      
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
  }, [isVip]);

  const handleReveal = async (index) => {
    if (status !== 'playing' || grid[index].isRevealed) return;

    const newGrid = [...grid];
    newGrid[index].isRevealed = true;
    setGrid(newGrid);

    let currentCoins = coinsFound;
    if (newGrid[index].symbol === '🪙') {
      currentCoins += 1;
      setCoinsFound(currentCoins);
    }

    if (currentCoins === 3) {
      setStatus('processing');
      try {
        const response = await chipAPI.claimDailyReward(user.id);
        
        const issuedReward = response.rewardAmount || 500;
        setRewardAmount(issuedReward);
        setStatus('won');
        
        setGrid(prevGrid => prevGrid.map(cell => ({ ...cell, isRevealed: true })));

        if (onUpdateUser) {
          const newTotal = response.newBalance !== undefined ? response.newBalance : user.chips + issuedReward;
          onUpdateUser({ ...user, chips: newTotal });
        }
      } catch (err) {
        console.error('Reward claim failed:', err);
        setError('Claim failed. The daily reward may have already been redeemed today.');
        setStatus('error');
      }
    }
  };

  return (
    <div style={{ textAlign: 'center', maxWidth: '500px', margin: '0 auto', padding: '20px', color: '#fff' }}>
      <h2 style={{ color: '#f39c12' }}>VIP Daily Scratch-Off</h2>
      <p style={{ color: '#aaa' }}>Reveal 3 Gold Coins (🪙) to claim your daily VIP reward.</p>

      {!isVip && (
        <div style={{ backgroundColor: 'rgba(231, 76, 60, 0.1)', padding: '20px', borderRadius: '8px', border: '1px solid #e74c3c', marginTop: '20px' }}>
          <h3 style={{ color: '#e74c3c', marginTop: 0 }}>VIP Access Required</h3>
          <p style={{ color: '#fff', marginBottom: 0 }}>An active VIP Pass is required to access daily scratch-offs. Visit the Arcade Cashier to upgrade.</p>
        </div>
      )}

      {error && (
        <div style={{ color: '#e74c3c', marginTop: '15px', padding: '10px', backgroundColor: 'rgba(231, 76, 60, 0.1)', borderRadius: '5px', border: '1px solid #e74c3c' }}>
          {error}
        </div>
      )}

      {isVip && (
        <div style={{
          display: 'grid',
          gridTemplateColumns: 'repeat(3, 100px)',
          gap: '15px',
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
                backgroundColor: cell.isRevealed ? '#1a1a2e' : '#f39c12',
                border: cell.isRevealed ? '2px solid #333' : '2px solid #e67e22',
                borderRadius: '8px',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                fontSize: '40px',
                cursor: status === 'playing' && !cell.isRevealed ? 'pointer' : 'default',
                boxShadow: cell.isRevealed ? 'inset 0 4px 8px rgba(0,0,0,0.5)' : '0 4px 6px rgba(0,0,0,0.3)',
                transition: 'all 0.3s'
              }}
            >
              {cell.isRevealed ? cell.symbol : '❓'}
            </div>
          ))}
        </div>
      )}

      {status === 'processing' && <h3 style={{ marginTop: '25px', color: '#f39c12' }}>Verifying claim...</h3>}
      
      {status === 'won' && (
        <div style={{ marginTop: '30px', backgroundColor: 'rgba(46, 204, 113, 0.1)', padding: '20px', borderRadius: '8px', border: '1px solid #2ecc71' }}>
          <h2 style={{ color: '#2ecc71', margin: '0 0 10px 0' }}>Victory!</h2>
          <p style={{ margin: 0, color: '#fff' }}>Daily reward claimed: <strong style={{ color: '#2ecc71' }}>{rewardAmount} Chips</strong> added to balance.</p>
        </div>
      )}
    </div>
  );
};

export default ScratchOffs;