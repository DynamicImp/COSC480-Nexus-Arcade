import React, { useState, useEffect, useCallback } from 'react';
import { gameAPI } from '../api';

const ROWS = 6;
const COLS = 7;
const EMPTY_SLOT = 0;
const PLAYER_PIECE = 1;
const CPU_PIECE = 2;

const ConnectFour = ({ user, onUpdateUser }) => {
  const [board, setBoard] = useState(
    Array.from({ length: ROWS }, () => Array(COLS).fill(EMPTY_SLOT))
  );
  const [currentPlayer, setCurrentPlayer] = useState(PLAYER_PIECE);
  const [winner, setWinner] = useState(null);
  const [isProcessing, setIsProcessing] = useState(false);

  /**
   * Evaluates the matrix for a sequence of 4 identical tokens.
   * @param {number[][]} currentBoard - The state matrix to evaluate.
   * @param {number} player - The identifier of the player to verify.
   * @returns {boolean} - Returns true if a win condition is detected.
   */
  const checkWin = useCallback((currentBoard, player) => {
    for (let r = 0; r < ROWS; r++) {
      for (let c = 0; c < COLS - 3; c++) {
        if (currentBoard[r][c] === player && currentBoard[r][c + 1] === player && currentBoard[r][c + 2] === player && currentBoard[r][c + 3] === player) return true;
      }
    }
    for (let r = 0; r < ROWS - 3; r++) {
      for (let c = 0; c < COLS; c++) {
        if (currentBoard[r][c] === player && currentBoard[r + 1][c] === player && currentBoard[r + 2][c] === player && currentBoard[r + 3][c] === player) return true;
      }
    }
    for (let r = 3; r < ROWS; r++) {
      for (let c = 0; c < COLS - 3; c++) {
        if (currentBoard[r][c] === player && currentBoard[r - 1][c + 1] === player && currentBoard[r - 2][c + 2] === player && currentBoard[r - 3][c + 3] === player) return true;
      }
    }
    for (let r = 0; r < ROWS - 3; r++) {
      for (let c = 0; c < COLS - 3; c++) {
        if (currentBoard[r][c] === player && currentBoard[r + 1][c + 1] === player && currentBoard[r + 2][c + 2] === player && currentBoard[r + 3][c + 3] === player) return true;
      }
    }
    return false;
  }, []);

  /**
   * Records match outcome via API and triggers global state synchronization.
   * @param {string} resultType - The outcome string ('Win', 'Loss', 'Draw').
   */
  const handleGameEnd = useCallback(async (resultType) => {
    setIsProcessing(true);
    try {
      const payoutAmount = resultType === 'Win' ? 10 : 0;
      
      const response = await gameAPI.recordMatch({
        userId: user.id,
        gameName: 'Connect Four',
        wager: 0,
        result: resultType,
        payout: payoutAmount
      });
      
      if (onUpdateUser && resultType === 'Win') {
        const newTotal = response.newBalance !== undefined ? response.newBalance : user.chips + payoutAmount;
        onUpdateUser({ chips: newTotal });
      }
    } catch (error) {
      console.error('API Error: Match Record Failure', error);
    } finally {
      setIsProcessing(false);
    }
  }, [user.id, user.chips, onUpdateUser]);

  /**
   * Helper function to simulate a drop for heuristic evaluation.
   */
  const simulateDrop = (boardState, col, player) => {
    for (let r = ROWS - 1; r >= 0; r--) {
      if (boardState[r][col] === EMPTY_SLOT) {
        boardState[r][col] = player;
        return true;
      }
    }
    return false;
  };

  /**
   * Calculates the optimal move for the CPU using a defensive heuristic.
   */
  const calculateOptimalMove = useCallback((currentBoard) => {
    const validCols = [];
    for (let c = 0; c < COLS; c++) {
      if (currentBoard[0][c] === EMPTY_SLOT) validCols.push(c);
    }

    if (validCols.length === 0) return null;

    // Phase 1: Search for immediate CPU win condition
    for (let c of validCols) {
      const boardCopy = currentBoard.map(row => [...row]);
      simulateDrop(boardCopy, c, CPU_PIECE);
      if (checkWin(boardCopy, CPU_PIECE)) return c;
    }

    // Phase 2: Search for immediate Player win condition to block
    for (let c of validCols) {
      const boardCopy = currentBoard.map(row => [...row]);
      simulateDrop(boardCopy, c, PLAYER_PIECE);
      if (checkWin(boardCopy, PLAYER_PIECE)) return c;
    }

    // Phase 3: Positional advantage (center bias)
    const centerCol = Math.floor(COLS / 2);
    if (validCols.includes(centerCol) && Math.random() > 0.3) {
      return centerCol;
    }

    return validCols[Math.floor(Math.random() * validCols.length)];
  }, [checkWin]);

  const makeCPUMove = useCallback(() => {
    if (winner) return;

    setBoard((prevBoard) => {
      const targetCol = calculateOptimalMove(prevBoard);

      if (targetCol === null) {
        setWinner('Draw');
        handleGameEnd('Draw');
        return prevBoard;
      }

      const newBoard = prevBoard.map(row => [...row]);
      simulateDrop(newBoard, targetCol, CPU_PIECE);
      
      if (checkWin(newBoard, CPU_PIECE)) {
        setWinner('CPU');
        handleGameEnd('Loss');
      } else {
        setCurrentPlayer(PLAYER_PIECE);
      }
      
      return newBoard;
    });
  }, [winner, calculateOptimalMove, checkWin, handleGameEnd]);

  useEffect(() => {
    if (currentPlayer === CPU_PIECE && !winner) {
      const cpuTimer = setTimeout(() => {
        makeCPUMove();
      }, 600);
      return () => clearTimeout(cpuTimer);
    }
  }, [currentPlayer, winner, makeCPUMove]);

  const dropPiece = (colIndex) => {
    if (winner || currentPlayer !== PLAYER_PIECE || isProcessing) return;

    setBoard((prevBoard) => {
      if (prevBoard[0][colIndex] !== EMPTY_SLOT) return prevBoard;

      const newBoard = prevBoard.map(row => [...row]);
      simulateDrop(newBoard, colIndex, PLAYER_PIECE);
      
      if (checkWin(newBoard, PLAYER_PIECE)) {
        setWinner('Player');
        handleGameEnd('Win');
      } else {
        setCurrentPlayer(CPU_PIECE);
      }
      return newBoard;
    });
  };

  const resetGame = () => {
    setBoard(Array.from({ length: ROWS }, () => Array(COLS).fill(EMPTY_SLOT)));
    setCurrentPlayer(PLAYER_PIECE);
    setWinner(null);
  };

  const getCellColor = (cellValue) => {
    if (cellValue === PLAYER_PIECE) return '#e94560';
    if (cellValue === CPU_PIECE) return '#f39c12';
    return '#1a1a2e';
  };

  return (
    <div style={{ textAlign: 'center', maxWidth: '600px', margin: '0 auto', color: '#fff' }}>
      <h2 style={{ color: '#e94560' }}>Connect Four</h2>
      
      <div style={{ marginBottom: '20px', height: '30px' }}>
        {winner ? (
          <h3 style={{ color: winner === 'Player' ? '#2ecc71' : '#e74c3c' }}>
            {winner === 'Draw' ? "Draw Detected" : `${winner} Victory!`}
          </h3>
        ) : (
          <h3 style={{ color: currentPlayer === PLAYER_PIECE ? '#e94560' : '#f39c12' }}>
            {currentPlayer === PLAYER_PIECE ? 'Your Turn (Red)' : 'CPU Processing (Yellow)...'}
          </h3>
        )}
      </div>

      <div style={{ 
        backgroundColor: '#0f3460', 
        padding: '15px', 
        borderRadius: '12px',
        display: 'inline-block',
        border: '2px solid #16213e'
      }}>
        {board.map((row, rowIndex) => (
          <div key={rowIndex} style={{ display: 'flex' }}>
            {row.map((cell, colIndex) => (
              <div 
                key={`${rowIndex}-${colIndex}`}
                onClick={() => dropPiece(colIndex)}
                style={{
                  width: '50px',
                  height: '50px',
                  backgroundColor: getCellColor(cell),
                  borderRadius: '50%',
                  margin: '5px',
                  cursor: currentPlayer === PLAYER_PIECE && !winner ? 'pointer' : 'default',
                  boxShadow: cell !== EMPTY_SLOT ? 'inset 0 -3px 6px rgba(0,0,0,0.4)' : 'inset 0 3px 6px rgba(0,0,0,0.6)'
                }}
              />
            ))}
          </div>
        ))}
      </div>

      {winner && (
        <div style={{ marginTop: '25px' }}>
          <button 
            onClick={resetGame}
            style={{ 
              padding: '12px 24px', 
              fontSize: '16px', 
              cursor: 'pointer',
              backgroundColor: '#e94560',
              color: '#fff',
              border: 'none',
              borderRadius: '6px',
              fontWeight: 'bold'
            }}
          >
            Initialize New Match
          </button>
        </div>
      )}
    </div>
  );
};

export default ConnectFour;