
import React from 'react';
import Game from './components/Game';

const App: React.FC = () => {
  return (
    <div className="flex flex-col items-center justify-center min-h-screen bg-slate-900 p-4">
      <div className="relative shadow-2xl border-8 border-slate-800 rounded-3xl overflow-hidden bg-sky-300">
        <Game />
        <div className="absolute top-4 left-0 right-0 pointer-events-none flex justify-center">
          <h1 className="text-white text-xs drop-shadow-md opacity-50 tracking-tighter">
            AGENT FLAP v1.0
          </h1>
        </div>
      </div>
    </div>
  );
};

export default App;
