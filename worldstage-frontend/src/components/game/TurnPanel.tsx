import React, { useState, useEffect } from 'react';

interface TurnPanelProps {
  currentTurn: number;
  gamePhase: string;
  turnDurationHours: number;
  onEndTurn: () => void;
  className?: string;
}

const TurnPanel: React.FC<TurnPanelProps> = ({
  currentTurn,
  gamePhase,
  turnDurationHours,
  onEndTurn,
  className = ''
}) => {
  const [timeRemaining, setTimeRemaining] = useState(turnDurationHours * 3600); // seconds
  const [turnEnded, setTurnEnded] = useState(false);

  useEffect(() => {
    const timer = setInterval(() => {
      setTimeRemaining(prev => {
        if (prev <= 0) {
          return 0;
        }
        return prev - 1;
      });
    }, 1000);

    return () => clearInterval(timer);
  }, []);

  const formatTime = (seconds: number): string => {
    const hours = Math.floor(seconds / 3600);
    const minutes = Math.floor((seconds % 3600) / 60);
    const secs = seconds % 60;

    if (hours > 0) {
      return `${hours}h ${minutes}m`;
    } else if (minutes > 0) {
      return `${minutes}m ${secs}s`;
    } else {
      return `${secs}s`;
    }
  };

  const getPhaseInfo = (phase: string) => {
    switch (phase) {
      case 'foundation':
        return {
          name: 'Foundation Phase',
          description: 'Build your initial infrastructure and establish your nation',
          icon: '🏗️',
          color: 'text-yellow-400'
        };
      case 'expansion':
        return {
          name: 'Expansion Phase',
          description: 'Grow your economy and expand your influence',
          icon: '📈',
          color: 'text-blue-400'
        };
      case 'competition':
        return {
          name: 'Competition Phase', 
          description: 'Compete with other nations for dominance',
          icon: '⚔️',
          color: 'text-red-400'
        };
      case 'resolution':
        return {
          name: 'Resolution Phase',
          description: 'Final push towards victory conditions',
          icon: '🏆',
          color: 'text-purple-400'
        };
      default:
        return {
          name: 'Game Phase',
          description: 'Current game phase',
          icon: '🎮',
          color: 'text-gray-400'
        };
    }
  };

  const handleEndTurn = () => {
    setTurnEnded(true);
    onEndTurn();
  };

  const phaseInfo = getPhaseInfo(gamePhase);
  const isUrgent = timeRemaining < 3600; // Less than 1 hour
  const isCritical = timeRemaining < 600; // Less than 10 minutes

  return (
    <div className={`card ${className}`}>
      <div className="flex items-center justify-between mb-4">
        <h3 className="text-lg font-semibold text-white">Turn {currentTurn}</h3>
        <div className="flex items-center gap-2">
          <span className="text-xl">{phaseInfo.icon}</span>
          <span className={`text-sm font-medium ${phaseInfo.color}`}>
            {phaseInfo.name}
          </span>
        </div>
      </div>

      {/* Phase Description */}
      <div className="bg-game-bg rounded-lg p-3 mb-4">
        <p className="text-gray-300 text-sm">{phaseInfo.description}</p>
      </div>

      {/* Time Remaining */}
      <div className="mb-4">
        <div className="flex items-center justify-between mb-2">
          <span className="text-sm text-gray-400">Time Remaining:</span>
          <span className={`text-sm font-medium ${
            isCritical ? 'text-red-400' : 
            isUrgent ? 'text-yellow-400' : 
            'text-green-400'
          }`}>
            {formatTime(timeRemaining)}
          </span>
        </div>
        
        {/* Progress Bar */}
        <div className="w-full bg-gray-700 rounded-full h-2">
          <div 
            className={`h-2 rounded-full transition-all duration-1000 ${
              isCritical ? 'bg-red-400' : 
              isUrgent ? 'bg-yellow-400' : 
              'bg-green-400'
            }`}
            style={{ 
              width: `${Math.max(0, (timeRemaining / (turnDurationHours * 3600)) * 100)}%` 
            }}
          ></div>
        </div>
      </div>

      {/* Turn Actions */}
      <div className="space-y-3">
        {!turnEnded ? (
          <>
            <button
              onClick={handleEndTurn}
              className="btn-primary w-full flex items-center justify-center gap-2"
            >
              <span>✅</span>
              End Turn
            </button>
            <p className="text-xs text-gray-400 text-center">
              End your turn early to speed up the game
            </p>
          </>
        ) : (
          <div className="text-center">
            <div className="bg-green-400/20 border border-green-400 text-green-400 rounded-lg p-3 mb-2">
              <span className="text-lg">✅</span>
              <p className="text-sm font-medium">Turn Ended</p>
            </div>
            <p className="text-xs text-gray-400">
              Waiting for other players...
            </p>
          </div>
        )}
      </div>

      {/* Turn Tips */}
      <div className="mt-4 pt-3 border-t border-gray-600">
        <p className="text-xs text-gray-500 font-medium mb-2">💡 Turn Tips:</p>
        <div className="space-y-1 text-xs text-gray-400">
          <div className="flex items-center gap-2">
            <span>🏭</span>
            <span>Build structures to grow your economy</span>
          </div>
          <div className="flex items-center gap-2">
            <span>👥</span>
            <span>Keep your population happy for better productivity</span>
          </div>
          <div className="flex items-center gap-2">
            <span>🤝</span>
            <span>Communicate with other players for alliances</span>
          </div>
        </div>
      </div>
    </div>
  );
};

export default TurnPanel; 