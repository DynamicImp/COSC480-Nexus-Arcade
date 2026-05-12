import React, { useRef, useEffect, useState, useCallback } from 'react';
import { gameAPI } from '../api';

const CANVAS_WIDTH = 600;
const CANVAS_HEIGHT = 400;
const PADDLE_WIDTH = 10;
const PADDLE_HEIGHT = 80;
const BALL_SIZE = 10;
const PLAYER_SPEED = 6;
const CPU_SPEED = 4;
const INITIAL_BALL_SPEED = 5;
const WINNING_SCORE = 3;

const Pong = ({ user, onUpdateUser }) => {
  const canvasRef = useRef(null);
  const requestRef = useRef();
  
  const gameState = useRef({
    playerY: CANVAS_HEIGHT / 2 - PADDLE_HEIGHT / 2,
    cpuY: CANVAS_HEIGHT / 2 - PADDLE_HEIGHT / 2,
    ballX: CANVAS_WIDTH / 2,
    ballY: CANVAS_HEIGHT / 2,
    ballDX: INITIAL_BALL_SPEED,
    ballDY: INITIAL_BALL_SPEED,
    playerScore: 0,
    cpuScore: 0,
    status: 'idle' 
  });

  const keys = useRef({ ArrowUp: false, ArrowDown: false });

  const [statusUI, setStatusUI] = useState('idle');
  const [winner, setWinner] = useState(null);

  /**
   * Synchronizes match outcome with backend database and updates global state.
   * @param {boolean} isWin - Boolean indicating if the player won the match.
   */
  const recordMatchOutcome = useCallback(async (isWin) => {
    try {
      const payoutAmount = isWin ? 5 : 0;
      
      const response = await gameAPI.recordMatch({
        userId: user.id,
        gameName: 'Pong',
        wager: 0, 
        result: isWin ? 'Win' : 'Loss',
        payout: payoutAmount
      });

      if (onUpdateUser && isWin) {
        const newTotal = response.newBalance !== undefined ? response.newBalance : user.chips + payoutAmount;
        onUpdateUser({ ...user, chips: newTotal });
      }
    } catch (err) {
      console.error('API Error: Match Record Failure', err);
    }
  }, [user, onUpdateUser]);

  /**
   * Primary game physics and rendering loop.
   */
  const gameLoop = useCallback(() => {
    const state = gameState.current;
    if (state.status !== 'playing') return;

    const canvas = canvasRef.current;
    if (!canvas) return;
    const ctx = canvas.getContext('2d');

    if (keys.current.ArrowUp && state.playerY > 0) {
      state.playerY -= PLAYER_SPEED;
    }
    if (keys.current.ArrowDown && state.playerY < CANVAS_HEIGHT - PADDLE_HEIGHT) {
      state.playerY += PLAYER_SPEED;
    }

    const cpuCenter = state.cpuY + PADDLE_HEIGHT / 2;
    if (cpuCenter < state.ballY - 10 && state.cpuY < CANVAS_HEIGHT - PADDLE_HEIGHT) {
      state.cpuY += CPU_SPEED;
    } else if (cpuCenter > state.ballY + 10 && state.cpuY > 0) {
      state.cpuY -= CPU_SPEED;
    }

    state.ballX += state.ballDX;
    state.ballY += state.ballDY;

    if (state.ballY <= 0 || state.ballY >= CANVAS_HEIGHT - BALL_SIZE) {
      state.ballDY *= -1;
    }

    if (
      state.ballX <= PADDLE_WIDTH &&
      state.ballY + BALL_SIZE >= state.playerY &&
      state.ballY <= state.playerY + PADDLE_HEIGHT
    ) {
      state.ballDX = Math.abs(state.ballDX) + 0.5;
      state.ballX = PADDLE_WIDTH;
    }

    if (
      state.ballX >= CANVAS_WIDTH - PADDLE_WIDTH - BALL_SIZE &&
      state.ballY + BALL_SIZE >= state.cpuY &&
      state.ballY <= state.cpuY + PADDLE_HEIGHT
    ) {
      state.ballDX = -Math.abs(state.ballDX) - 0.5;
      state.ballX = CANVAS_WIDTH - PADDLE_WIDTH - BALL_SIZE;
    }

    if (state.ballX < 0) {
      state.cpuScore += 1;
      resetBall(state, 1);
    } else if (state.ballX > CANVAS_WIDTH) {
      state.playerScore += 1;
      resetBall(state, -1);
    }

    if (state.playerScore >= WINNING_SCORE || state.cpuScore >= WINNING_SCORE) {
      state.status = 'gameover';
      setStatusUI('gameover');
      const isPlayerWin = state.playerScore >= WINNING_SCORE;
      setWinner(isPlayerWin ? 'Player' : 'CPU');
      recordMatchOutcome(isPlayerWin);
      return; 
    }

    // Render Canvas Background
    ctx.fillStyle = '#0f3460';
    ctx.fillRect(0, 0, CANVAS_WIDTH, CANVAS_HEIGHT);

    // Render Center Net
    ctx.setLineDash([10, 10]);
    ctx.beginPath();
    ctx.moveTo(CANVAS_WIDTH / 2, 0);
    ctx.lineTo(CANVAS_WIDTH / 2, CANVAS_HEIGHT);
    ctx.strokeStyle = '#16213e';
    ctx.stroke();

    // Render Player Paddle
    ctx.fillStyle = '#e94560';
    ctx.fillRect(0, state.playerY, PADDLE_WIDTH, PADDLE_HEIGHT);

    // Render CPU Paddle
    ctx.fillStyle = '#f39c12';
    ctx.fillRect(CANVAS_WIDTH - PADDLE_WIDTH, state.cpuY, PADDLE_WIDTH, PADDLE_HEIGHT);

    // Render Ball
    ctx.fillStyle = '#2ecc71';
    ctx.fillRect(state.ballX, state.ballY, BALL_SIZE, BALL_SIZE);

    requestRef.current = requestAnimationFrame(gameLoop);
  }, [recordMatchOutcome]);

  /**
   * Restores ball to center with directional velocity.
   */
  const resetBall = (state, directionMultiplier) => {
    state.ballX = CANVAS_WIDTH / 2;
    state.ballY = CANVAS_HEIGHT / 2;
    state.ballDX = INITIAL_BALL_SPEED * directionMultiplier;
    state.ballDY = INITIAL_BALL_SPEED * (Math.random() > 0.5 ? 1 : -1);
  };

  /**
   * Initializes state and triggers game loop.
   */
  const startGame = () => {
    gameState.current.playerScore = 0;
    gameState.current.cpuScore = 0;
    gameState.current.status = 'playing';
    setStatusUI('playing');
    setWinner(null);
    resetBall(gameState.current, 1);
    requestRef.current = requestAnimationFrame(gameLoop);
  };

  useEffect(() => {
    const handleKeyDown = (e) => {
      if (keys.current.hasOwnProperty(e.key)) keys.current[e.key] = true;
      if (['ArrowUp', 'ArrowDown'].includes(e.key)) e.preventDefault(); // Prevent page scrolling
    };
    const handleKeyUp = (e) => {
      if (keys.current.hasOwnProperty(e.key)) keys.current[e.key] = false;
    };

    window.addEventListener('keydown', handleKeyDown, { passive: false });
    window.addEventListener('keyup', handleKeyUp);

    return () => {
      window.removeEventListener('keydown', handleKeyDown);
      window.removeEventListener('keyup', handleKeyUp);
      cancelAnimationFrame(requestRef.current);
    };
  }, []);

  useEffect(() => {
    if (statusUI === 'playing') {
      requestRef.current = requestAnimationFrame(gameLoop);
    }
    return () => cancelAnimationFrame(requestRef.current);
  }, [statusUI, gameLoop]);

  return (
    <div style={{ textAlign: 'center', margin: '0 auto', maxWidth: '650px', color: '#fff' }}>
      <h2 style={{ color: '#e94560', marginBottom: '10px' }}>Pong</h2>
      
      <div style={{ display: 'flex', justifyContent: 'space-between', padding: '0 50px', marginBottom: '15px' }}>
        <h3 style={{ color: '#e94560', margin: 0 }}>Player: {gameState.current.playerScore}</h3>
        <h3 style={{ color: '#f39c12', margin: 0 }}>CPU: {gameState.current.cpuScore}</h3>
      </div>

      <div style={{ position: 'relative', display: 'inline-block' }}>
        <canvas 
          ref={canvasRef} 
          width={CANVAS_WIDTH} 
          height={CANVAS_HEIGHT} 
          style={{ 
            backgroundColor: '#0f3460', 
            border: '4px solid #16213e', 
            borderRadius: '8px',
            boxShadow: '0 4px 15px rgba(0,0,0,0.5)'
          }}
        />
        
        {statusUI === 'idle' && (
          <div style={{
            position: 'absolute', top: 0, left: 0, right: 0, bottom: 0,
            backgroundColor: 'rgba(26, 26, 46, 0.85)',
            display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center',
            borderRadius: '8px'
          }}>
            <h3 style={{ marginBottom: '20px', color: '#fff' }}>Use Up/Down Arrows to Move</h3>
            <button 
              onClick={startGame} 
              style={{ 
                padding: '12px 24px', 
                fontSize: '18px', 
                cursor: 'pointer',
                backgroundColor: '#e94560',
                color: '#fff',
                border: 'none',
                borderRadius: '6px',
                fontWeight: 'bold'
              }}
            >
              INITIALIZE MATCH
            </button>
          </div>
        )}

        {statusUI === 'gameover' && (
          <div style={{
            position: 'absolute', top: 0, left: 0, right: 0, bottom: 0,
            backgroundColor: 'rgba(26, 26, 46, 0.9)',
            display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center',
            borderRadius: '8px'
          }}>
            <h2 style={{ color: winner === 'Player' ? '#2ecc71' : '#e74c3c', fontSize: '36px', margin: '0 0 10px 0' }}>
              {winner} Victory!
            </h2>
            <p style={{ marginBottom: '25px', fontSize: '18px', color: '#aaa' }}>
              {winner === 'Player' ? 'Reward: +5 Chips' : 'Reward: 0 Chips'}
            </p>
            <button 
              onClick={startGame} 
              style={{ 
                padding: '12px 24px', 
                fontSize: '18px', 
                cursor: 'pointer',
                backgroundColor: '#e94560',
                color: '#fff',
                border: 'none',
                borderRadius: '6px',
                fontWeight: 'bold'
              }}
            >
              PLAY AGAIN
            </button>
          </div>
        )}
      </div>
    </div>
  );
};

export default Pong;