// Audio Engine using Web Audio API for Retro Sounds

let audioCtx: AudioContext | null = null;
let bgmOscillators: any[] = [];
let ambienceNode: AudioNode | null = null;
let reverbBuffer: AudioBuffer | null = null; // Impulse Response for Stadium Reverb

let isMuted = false; // Global mute backup
let isMusicOn = true;
let isSfxOn = true;

// Initialize Audio Context
export const initAudio = () => {
  if (!audioCtx) {
    audioCtx = new (window.AudioContext || (window as any).webkitAudioContext)();
  }
  if (audioCtx.state === 'suspended') {
    audioCtx.resume();
  }
  // Pre-generate reverb
  if (!reverbBuffer) {
    getReverbBuffer();
  }
};

export const setMusicState = (enabled: boolean) => {
  isMusicOn = enabled;
  if (!enabled) {
    stopMusic();
  }
};

export const setSfxState = (enabled: boolean) => {
  isSfxOn = enabled;
};

// --- HELPERS ---

// Create Reverb Impulse Response (Simulates a large stadium space)
const getReverbBuffer = () => {
  if (!audioCtx) return null;
  if (reverbBuffer) return reverbBuffer;

  const sampleRate = audioCtx.sampleRate;
  const length = sampleRate * 2.5; // 2.5 seconds tail
  const decay = 2.0;
  const buffer = audioCtx.createBuffer(2, length, sampleRate);
  
  for (let c = 0; c < 2; c++) {
    const channelData = buffer.getChannelData(c);
    for (let i = 0; i < length; i++) {
      // Noise with exponential decay
      const noise = (Math.random() * 2 - 1);
      const envelope = Math.pow(1 - i / length, decay);
      channelData[i] = noise * envelope;
    }
  }
  reverbBuffer = buffer;
  return buffer;
};

// Create Pink Noise (More natural/realistic than White Noise)
const createPinkNoiseBuffer = () => {
    if (!audioCtx) return null;
    const bufferSize = audioCtx.sampleRate * 2; 
    const buffer = audioCtx.createBuffer(1, bufferSize, audioCtx.sampleRate);
    const b = buffer.getChannelData(0);
    
    // Pink Noise generation algorithm (Paul Kellet's method)
    let b0 = 0, b1 = 0, b2 = 0, b3 = 0, b4 = 0, b5 = 0, b6 = 0;
    
    for (let i = 0; i < bufferSize; i++) {
        const white = Math.random() * 2 - 1;
        b0 = 0.99886 * b0 + white * 0.0555179;
        b1 = 0.99332 * b1 + white * 0.0750759;
        b2 = 0.96900 * b2 + white * 0.1538520;
        b3 = 0.86650 * b3 + white * 0.3104856;
        b4 = 0.55000 * b4 + white * 0.5329522;
        b5 = -0.7616 * b5 - white * 0.0168980;
        b[i] = b0 + b1 + b2 + b3 + b4 + b5 + b6 + white * 0.5362;
        b[i] *= 0.11; // Normalize
        b6 = white * 0.115926;
    }
    return buffer;
};

const playTone = (freq: number, type: OscillatorType, duration: number, startTime: number = 0, vol: number = 0.1) => {
  if (!audioCtx || isMuted || !isSfxOn) return;
  const osc = audioCtx.createOscillator();
  const gain = audioCtx.createGain();
  
  osc.type = type;
  osc.frequency.setValueAtTime(freq, audioCtx.currentTime + startTime);
  
  gain.gain.setValueAtTime(vol, audioCtx.currentTime + startTime);
  gain.gain.exponentialRampToValueAtTime(0.001, audioCtx.currentTime + startTime + duration);
  
  osc.connect(gain);
  gain.connect(audioCtx.destination);
  
  osc.start(audioCtx.currentTime + startTime);
  osc.stop(audioCtx.currentTime + startTime + duration);
};

// --- SFX ---

export const playClick = () => {
  if (!isSfxOn) return;
  playTone(800, 'square', 0.1, 0, 0.05);
};

export const playFlip = () => {
  if (!audioCtx || isMuted || !isSfxOn) return;
  // Use White noise for crisp paper sound, Pink is too dull for paper
  const bufferSize = audioCtx.sampleRate * 0.5;
  const buffer = audioCtx.createBuffer(1, bufferSize, audioCtx.sampleRate);
  const data = buffer.getChannelData(0);
  for(let i=0; i<bufferSize; i++) data[i] = Math.random()*2-1;

  const source = audioCtx.createBufferSource();
  source.buffer = buffer;
  const gain = audioCtx.createGain();
  const filter = audioCtx.createBiquadFilter();
  
  filter.type = 'lowpass';
  filter.frequency.setValueAtTime(1200, audioCtx.currentTime);
  
  gain.gain.setValueAtTime(0.08, audioCtx.currentTime);
  gain.gain.exponentialRampToValueAtTime(0.001, audioCtx.currentTime + 0.15);
  
  source.connect(filter);
  filter.connect(gain);
  gain.connect(audioCtx.destination);
  
  source.start();
};

