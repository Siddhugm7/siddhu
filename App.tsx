
import React from 'react';
import Game from './components/Game';

const App: React.FC = () => {
  return (
    <div className="flex items-center justify-center w-full h-full bg-slate-900 overflow-hidden">
      {/* Container is now full-screen with no borders or rounded corners */}
      <div className="relative w-full h-full overflow-hidden flex items-center justify-center">
        <Game />
      </div>
    </div>
  );
};

export default App;
