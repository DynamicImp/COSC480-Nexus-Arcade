import React, { useRef, useEffect, useState, useCallback } from 'react';
import { gameAPI } from '../api';

// Define core game physics and rendering constants
const CANVAS_WIDTH = 600;
const CANVAS_HEIGHT = 400;
const PADDLE_WIDTH = 10;
const PADDLE_HEIGHT = 80;
const BALL_SIZE = 10;
const PLAYER_SPEED = 6;
const CPU_SPEED = 4;
const INITIAL_BALL_SPEED = 5;
const WINNING_SCORE = 3;

const Pong = ({ user }) => {
  // DOM reference for the HTML5 Canvas
  const canvasRef = useRef(null);
  
  // Mutable references for the game loop to avoid React re-renders on every frame
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

  // Track active keyboard inputs
  const keys = useRef({ ArrowUp: false, ArrowDown: false });

  // React state for UI overlays and synchronization
  const [statusUI, setStatusUI] = useState('idle');
  const [winner, setWinner] = useState(null);

  // Synchronize game outcome with backend database
  const recordMatchOutcome = useCallback(async (isWin) => {
    try {
      // Award 5 chips for a win, 0 for a loss (Free tier game)
      const payoutAmount = isWin ? 5 : 0;
      
      await gameAPI.recordMatch({
        userId: user.id,
        gameName: 'Pong',
        wager: 0, 
        result: isWin ? 'Win' : 'Loss',
        payout: payoutAmount
      });
    } catch (err) {
      console.error('API synchronization failed during match recording:', err);
    }
  }, [user.id]);

  // Main game physics and rendering loop
  const gameLoop = useCallback(() => {
    const state = gameState.current;
    if (state.status !== 'playing') return;

    const canvas = canvasRef.current;
    if (!canvas) return;
    const ctx = canvas.getContext('2d');

    // Process player input and update paddle position
    if (keys.current.ArrowUp && state.playerY > 0) {
      state.playerY -= PLAYER_SPEED;
    }
    if (keys.current.ArrowDown && state.playerY < CANVAS_HEIGHT - PADDLE_HEIGHT) {
      state.playerY += PLAYER_SPEED;
    }

    // Execute basic CPU paddle AI tracking the ball's Y-axis
    const cpuCenter = state.cpuY + PADDLE_HEIGHT / 2;
    if (cpuCenter < state.ballY - 10 && state.cpuY < CANVAS_HEIGHT - PADDLE_HEIGHT) {
      state.cpuY += CPU_SPEED;
    } else if (cpuCenter > state.ballY + 10 && state.cpuY > 0) {
      state.cpuY -= CPU_SPEED;
    }

    // Update ball coordinates based on current velocity vectors
    state.ballX += state.ballDX;
    state.ballY += state.ballDY;

    // Evaluate top and bottom wall collisions
    if (state.ballY <= 0 || state.ballY >= CANVAS_HEIGHT - BALL_SIZE) {
      state.ballDY *= -1;
    }

    // Evaluate collision boundary for Player paddle
    if (
      state.ballX <= PADDLE_WIDTH &&
      state.ballY + BALL_SIZE >= state.playerY &&
      state.ballY <= state.playerY + PADDLE_HEIGHT
    ) {
      state.ballDX = Math.abs(state.ballDX) + 0.5; // Increment speed on hit
      state.ballX = PADDLE_WIDTH; // Prevent clipping
    }

    // Evaluate collision boundary for CPU paddle
    if (
      state.ballX >= CANVAS_WIDTH - PADDLE_WIDTH - BALL_SIZE &&
      state.ballY + BALL_SIZE >= state.cpuY &&
      state.ballY <= state.cpuY + PADDLE_HEIGHT
    ) {
      state.ballDX = -Math.abs(state.ballDX) - 0.5; // Increment speed on hit
      state.ballX = CANVAS_WIDTH - PADDLE_WIDTH - BALL_SIZE; // Prevent clipping
    }

    // Evaluate out-of-bounds conditions (Scoring)
    if (state.ballX < 0) {
      state.cpuScore += 1;
      resetBall(state, 1);
    } else if (state.ballX > CANVAS_WIDTH) {
      state.playerScore += 1;
      resetBall(state, -1);
    }

    // Evaluate win condition
    if (state.playerScore >= WINNING_SCORE || state.cpuScore >= WINNING_SCORE) {
      state.status = 'gameover';
      setStatusUI('gameover');
      const isPlayerWin = state.playerScore >= WINNING_SCORE;
      setWinner(isPlayerWin ? 'Player' : 'CPU');
      recordMatchOutcome(isPlayerWin);
      return; // Halt rendering loop
    }

    // Render operations
    // Clear previous frame
    ctx.fillStyle = '#000000';
    ctx.fillRect(0, 0, CANVAS_WIDTH, CANVAS_HEIGHT);

    // Render center dashed net
    ctx.setLineDash([10, 10]);
    ctx.beginPath();
    ctx.moveTo(CANVAS_WIDTH / 2, 0);
    ctx.lineTo(CANVAS_WIDTH / 2, CANVAS_HEIGHT);
    ctx.strokeStyle = '#ffffff';
    ctx.stroke();

    // Render player and CPU paddles
    ctx.fillStyle = '#ffffff';
    ctx.fillRect(0, state.playerY, PADDLE_WIDTH, PADDLE_HEIGHT);
    ctx.fillRect(CANVAS_WIDTH - PADDLE_WIDTH, state.cpuY, PADDLE_WIDTH, PADDLE_HEIGHT);

    // Render ball
    ctx.fillRect(state.ballX, state.ballY, BALL_SIZE, BALL_SIZE);

    // Request next animation frame
    requestRef.current = requestAnimationFrame(gameLoop);
  }, [recordMatchOutcome]);

  // Restores ball to center with directional velocity based on scoring player
  const resetBall = (state, directionMultiplier) => {
    state.ballX = CANVAS_WIDTH / 2;
    state.ballY = CANVAS_HEIGHT / 2;
    state.ballDX = INITIAL_BALL_SPEED * directionMultiplier;
    state.ballDY = INITIAL_BALL_SPEED * (Math.random() > 0.5 ? 1 : -1);
  };

  // Triggers game initialization
  const startGame = () => {
    gameState.current.playerScore = 0;
    gameState.current.cpuScore = 0;
    gameState.current.status = 'playing';
    setStatusUI('playing');
    setWinner(null);
    resetBall(gameState.current, 1);
    requestRef.current = requestAnimationFrame(gameLoop);
  };

  // Bind keyboard event listeners
  useEffect(() => {
    const handleKeyDown = (e) => {
      if (keys.current.hasOwnProperty(e.key)) keys.current[e.key] = true;
    };
    const handleKeyUp = (e) => {
      if (keys.current.hasOwnProperty(e.key)) keys.current[e.key] = false;
    };

    window.addEventListener('keydown', handleKeyDown);
    window.addEventListener('keyup', handleKeyUp);

    return () => {
      window.removeEventListener('keydown', handleKeyDown);
      window.removeEventListener('keyup', handleKeyUp);
      cancelAnimationFrame(requestRef.current);
    };
  }, []);

  // Initialize and clean up game loop request
  useEffect(() => {
    if (statusUI === 'playing') {
      requestRef.current = requestAnimationFrame(gameLoop);
    }
    return () => cancelAnimationFrame(requestRef.current);
  }, [statusUI, gameLoop]);

  return (
    <div style={{ textAlign: 'center', margin: '0 auto', maxWidth: '650px' }}>
      <h2>Pong</h2>
      
      {/* Score Header */}
      <div style={{ display: 'flex', justifyContent: 'space-between', padding: '0 50px', marginBottom: '10px' }}>
        <h3>Player: {gameState.current.playerScore}</h3>
        <h3>CPU: {gameState.current.cpuScore}</h3>
      </div>

      {/* Primary Rendering Canvas */}
      <div style={{ position: 'relative', display: 'inline-block' }}>
        <canvas 
          ref={canvasRef} 
          width={CANVAS_WIDTH} 
          height={CANVAS_HEIGHT} 
          style={{ backgroundColor: '#000', border: '4px solid #333', borderRadius: '8px' }}
        />
        
        {/* Game State Overlays */}
        {statusUI === 'idle' && (
          <div style={{
            position: 'absolute', top: 0, left: 0, right: 0, bottom: 0,
            backgroundColor: 'rgba(0,0,0,0.6)', color: 'white',
            display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center'
          }}>
            <h3 style={{ marginBottom: '20px' }}>Use Up/Down Arrows to Move</h3>
            <button onClick={startGame} style={{ padding: '10px 20px', fontSize: '18px', cursor: 'pointer' }}>
              Start Game
            </button>
          </div>
        )}

        {statusUI === 'gameover' && (
          <div style={{
            position: 'absolute', top: 0, left: 0, right: 0, bottom: 0,
            backgroundColor: 'rgba(0,0,0,0.8)', color: 'white',
            display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center'
          }}>
            <h2 style={{ color: winner === 'Player' ? '#2ecc71' : '#e74c3c' }}>
              {winner} Wins!
            </h2>
            <p style={{ marginBottom: '20px' }}>
              {winner === 'Player' ? 'Reward: +5 Chips' : 'Reward: 0 Chips'}
            </p>
            <button onClick={startGame} style={{ padding: '10px 20px', fontSize: '18px', cursor: 'pointer' }}>
              Play Again
            </button>
          </div>
        )}
      </div>
    </div>
  );
};

export default Pong;