export const playCrowdSound = (type: 'SLOW_CLAP' | 'OOH' | 'CHEER') => {
  if (!audioCtx || isMuted || !isSfxOn) return;
  const t = audioCtx.currentTime;

  // Setup Reverb Node for realistic space
  const convolver = audioCtx.createConvolver();
  const rb = getReverbBuffer();
  if (rb) convolver.buffer = rb;
  
  // Master gain for this SFX
  const masterGain = audioCtx.createGain();
  masterGain.connect(audioCtx.destination);
  
  // Send Dry signal to master, Wet signal to master via Reverb
  const wetGain = audioCtx.createGain();
  wetGain.gain.value = 0.5; // Mix: 50% wet for stadium ambiance
  convolver.connect(wetGain);
  wetGain.connect(masterGain);
  
  const dryGain = audioCtx.createGain();
  dryGain.gain.value = 0.8; // Mix: 80% dry for clarity
  dryGain.connect(masterGain);

  const connectToMix = (node: AudioNode) => {
    node.connect(dryGain);
    node.connect(convolver);
  };

  if (type === 'SLOW_CLAP') {
    // REALISTIC APPLAUSE: Scattered clapping
    // Uses bandpass filtered pink noise bursts with variance
    const buffer = createPinkNoiseBuffer();
    if (!buffer) return;
    
    const density = 60; // Number of claps
    const duration = 1.6; // Duration of applause

    for (let i = 0; i < density; i++) {
       const source = audioCtx.createBufferSource();
       source.buffer = buffer;
       
       const clapGain = audioCtx.createGain();
       const filter = audioCtx.createBiquadFilter();
       
       // Vary frequency to simulate different hand sizes/claps (800Hz - 2000Hz)
       filter.type = 'bandpass';
       filter.frequency.value = 800 + Math.random() * 1200; 
       filter.Q.value = 1.5 + Math.random() * 2.0;

       // Randomized timing
       const startTime = t + Math.random() * duration; 
       
       // Vary loudness for natural feel
       const vol = 0.03 + Math.random() * 0.08;

       clapGain.gain.setValueAtTime(0, startTime);
       clapGain.gain.linearRampToValueAtTime(vol, startTime + 0.004); // Fast attack
       clapGain.gain.exponentialRampToValueAtTime(0.001, startTime + 0.1); // Short decay

       source.connect(filter);
       filter.connect(clapGain);
       
       connectToMix(clapGain);
       
       source.start(startTime);
       source.stop(startTime + 0.15);
    }
  } 
  else if (type === 'OOH') {
    // DISAPPOINTMENT (OOH/AAH)
    // Uses synthesized formants
    const osc = audioCtx.createOscillator();
    const gain = audioCtx.createGain();
    
    osc.type = 'triangle';
    osc.frequency.setValueAtTime(180, t);
    osc.frequency.exponentialRampToValueAtTime(90, t + 1.2);
    
    gain.gain.setValueAtTime(0.0, t);
    gain.gain.linearRampToValueAtTime(0.2, t + 0.2);
    gain.gain.linearRampToValueAtTime(0, t + 1.5);
    
    osc.connect(gain);
    connectToMix(gain);
    
    osc.start();
    osc.stop(t + 1.5);
  } 
  else if (type === 'CHEER') {
    // REALISTIC CROWD ROAR
    const buffer = createPinkNoiseBuffer();
    if (!buffer) return;

    // 1. The Roar (Low-Mid Swell)
    // Simulates the collective breath/voice of the crowd opening up
    const roarSrc = audioCtx.createBufferSource();
    roarSrc.buffer = buffer;
    
    const roarFilter = audioCtx.createBiquadFilter();
    roarFilter.type = 'lowpass';
    roarFilter.frequency.setValueAtTime(300, t);
    roarFilter.frequency.exponentialRampToValueAtTime(2200, t + 0.4); // Opens up fast
    roarFilter.frequency.linearRampToValueAtTime(600, t + 3.5); // Settles down
    
    const roarGain = audioCtx.createGain();
    roarGain.gain.setValueAtTime(0, t);
    roarGain.gain.linearRampToValueAtTime(0.6, t + 0.2);
    roarGain.gain.exponentialRampToValueAtTime(0.01, t + 3.8);

    roarSrc.connect(roarFilter);
    roarFilter.connect(roarGain);
    connectToMix(roarGain);
    roarSrc.start();
    roarSrc.stop(t + 4.0);

    // 2. High Frequency "Hype" (Screams/Chatter)
    // Adds texture and sizzle to the sound
    const highSrc = audioCtx.createBufferSource();
    highSrc.buffer = buffer;
    
    const highFilter = audioCtx.createBiquadFilter();
    highFilter.type = 'highpass';
    highFilter.frequency.value = 1000;
    
    const highGain = audioCtx.createGain();
    highGain.gain.setValueAtTime(0, t);
    highGain.gain.linearRampToValueAtTime(0.15, t + 0.6);
    highGain.gain.linearRampToValueAtTime(0, t + 3.0);
    
    highSrc.connect(highFilter);
    highFilter.connect(highGain);
    connectToMix(highGain);
    highSrc.start();
    highSrc.stop(t + 4.0);

    // 3. Whistles
    // Adds randomized tonal elements (sine wave chirps)
    for(let i=0; i<4; i++) {
        const osc = audioCtx.createOscillator();
        const gain = audioCtx.createGain();
        const start = t + 0.3 + Math.random() * 1.5;
        
        osc.type = 'sine';
        const startFreq = 1400 + Math.random() * 800;
        osc.frequency.setValueAtTime(startFreq, start);
        osc.frequency.linearRampToValueAtTime(startFreq - 200 - Math.random() * 300, start + 0.4); 

        gain.gain.setValueAtTime(0, start);
        gain.gain.linearRampToValueAtTime(0.06, start + 0.05);
        gain.gain.linearRampToValueAtTime(0, start + 0.4);

        osc.connect(gain);
        connectToMix(gain);
        osc.start(start);
        osc.stop(start + 0.5);
    }
  }
};

