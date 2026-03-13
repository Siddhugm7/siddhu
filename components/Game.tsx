
import React, { useEffect, useRef, useState, useCallback } from 'react';
import { GameStatus, Bird, Pipe, Coin, UserSettings, Character } from '../types';
import { 
  CANVAS_WIDTH, 
  CANVAS_HEIGHT, 
  GRAVITY, 
  JUMP_STRENGTH, 
  PIPE_SPEED, 
  PIPE_SPAWN_RATE, 
  PIPE_WIDTH, 
  PIPE_GAP,
  ASSETS,
  COIN_SIZE,
  CHARACTERS
} from '../constants';

const Game: React.FC = () => {
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const [gameState, setGameState] = useState<GameStatus>(GameStatus.START);
  const [score, setScore] = useState(0);
  const [coinCount, setCoinCount] = useState(() => {
    const saved = localStorage.getItem('flap_coins');
    return saved ? parseInt(saved, 10) : 0;
  });
  const [superCoinCount, setSuperCoinCount] = useState(() => {
    const saved = localStorage.getItem('flap_super_coins');
    return saved ? parseInt(saved, 10) : 0;
  });
  const [highScore, setHighScore] = useState(() => {
    const saved = localStorage.getItem('flap_highscore');
    return saved ? parseInt(saved, 10) : 0;
  });
  const [bgColor, setBgColor] = useState('#4ec0ca');

  // New State for expanded features
  const [unlockedLevels] = useState(() => {
    const saved = localStorage.getItem('flap_unlocked_levels');
    return saved ? parseInt(saved, 10) : 1;
  });
  const [characterLevel, setCharacterLevel] = useState(() => {
    const saved = localStorage.getItem('flap_char_level');
    return saved ? parseInt(saved, 10) : 1;
  });

  const [settings, setSettings] = useState<UserSettings>(() => {
    const saved = localStorage.getItem('flap_settings');
    return saved ? JSON.parse(saved) : {
      musicEnabled: true,
      vibrationEnabled: true,
      effectsEnabled: true
    };
  });

  const [showSettings, setShowSettings] = useState(false);
  const [showPrivacy, setShowPrivacy] = useState(false);

  const audioCtx = useRef<AudioContext | null>(null);
  const isMusicPlaying = useRef(false);
  const melodyIndex = useRef(0);
  const melody = [261.63, 293.66, 329.63, 349.23, 392.00, 349.23, 329.63, 293.66];

  const playSound = useCallback((freq: number, type: OscillatorType = 'sine', duration = 0.1, isEffect = true) => {
    const enabled = isEffect ? settings.effectsEnabled : settings.musicEnabled;
    if (!enabled) return;
    if (!audioCtx.current) audioCtx.current = new (window.AudioContext || (window as any).webkitAudioContext)();
    const osc = audioCtx.current.createOscillator();
    const gain = audioCtx.current.createGain();
    osc.type = type;
    osc.frequency.setValueAtTime(freq, audioCtx.current.currentTime);
    gain.gain.setValueAtTime(0.1, audioCtx.current.currentTime);
    gain.gain.exponentialRampToValueAtTime(0.01, audioCtx.current.currentTime + duration);
    osc.connect(gain);
    gain.connect(audioCtx.current.destination);
    osc.start();
    osc.stop(audioCtx.current.currentTime + duration);
  }, [settings.effectsEnabled, settings.musicEnabled]);

  const playNextNote = useCallback(() => {
    if (!settings.musicEnabled || !isMusicPlaying.current || !audioCtx.current) return;
    
    const osc = audioCtx.current.createOscillator();
    const gain = audioCtx.current.createGain();
    osc.type = 'triangle';
    osc.frequency.setValueAtTime(melody[melodyIndex.current], audioCtx.current.currentTime);
    gain.gain.setValueAtTime(0.03, audioCtx.current.currentTime);
    gain.gain.exponentialRampToValueAtTime(0.001, audioCtx.current.currentTime + 0.5);
    
    osc.connect(gain);
    gain.connect(audioCtx.current.destination);
    
    osc.start();
    osc.stop(audioCtx.current.currentTime + 0.5);
    
    melodyIndex.current = (melodyIndex.current + 1) % melody.length;
    setTimeout(playNextNote, 500);
  }, [settings.musicEnabled]);

  const startMusic = useCallback(() => {
    if (!settings.musicEnabled || isMusicPlaying.current) return;
    if (!audioCtx.current) audioCtx.current = new (window.AudioContext || (window as any).webkitAudioContext)();
    isMusicPlaying.current = true;
    playNextNote();
  }, [settings.musicEnabled, playNextNote]);

  const stopMusic = useCallback(() => {
    isMusicPlaying.current = false;
  }, []);

  useEffect(() => {
    if (settings.musicEnabled && gameState === GameStatus.PLAYING) {
      startMusic();
    } else {
      stopMusic();
    }
  }, [settings.musicEnabled, gameState, startMusic, stopMusic]);

  useEffect(() => {
    localStorage.setItem('flap_settings', JSON.stringify(settings));
  }, [settings]);

  const triggerVibration = () => {
    if (settings.vibrationEnabled && navigator.vibrate) {
      navigator.vibrate(50);
    }
  };

  const birdImg = useRef<HTMLImageElement | null>(null);
  const bgImg = useRef<HTMLImageElement | null>(null);
  
  const bird = useRef<Bird>({
    y: CANVAS_HEIGHT / 2,
    velocity: 0,
    rotation: 0,
    width: 48,  
    height: 34 
  });
  
  const pipes = useRef<Pipe[]>([]);
  const coins = useRef<Coin[]>([]);
  const frameCount = useRef(0);
  const animationFrameId = useRef<number | undefined>(undefined);
  const bgX = useRef(0);

  const loadBirdImg = useCallback((src: string) => {
    if (!src) {
      birdImg.current = null;
      return;
    }
    const img = new Image();
    img.crossOrigin = "anonymous";
    img.src = src;
    img.onload = () => { birdImg.current = img; };
  }, []);

  useEffect(() => {
    const currentChar = CHARACTERS[0]; // Default character
    if (currentChar) loadBirdImg(currentChar.src);

    const background = new Image();
    background.crossOrigin = "anonymous";
    background.src = ASSETS.BACKGROUND;
    background.onload = () => { bgImg.current = background; };

    // Daily Reward Check
    const lastReward = localStorage.getItem('flap_last_reward');
    const today = new Date().toDateString();
    if (lastReward !== today) {
      setCoinCount(c => c + 10);
      localStorage.setItem('flap_last_reward', today);
      alert('Daily Reward: +10 Coins!');
    }
  }, [loadBirdImg]);

  const resetGame = useCallback(() => {
    bird.current = {
      y: CANVAS_HEIGHT / 2,
      velocity: 0,
      rotation: 0,
      width: 48,
      height: 34
    };
    pipes.current = [];
    coins.current = [];
    frameCount.current = 0;
    setScore(0);
    setBgColor('#4ec0ca');
    setGameState(GameStatus.PLAYING);
  }, []);

  const flap = useCallback((e?: React.MouseEvent | React.TouchEvent | KeyboardEvent) => {
    if (e && 'preventDefault' in e) {
      e.preventDefault();
    }
    
    if (gameState === GameStatus.START) {
      resetGame();
    } else if (gameState === GameStatus.PLAYING) {
      bird.current.velocity = JUMP_STRENGTH;
      playSound(400, 'square', 0.1);
    } else if (gameState === GameStatus.GAME_OVER) {
      // Do nothing, handleCanvasClick will manage buttons and reset
    }
  }, [gameState, resetGame, settings.musicEnabled]);

  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.code === 'Space' || e.code === 'ArrowUp') {
        flap(e);
      }
    };
    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [flap]);

  const drawPipe = (ctx: CanvasRenderingContext2D, pipe: Pipe) => {
    const renderPipePart = (x: number, y: number, w: number, h: number, isTop: boolean) => {
      const gradient = ctx.createLinearGradient(x, y, x + w, y);
      gradient.addColorStop(0, '#55a02e');
      gradient.addColorStop(0.3, '#73bf2e');
      gradient.addColorStop(0.5, '#94e044');
      gradient.addColorStop(0.7, '#73bf2e');
      gradient.addColorStop(1, '#437018');
      
      ctx.fillStyle = gradient;
      ctx.fillRect(x, y, w, h);
      
      ctx.strokeStyle = '#2d4d0c';
      ctx.lineWidth = 3;
      ctx.strokeRect(x, y, w, h);

      const lipHeight = 26;
      const lipX = x - 6;
      const lipW = w + 12;
      const lipY = isTop ? y + h - lipHeight : y;
      
      ctx.fillStyle = gradient;
      ctx.fillRect(lipX, lipY, lipW, lipHeight);
      ctx.strokeRect(lipX, lipY, lipW, lipHeight);
    };

    let currentGap = PIPE_GAP;
    if (score > 80) currentGap = 130;
    else if (score > 50) currentGap = 150;

    renderPipePart(pipe.x, 0, PIPE_WIDTH, pipe.topHeight, true);
    renderPipePart(pipe.x, pipe.topHeight + currentGap, PIPE_WIDTH, CANVAS_HEIGHT - (pipe.topHeight + currentGap), false);
  };

  const drawCoin = (ctx: CanvasRenderingContext2D, coin: Coin) => {
    if (coin.collected) return;
    ctx.save();
    ctx.beginPath();
    ctx.arc(coin.x, coin.y, COIN_SIZE / 2, 0, Math.PI * 2);
    ctx.fillStyle = coin.isSuper ? '#FF00FF' : '#FFD700';
    ctx.fill();
    ctx.strokeStyle = '#B8860B';
    ctx.lineWidth = 2;
    ctx.stroke();
    ctx.fillStyle = 'white';
    ctx.textAlign = 'center';
    ctx.textBaseline = 'middle';
    ctx.font = 'bold 12px Arial';
    ctx.fillText(coin.isSuper ? 'S' : '$', coin.x, coin.y);
    ctx.restore();
  };

  const update = () => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    const ctx = canvas.getContext('2d');
    if (!ctx) return;

    ctx.clearRect(0, 0, CANVAS_WIDTH, CANVAS_HEIGHT);

    // BACKGROUND
    if (gameState === GameStatus.START) {
      ctx.fillStyle = '#1a3a3d';
      ctx.fillRect(0, 0, CANVAS_WIDTH, CANVAS_HEIGHT);
    } else if (score > 51 && frameCount.current % 300 === 0) {
      const colors = ['#4ec0ca', '#1a2a6c', '#f24e1e', '#2c3e50', '#8e44ad'];
      setBgColor(colors[Math.floor(Math.random() * colors.length)]);
    }

    if (gameState !== GameStatus.START) {
      if (bgImg.current && bgImg.current.complete && score <= 51) {
        bgX.current -= 1;
        if (bgX.current <= -CANVAS_WIDTH) bgX.current = 0;
        ctx.drawImage(bgImg.current, bgX.current, 0, CANVAS_WIDTH, CANVAS_HEIGHT);
        ctx.drawImage(bgImg.current, bgX.current + CANVAS_WIDTH, 0, CANVAS_WIDTH, CANVAS_HEIGHT);
      } else {
        ctx.fillStyle = bgColor;
        ctx.fillRect(0, 0, CANVAS_WIDTH, CANVAS_HEIGHT);
      }
    }

    if (gameState === GameStatus.PLAYING) {
      bird.current.velocity += GRAVITY;
      bird.current.y += bird.current.velocity;
      
      const targetRotation = Math.min(Math.PI / 3, Math.max(-Math.PI / 6, bird.current.velocity * 0.1));
      bird.current.rotation += (targetRotation - bird.current.rotation) * 0.1;

      if (bird.current.y + bird.current.height / 2 >= CANVAS_HEIGHT) {
        setGameState(GameStatus.GAME_OVER);
        playSound(100, 'sawtooth', 0.3);
        triggerVibration();
      }
      if (bird.current.y <= 0) bird.current.y = 0;

      let currentPipeSpeed = PIPE_SPEED;
      let currentSpawnRate = PIPE_SPAWN_RATE;
      let currentGap = PIPE_GAP;

      if (score > 80) {
        currentPipeSpeed = 4.5;
        currentSpawnRate = 90;
        currentGap = 130;
      } else if (score > 50) {
        currentPipeSpeed = 3.5;
        currentSpawnRate = 110;
        currentGap = 150;
      }

      if (frameCount.current % currentSpawnRate === 0) {
        const minHeight = 50;
        const maxHeight = CANVAS_HEIGHT - currentGap - minHeight - 50;
        const topHeight = Math.random() * maxHeight + minHeight;
        pipes.current.push({ x: CANVAS_WIDTH, topHeight, passed: false });
        
        const isSuper = Math.random() < 0.1;
        coins.current.push({ 
          x: CANVAS_WIDTH + PIPE_WIDTH + 50, 
          y: topHeight + currentGap / 2, 
          collected: false,
          isSuper 
        });
      }

      for (let i = pipes.current.length - 1; i >= 0; i--) {
        const p = pipes.current[i];
        p.x -= currentPipeSpeed;

        const bx = 80;
        const by = bird.current.y;
        if (bx + 15 > p.x && bx - 15 < p.x + PIPE_WIDTH) {
          if (by - 12 < p.topHeight || by + 12 > p.topHeight + currentGap) {
            setGameState(GameStatus.GAME_OVER);
            playSound(100, 'sawtooth', 0.3);
            triggerVibration();
          }
        }

        if (!p.passed && p.x + PIPE_WIDTH < bx) {
          p.passed = true;
          playSound(800, 'sine', 0.1);
          setScore(s => {
            const next = s + 1;
            if (next > highScore) {
              setHighScore(next);
              localStorage.setItem('flap_highscore', next.toString());
            }
            if (next % 10 === 0) {
              setCharacterLevel(l => {
                const nl = l + 1;
                localStorage.setItem('flap_char_level', nl.toString());
                return nl;
              });
            }
            return next;
          });
        }
        if (p.x + PIPE_WIDTH < -100) pipes.current.splice(i, 1);
      }

      for (let i = coins.current.length - 1; i >= 0; i--) {
        const c = coins.current[i];
        c.x -= currentPipeSpeed;

        const bx = 80;
        const by = bird.current.y;
        const dist = Math.sqrt((bx - c.x) ** 2 + (by - c.y) ** 2);
        if (!c.collected && dist < 30) {
          c.collected = true;
          if (c.isSuper) {
            setSuperCoinCount(prev => {
              const next = prev + 1;
              localStorage.setItem('flap_super_coins', next.toString());
              return next;
            });
            playSound(1500, 'sine', 0.2);
          } else {
            setCoinCount(prev => {
              const next = prev + 1;
              localStorage.setItem('flap_coins', next.toString());
              return next;
            });
            playSound(1200, 'sine', 0.1);
          }
        }

        if (c.x < -50) coins.current.splice(i, 1);
      }

      frameCount.current++;
    }

    pipes.current.forEach(p => drawPipe(ctx, p));
    coins.current.forEach(c => drawCoin(ctx, c));

    // BIRD
    ctx.save();
    ctx.translate(80, bird.current.y);
    ctx.rotate(bird.current.rotation);
    if (birdImg.current && birdImg.current.complete) {
      ctx.drawImage(birdImg.current, -bird.current.width/2, -bird.current.height/2, bird.current.width, bird.current.height);
    } else {
      const currentChar = CHARACTERS[0];
      ctx.fillStyle = currentChar?.color || 'red';
      ctx.fillRect(-15, -15, 30, 30);
    }
    ctx.restore();

    if (gameState === GameStatus.START) {
      ctx.fillStyle = 'rgba(0,0,0,0.2)';
      ctx.fillRect(0, 0, CANVAS_WIDTH, CANVAS_HEIGHT);
    }

    if (gameState === GameStatus.GAME_OVER) {
      ctx.fillStyle = 'rgba(0,0,0,0.7)';
      ctx.fillRect(0, 0, CANVAS_WIDTH, CANVAS_HEIGHT);
      ctx.fillStyle = 'white';
      ctx.textAlign = 'center';
      ctx.font = '24px "Press Start 2P"';
      ctx.fillText('GAME OVER', CANVAS_WIDTH / 2, CANVAS_HEIGHT / 2 - 100);
      ctx.font = '14px "Press Start 2P"';
      ctx.fillText(`SCORE: ${score}`, CANVAS_WIDTH / 2, CANVAS_HEIGHT / 2 - 50);
      ctx.fillText(`COINS: ${coinCount}`, CANVAS_WIDTH / 2, CANVAS_HEIGHT / 2 - 20);
      ctx.fillText(`BEST: ${highScore}`, CANVAS_WIDTH / 2, CANVAS_HEIGHT / 2 + 10);
      
      const btnW = 160;
      const btnH = 40;
      const btnX = CANVAS_WIDTH / 2 - btnW / 2;
      
      // Button 1: RETRY (Improved visual)
      const btn1Y = CANVAS_HEIGHT / 2 + 40;
      // Shadow/Ring effect
      ctx.beginPath();
      ctx.arc(CANVAS_WIDTH / 2, btn1Y + btnH / 2 + 4, btnW / 2 + 4, 0, Math.PI * 2);
      ctx.fillStyle = 'rgba(0,0,0,0.3)';
      ctx.fill();

      // Main Button
      ctx.fillStyle = '#d35400';
      ctx.fillRect(btnX, btn1Y + 4, btnW, btnH);
      ctx.fillStyle = '#e67e22';
      ctx.fillRect(btnX, btn1Y, btnW, btnH);
      
      // Border
      ctx.strokeStyle = 'white';
      ctx.lineWidth = 3;
      ctx.strokeRect(btnX, btn1Y, btnW, btnH);
      
      ctx.fillStyle = 'white';
      ctx.font = '14px "Press Start 2P"';
      ctx.fillText('RETRY', CANVAS_WIDTH / 2, btn1Y + 28);

      // Button 2: HOME
      const btn2Y = btn1Y + 60;
      // Shadow
      ctx.fillStyle = 'rgba(0,0,0,0.3)';
      ctx.fillRect(btnX, btn2Y + 4, btnW, btnH);
      // Main
      ctx.fillStyle = '#7f8c8d';
      ctx.fillRect(btnX, btn2Y + 4, btnW, btnH);
      ctx.fillStyle = '#95a5a6';
      ctx.fillRect(btnX, btn2Y, btnW, btnH);
      // Border
      ctx.strokeStyle = 'white';
      ctx.lineWidth = 3;
      ctx.strokeRect(btnX, btn2Y, btnW, btnH);

      ctx.fillStyle = 'white';
      ctx.font = '14px "Press Start 2P"';
      ctx.fillText('HOME', CANVAS_WIDTH / 2, btn2Y + 28);
    }

    if (gameState === GameStatus.PLAYING) {
      ctx.fillStyle = 'white';
      ctx.textAlign = 'center';
      ctx.font = '36px "Press Start 2P"';
      ctx.strokeStyle = 'black';
      ctx.lineWidth = 4;
      ctx.strokeText(score.toString(), CANVAS_WIDTH / 2, 80);
      ctx.fillText(score.toString(), CANVAS_WIDTH / 2, 80);

      ctx.font = '14px "Press Start 2P"';
      ctx.textAlign = 'left';
      ctx.fillText(`COINS: ${coinCount}`, 20, 40);
      ctx.fillText(`SUPER: ${superCoinCount}`, 20, 70);
      
      ctx.textAlign = 'right';
      let mode = 'NORMAL';
      if (score > 80) mode = 'HARD';
      else if (score > 50) mode = 'MEDIUM';
      ctx.fillText(mode, CANVAS_WIDTH - 20, 80);
    }

    animationFrameId.current = requestAnimationFrame(update);
  };

  const handleCanvasClick = (e: React.MouseEvent | React.TouchEvent) => {
    const rect = canvasRef.current?.getBoundingClientRect();
    if (!rect) return;
    
    let clientX, clientY;
    if ('touches' in e) {
      clientX = e.touches[0].clientX;
      clientY = e.touches[0].clientY;
    } else {
      clientX = (e as React.MouseEvent).clientX;
      clientY = (e as React.MouseEvent).clientY;
    }

    const scaleX = CANVAS_WIDTH / rect.width;
    const scaleY = CANVAS_HEIGHT / rect.height;
    const x = (clientX - rect.left) * scaleX;
    const y = (clientY - rect.top) * scaleY;

    if (gameState === GameStatus.GAME_OVER) {
      const btnW = 160;
      const btnH = 40;
      const btnX = CANVAS_WIDTH / 2 - btnW / 2;
      
      // Retry
      const btn1Y = CANVAS_HEIGHT / 2 + 40;
      if (x > btnX && x < btnX + btnW && y > btn1Y && y < btn1Y + btnH) {
        resetGame();
        return;
      }

      // Home
      const btn2Y = btn1Y + 60;
      if (x > btnX && x < btnX + btnW && y > btn2Y && y < btn2Y + btnH) {
        setGameState(GameStatus.START);
        return;
      }
      
      // Click anywhere else to retry
      resetGame();
      return;
    }

    flap(e);
  };

  useEffect(() => {
    animationFrameId.current = requestAnimationFrame(update);
    return () => {
      if (animationFrameId.current) cancelAnimationFrame(animationFrameId.current);
    };
  }, [gameState, score, highScore, coinCount, superCoinCount, bgColor, settings]);

  return (
    <div className={`relative flex flex-col items-center justify-center w-full h-full overflow-hidden transition-all duration-1000 ${gameState === GameStatus.START ? 'bg-[#1a3a3d]' : 'bg-[#2f7a80]'}`}>
      {/* Sky Background with Clouds and Birds */}
      <div className="absolute inset-0 pointer-events-none overflow-hidden">
        <div className="cloud cloud-1"></div>
        <div className="cloud cloud-2"></div>
        <div className="cloud cloud-3"></div>
        <div className="bg-bird bg-bird-1"></div>
        <div className="bg-bird bg-bird-2"></div>
        <div className="bg-bird bg-bird-3"></div>
      </div>

      <canvas 
        ref={canvasRef} 
        width={CANVAS_WIDTH} 
        height={CANVAS_HEIGHT} 
        onMouseDown={handleCanvasClick}
        onTouchStart={handleCanvasClick}
        className="relative z-10 cursor-pointer max-w-full max-h-full object-contain" 
      />

      {/* Settings Toggle Button (Top Right - only visible during play) */}
      {gameState === GameStatus.PLAYING && (
        <button 
          onMouseDown={(e) => { e.stopPropagation(); setShowSettings(true); }}
          onTouchStart={(e) => { e.stopPropagation(); setShowSettings(true); }}
          className="absolute top-4 right-4 z-50 w-12 h-12 bg-white rounded-full shadow-lg flex items-center justify-center text-2xl hover:scale-110 transition-transform"
        >
          ⚙️
        </button>
      )}

      {/* Home Screen Overlay */}
      {gameState === GameStatus.START && (
        <div 
          className="absolute inset-0 z-20 flex flex-col items-center justify-center overflow-hidden cursor-pointer"
          onMouseDown={() => setGameState(GameStatus.PLAYING)}
          onTouchStart={() => setGameState(GameStatus.PLAYING)}
        >
          {/* Scrolling Background for Home Screen */}
          <div className="absolute inset-0 z-0 pointer-events-none">
            <div className="absolute inset-0 bg-[#4ec0ca]"></div>
            <div className="home-bg-scroll"></div>
          </div>

          <div className="relative z-10 flex flex-col items-center justify-center w-full h-full bg-black/5 backdrop-blur-[0.5px] px-8 gap-8">
            {/* Top: Name and Character */}
            <div className="flex flex-col items-center justify-center">
              <h1 className="text-6xl md:text-8xl font-black text-[#ffd700] uppercase tracking-tighter drop-shadow-[0_6px_0_rgba(0,0,0,0.4)] mb-8 text-center font-sans animate-pulse">
                Fly Bird
              </h1>
              
              <div className="relative group mb-12">
                {/* Bird Glow Effect */}
                <div className="absolute inset-0 bg-[#ffd700] blur-3xl opacity-20 group-hover:opacity-40 transition-opacity animate-pulse"></div>
                
                <div className="relative animate-float transition-transform duration-500 hover:scale-110">
                  <img 
                    src="https://raw.githubusercontent.com/samuelcust/flappy-bird-assets/master/sprites/redbird-midflap.png" 
                    alt="Bird" 
                    className="w-24 h-auto image-pixelated scale-[2] drop-shadow-[0_4px_8px_rgba(0,0,0,0.5)] brightness-110 contrast-110"
                    style={{ filter: 'hue-rotate(-15deg) saturate(1.4)' }}
                    referrerPolicy="no-referrer"
                  />
                </div>
                
                {/* Dynamic Shadow */}
                <div className="w-12 h-3 bg-black/20 rounded-[100%] blur-md mx-auto mt-8 animate-shadow"></div>
              </div>
            </div>

            {/* Bottom: Buttons */}
            <div className="flex flex-col gap-4 w-full max-w-[280px]">
              <div className="w-full py-4 bg-[#ffd700] text-black text-2xl font-bold rounded-xl shadow-[0_6px_0_#b8860b] hover:translate-y-1 hover:shadow-[0_3px_0_#b8860b] active:translate-y-2 active:shadow-none transition-all uppercase flex items-center justify-center gap-2">
                <span>▶</span> Play Game
              </div>
              <button 
                onMouseDown={(e) => {
                  e.stopPropagation();
                  setShowSettings(true);
                }}
                onTouchStart={(e) => {
                  e.stopPropagation();
                  setShowSettings(true);
                }}
                className="w-full py-4 bg-white/20 text-white text-xl font-bold rounded-xl border-2 border-white/30 backdrop-blur-md hover:bg-white/40 transition-all uppercase flex items-center justify-center gap-2"
              >
                <span>⚙️</span> Settings
              </button>
              
              <p className="text-white/60 text-sm font-bold uppercase tracking-widest mt-4 animate-pulse text-center">
                Click anywhere to start
              </p>
            </div>
          </div>
        </div>
      )}

      {/* Settings Modal */}
      {showSettings && (
        <div className="absolute inset-0 z-[100] flex items-center justify-center bg-black/60 backdrop-blur-md p-4">
          <div className="bg-white w-full max-w-md rounded-[40px] p-8 relative shadow-2xl animate-in fade-in zoom-in duration-300">
            <button 
              onClick={() => setShowSettings(false)}
              className="absolute -top-4 -right-4 w-12 h-12 bg-red-500 text-white rounded-full border-4 border-white font-bold flex items-center justify-center shadow-lg hover:scale-110 transition-transform"
            >
              ✕
            </button>
            
            <h2 className="text-3xl font-bold text-center mb-8 text-[#2c3e50]">Settings</h2>
            
            <div className="space-y-6">
              <div className="flex justify-between items-center py-4 border-b border-gray-100">
                <span className="text-xl font-semibold text-[#2c3e50]">Sound Effects</span>
                <label className="relative inline-flex items-center cursor-pointer">
                  <input 
                    type="checkbox" 
                    checked={settings.effectsEnabled}
                    onChange={(e) => setSettings(prev => ({ ...prev, effectsEnabled: e.target.checked }))}
                    className="sr-only peer"
                  />
                  <div className="w-14 h-8 bg-gray-200 peer-focus:outline-none rounded-full peer peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[4px] after:left-[4px] after:bg-white after:border-gray-300 after:border after:rounded-full after:h-6 after:w-6 after:transition-all peer-checked:bg-[#f1c40f]"></div>
                </label>
              </div>

              <div className="flex justify-between items-center py-4 border-b border-gray-100">
                <span className="text-xl font-semibold text-[#2c3e50]">Background Music</span>
                <label className="relative inline-flex items-center cursor-pointer">
                  <input 
                    type="checkbox" 
                    checked={settings.musicEnabled}
                    onChange={(e) => setSettings(prev => ({ ...prev, musicEnabled: e.target.checked }))}
                    className="sr-only peer"
                  />
                  <div className="w-14 h-8 bg-gray-200 peer-focus:outline-none rounded-full peer peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[4px] after:left-[4px] after:bg-white after:border-gray-300 after:border after:rounded-full after:h-6 after:w-6 after:transition-all peer-checked:bg-[#f1c40f]"></div>
                </label>
              </div>

              <button 
                onClick={() => setShowPrivacy(true)}
                className="w-full py-4 bg-gray-100 rounded-2xl font-bold text-[#2c3e50] hover:bg-gray-200 transition-colors"
              >
                Privacy Policy
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Privacy Modal */}
      {showPrivacy && (
        <div className="absolute inset-0 z-[200] flex items-center justify-center bg-black/60 backdrop-blur-md p-4">
          <div className="bg-white w-full max-w-md rounded-[40px] p-8 relative shadow-2xl max-h-[80vh] flex flex-col">
            <button 
              onClick={() => setShowPrivacy(false)}
              className="absolute -top-4 -right-4 w-12 h-12 bg-red-500 text-white rounded-full border-4 border-white font-bold flex items-center justify-center shadow-lg hover:scale-110 transition-transform"
            >
              ✕
            </button>
            
            <h2 className="text-3xl font-bold text-center mb-6 text-[#2c3e50]">Privacy Policy</h2>
            
            <div className="overflow-y-auto pr-2 text-gray-600 space-y-4 leading-relaxed">
              <p><strong>1. Information We Collect</strong><br/>
              Fly Bird does not collect any personal information. We do not track your location, access your contacts, or store any data on our servers.</p>
              
              <p><strong>2. How We Use Information</strong><br/>
              Since we do not collect information, we do not use it for any purpose other than providing you with a fun gaming experience.</p>
              
              <p><strong>3. Third-Party Services</strong><br/>
              We do not use any third-party analytics or advertising services that track your behavior.</p>
              
              <p><strong>4. Changes to This Policy</strong><br/>
              We may update our Privacy Policy from time to time. We will notify you of any changes by posting the new Privacy Policy on this page.</p>
              
              <p><strong>5. Contact Us</strong><br/>
              If you have any questions about this Privacy Policy, please contact us at support@flybird.example.com.</p>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default Game;

