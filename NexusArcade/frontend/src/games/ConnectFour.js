import React, { useState, useEffect, useCallback } from 'react';
import { gameAPI } from '../api';

const ROWS = 6;
const COLS = 7;
const EMPTY_SLOT = 0;
const PLAYER_PIECE = 1;
const CPU_PIECE = 2;

const ConnectFour = ({ user }) => {
  // Game state initialization
  const [board, setBoard] = useState(
    Array.from({ length: ROWS }, () => Array(COLS).fill(EMPTY_SLOT))
  );
  const [currentPlayer, setCurrentPlayer] = useState(PLAYER_PIECE);
  const [winner, setWinner] = useState(null);
  const [isProcessing, setIsProcessing] = useState(false);

  // Evaluates the board for a win condition
  const checkWin = useCallback((currentBoard, player) => {
    // Check horizontal
    for (let r = 0; r < ROWS; r++) {
      for (let c = 0; c < COLS - 3; c++) {
        if (
          currentBoard[r][c] === player &&
          currentBoard[r][c + 1] === player &&
          currentBoard[r][c + 2] === player &&
          currentBoard[r][c + 3] === player
        ) {
          return true;
        }
      }
    }

    // Check vertical
    for (let r = 0; r < ROWS - 3; r++) {
      for (let c = 0; c < COLS; c++) {
        if (
          currentBoard[r][c] === player &&
          currentBoard[r + 1][c] === player &&
          currentBoard[r + 2][c] === player &&
          currentBoard[r + 3][c] === player
        ) {
          return true;
        }
      }
    }

    // Check diagonal (bottom-left to top-right)
    for (let r = 3; r < ROWS; r++) {
      for (let c = 0; c < COLS - 3; c++) {
        if (
          currentBoard[r][c] === player &&
          currentBoard[r - 1][c + 1] === player &&
          currentBoard[r - 2][c + 2] === player &&
          currentBoard[r - 3][c + 3] === player
        ) {
          return true;
        }
      }
    }

    // Check diagonal (top-left to bottom-right)
    for (let r = 0; r < ROWS - 3; r++) {
      for (let c = 0; c < COLS - 3; c++) {
        if (
          currentBoard[r][c] === player &&
          currentBoard[r + 1][c + 1] === player &&
          currentBoard[r + 2][c + 2] === player &&
          currentBoard[r + 3][c + 3] === player
        ) {
          return true;
        }
      }
    }

    return false;
  }, []);

  // Records the match outcome via the backend API
  const handleGameEnd = useCallback(async (resultType) => {
    setIsProcessing(true);
    try {
      const payoutAmount = resultType === 'Win' ? 10 : 0;
      
      await gameAPI.recordMatch({
        userId: user.id,
        gameName: 'Connect Four',
        wager: 0,
        result: resultType,
        payout: payoutAmount
      });
      
    } catch (error) {
      console.error('Failed to record match:', error);
    } finally {
      setIsProcessing(false);
    }
  }, [user.id]);

  // Executes the CPU turn using a random valid column selection
  const makeCPUMove = useCallback(() => {
    if (winner) return;

    setBoard((prevBoard) => {
      const validCols = [];
      for (let c = 0; c < COLS; c++) {
        if (prevBoard[0][c] === EMPTY_SLOT) {
          validCols.push(c);
        }
      }

      if (validCols.length === 0) {
        setWinner('Draw');
        handleGameEnd('Draw');
        return prevBoard;
      }

      const randomCol = validCols[Math.floor(Math.random() * validCols.length)];
      const newBoard = prevBoard.map(row => [...row]);

      for (let r = ROWS - 1; r >= 0; r--) {
        if (newBoard[r][randomCol] === EMPTY_SLOT) {
          newBoard[r][randomCol] = CPU_PIECE;
          
          if (checkWin(newBoard, CPU_PIECE)) {
            setWinner('CPU');
            handleGameEnd('Loss');
          } else {
            setCurrentPlayer(PLAYER_PIECE);
          }
          break;
        }
      }
      return newBoard;
    });
  }, [winner, checkWin, handleGameEnd]);

  // Triggers CPU move when the current player state updates to CPU_PIECE
  useEffect(() => {
    if (currentPlayer === CPU_PIECE && !winner) {
      const cpuTimer = setTimeout(() => {
        makeCPUMove();
      }, 500);
      return () => clearTimeout(cpuTimer);
    }
  }, [currentPlayer, winner, makeCPUMove]);

  // Handles column selection by the human player
  const dropPiece = (colIndex) => {
    if (winner || currentPlayer !== PLAYER_PIECE || isProcessing) return;

    setBoard((prevBoard) => {
      const newBoard = prevBoard.map(row => [...row]);
      
      for (let r = ROWS - 1; r >= 0; r--) {
        if (newBoard[r][colIndex] === EMPTY_SLOT) {
          newBoard[r][colIndex] = PLAYER_PIECE;
          
          if (checkWin(newBoard, PLAYER_PIECE)) {
            setWinner('Player');
            handleGameEnd('Win');
          } else {
            setCurrentPlayer(CPU_PIECE);
          }
          return newBoard;
        }
      }
      return prevBoard;
    });
  };

  // Resets the board for a new game
  const resetGame = () => {
    setBoard(Array.from({ length: ROWS }, () => Array(COLS).fill(EMPTY_SLOT)));
    setCurrentPlayer(PLAYER_PIECE);
    setWinner(null);
  };

  // UI rendering helper for cell colors
  const getCellColor = (cellValue) => {
    if (cellValue === PLAYER_PIECE) return '#e74c3c'; // Red
    if (cellValue === CPU_PIECE) return '#f1c40f';    // Yellow
    return '#ecf0f1';                                 // Empty
  };

  return (
    <div style={{ textAlign: 'center', maxWidth: '600px', margin: '0 auto' }}>
      <h2>Connect Four</h2>
      
      <div style={{ marginBottom: '20px', height: '30px' }}>
        {winner ? (
          <h3>{winner === 'Draw' ? "It's a Draw!" : `${winner} Wins!`}</h3>
        ) : (
          <h3>{currentPlayer === PLAYER_PIECE ? 'Your Turn (Red)' : 'CPU Thinking (Yellow)...'}</h3>
        )}
      </div>

      <div style={{ 
        backgroundColor: '#3498db', 
        padding: '10px', 
        borderRadius: '10px',
        display: 'inline-block'
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
                  boxShadow: 'inset 0 3px 6px rgba(0,0,0,0.3)'
                }}
              />
            ))}
          </div>
        ))}
      </div>

      {winner && (
        <div style={{ marginTop: '20px' }}>
          <button 
            onClick={resetGame}
            style={{ padding: '10px 20px', fontSize: '16px', cursor: 'pointer' }}
          >
            Play Again
          </button>
        </div>
      )}
    </div>
  );
};

export default ConnectFour;