// --- MUSIC ---

export const stopMusic = () => {
  bgmOscillators.forEach(o => {
    try { o.stop(); } catch(e){}
    o.disconnect();
  });
  bgmOscillators = [];
  
  if (ambienceNode) {
     try { (ambienceNode as any).stop(); } catch(e){}
     ambienceNode.disconnect();
     ambienceNode = null;
  }
};

export const startMusic = (type: 'MENU' | 'GAME' | 'END') => {
  if (!audioCtx || isMuted || !isMusicOn) return;
  stopMusic();

  if (type === 'MENU') {
    // REVERTED: Retro Arpeggio Loop + Drone (The original requested style)
    const notes = [220, 330, 440, 554, 440, 330]; // A Majorish
    let noteIndex = 0;
    
    const interval = setInterval(() => {
        if (bgmOscillators.length === 0 && noteIndex > 0) {
            clearInterval(interval); 
            return;
        }
        if (isMusicOn) {
            // Short pluck
            playTone(notes[noteIndex % notes.length], 'square', 0.15, 0, 0.03);
        }
        noteIndex++;
    }, 200);

    // Drone
    const osc1 = audioCtx.createOscillator();
    const osc2 = audioCtx.createOscillator();
    const gain = audioCtx.createGain();
    
    osc1.type = 'square';
    osc1.frequency.value = 110;
    osc2.type = 'sawtooth';
    osc2.frequency.value = 111; // Detune
    
    gain.gain.value = 0.02;
    
    osc1.connect(gain);
    osc2.connect(gain);
    gain.connect(audioCtx.destination);
    
    osc1.start();
    osc2.start();
    
    bgmOscillators.push(osc1, osc2);
  } 
  else if (type === 'GAME') {
    // Stadium Ambience (Pink Noise Hum)
    const buffer = createPinkNoiseBuffer();
    if (!buffer) return;
    const source = audioCtx.createBufferSource();
    source.buffer = buffer;
    source.loop = true;
    
    const filter = audioCtx.createBiquadFilter();
    filter.type = 'lowpass';
    filter.frequency.value = 250;
    
    const gain = audioCtx.createGain();
    gain.gain.value = 0.05;
    
    source.connect(filter);
    filter.connect(gain);
    gain.connect(audioCtx.destination);
    source.start();
    
    ambienceNode = source;
  }
  else if (type === 'END') {
    // Victory Fanfare
    playTone(392, 'square', 0.2, 0, 0.1); // G
    playTone(523, 'square', 0.2, 0.2, 0.1); // C
    playTone(659, 'square', 0.2, 0.4, 0.1); // E
    playTone(783, 'square', 0.8, 0.6, 0.1); // G High
  }
};