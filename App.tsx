
import React from 'react';
import Game from './components/Game';

const App: React.FC = () => {
  return (
    <div className="flex items-center justify-center w-full h-full bg-slate-900 overflow-hidden">
      {/* Container is now full-screen with no borders or rounded corners */}
      <div className="relative w-full h-full overflow-hidden flex items-center justify-center">
        <Game />
        
        {/* Minimal HUD overlay */}
        <div className="absolute top-safe-top mt-4 left-0 right-0 pointer-events-none flex justify-center">
          <h1 className="text-white text-[8px] md:text-xs drop-shadow-md opacity-30 tracking-widest uppercase font-sans">
            AGENT FLAP FULLSCREEN
          </h1>
        </div>
      </div>
    </div>
  );
};

export default App;
