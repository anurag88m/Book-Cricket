import React, { useEffect, useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { playFlip } from '../utils/audio';

interface BookProps {
  isFlipping: boolean;
  pageNumber: number | null;
  onFlipComplete?: () => void;
}

export const Book: React.FC<BookProps> = ({ isFlipping, pageNumber, onFlipComplete }) => {
  const [isOpen, setIsOpen] = useState(false);

  // Orchestrate the animation sequence
  useEffect(() => {
    let sequenceTimeout: ReturnType<typeof setTimeout>;

    if (isFlipping) {
      // 1. Open Book Immediately
      setIsOpen(true);
      playFlip(); // Open sound

      // 2. Wait for cover animation to finish, then show result
      // The spring animation duration is approx 0.4s
      sequenceTimeout = setTimeout(() => {
        if (onFlipComplete) onFlipComplete();
      }, 420); 
      
    } else {
      // Closing sequence
      if (!isFlipping && isOpen) {
          sequenceTimeout = setTimeout(() => {
            setIsOpen(false);
            playFlip(); // Close sound
          }, 2000); // Reduced to 2000ms to ensure it closes before state updates
      }
    }

    return () => {
      clearTimeout(sequenceTimeout);
    };
  }, [isFlipping]);

  return (
    <div className="relative w-56 h-72 sm:w-72 sm:h-[360px] mx-auto my-4 perspective-[1500px]"> 
      
      {/* Container for the 3D Book */}
      <div className="relative w-full h-full preserve-3d transition-transform duration-500">
        
        {/* --- BOTTOM COVER / BACK PAGE --- */}
        <div className="absolute inset-0 bg-[#f8f1e0] rounded-r-2xl rounded-bl-md shadow-2xl border-y-[6px] border-r-[6px] border-[#e3d5b8] flex flex-col overflow-hidden">
          {/* Paper Texture */}
          <div className="absolute inset-0 opacity-40 bg-[url('https://www.transparenttextures.com/patterns/cream-paper.png')]"></div>
          
          {/* Corner Decorations */}
          <div className="absolute top-0 right-0 w-16 h-16 bg-gradient-to-bl from-yellow-100/50 to-transparent pointer-events-none"></div>

          {/* Page Number / Result Content */}
          <AnimatePresence>
            {!isFlipping && isOpen && pageNumber !== null && (
              <motion.div 
                initial={{ opacity: 0 }} 
                animate={{ opacity: 1 }} 
                exit={{ opacity: 0 }}
                className="relative z-10 flex flex-col items-center justify-center h-full p-6 text-center"
              >
                 <div className="absolute top-6 right-6 text-gray-500 font-serif text-lg tracking-widest opacity-60">
                   p.{pageNumber}
                 </div>
                 
                 <div className="w-full h-full border-4 border-double border-gray-300/50 p-4 flex flex-col items-center justify-center rounded-lg">
                    <div className="bg-white/60 backdrop-blur-sm p-6 rounded-full shadow-inner border border-gray-200">
                        <p className="text-6xl font-bold text-gray-800 font-serif drop-shadow-sm">{pageNumber}</p>
                        <div className="w-full h-1 bg-gray-300 my-2"></div>
                        <p className="text-red-700 text-5xl font-bold mono-text drop-shadow-sm">{pageNumber % 10}</p>
                    </div>
                    
                    <div className="mt-8 opacity-60">
                       <p className="font-serif italic text-gray-600 text-xs">"The game is not over until the last ball is bowled."</p>
                    </div>
                 </div>
              </motion.div>
            )}
          </AnimatePresence>

          {/* Dummy text lines if no result (blurred text effect) */}
          {(isFlipping || !isOpen) && (
             <div className="p-10 space-y-6 opacity-10 flex flex-col h-full justify-center">
               {[...Array(8)].map((_, i) => (
                   <div key={i} className="h-3 bg-black rounded w-full"></div>
               ))}
             </div>
          )}
        </div>

        {/* --- FRONT COVER (Animated) --- */}
        <motion.div
          initial={false}
          animate={{ rotateY: isOpen ? -180 : 0 }}
          transition={{ duration: 0.4, type: "spring", stiffness: 60, damping: 12 }}
          className="absolute inset-0 origin-left preserve-3d z-50"
        >
          {/* Front of Cover (Closed State) */}
          <div className="absolute inset-0 bg-gradient-to-br from-[#800000] to-[#4a0000] rounded-r-2xl shadow-2xl backface-hidden flex flex-col items-center justify-center border-l-8 border-[#2e0000] border-y-2 border-r-2 border-[#600000] overflow-hidden">
             
             {/* Leather Texture Effect */}
             <div className="absolute inset-0 opacity-30 mix-blend-overlay" style={{ backgroundImage: `url("data:image/svg+xml,%3Csvg width='20' height='20' viewBox='0 0 20 20' xmlns='http://www.w3.org/2000/svg'%3E%3Cg fill='%23000000' fill-opacity='0.4' fill-rule='evenodd'%3E%3Ccircle cx='3' cy='3' r='3'/%3E%3Ccircle cx='13' cy='13' r='3'/%3E%3C/g%3E%3C/svg%3E")` }}></div>
             
             {/* Gold Frame */}
             <div className="absolute inset-4 border-2 border-[#d4af37] rounded-lg opacity-80">
                <div className="absolute inset-1 border border-[#d4af37] rounded opacity-50"></div>
             </div>
             
             {/* Title Block */}
             <div className="z-10 bg-[#3a0000] border-y-4 border-[#d4af37] w-full py-8 text-center shadow-lg relative">
               <div className="absolute inset-0 bg-black/20"></div>
               <h1 className="relative text-3xl text-[#f3e5ab] font-serif tracking-[0.2em] drop-shadow-[0_2px_4px_rgba(0,0,0,0.8)]">BOOK</h1>
               <div className="my-2 h-0.5 bg-[#d4af37] w-1/2 mx-auto shadow-[0_0_5px_#d4af37]"></div>
               <h1 className="relative text-3xl text-[#f3e5ab] font-serif tracking-[0.2em] drop-shadow-[0_2px_4px_rgba(0,0,0,0.8)]">CRICKET</h1>
             </div>
             
             <div className="absolute bottom-10 flex flex-col items-center gap-1 opacity-70">
                <span className="text-[#d4af37] text-[10px] font-mono tracking-widest">OFFICIAL RULEBOOK</span>
                <span className="text-[#d4af37] text-[10px] font-serif">EST. 1990</span>
             </div>

             {/* Shine effect */}
             <div className="absolute top-0 -inset-full h-full w-1/2 z-5 block transform -skew-x-12 bg-gradient-to-r from-transparent to-white opacity-10 animate-shine" />
          </div>

          {/* Back of Cover (Inside Left Page when Open) */}
          <div 
            className="absolute inset-0 bg-[#fdf5e6] rounded-l-2xl shadow-inner border-l border-gray-200 flex flex-col p-6 items-center justify-center"
            style={{ transform: "rotateY(180deg)", backfaceVisibility: 'hidden' }}
          >
             <div className="w-full h-full border-4 border-double border-gray-300 opacity-60 flex flex-col items-center justify-center p-4">
                <div className="w-24 h-24 mb-4 opacity-20 bg-contain bg-no-repeat bg-center" style={{ backgroundImage: "url('https://cdn-icons-png.flaticon.com/512/1055/1055668.png')"}}></div>
                <h3 className="text-gray-400 font-serif font-bold text-lg uppercase tracking-widest">Ex Libris</h3>
                <div className="w-full h-px bg-gray-300 my-4"></div>
                <div className="text-[10px] text-gray-400 text-center font-mono leading-relaxed">
                   Property of<br/>Retro Cricket Club<br/>Since 1990
                </div>
             </div>
          </div>
        </motion.div>

        {/* SPINE / THICKNESS */}
        {/* Animated to disappear when open to avoid Z-fighting. Delayed appearance when closing. */}
        <motion.div 
            animate={{ opacity: isOpen ? 0 : 1 }}
            transition={{ 
                duration: 0.2,
                delay: isOpen ? 0 : 0.3 // Wait for cover to mostly close before showing spine
            }}
            className="absolute left-0 top-1 bottom-1 w-10 bg-[#2e0000] rounded-l-md shadow-2xl z-0 flex flex-col justify-center items-center border-l border-[#4a0000]"
            style={{ transform: 'translateX(-100%) translateZ(-1px)' }}
        >
             <div className="w-full h-px bg-[#d4af37] my-2 opacity-50"></div>
             <div className="w-full h-px bg-[#d4af37] my-2 opacity-50"></div>
             <div className="w-full h-px bg-[#d4af37] my-2 opacity-50"></div>
             <span className="text-[#d4af37] text-[8px] font-serif -rotate-90 whitespace-nowrap opacity-60 mt-4">VOL. I</span>
        </motion.div>
      
      </div>

      {/* Realistic Shadow underneath */}
      <div className="absolute -bottom-8 left-8 right-8 h-8 bg-black/60 blur-xl rounded-[100%] z-[-1]"></div>
    </div>
  );
};