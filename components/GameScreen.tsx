import React, { useState, useEffect } from 'react';
import { GameMode, PlayerStats, TurnResult } from '../types';
import { Book } from './Book';
import { ScorePopup } from './ScorePopup';
import { Trophy, AlertCircle } from 'lucide-react';
import { playClick, playCrowdSound } from '../utils/audio';

interface GameScreenProps {
  mode: GameMode;
  p1Stats: PlayerStats;
  p2Stats: PlayerStats;
  currentPlayer: 1 | 2;
  totalOvers: number;
  onTurnComplete: (result: TurnResult) => void;
  targetScore: number | null;
  isFreeHit: boolean;
  totalWickets: number;
}

export const GameScreen: React.FC<GameScreenProps> = ({
  mode,
  p1Stats,
  p2Stats,
  currentPlayer,
  totalOvers,
  onTurnComplete,
  targetScore,
  isFreeHit,
  totalWickets
}) => {
  const [isFlipping, setIsFlipping] = useState(false);
  const [lastResult, setLastResult] = useState<TurnResult | null>(null);
  const [showPopup, setShowPopup] = useState(false);

  const activePlayer = currentPlayer === 1 ? p1Stats : p2Stats;
  const currentBalls = activePlayer.ballsBowled;
  const totalBalls = totalOvers * 6;
  
  // Calculate Overs representation (e.g., 1.4 overs)
  const formatOvers = (balls: number) => {
    const completedOvers = Math.floor(balls / 6);
    const ballsInOver = balls % 6;
    return `${completedOvers}.${ballsInOver}`;
  };

  const handleFlip = () => {
    if (isFlipping || showPopup || activePlayer.isOut) return;
    playClick(); 
    setIsFlipping(true);
  };

  // Keyboard Support (Spacebar)
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.code === 'Space') {
        e.preventDefault(); // Prevent scrolling
        handleFlip();
      }
    };

    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [isFlipping, showPopup, activePlayer.isOut]);

  const getWeightedDigit = () => {
    // Check if it is the final over
    // Final over starts when the number of balls bowled reaches the start of the last over
    const isFinalOver = currentBalls >= (totalOvers - 1) * 6;
    
    let weights;

    if (isFinalOver) {
      // Final Over Probabilities
      weights = [
        { digit: 1, weight: 20 },
        { digit: 2, weight: 20 },
        { digit: 4, weight: 20 },

        { digit: 6, weight: 12 },
        { digit: 8, weight: 12 },
        { digit: 7, weight: 12 },
        { digit: 9, weight: 12 },

        { digit: 3, weight: 4 },
        { digit: 0, weight: 4 },

        { digit: 5, weight: 1 },
      ];
    } else {
      // Standard Probabilities
      weights = [
        { digit: 1, weight: 20 },
        { digit: 2, weight: 20 },
        { digit: 4, weight: 20 },
        { digit: 3, weight: 10 },
        { digit: 7, weight: 10 },
        { digit: 8, weight: 10 },
        { digit: 6, weight: 3 },
        { digit: 9, weight: 3 },
        { digit: 0, weight: 3 },
        { digit: 5, weight: 1 },
      ];
    }

    const totalWeight = weights.reduce((acc, curr) => acc + curr.weight, 0);
    let random = Math.random() * totalWeight;
    
    for (const item of weights) {
      if (random < item.weight) return item.digit;
      random -= item.weight;
    }
    return 1; // Fallback
  };

  const calculateResult = () => {
    // 1. Get Weighted Digit
    const digit = getWeightedDigit();

    // 2. Generate plausible page number ending in that digit
    // Range 0-49 for prefix -> 0 to 490. Total 0-500 approx.
    const prefix = Math.floor(Math.random() * 50); 
    let pageNumber = prefix * 10 + digit;
    
    // Edge case: Page 0 doesn't usually exist in books, swap to 500 (ends in 0) or 10
    if (pageNumber === 0) pageNumber = 500;

    let result: TurnResult;

    // Rules Logic
    if (digit >= 1 && digit <= 6) {
      result = {
        pageNumber,
        lastDigit: digit,
        scoreAdded: digit,
        ballsAdded: 1,
        message: `${digit} RUNS`,
        type: 'RUNS'
      };
    } else if (digit === 7) {
      result = {
        pageNumber,
        lastDigit: digit,
        scoreAdded: 0,
        ballsAdded: 1,
        message: 'DOT BALL',
        type: 'DOT'
      };
    } else if (digit === 8) {
      result = {
        pageNumber,
        lastDigit: digit,
        scoreAdded: 1,
        ballsAdded: 0,
        message: 'WIDE BALL',
        type: 'WIDE'
      };
    } else if (digit === 9) {
       result = {
        pageNumber,
        lastDigit: digit,
        scoreAdded: 1,
        ballsAdded: 0,
        message: 'NO BALL',
        type: 'NOBALL'
      };
    } else { // digit === 0
      if (isFreeHit) {
        result = {
          pageNumber,
          lastDigit: digit,
          scoreAdded: 0,
          ballsAdded: 1,
          message: 'SAVED BY FREEHIT',
          type: 'SAVED'
        };
      } else {
        result = {
          pageNumber,
          lastDigit: digit,
          scoreAdded: 0,
          ballsAdded: 1, 
          message: 'OUT!',
          type: 'OUT'
        };
      }
    }
    
    // --- TRIGGER SOUNDS ---
    if (result.type === 'RUNS') {
        if (digit >= 1 && digit <= 3) {
            playCrowdSound('SLOW_CLAP');
        } else if (digit >= 4) {
            playCrowdSound('CHEER');
        }
    } else if (result.type === 'OUT' || result.type === 'WIDE' || result.type === 'NOBALL') {
        playCrowdSound('OOH');
    } else if (result.type === 'SAVED') {
        playCrowdSound('CHEER'); // Being saved is good!
    } else if (result.type === 'DOT') {
        playCrowdSound('SLOW_CLAP'); 
    }

    setLastResult(result);
    setShowPopup(true);
    setIsFlipping(false);
    
    // Auto-hide popup and update state
    setTimeout(() => {
      setShowPopup(false);
      onTurnComplete(result);
    }, 2500); 
  };

  return (
    <div className="relative w-full max-w-4xl flex flex-col items-center">
      
      {/* HUD - Heads Up Display */}
      <div className="w-full bg-gray-900/90 border-4 border-gray-600 rounded-xl p-4 mb-4 shadow-xl grid grid-cols-3 items-center text-white relative overflow-hidden backdrop-blur-md">
        {/* Scanline overlay for HUD */}
        <div className="absolute inset-0 pointer-events-none bg-[url('data:image/svg+xml;base64,PHN2ZyB4bWxucz0iaHR0cDovL3d3dy53My5vcmcvMjAwMC9zdmciIHdpZHRoPSI0IiBoZWlnaHQ9IjQiPgo8cmVjdCB3aWR0aD0iNCIgaGVpZ2h0PSI0IiBmaWxsPSIjZmZmIiBmaWxsLW9wYWNpdHk9IjAuMDUiLz4KPC9zdmc+')] opacity-20"></div>

        {/* LEFT: RUNS / WICKETS */}
        {/* items-center + justify-self-start: keeps container in left corner, but centers text inside it */}
        <div className="flex flex-col z-10 items-center justify-self-start">
          <span className="text-yellow-400 pixel-text text-[10px]">SCORE</span>
          <h2 className="text-4xl md:text-5xl font-bold mono-text leading-none text-white drop-shadow-md text-center">
            {activePlayer.score}
            {totalWickets > 1 && (
              <span className="text-lg text-gray-400">/{activePlayer.wicketsLost}</span>
            )}
          </h2>
          {targetScore !== null && (
            <span className="text-xs text-green-300 mt-1 pixel-text">
              TARGET: {targetScore}
            </span>
          )}
        </div>

        {/* CENTER: PLAYER NAME */}
        <div className="flex flex-col items-center z-10">
          <span className="text-blue-300 pixel-text text-[10px] md:text-xs mb-1">PLAYER {currentPlayer}</span>
          <h2 className="retro-text text-xl md:text-3xl tracking-wider text-center leading-none text-white drop-shadow-sm">
            {activePlayer.name}
          </h2>
           {/* Free Hit Indicator (Center Bottom) */}
           {isFreeHit && (
             <div className="mt-1 animate-pulse">
               <div className="bg-yellow-500 text-black px-2 py-0.5 rounded text-[10px] font-bold border border-white flex items-center gap-1">
                 <AlertCircle size={10} /> FREE HIT
               </div>
             </div>
          )}
        </div>

        {/* RIGHT: OVERS */}
        <div className="flex flex-col items-end z-10">
          <span className="text-yellow-400 pixel-text text-[10px]">OVERS</span>
          <div className="retro-text text-3xl md:text-5xl text-white drop-shadow-md leading-tight">
            {formatOvers(currentBalls)} <span className="text-xl md:text-2xl text-gray-400">/ {totalOvers}</span>
          </div>
        </div>
      </div>

      {/* Main Game Area */}
      <div className="relative w-full bg-black/60 border border-white/20 rounded-xl p-8 min-h-[500px] flex flex-col items-center justify-center backdrop-blur-md shadow-2xl">
        
        <ScorePopup result={lastResult} isVisible={showPopup} />

        {/* Spacebar Instruction */}
        <div className="absolute top-6 left-0 right-0 flex justify-center z-10 pointer-events-none">
             <div className="bg-black/40 backdrop-blur px-4 py-2 rounded-full border border-white/10">
               <span className="text-yellow-400/80 font-mono text-xs md:text-sm tracking-widest uppercase animate-pulse">
                  Press Spacebar to Flip
               </span>
             </div>
        </div>

        {/* Clickable wrapper for interaction */}
        <div onClick={handleFlip} className="cursor-pointer transition-transform active:scale-[0.98] w-full flex justify-center">
            <Book 
              isFlipping={isFlipping} 
              pageNumber={lastResult?.pageNumber || null}
              onFlipComplete={calculateResult}
            />
        </div>

      </div>
      
      {/* Progress Bar */}
      <div className="w-full mt-4 h-4 bg-gray-800/80 rounded-full overflow-hidden border border-gray-600 shadow-inner">
        <div 
          className="h-full bg-gradient-to-r from-blue-500 to-cyan-400 transition-all duration-500"
          style={{ width: `${(currentBalls / totalBalls) * 100}%` }}
        ></div>
      </div>
      
    </div>
  );
};