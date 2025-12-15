import React, { useState, useEffect } from 'react';
import { GameMode, GameSettings, GameState, PlayerStats, ScoreHistoryItem, TurnResult } from './types';
import { StartScreen } from './components/StartScreen';
import { GameScreen } from './components/GameScreen';
import { EndScreen } from './components/EndScreen';
import { initAudio, startMusic, stopMusic, playClick, playCrowdSound } from './utils/audio';

const initialStats = (name: string): PlayerStats => ({
  name,
  score: 0,
  ballsBowled: 0,
  wicketsLost: 0,
  isOut: false,
  history: []
});

const App: React.FC = () => {
  const [gameState, setGameState] = useState<GameState>(GameState.START);
  const [mode, setMode] = useState<GameMode>(GameMode.ONE_PLAYER);
  const [overs, setOvers] = useState(2);
  const [totalWickets, setTotalWickets] = useState(1);
  
  const [p1Stats, setP1Stats] = useState<PlayerStats>(initialStats('Player 1'));
  const [p2Stats, setP2Stats] = useState<PlayerStats>(initialStats('Player 2'));
  const [currentPlayer, setCurrentPlayer] = useState<1 | 2>(1);
  const [isFreeHit, setIsFreeHit] = useState(false);
  const [history, setHistory] = useState<ScoreHistoryItem[]>([]);

  const totalBalls = overs * 6;

  // Initialize Audio and Start Menu Music
  useEffect(() => {
    // We attempt to play music, but browser might block until interaction.
    // We'll rely on the Start Button click in StartScreen to fully resume Context.
    const handleInteraction = () => {
        initAudio();
        if (gameState === GameState.START) {
            startMusic('MENU');
        }
        window.removeEventListener('click', handleInteraction);
    };
    window.addEventListener('click', handleInteraction);
    return () => {
        stopMusic();
        window.removeEventListener('click', handleInteraction);
    };
  }, []);

  // Music State Management
  useEffect(() => {
    if (gameState === GameState.START) {
        startMusic('MENU');
    } else if (gameState === GameState.PLAYING) {
        startMusic('GAME');
    } else if (gameState === GameState.GAME_OVER) {
        startMusic('END');
    }
  }, [gameState]);

  // Determine Background Class
  const getBackgroundClass = () => {
    if (gameState === GameState.START) return 'bg-start-cricket';
    if (gameState === GameState.PLAYING) {
        return currentPlayer === 1 ? 'bg-p1' : 'bg-p2';
    }
    return 'bg-start-cricket'; // Use cricket background for end screen too
  };

  // Handle game start from settings
  const startGame = (settings: GameSettings) => {
    playClick();
    initAudio(); // Ensure audio context is running
    setMode(settings.mode);
    setOvers(settings.overs);
    setTotalWickets(settings.totalWickets);
    setP1Stats(initialStats(settings.p1Name));
    setP2Stats(initialStats(settings.p2Name));
    setCurrentPlayer(1);
    setIsFreeHit(false);
    setGameState(GameState.PLAYING);
  };

  const endGame = () => {
    // Save scores to history
    const newHistory = [...history];
    newHistory.push({ name: p1Stats.name, score: p1Stats.score, date: new Date().toISOString() });
    if (mode === GameMode.TWO_PLAYER) {
       newHistory.push({ name: p2Stats.name, score: p2Stats.score, date: new Date().toISOString() });
    }
    setHistory(newHistory);
    setGameState(GameState.GAME_OVER);
  };

  const handleTurnComplete = (result: TurnResult) => {
    const isP1 = currentPlayer === 1;
    const currentStats = isP1 ? p1Stats : p2Stats;
    const setStats = isP1 ? setP1Stats : setP2Stats;

    // Apply Logic
    let newScore = currentStats.score + result.scoreAdded;
    let newBalls = currentStats.ballsBowled + result.ballsAdded;
    let newWicketsLost = currentStats.wicketsLost;
    let newIsOut = currentStats.isOut;
    let nextIsFreeHit = false;

    // FreeHit Handling logic:
    if (result.type === 'NOBALL') {
      nextIsFreeHit = true; 
    } else if (isFreeHit && result.type === 'WIDE') {
      nextIsFreeHit = true;
    }
    
    // Out Logic
    if (result.type === 'OUT') {
      newWicketsLost += 1;
      // Check if all wickets are lost
      if (newWicketsLost >= totalWickets) {
        newIsOut = true;
      }
    }

    // Update Player Stats
    const updatedStats: PlayerStats = {
      ...currentStats,
      score: newScore,
      ballsBowled: newBalls,
      wicketsLost: newWicketsLost,
      isOut: newIsOut,
      history: [...currentStats.history, result.scoreAdded]
    };

    setStats(updatedStats);
    setIsFreeHit(nextIsFreeHit);

    // Check End Conditions
    checkGameFlow(updatedStats, newBalls, newIsOut);
  };

  const checkGameFlow = (stats: PlayerStats, balls: number, isOut: boolean) => {
    // Condition: Player turn ends if ALL OUT (isOut=true) or OVERS finished
    const turnOver = isOut || balls >= totalBalls;

    if (mode === GameMode.ONE_PLAYER) {
      if (turnOver) {
        endGame();
      }
    } else {
      // Two Player Logic
      if (currentPlayer === 1) {
        if (turnOver) {
          // Switch to Player 2
          setCurrentPlayer(2);
          setIsFreeHit(false);
          // Play a transition sound? For now, standard flow.
        }
      } else {
        // Player 2 Playing
        const target = p1Stats.score + 1;
        
        if (stats.score >= target) {
          // P2 Wins immediately
          playCrowdSound('CHEER'); // End game cheer
          endGame();
        } else if (turnOver) {
          // P2 Out or Balls finished
          playCrowdSound('CHEER'); // End game cheer
          endGame();
        }
      }
    }
  };

  const handleRestart = () => {
    playClick();
    setP1Stats(initialStats(p1Stats.name));
    setP2Stats(initialStats(p2Stats.name));
    setCurrentPlayer(1);
    setIsFreeHit(false);
    setGameState(GameState.PLAYING);
  };

  const handleHome = () => {
    playClick();
    setGameState(GameState.START);
  };

  return (
    <div className={`flash-container relative w-full h-screen md:h-auto md:w-[900px] md:aspect-[4/3] overflow-hidden md:rounded-2xl crt flex flex-col transition-all duration-1000 ${getBackgroundClass()}`}>
      {/* Background Pattern Overlay */}
      <div className="absolute inset-0 stadium-pattern opacity-30 pointer-events-none"></div>

      <div className="relative z-10 flex-1 flex items-center justify-center p-4">
        {gameState === GameState.START && (
          <StartScreen onStart={startGame} savedName={p1Stats.name} />
        )}

        {gameState === GameState.PLAYING && (
          <GameScreen 
            mode={mode}
            p1Stats={p1Stats}
            p2Stats={p2Stats}
            currentPlayer={currentPlayer}
            totalOvers={overs}
            onTurnComplete={handleTurnComplete}
            targetScore={currentPlayer === 2 && mode === GameMode.TWO_PLAYER ? p1Stats.score + 1 : null}
            isFreeHit={isFreeHit}
            totalWickets={totalWickets}
          />
        )}

        {gameState === GameState.GAME_OVER && (
          <EndScreen 
            mode={mode}
            p1Stats={p1Stats}
            p2Stats={p2Stats}
            history={history}
            onRestart={handleRestart}
            onHome={handleHome}
          />
        )}
      </div>
      
      {/* Footer / Copyright */}
      <div className="absolute bottom-2 right-4 text-white/30 text-[10px] font-mono z-20">
        © RETRO CRICKET LTD. 
      </div>
    </div>
  );
};

export default App;