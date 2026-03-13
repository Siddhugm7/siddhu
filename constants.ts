
export const CANVAS_WIDTH = 400;
export const CANVAS_HEIGHT = 700;
export const GRAVITY = 0.15;
export const JUMP_STRENGTH = -5.5;
export const PIPE_SPEED = 2.2;
export const PIPE_SPAWN_RATE = 130; 
export const PIPE_WIDTH = 70;
export const PIPE_GAP = 170;
export const COIN_SIZE = 25;
export const COIN_SPAWN_RATE = 130; 


// Using the most reliable Flappy Bird assets on GitHub
export const ASSETS = {
  BIRD: 'https://raw.githubusercontent.com/samuelcust/flappy-bird-assets/master/sprites/redbird-midflap.png',
  BACKGROUND: 'https://raw.githubusercontent.com/samuelcust/flappy-bird-assets/master/sprites/background-day.png',
  PIPE: 'https://raw.githubusercontent.com/samuelcust/flappy-bird-assets/master/sprites/pipe-green.png'
};

export const CHARACTERS = [
  { id: 'FLYBIRD', name: 'FLYBIRD', color: '#e74c3c', price: 0, src: 'https://raw.githubusercontent.com/samuelcust/flappy-bird-assets/master/sprites/redbird-midflap.png' },
  { id: 'FlyBird', name: 'FlyBird', color: '#3498db', price: 100, src: 'https://raw.githubusercontent.com/samuelcust/flappy-bird-assets/master/sprites/bluebird-midflap.png' },
  { id: 'FLY_BRD', name: 'FLY_BRD', color: '#f1c40f', price: 200, src: 'https://raw.githubusercontent.com/samuelcust/flappy-bird-assets/master/sprites/yellowbird-midflap.png' },
  { id: 'FLYBRD7', name: 'FLYBRD7', color: '#2ecc71', price: 300, src: '' },
  { id: 'F1YB1RD', name: 'F1YB1RD', color: '#9b59b6', price: 400, src: '' },
  { id: 'FLYBRDS', name: 'FLYBRDS', color: '#e67e22', price: 500, src: '' },
  { id: 'FLYB1RD_CYAN', name: 'FLYB1RD', color: '#1abc9c', price: 600, src: '' },
];
