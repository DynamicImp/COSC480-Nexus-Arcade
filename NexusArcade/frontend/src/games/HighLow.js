import React, { useState } from 'react';
import { gameAPI } from '../api';

const HighLow = ({ user }) => {
  // Initialize game state variables
  const [wager, setWager] = useState(10);
  const [guess, setGuess] = useState('high'); 
  const [rollResult, setRollResult] = useState(null);
  const [status, setStatus] = useState('idle'); 
  const [error, setError] = useState('');

  // Execute game logic and synchronize outcome with the backend API
  const handlePlay = async () => {
    // Validate wager input against user balance
    if (wager <= 0) {
      setError('Wager must be greater than 0.');
      return;
    }
    if (wager > user.chips) {
      setError('Insufficient chips for this wager.');
      return;
    }

    // Reset UI state for the current round
    setError('');
    setStatus('rolling');
    setRollResult(null);

    // Simulate network latency for UI rolling effect
    setTimeout(async () => {
      // Generate a random integer between 1 and 100
      const outcome = Math.floor(Math.random() * 100) + 1;
      setRollResult(outcome);

      // Evaluate win condition based on user guess boundaries
      const isWin = (guess === 'high' && outcome >= 51) || (guess === 'low' && outcome <= 50);
      setStatus(isWin ? 'won' : 'lost');

      // Calculate payout integer for database synchronization
      const payoutAmount = isWin ? parseInt(wager, 10) : -parseInt(wager, 10);

      try {
        // Record match outcome in the database
        await gameAPI.recordMatch({
          userId: user.id,
          gameName: 'High-Low',
          wager: parseInt(wager, 10),
          result: isWin ? 'Win' : 'Loss',
          payout: payoutAmount
        });
      } catch (err) {
        console.error('Failed to record match:', err);
        setError('Server synchronization failed. Balance may not be updated.');
      }
    }, 1200);
  };

  return (
    <div style={{ textAlign: 'center', maxWidth: '500px', margin: '0 auto', padding: '20px' }}>
      <h2>High-Low</h2>
      <p>Roll 1-50 is <strong>Low</strong>. Roll 51-100 is <strong>High</strong>.</p>

      {/* Render error validation messages */}
      {error && <div style={{ color: 'red', marginBottom: '15px' }}>{error}</div>}

      {/* Wager input configuration */}
      <div style={{ marginBottom: '20px', padding: '15px', backgroundColor: '#f9f9f9', borderRadius: '8px' }}>
        <label style={{ display: 'block', marginBottom: '10px', fontWeight: 'bold' }}>
          Wager Amount (Chips):
        </label>
        <input 
          type="number" 
          value={wager}
          onChange={(e) => setWager(e.target.value)}
          min="1"
          max={user.chips}
          disabled={status === 'rolling'}
          style={{ padding: '8px', width: '100px', textAlign: 'center', fontSize: '16px' }}
        />
      </div>

      {/* Guess selection controls */}
      <div style={{ marginBottom: '20px' }}>
        <button 
          onClick={() => setGuess('low')}
          disabled={status === 'rolling'}
          style={{ 
            padding: '10px 20px', 
            marginRight: '10px',
            backgroundColor: guess === 'low' ? '#3498db' : '#ccc',
            color: guess === 'low' ? 'white' : 'black',
            border: 'none',
            borderRadius: '5px',
            cursor: 'pointer'
          }}
        >
          Bet LOW (1-50)
        </button>
        <button 
          onClick={() => setGuess('high')}
          disabled={status === 'rolling'}
          style={{ 
            padding: '10px 20px', 
            backgroundColor: guess === 'high' ? '#e74c3c' : '#ccc',
            color: guess === 'high' ? 'white' : 'black',
            border: 'none',
            borderRadius: '5px',
            cursor: 'pointer'
          }}
        >
          Bet HIGH (51-100)
        </button>
      </div>

      {/* Play execution trigger */}
      <button 
        onClick={handlePlay}
        disabled={status === 'rolling'}
        style={{ padding: '15px 30px', fontSize: '18px', fontWeight: 'bold', cursor: 'pointer' }}
      >
        {status === 'rolling' ? 'Processing...' : 'PLAY'}
      </button>

      {/* Outcome and payout display area */}
      <div style={{ marginTop: '30px', minHeight: '100px' }}>
        {status === 'rolling' && <h3 style={{ color: '#888' }}>Generating secure random number...</h3>}
        
        {rollResult && status !== 'rolling' && (
          <div>
            <div style={{ 
              fontSize: '64px', 
              fontWeight: 'bold', 
              color: status === 'won' ? '#2ecc71' : '#e74c3c' 
            }}>
              {rollResult}
            </div>
            <h3>
              {status === 'won' 
                ? `You Won! +${wager} Chips` 
                : `You Lost! -${wager} Chips`}
            </h3>
          </div>
        )}
      </div>
    </div>
  );
};

export default HighLow;