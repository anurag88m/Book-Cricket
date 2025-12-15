import React, { useState, useEffect } from 'react';
import { GameMode, GameSettings, MatchType } from '../types';
import { Button } from './Button';
import { BookOpen, User, Users, Music, Volume2, VolumeX, Music2, Download, Zap, Clock } from 'lucide-react';
import { playClick, setMusicState, setSfxState, startMusic } from '../utils/audio';

interface StartScreenProps {
  onStart: (settings: GameSettings) => void;
  savedName?: string;
}

export const StartScreen: React.FC<StartScreenProps> = ({ onStart, savedName = '' }) => {
  const [p1Name, setP1Name] = useState(savedName || 'Player 1');
  const [p2Name, setP2Name] = useState('Player 2');
  const [mode, setMode] = useState<GameMode>(GameMode.ONE_PLAYER);
  const [matchType, setMatchType] = useState<MatchType>(MatchType.QUICK);
  const [overs, setOvers] = useState(2);
  const [musicOn, setMusicOn] = useState(true);
  const [sfxOn, setSfxOn] = useState(true);
  const [deferredPrompt, setDeferredPrompt] = useState<any>(null);

  useEffect(() => {
    const handleBeforeInstallPrompt = (e: any) => {
      e.preventDefault();
      setDeferredPrompt(e);
    };

    window.addEventListener('beforeinstallprompt', handleBeforeInstallPrompt);

    return () => {
      window.removeEventListener('beforeinstallprompt', handleBeforeInstallPrompt);
    };
  }, []);

  const handleInstallClick = async () => {
    playClick();
    if (!deferredPrompt) return;
    deferredPrompt.prompt();
    const { outcome } = await deferredPrompt.userChoice;
    if (outcome === 'accepted') {
        setDeferredPrompt(null);
    }
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    onStart({ 
      p1Name, 
      p2Name, 
      mode, 
      overs,
      totalWickets: matchType === MatchType.QUICK ? 1 : 10
    });
  };

  const handleClickMode = (m: GameMode) => {
      playClick();
      setMode(m);
  }

  const handleClickMatchType = (t: MatchType) => {
    playClick();
    setMatchType(t);
    // Reset overs to valid default for the new type
    if (t === MatchType.QUICK) setOvers(2);
    else setOvers(5);
  };

  const toggleMusic = () => {
    playClick(); 
    const newState = !musicOn;
    setMusicOn(newState);
    setMusicState(newState);
    if (newState) {
      startMusic('MENU');
    }
  };

  const toggleSfx = () => {
    const newState = !sfxOn;
    setSfxOn(newState);
    setSfxState(newState);
    if (newState) playClick();
  };

  return (
    <div className="w-full max-w-lg bg-black/60 backdrop-blur-md border border-white/20 rounded-3xl p-8 shadow-2xl relative overflow-hidden flex flex-col max-h-[90vh] overflow-y-auto custom-scrollbar">
      
      {/* Audio Controls - Absolute Top Right */}
      <div className="absolute top-4 right-4 flex gap-2 z-20">
        <button 
          type="button"
          onClick={toggleMusic}
          className={`p-2 rounded-full transition-all ${musicOn ? 'bg-white/10 text-yellow-400' : 'bg-transparent text-gray-400 hover:bg-white/5'}`}
          title="Toggle Music"
        >
          {musicOn ? <Music size={18} /> : <Music2 size={18} />}
        </button>
        <button 
          type="button"
          onClick={toggleSfx}
          className={`p-2 rounded-full transition-all ${sfxOn ? 'bg-white/10 text-yellow-400' : 'bg-transparent text-gray-400 hover:bg-white/5'}`}
          title="Toggle SFX"
        >
          {sfxOn ? <Volume2 size={18} /> : <VolumeX size={18} />}
        </button>
      </div>

      {/* Header */}
      <div className="text-center mb-6 mt-2">
        <div className="flex justify-center mb-2">
            <div className="p-3 bg-yellow-500/20 rounded-full border border-yellow-500/50 shadow-[0_0_15px_rgba(234,179,8,0.3)]">
              <BookOpen size={32} className="text-yellow-400" />
            </div>
        </div>
        <h1 className="text-5xl retro-text text-transparent bg-clip-text bg-gradient-to-b from-yellow-300 to-yellow-600 drop-shadow-sm">
          BOOK CRICKET
        </h1>
      </div>

      <form onSubmit={handleSubmit} className="space-y-5">
        
        {/* Game Mode Selector (Segmented) */}
        <div className="bg-black/40 p-1.5 rounded-xl flex border border-white/10">
            <button
                type="button"
                onClick={() => handleClickMode(GameMode.ONE_PLAYER)}
                className={`flex-1 py-3 rounded-lg flex items-center justify-center gap-2 transition-all ${mode === GameMode.ONE_PLAYER ? 'bg-blue-600 shadow-lg text-white' : 'text-gray-400 hover:text-white hover:bg-white/5'}`}
            >
                <User size={18} />
                <span className="font-bold text-xs tracking-wider">1 PLAYER</span>
            </button>
            <button
                type="button"
                onClick={() => handleClickMode(GameMode.TWO_PLAYER)}
                className={`flex-1 py-3 rounded-lg flex items-center justify-center gap-2 transition-all ${mode === GameMode.TWO_PLAYER ? 'bg-blue-600 shadow-lg text-white' : 'text-gray-400 hover:text-white hover:bg-white/5'}`}
            >
                <Users size={18} />
                <span className="font-bold text-xs tracking-wider">2 PLAYERS</span>
            </button>
        </div>

        {/* Match Type Selector (Cards) */}
        <div className="grid grid-cols-2 gap-4">
            <div 
                onClick={() => handleClickMatchType(MatchType.QUICK)}
                className={`cursor-pointer p-4 rounded-xl border transition-all flex flex-col items-center gap-2 ${matchType === MatchType.QUICK ? 'bg-yellow-500/20 border-yellow-500 text-yellow-400' : 'bg-black/30 border-gray-500 text-gray-400 hover:border-gray-400 hover:bg-white/5'}`}
            >
                <Zap size={24} />
                <div className="text-center">
                    <div className="font-bold text-xs tracking-wide">QUICK MATCH</div>
                </div>
            </div>
            <div 
                onClick={() => handleClickMatchType(MatchType.LONG)}
                className={`cursor-pointer p-4 rounded-xl border transition-all flex flex-col items-center gap-2 ${matchType === MatchType.LONG ? 'bg-purple-500/20 border-purple-500 text-purple-400' : 'bg-black/30 border-gray-500 text-gray-400 hover:border-gray-400 hover:bg-white/5'}`}
            >
                <Clock size={24} />
                 <div className="text-center">
                    <div className="font-bold text-xs tracking-wide">LONG MATCH</div>
                </div>
            </div>
        </div>

        {/* Dynamic Overs Section */}
        <div className="space-y-3 bg-black/30 p-4 rounded-xl border border-white/10">
            <div className="flex justify-between items-center text-xs text-gray-300">
                <span className="uppercase tracking-wider font-bold">Match Length</span>
                <span className="text-white font-mono bg-white/10 px-2 py-0.5 rounded text-[10px]">{overs} OVERS</span>
            </div>
            
            {matchType === MatchType.QUICK ? (
                <div>
                    <input 
                        type="range" 
                        min="1" 
                        max="10" 
                        value={overs} 
                        onChange={(e) => {
                            playClick();
                            setOvers(parseInt(e.target.value));
                        }}
                        className="w-full h-2 bg-gray-600 rounded-lg appearance-none cursor-pointer accent-yellow-500 hover:bg-gray-500"
                    />
                     <div className="flex justify-between text-[10px] text-gray-400 font-mono mt-1">
                        <span>1</span>
                        <span>5</span>
                        <span>10</span>
                    </div>
                </div>
            ) : (
                <div className="grid grid-cols-4 gap-2">
                    {[5, 10, 15, 20].map(val => (
                        <button
                            key={val}
                            type="button"
                            onClick={() => { playClick(); setOvers(val); }}
                            className={`py-2 rounded-lg font-mono text-xs font-bold transition-all border ${overs === val ? 'bg-white text-black border-white shadow-sm' : 'bg-transparent text-gray-400 border-gray-600 hover:border-gray-500 hover:text-gray-200'}`}
                        >
                            {val}
                        </button>
                    ))}
                </div>
            )}
        </div>

        {/* Inputs */}
        <div className="space-y-4">
             <div className="relative group">
                <div className="absolute inset-y-0 left-0 pl-4 flex items-center pointer-events-none">
                    <User className="text-gray-400 group-focus-within:text-yellow-500 transition-colors" size={18} />
                </div>
                <input 
                    type="text" 
                    value={p1Name}
                    onChange={(e) => setP1Name(e.target.value)}
                    maxLength={12}
                    className="w-full bg-black/40 border border-gray-600 text-white text-sm pl-11 pr-4 py-3.5 rounded-xl focus:border-yellow-500 focus:ring-1 focus:ring-yellow-500 focus:outline-none transition-all placeholder-gray-500"
                    placeholder="PLAYER 1 NAME"
                    required
                />
             </div>
             
             {mode === GameMode.TWO_PLAYER && (
                 <div className="relative group animate-fade-in-down">
                    <div className="absolute inset-y-0 left-0 pl-4 flex items-center pointer-events-none">
                        <Users className="text-gray-400 group-focus-within:text-yellow-500 transition-colors" size={18} />
                    </div>
                    <input 
                        type="text" 
                        value={p2Name}
                        onChange={(e) => setP2Name(e.target.value)}
                        maxLength={12}
                        className="w-full bg-black/40 border border-gray-600 text-white text-sm pl-11 pr-4 py-3.5 rounded-xl focus:border-yellow-500 focus:ring-1 focus:ring-yellow-500 focus:outline-none transition-all placeholder-gray-500"
                        placeholder="PLAYER 2 NAME"
                        required
                    />
                 </div>
             )}
        </div>

        {/* Action */}
        <Button 
            type="submit" 
            className="w-full py-4 rounded-xl text-2xl bg-blue-800 border-b-4 border-black text-white hover:bg-blue-700 hover:scale-[1.02] active:scale-[0.98] active:border-b-0 active:translate-y-1 transition-all"
        >
          START MATCH
        </Button>
      </form>

      {/* Install Button (Minimal) */}
      {deferredPrompt && (
        <div className="mt-6 flex justify-center">
            <button
                onClick={handleInstallClick}
                className="text-xs text-gray-400 hover:text-white flex items-center gap-2 transition-colors border border-gray-600 rounded-full px-4 py-1.5 hover:border-gray-500 hover:bg-white/5"
            >
                <Download size={12} />
                <span>INSTALL APP</span>
            </button>
        </div>
      )}
    </div>
  );
};