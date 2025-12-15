import React from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { TurnResult } from '../types';

interface ScorePopupProps {
  result: TurnResult | null;
  isVisible: boolean;
}

export const ScorePopup: React.FC<ScorePopupProps> = ({ result, isVisible }) => {
  if (!result) return null;

  const getColor = (type: TurnResult['type']) => {
    switch (type) {
      case 'RUNS': return 'text-green-400';
      case 'OUT': return 'text-red-500';
      case 'DOT': return 'text-gray-300';
      case 'WIDE': 
      case 'NOBALL': return 'text-yellow-400';
      case 'SAVED': return 'text-blue-300';
      default: return 'text-white';
    }
  };

  return (
    <AnimatePresence>
      {isVisible && (
        <motion.div
          initial={{ scale: 0.5, opacity: 0, y: 50 }}
          animate={{ scale: 1.2, opacity: 1, y: 0 }}
          exit={{ scale: 1.5, opacity: 0 }}
          transition={{ type: "spring", stiffness: 300, damping: 20 }}
          className="absolute inset-0 flex items-center justify-center z-50 pointer-events-none"
        >
          <div className="bg-black/80 backdrop-blur-sm border-4 border-white p-6 rounded-xl shadow-2xl flex flex-col items-center">
            <h2 className={`text-5xl font-bold retro-text ${getColor(result.type)} mb-2 drop-shadow-md`}>
              {result.message}
            </h2>
            {result.type === 'RUNS' && (
              <div className="text-2xl text-white pixel-text mt-2">
                +{result.scoreAdded} Runs
              </div>
            )}
            {result.type === 'OUT' && (
              <div className="text-xl text-red-300 mt-2 pixel-text">
                Bad Luck!
              </div>
            )}
            <div className="mt-4 text-xs text-gray-400 font-mono">
              Page: {result.pageNumber}
            </div>
          </div>
        </motion.div>
      )}
    </AnimatePresence>
  );
};