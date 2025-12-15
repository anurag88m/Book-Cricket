import React from 'react';
import { motion } from 'framer-motion';
import { GameMode, PlayerStats, ScoreHistoryItem } from '../types';
import { Button } from './Button';
import { Trophy, RotateCcw, Home } from 'lucide-react';

interface EndScreenProps {
  mode: GameMode;
  p1Stats: PlayerStats;
  p2Stats: PlayerStats;
  history: ScoreHistoryItem[];
  onRestart: () => void;
  onHome: () => void;
}

export const EndScreen: React.FC<EndScreenProps> = ({
  mode,
  p1Stats,
  p2Stats,
  history,
  onRestart,
  onHome
}) => {
  let winnerText = '';
  let subText = '';

  if (mode === GameMode.ONE_PLAYER) {
    winnerText = "INNINGS OVER";
    subText = `You scored ${p1Stats.score} runs!`;
  } else {
    if (p1Stats.score > p2Stats.score) {
        winnerText = `${p1Stats.name} WINS!`;
        subText = `Won by ${p1Stats.score - p2Stats.score} runs`;
    } else if (p2Stats.score > p1Stats.score) {
        winnerText = `${p2Stats.name} WINS!`;
        subText = "Successful chase!";
    } else {
        winnerText = "IT'S A TIE!";
        subText = "What a match!";
    }
  }
  
  // Calculate highest score from current session history for scale
  const maxScore = history.length > 0 ? Math.max(...history.map(h => h.score)) : 0;
  // Ensure we don't divide by zero if maxScore is 0, and provide some headroom
  const scaleMax = maxScore || 10; 

  return (
    <div className="w-full max-w-2xl bg-gray-800 border-4 border-yellow-500 rounded-xl p-8 shadow-2xl relative overflow-hidden animate-scale-in text-center flex flex-col max-h-[90vh] overflow-y-auto custom-scrollbar">
      {/* Victory Icon */}
      <div className="flex justify-center mb-6">
        <div className="bg-yellow-500 p-6 rounded-full shadow-lg border-4 border-white animate-bounce">
          <Trophy size={64} className="text-white" />
        </div>
      </div>

      <h1 className="text-4xl md:text-5xl retro-text text-yellow-400 drop-shadow-md mb-2">
        {winnerText}
      </h1>
      <p className="text-white font-mono text-xl mb-8">{subText}</p>

      {/* Score Cards */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mb-6">
        <div className="bg-white/10 p-4 rounded-lg border border-gray-600">
          <h3 className="pixel-text text-yellow-300 text-xs mb-2">{p1Stats.name}</h3>
          <p className="text-4xl font-bold text-white mono-text">{p1Stats.score}</p>
          <p className="text-xs text-gray-400 mt-1">{p1Stats.ballsBowled} balls • {p1Stats.wicketsLost} Wickets</p>
        </div>

        {mode === GameMode.TWO_PLAYER && (
          <div className="bg-white/10 p-4 rounded-lg border border-gray-600">
             <h3 className="pixel-text text-yellow-300 text-xs mb-2">{p2Stats.name}</h3>
             <p className="text-4xl font-bold text-white mono-text">{p2Stats.score}</p>
             <p className="text-xs text-gray-400 mt-1">{p2Stats.ballsBowled} balls • {p2Stats.wicketsLost} Wickets</p>
          </div>
        )}
      </div>

      {/* Session History Chart */}
      {history.length > 0 && (
        <div className="mb-8 w-full">
           <div className="flex justify-between items-end mb-2 px-1">
             <h3 className="text-gray-400 pixel-text text-[10px] uppercase">Session History</h3>
             <span className="text-[10px] text-gray-500 font-mono">Best: {maxScore}</span>
           </div>
           
           <div className="w-full h-40 bg-black/40 rounded border border-gray-700 p-4 flex items-end gap-3 overflow-x-auto">
              {history.map((item, idx) => {
                 // Calculate height percentage, ensuring at least a small sliver is visible for 0 scores
                 const heightPercent = Math.max((item.score / scaleMax) * 100, 5);
                 
                 // Determine color based on player name matching
                 let barColor = "bg-gray-500";
                 if (item.name === p1Stats.name) barColor = "bg-blue-500";
                 else if (item.name === p2Stats.name) barColor = "bg-green-500";
                 
                 return (
                   <div key={idx} className="flex flex-col items-center justify-end h-full flex-1 min-w-[30px] group relative">
                      
                      {/* Tooltip on hover */}
                      <div className="absolute bottom-full mb-1 opacity-0 group-hover:opacity-100 transition-opacity bg-gray-900 text-white text-[10px] p-1 rounded z-10 whitespace-nowrap border border-gray-600 pointer-events-none">
                        {item.name}: {item.score}
                      </div>
                      
                      {/* Score Label above bar */}
                      <span className="text-[10px] text-white font-mono mb-1 opacity-70 group-hover:opacity-100">{item.score}</span>
                      
                      {/* Bar Animation */}
                      <motion.div 
                        initial={{ height: 0 }}
                        animate={{ height: `${heightPercent}%` }}
                        transition={{ duration: 0.6, delay: idx * 0.05, type: "spring" }}
                        className={`w-full rounded-t-sm ${barColor} opacity-80 hover:opacity-100 transition-opacity cursor-help shadow-[0_0_10px_rgba(255,255,255,0.1)]`}
                      />
                      
                      {/* Game Number/Index */}
                      <span className="text-[8px] text-gray-500 font-mono mt-2 w-full text-center truncate">
                        #{idx + 1}
                      </span>
                   </div>
                 );
              })}
           </div>
        </div>
      )}

      {/* Actions */}
      <div className="flex flex-col md:flex-row gap-4 justify-center">
        <Button onClick={onRestart} variant="primary" className="flex items-center justify-center gap-2">
          <RotateCcw size={18} /> Rematch
        </Button>
        <Button onClick={onHome} variant="warning" className="flex items-center justify-center gap-2">
           <Home size={18} /> Main Menu
        </Button>
      </div>
      
    </div>
  );
};