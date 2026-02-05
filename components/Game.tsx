
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
    width: 54,  
    height: 38 
  });
  
  const pipes = useRef<Pipe[]>([]);
  const frameCount = useRef(0);
  const animationFrameId = useRef<number | undefined>(undefined);
  const bgX = useRef(0);

  // Initialize Assets with explicit loading checks
  useEffect(() => {
    const birdImage = new Image();
    birdImage.src = AGENT_BIRD_SRC;
    birdImage.onload = () => { birdImg.current = birdImage; };

    const bgImage = new Image();
    bgImage.src = ASSETS.BACKGROUND;
    bgImage.onload = () => { bgImg.current = bgImage; };
  }, []);

  const resetGame = useCallback(() => {
    bird.current = {
      y: CANVAS_HEIGHT / 2,
      velocity: 0,
      rotation: 0,
      width: 54,
      height: 38
    };
    pipes.current = [];
    frameCount.current = 0;
    setScore(0);
    setGameState(GameStatus.PLAYING);
  }, []);

  const flap = useCallback(() => {
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
        e.preventDefault();
        flap();
      }
    };
    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [flap]);

  const drawPipe = (ctx: CanvasRenderingContext2D, pipe: Pipe) => {
    const renderPipePart = (x: number, y: number, w: number, h: number, isTop: boolean) => {
      // Procedural HD Pipe rendering
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
      
      // Highlight shine
      ctx.fillStyle = 'rgba(255, 255, 255, 0.3)';
      ctx.fillRect(lipX + 10, lipY + 4, 4, lipHeight - 8);
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

    // DRAW BACKGROUND
    if (bgImg.current) {
      bgX.current -= 1;
      if (bgX.current <= -CANVAS_WIDTH) bgX.current = 0;
      // Draw two backgrounds for seamless scrolling
      ctx.drawImage(bgImg.current, bgX.current, 0, CANVAS_WIDTH, CANVAS_HEIGHT);
      ctx.drawImage(bgImg.current, bgX.current + CANVAS_WIDTH, 0, CANVAS_WIDTH, CANVAS_HEIGHT);
    } else {
      // Fallback sky gradient
      const skyGrad = ctx.createLinearGradient(0, 0, 0, CANVAS_HEIGHT);
      skyGrad.addColorStop(0, '#4ec0ca');
      skyGrad.addColorStop(1, '#dff6f5');
      ctx.fillStyle = skyGrad;
      ctx.fillRect(0, 0, CANVAS_WIDTH, CANVAS_HEIGHT);
    }

    if (gameState === GameStatus.PLAYING) {
      bird.current.velocity += GRAVITY;
      bird.current.y += bird.current.velocity;
      
      const targetRotation = Math.min(Math.PI / 3, Math.max(-Math.PI / 6, bird.current.velocity * 0.12));
      bird.current.rotation += (targetRotation - bird.current.rotation) * 0.15;

      if (bird.current.y + bird.current.height / 2 >= CANVAS_HEIGHT) {
        setGameState(GameStatus.GAME_OVER);
      }
      if (bird.current.y <= 0) {
        bird.current.y = 0;
        bird.current.velocity = 0;
      }

      if (frameCount.current % PIPE_SPAWN_RATE === 0) {
        const minHeight = 100;
        const maxHeight = CANVAS_HEIGHT - PIPE_GAP - 150;
        const topHeight = Math.floor(Math.random() * (maxHeight - minHeight + 1)) + minHeight;
        pipes.current.push({ x: CANVAS_WIDTH, topHeight, passed: false });
      }

      for (let i = pipes.current.length - 1; i >= 0; i--) {
        const p = pipes.current[i];
        p.x -= PIPE_SPEED;

        const bx = 80;
        const by = bird.current.y;
        const bw = 34; 
        const bh = 24;

        if (bx + bw / 2 > p.x && bx - bw / 2 < p.x + PIPE_WIDTH) {
          if (by - bh / 2 < p.topHeight || by + bh / 2 > p.topHeight + PIPE_GAP) {
            setGameState(GameStatus.GAME_OVER);
          }
        }

        if (!p.passed && p.x + PIPE_WIDTH < bx) {
          p.passed = true;
          setScore(prev => {
            const newScore = prev + 1;
            if (newScore > highScore) {
              setHighScore(newScore);
              localStorage.setItem('flap_highscore', newScore.toString());
            }
            return newScore;
          });
        }

        if (p.x + PIPE_WIDTH < -100) {
          pipes.current.splice(i, 1);
        }
      }

      frameCount.current++;
    }

    pipes.current.forEach(p => drawPipe(ctx, p));

    // DRAW BIRD
    ctx.save();
    ctx.translate(80, bird.current.y);
    ctx.rotate(bird.current.rotation);
    if (birdImg.current) {
      ctx.drawImage(
        birdImg.current, 
        -bird.current.width / 2, 
        -bird.current.height / 2, 
        bird.current.width, 
        bird.current.height
      );
    } else {
      // Fallback bird
      ctx.beginPath();
      ctx.fillStyle = '#f8d305';
      ctx.arc(0, 0, 18, 0, Math.PI * 2);
      ctx.fill();
      ctx.fillStyle = 'white';
      ctx.fillRect(8, -8, 8, 8);
      ctx.fillStyle = 'red';
      ctx.fillRect(8, 2, 12, 6);
    }
    ctx.restore();

    // UI OVERLAYS
    if (gameState === GameStatus.START) {
      ctx.fillStyle = 'rgba(0,0,0,0.4)';
      ctx.fillRect(0, 0, CANVAS_WIDTH, CANVAS_HEIGHT);
      ctx.fillStyle = 'white';
      ctx.textAlign = 'center';
      ctx.font = '24px "Press Start 2P"';
      ctx.strokeStyle = 'black';
      ctx.lineWidth = 6;
      ctx.strokeText('FLAP READY', CANVAS_WIDTH / 2, CANVAS_HEIGHT / 2 - 40);
      ctx.fillText('FLAP READY', CANVAS_WIDTH / 2, CANVAS_HEIGHT / 2 - 40);
      
      ctx.font = '10px "Press Start 2P"';
      ctx.fillText('TAP OR SPACE TO START', CANVAS_WIDTH / 2, CANVAS_HEIGHT / 2 + 20);
    }

    if (gameState === GameStatus.GAME_OVER) {
      ctx.fillStyle = 'rgba(0,0,0,0.6)';
      ctx.fillRect(0, 0, CANVAS_WIDTH, CANVAS_HEIGHT);
      ctx.fillStyle = 'white';
      ctx.textAlign = 'center';
      ctx.font = '24px "Press Start 2P"';
      ctx.strokeStyle = '#800000';
      ctx.lineWidth = 4;
      ctx.strokeText('CRASHED!', CANVAS_WIDTH / 2, CANVAS_HEIGHT / 2 - 80);
      ctx.fillText('CRASHED!', CANVAS_WIDTH / 2, CANVAS_HEIGHT / 2 - 80);
      
      ctx.font = '14px "Press Start 2P"';
      ctx.fillStyle = '#FFD700';
      ctx.fillText(`SCORE: ${score}`, CANVAS_WIDTH / 2, CANVAS_HEIGHT / 2 - 10);
      ctx.fillStyle = 'white';
      ctx.fillText(`BEST: ${highScore}`, CANVAS_WIDTH / 2, CANVAS_HEIGHT / 2 + 30);
      ctx.font = '10px "Press Start 2P"';
      ctx.fillText('TAP TO RETRY', CANVAS_WIDTH / 2, CANVAS_HEIGHT / 2 + 100);
    }

    if (gameState === GameStatus.PLAYING) {
      ctx.fillStyle = 'white';
      ctx.textAlign = 'center';
      ctx.font = '42px "Press Start 2P"';
      ctx.strokeStyle = 'rgba(0,0,0,0.5)';
      ctx.lineWidth = 8;
      ctx.strokeText(score.toString(), CANVAS_WIDTH / 2, 100);
      ctx.fillText(score.toString(), CANVAS_WIDTH / 2, 100);
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
      onClick={flap}
      className="cursor-pointer block"
    />
  );
};

export default Game;
