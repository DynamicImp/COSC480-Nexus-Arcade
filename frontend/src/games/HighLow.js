import React, { useState } from 'react';
import { gameAPI } from '../api';

const HighLow = ({ user, onUpdateUser }) => {
  const [wager, setWager] = useState(10);
  const [guess, setGuess] = useState('high'); 
  const [rollResult, setRollResult] = useState(null);
  const [status, setStatus] = useState('idle'); 
  const [error, setError] = useState('');

  /**
   * Executes the RNG generation, evaluates the win condition,
   * and synchronizes the transaction with the backend API.
   */
  const handlePlay = async () => {
    const wagerNum = parseInt(wager, 10);
    
    if (isNaN(wagerNum) || wagerNum <= 0) {
      setError('Wager must be a valid positive integer.');
      return;
    }
    if (wagerNum > user.chips) {
      setError('Insufficient chips for this wager.');
      return;
    }

    setError('');
    setStatus('rolling');
    setRollResult(null);

    setTimeout(async () => {
      const outcome = Math.floor(Math.random() * 100) + 1;
      setRollResult(outcome);

      const isWin = (guess === 'high' && outcome >= 51) || (guess === 'low' && outcome <= 50);
      setStatus(isWin ? 'won' : 'lost');

      const payoutAmount = isWin ? wagerNum : -wagerNum;

      try {
        const response = await gameAPI.recordMatch({
          userId: user.id,
          gameName: 'High-Low',
          wager: wagerNum,
          result: isWin ? 'Win' : 'Loss',
          payout: payoutAmount
        });

        if (onUpdateUser) {
          const newTotal = response.newBalance !== undefined ? response.newBalance : user.chips + payoutAmount;
          onUpdateUser({ ...user, chips: newTotal });
        }
      } catch (err) {
        console.error('API Error: Match Record Failure', err);
        setError('Server synchronization failed. Balance may not reflect the recent transaction.');
      }
    }, 1200);
  };

  return (
    <div style={{ textAlign: 'center', maxWidth: '500px', margin: '0 auto', padding: '20px', color: '#fff' }}>
      <h2 style={{ color: '#f39c12', marginBottom: '10px' }}>High/Low</h2>
      <p style={{ color: '#aaa', marginBottom: '25px' }}>Roll 1-50 is <strong>Low</strong>. Roll 51-100 is <strong>High</strong>.</p>

      {error && (
        <div style={{ color: '#e74c3c', marginBottom: '15px', padding: '10px', backgroundColor: 'rgba(231, 76, 60, 0.1)', borderRadius: '5px', border: '1px solid #e74c3c' }}>
          {error}
        </div>
      )}

      <div style={{ marginBottom: '25px', padding: '20px', backgroundColor: '#16213e', borderRadius: '8px', border: '1px solid #333' }}>
        <label style={{ display: 'block', marginBottom: '10px', fontWeight: 'bold', color: '#fff' }}>
          Wager Amount (Chips)
        </label>
        <input 
          type="number" 
          value={wager}
          onChange={(e) => setWager(e.target.value)}
          min="1"
          max={user.chips}
          disabled={status === 'rolling'}
          style={{ 
            padding: '10px', 
            width: '120px', 
            textAlign: 'center', 
            fontSize: '18px',
            backgroundColor: '#1a1a2e',
            color: '#2ecc71',
            border: '2px solid #333',
            borderRadius: '6px',
            fontWeight: 'bold'
          }}
        />
      </div>

      <div style={{ marginBottom: '25px', display: 'flex', justifyContent: 'center', gap: '15px' }}>
        <button 
          onClick={() => setGuess('low')}
          disabled={status === 'rolling'}
          style={{ 
            flex: 1,
            padding: '12px 20px', 
            backgroundColor: guess === 'low' ? '#3498db' : '#1a1a2e',
            color: guess === 'low' ? '#fff' : '#888',
            border: guess === 'low' ? '2px solid #2980b9' : '2px solid #333',
            borderRadius: '6px',
            cursor: status === 'rolling' ? 'not-allowed' : 'pointer',
            fontWeight: 'bold',
            transition: 'all 0.2s'
          }}
        >
          Bet LOW (1-50)
        </button>
        <button 
          onClick={() => setGuess('high')}
          disabled={status === 'rolling'}
          style={{ 
            flex: 1,
            padding: '12px 20px', 
            backgroundColor: guess === 'high' ? '#e74c3c' : '#1a1a2e',
            color: guess === 'high' ? '#fff' : '#888',
            border: guess === 'high' ? '2px solid #c0392b' : '2px solid #333',
            borderRadius: '6px',
            cursor: status === 'rolling' ? 'not-allowed' : 'pointer',
            fontWeight: 'bold',
            transition: 'all 0.2s'
          }}
        >
          Bet HIGH (51-100)
        </button>
      </div>

      <button 
        onClick={handlePlay}
        disabled={status === 'rolling'}
        style={{ 
          padding: '15px 40px', 
          fontSize: '18px', 
          fontWeight: 'bold', 
          cursor: status === 'rolling' ? 'not-allowed' : 'pointer',
          backgroundColor: status === 'rolling' ? '#555' : '#e94560',
          color: '#fff',
          border: 'none',
          borderRadius: '8px',
          width: '100%',
          boxShadow: status === 'rolling' ? 'none' : '0 4px 6px rgba(233, 69, 96, 0.3)'
        }}
      >
        {status === 'rolling' ? 'Processing...' : 'EXECUTE WAGER'}
      </button>

      <div style={{ marginTop: '30px', minHeight: '100px' }}>
        {status === 'rolling' && <h3 style={{ color: '#f39c12' }}>Generating cryptographic roll...</h3>}
        
        {rollResult && status !== 'rolling' && (
          <div style={{ backgroundColor: '#16213e', padding: '20px', borderRadius: '8px', border: status === 'won' ? '2px solid #2ecc71' : '2px solid #e74c3c' }}>
            <div style={{ 
              fontSize: '64px', 
              fontWeight: 'bold', 
              color: status === 'won' ? '#2ecc71' : '#e74c3c',
              textShadow: '0 2px 4px rgba(0,0,0,0.5)'
            }}>
              {rollResult}
            </div>
            <h3 style={{ color: '#fff', margin: '10px 0 0 0' }}>
              {status === 'won' 
                ? `Victory! +${wager} Chips` 
                : `Defeat! -${wager} Chips`}
            </h3>
          </div>
        )}
      </div>
    </div>
  );
};

export default HighLow;