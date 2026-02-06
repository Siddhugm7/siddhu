
import React, { useEffect, useRef, useState, useCallback } from 'react';
import { GameStatus, Bird, Pipe } from '../types';
import { 
  CANVAS_WIDTH, 
  CANVAS_HEIGHT, 
  GRAVITY, 
  JUMP_STRENGTH, 
  PIPE_SPEED, 
  PIPE_SPAWN_RATE, 
  PIPE_WIDTH, 
  PIPE_GAP,
  AGENT_BIRD_SRC,
  ASSETS
} from '../constants';

const Game: React.FC = () => {
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const [gameState, setGameState] = useState<GameStatus>(GameStatus.START);
  const [score, setScore] = useState(0);
  const [highScore, setHighScore] = useState(() => {
    const saved = localStorage.getItem('flap_highscore');
    return saved ? parseInt(saved, 10) : 0;
  });

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
  const frameCount = useRef(0);
  const animationFrameId = useRef<number | undefined>(undefined);
  const bgX = useRef(0);

  useEffect(() => {
    const loadImg = (src: string) => {
      const img = new Image();
      img.crossOrigin = "anonymous";
      img.src = src;
      return img;
    };

    const bImg = loadImg(AGENT_BIRD_SRC);
    bImg.onload = () => { birdImg.current = bImg; };

    const background = loadImg(ASSETS.BACKGROUND);
    background.onload = () => { bgImg.current = background; };
  }, []);

  const resetGame = useCallback(() => {
    bird.current = {
      y: CANVAS_HEIGHT / 2,
      velocity: 0,
      rotation: 0,
      width: 48,
      height: 34
    };
    pipes.current = [];
    frameCount.current = 0;
    setScore(0);
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
    } else if (gameState === GameStatus.GAME_OVER) {
      resetGame();
    }
  }, [gameState, resetGame]);

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

    renderPipePart(pipe.x, 0, PIPE_WIDTH, pipe.topHeight, true);
    renderPipePart(pipe.x, pipe.topHeight + PIPE_GAP, PIPE_WIDTH, CANVAS_HEIGHT - (pipe.topHeight + PIPE_GAP), false);
  };

  const update = () => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    const ctx = canvas.getContext('2d');
    if (!ctx) return;

    ctx.clearRect(0, 0, CANVAS_WIDTH, CANVAS_HEIGHT);

    // BACKGROUND
    if (bgImg.current && bgImg.current.complete) {
      bgX.current -= 1;
      if (bgX.current <= -CANVAS_WIDTH) bgX.current = 0;
      ctx.drawImage(bgImg.current, bgX.current, 0, CANVAS_WIDTH, CANVAS_HEIGHT);
      ctx.drawImage(bgImg.current, bgX.current + CANVAS_WIDTH, 0, CANVAS_WIDTH, CANVAS_HEIGHT);
    } else {
      ctx.fillStyle = '#4ec0ca';
      ctx.fillRect(0, 0, CANVAS_WIDTH, CANVAS_HEIGHT);
    }

    if (gameState === GameStatus.PLAYING) {
      bird.current.velocity += GRAVITY;
      bird.current.y += bird.current.velocity;
      
      const targetRotation = Math.min(Math.PI / 3, Math.max(-Math.PI / 6, bird.current.velocity * 0.1));
      bird.current.rotation += (targetRotation - bird.current.rotation) * 0.1;

      if (bird.current.y + bird.current.height / 2 >= CANVAS_HEIGHT) {
        setGameState(GameStatus.GAME_OVER);
      }
      if (bird.current.y <= 0) bird.current.y = 0;

      if (frameCount.current % PIPE_SPAWN_RATE === 0) {
        const topHeight = Math.random() * (CANVAS_HEIGHT - PIPE_GAP - 200) + 100;
        pipes.current.push({ x: CANVAS_WIDTH, topHeight, passed: false });
      }

      for (let i = pipes.current.length - 1; i >= 0; i--) {
        const p = pipes.current[i];
        p.x -= PIPE_SPEED;

        const bx = 80;
        const by = bird.current.y;
        if (bx + 15 > p.x && bx - 15 < p.x + PIPE_WIDTH) {
          if (by - 12 < p.topHeight || by + 12 > p.topHeight + PIPE_GAP) {
            setGameState(GameStatus.GAME_OVER);
          }
        }

        if (!p.passed && p.x + PIPE_WIDTH < bx) {
          p.passed = true;
          setScore(s => {
            const next = s + 1;
            if (next > highScore) {
              setHighScore(next);
              localStorage.setItem('flap_highscore', next.toString());
            }
            return next;
          });
        }
        if (p.x + PIPE_WIDTH < -100) pipes.current.splice(i, 1);
      }
      frameCount.current++;
    }

    pipes.current.forEach(p => drawPipe(ctx, p));

    // BIRD
    ctx.save();
    ctx.translate(80, bird.current.y);
    ctx.rotate(bird.current.rotation);
    if (birdImg.current && birdImg.current.complete) {
      ctx.drawImage(birdImg.current, -bird.current.width/2, -bird.current.height/2, bird.current.width, bird.current.height);
    } else {
      ctx.fillStyle = 'yellow';
      ctx.fillRect(-15, -15, 30, 30);
    }
    ctx.restore();

    // UI Overlay
    if (gameState === GameStatus.START) {
      ctx.fillStyle = 'rgba(0,0,0,0.4)';
      ctx.fillRect(0, 0, CANVAS_WIDTH, CANVAS_HEIGHT);
      ctx.fillStyle = 'white';
      ctx.textAlign = 'center';
      ctx.font = '16px "Press Start 2P"';
      ctx.fillText('TAP TO START', CANVAS_WIDTH / 2, CANVAS_HEIGHT / 2);
    }

    if (gameState === GameStatus.GAME_OVER) {
      ctx.fillStyle = 'rgba(0,0,0,0.6)';
      ctx.fillRect(0, 0, CANVAS_WIDTH, CANVAS_HEIGHT);
      ctx.fillStyle = 'white';
      ctx.textAlign = 'center';
      ctx.font = '20px "Press Start 2P"';
      ctx.fillText('GAME OVER', CANVAS_WIDTH / 2, CANVAS_HEIGHT / 2 - 50);
      ctx.font = '14px "Press Start 2P"';
      ctx.fillText(`SCORE: ${score}`, CANVAS_WIDTH / 2, CANVAS_HEIGHT / 2 + 10);
      ctx.fillText(`BEST: ${highScore}`, CANVAS_WIDTH / 2, CANVAS_HEIGHT / 2 + 50);
      ctx.font = '10px "Press Start 2P"';
      ctx.fillText('TAP TO RETRY', CANVAS_WIDTH / 2, CANVAS_HEIGHT / 2 + 100);
    }

    if (gameState === GameStatus.PLAYING) {
      ctx.fillStyle = 'white';
      ctx.textAlign = 'center';
      ctx.font = '36px "Press Start 2P"';
      ctx.strokeStyle = 'black';
      ctx.lineWidth = 4;
      ctx.strokeText(score.toString(), CANVAS_WIDTH / 2, 80);
      ctx.fillText(score.toString(), CANVAS_WIDTH / 2, 80);
    }

    animationFrameId.current = requestAnimationFrame(update);
  };

  useEffect(() => {
    animationFrameId.current = requestAnimationFrame(update);
    return () => {
      if (animationFrameId.current) cancelAnimationFrame(animationFrameId.current);
    };
  }, [gameState, score, highScore]);

  return (
    <canvas 
      ref={canvasRef} 
      width={CANVAS_WIDTH} 
      height={CANVAS_HEIGHT} 
      onMouseDown={(e) => flap(e as unknown as React.MouseEvent)}
      onTouchStart={(e) => flap(e as unknown as React.TouchEvent)}
      className="cursor-pointer" 
    />
  );
};

export default Game;
