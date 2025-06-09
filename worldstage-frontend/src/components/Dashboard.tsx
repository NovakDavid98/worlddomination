import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '../contexts/AuthContext';
import { useSocket } from '../contexts/SocketContext';
import { gameApi } from '../services/gameApi';
import type { Game } from '../services/gameApi';
import CreateGameModal from './ui/CreateGameModal';
import LoadingSpinner from './ui/LoadingSpinner';

// Extended interface for player games that includes nation info
interface PlayerGame extends Game {
  nation_name?: string;
  leader_name?: string;
  country_name?: string;
  color_hex?: string;
}

const Dashboard: React.FC = () => {
  const { user, logout } = useAuth();
  const { connected } = useSocket();
  const navigate = useNavigate();
  const [availableGames, setAvailableGames] = useState<Game[]>([]);
  const [playerGames, setPlayerGames] = useState<PlayerGame[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [showCreateModal, setShowCreateModal] = useState(false);

  useEffect(() => {
    loadData();
  }, []);

  const loadData = async () => {
    try {
      setLoading(true);
      const [games, myGames] = await Promise.all([
        gameApi.getGames(),
        gameApi.getPlayerGames()
      ]);
      setAvailableGames(games);
      setPlayerGames(myGames as PlayerGame[]);
      setError('');
    } catch (err) {
      setError('Failed to load games');
      console.error('Error loading data:', err);
    } finally {
      setLoading(false);
    }
  };

  const handleCreateGame = async (name: string, maxPlayers: number) => {
    try {
      const newGame = await gameApi.createGame(name, maxPlayers);
      await loadData(); // Refresh the games list
      // Navigate to the game lobby
      navigate(`/game/${newGame.id}/lobby`);
    } catch (err) {
      throw err; // Let the modal handle the error
    }
  };

  const handleJoinGame = (gameId: number) => {
    navigate(`/game/${gameId}/lobby`);
  };

  const formatDate = (dateString: string) => {
    return new Date(dateString).toLocaleDateString('en-US', {
      month: 'short',
      day: 'numeric',
      hour: '2-digit',
      minute: '2-digit'
    });
  };

  const getGameStatusColor = (status: string) => {
    switch (status) {
      case 'waiting': return 'text-game-warning';
      case 'active': return 'text-game-success';
      case 'completed': return 'text-gray-400';
      default: return 'text-gray-400';
    }
  };

  const getGamePhaseIcon = (phase: string) => {
    switch (phase) {
      case 'foundation': return '🏗️';
      case 'expansion': return '🌍';
      case 'competition': return '⚔️';
      case 'resolution': return '🏆';
      default: return '🎮';
    }
  };

  return (
    <div className="min-h-screen bg-game-bg">
      {/* Header */}
      <header className="bg-game-surface border-b border-gray-700">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex justify-between items-center h-16">
            <div className="flex items-center">
              <h1 className="text-2xl font-bold text-white">
                🌍 WorldStage
              </h1>
              <div className="ml-4 flex items-center">
                <div className={`w-2 h-2 rounded-full ${connected ? 'bg-game-success' : 'bg-game-danger'}`}></div>
                <span className="ml-2 text-sm text-gray-400">
                  {connected ? 'Connected' : 'Disconnected'}
                </span>
              </div>
            </div>
            
            <div className="flex items-center space-x-4">
              <span className="text-gray-300">Welcome, {user?.username}!</span>
              <button
                onClick={logout}
                className="btn-secondary"
              >
                Logout
              </button>
            </div>
          </div>
        </div>
      </header>

      {/* Main Content */}
      <main className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        {error && (
          <div className="bg-game-danger/20 border border-game-danger text-game-danger px-4 py-3 rounded-lg mb-6">
            {error}
            <button 
              onClick={loadData} 
              className="ml-4 text-sm underline hover:no-underline"
            >
              Retry
            </button>
          </div>
        )}

        <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
          
          {/* Available Games */}
          <div className="lg:col-span-2">
            <div className="card">
              <div className="flex justify-between items-center mb-6">
                <h2 className="text-xl font-semibold text-white">Available Games</h2>
                <button 
                  onClick={() => setShowCreateModal(true)}
                  className="btn-primary"
                >
                  Create New Game
                </button>
              </div>
              
              {loading ? (
                <div className="text-center py-8">
                  <LoadingSpinner />
                  <p className="mt-4 text-gray-400">Loading games...</p>
                </div>
              ) : (
                <div className="space-y-4">
                  {availableGames.length > 0 ? (
                    availableGames.map((game) => (
                      <div key={game.id} className="bg-game-bg rounded-lg p-4 border border-gray-600 hover:border-game-accent transition-colors">
                        <div className="flex justify-between items-start">
                          <div className="flex-1">
                            <div className="flex items-center gap-2 mb-1">
                              <h3 className="font-semibold text-white">{game.name}</h3>
                              <span className={`text-sm ${getGameStatusColor(game.status)}`}>
                                {game.status.charAt(0).toUpperCase() + game.status.slice(1)}
                              </span>
                            </div>
                            <p className="text-gray-400 text-sm">Created by: {game.creator_username}</p>
                            <div className="flex items-center gap-4 text-gray-400 text-sm mt-1">
                              <span>Players: {game.current_players}/{game.max_players}</span>
                              <span>Turn: {game.turn_duration_hours}h</span>
                              <span className="flex items-center gap-1">
                                {getGamePhaseIcon(game.game_phase)}
                                {game.game_phase.charAt(0).toUpperCase() + game.game_phase.slice(1)}
                              </span>
                            </div>
                            <p className="text-gray-500 text-xs mt-1">
                              Created: {formatDate(game.created_at)}
                            </p>
                          </div>
                          <button 
                            onClick={() => handleJoinGame(game.id)}
                            disabled={game.current_players >= game.max_players}
                            className={`ml-4 ${
                              game.current_players >= game.max_players 
                                ? 'bg-gray-600 text-gray-400 cursor-not-allowed' 
                                : 'btn-secondary'
                            }`}
                          >
                            {game.current_players >= game.max_players ? 'Full' : 'Join Game'}
                          </button>
                        </div>
                      </div>
                    ))
                  ) : (
                    <div className="text-center py-8 text-gray-400">
                      <div className="text-4xl mb-4">🎮</div>
                      <p>No games available</p>
                      <p className="text-sm mt-2">Be the first to create an epic campaign!</p>
                    </div>
                  )}
                </div>
              )}
            </div>
          </div>

          {/* Sidebar */}
          <div className="space-y-6">
            
            {/* Your Games */}
            <div className="card">
              <h3 className="text-lg font-semibold text-white mb-4">Your Games</h3>
              <div className="space-y-3">
                {playerGames.length > 0 ? (
                  playerGames.map((game) => (
                    <div key={game.id} className="bg-game-bg rounded-lg p-3 border border-gray-600">
                      <div className="flex items-center justify-between">
                        <div>
                          <h4 className="font-medium text-white text-sm">{game.name}</h4>
                          <p className="text-gray-400 text-xs">
                            {game.nation_name} • {game.game_phase}
                          </p>
                        </div>
                        <button 
                          onClick={() => navigate(`/game/${game.id}`)}
                          className="text-game-accent hover:text-blue-400 text-sm"
                        >
                          Enter
                        </button>
                      </div>
                    </div>
                  ))
                ) : (
                  <div className="text-center py-4 text-gray-400">
                    <p className="text-sm">No active games</p>
                    <p className="text-xs mt-1">Join a game to start playing!</p>
                  </div>
                )}
              </div>
            </div>

            {/* Quick Stats */}
            <div className="card">
              <h3 className="text-lg font-semibold text-white mb-4">Quick Stats</h3>
              <div className="space-y-2 text-sm">
                <div className="flex justify-between">
                  <span className="text-gray-400">Games Played:</span>
                  <span className="text-white">{playerGames.length}</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-gray-400">Active Games:</span>
                  <span className="text-white">{playerGames.filter(g => g.status === 'active').length}</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-gray-400">Reputation:</span>
                  <span className="text-game-accent">New Player</span>
                </div>
              </div>
            </div>

            {/* Game Guide */}
            <div className="card">
              <h3 className="text-lg font-semibold text-white mb-4">Getting Started</h3>
              <div className="space-y-2 text-sm text-gray-400">
                <p>🎯 Choose your victory path</p>
                <p>🤝 Build diplomatic relations</p>
                <p>🏭 Develop your economy</p>
                <p>🔬 Research technologies</p>
                <p>⏰ Games last 2-4 weeks</p>
              </div>
            </div>
          </div>
        </div>
      </main>

      {/* Create Game Modal */}
      <CreateGameModal
        isOpen={showCreateModal}
        onClose={() => setShowCreateModal(false)}
        onCreateGame={handleCreateGame}
      />
    </div>
  );
};

export default Dashboard; 