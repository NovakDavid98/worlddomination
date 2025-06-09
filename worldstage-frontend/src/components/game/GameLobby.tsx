import React, { useState, useEffect } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { useSocket } from '../../contexts/SocketContext';
import { useAuth } from '../../contexts/AuthContext';
import { gameApi } from '../../services/gameApi';
import type { Game, Country, Player } from '../../services/gameApi';
import LoadingSpinner from '../ui/LoadingSpinner';

const GameLobby: React.FC = () => {
  const { gameId } = useParams<{ gameId: string }>();
  const navigate = useNavigate();
  const { socket, connected } = useSocket();
  const { user } = useAuth();
  const [game, setGame] = useState<Game | null>(null);
  const [countries, setCountries] = useState<Country[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [joining, setJoining] = useState(false);
  const [togglingReady, setTogglingReady] = useState(false);
  const [startingGame, setStartingGame] = useState(false);
  const [selectedCountry, setSelectedCountry] = useState<Country | null>(null);
  const [nationName, setNationName] = useState('');
  const [leaderName, setLeaderName] = useState('');
  const [showJoinForm, setShowJoinForm] = useState(false);

  useEffect(() => {
    if (gameId) {
      loadGameData();
      joinGameRoom();
    }
  }, [gameId]);

  useEffect(() => {
    if (socket && connected) {
      socket.on('player_joined', handlePlayerStatusChange);
      socket.on('player_left', handlePlayerStatusChange);
      socket.on('player_ready_status_changed', handlePlayerStatusChange);
      socket.on('game_started', handleGameStarted);
      
      return () => {
        socket.off('player_joined', handlePlayerStatusChange);
        socket.off('player_left', handlePlayerStatusChange);
        socket.off('player_ready_status_changed', handlePlayerStatusChange);
        socket.off('game_started', handleGameStarted);
      };
    }
  }, [socket, connected, gameId]);

  const loadGameData = async () => {
    try {
      setLoading(true);
      const [gameData, countriesData] = await Promise.all([
        gameApi.getGameDetails(parseInt(gameId!)),
        gameApi.getCountries()
      ]);
      setGame(gameData);
      if (gameData && !gameData.players) {
        gameData.players = [];
      }
      setCountries(countriesData);
      setError('');
    } catch (err) {
      setError('Failed to load game data');
      console.error('Error loading game data:', err);
    } finally {
      setLoading(false);
    }
  };

  const joinGameRoom = () => {
    if (socket && gameId) {
      socket.emit('join_game', parseInt(gameId!));
    }
  };

  const handlePlayerStatusChange = (data: any) => {
    console.log('Player status change event:', data);
    loadGameData();
  };

  const handleGameStarted = (updatedGame: Game) => {
    console.log('Game started event received:', updatedGame);
    setGame(updatedGame);
    if (gameId) {
      navigate(`/game/${gameId}`);
    }
  };

  const getAvailableCountries = () => {
    if (!game || !countries) return [];
    const takenCountryIds = game.players?.map(p => p.country_id) || [];
    return countries.filter(country => !takenCountryIds.includes(country.id));
  };

  const handleJoinGame = async () => {
    if (!selectedCountry || !nationName.trim() || !leaderName.trim()) {
      setError('Please select a country and enter your nation & leader names.');
      return;
    }

    try {
      setJoining(true);
      setError('');
      
      await gameApi.joinGame(
        parseInt(gameId!),
        selectedCountry.id,
        nationName.trim(),
        leaderName.trim()
      );
      await loadGameData();
      setShowJoinForm(false);
      
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to join game');
    } finally {
      setJoining(false);
    }
  };

  const handleToggleReady = async () => {
    const currentPlayer = game?.players?.find(p => p.user_id === user?.id);
    if (!currentPlayer) {
      setError("You are not a player in this game.");
      return;
    }

    setTogglingReady(true);
    try {
      await gameApi.togglePlayerReadyStatus(currentPlayer.id);
    } catch (err) {
      setError(err instanceof Error ? err.message : "Failed to toggle ready status");
      console.error("Error toggling ready status:", err);
    } finally {
      setTogglingReady(false);
    }
  };

  const handleStartGame = async () => {
    if (!game) {
      setError("Game data is not available. Please refresh.");
      console.error("handleStartGame called with null game state");
      return;
    }

    if (game.creator_id !== user?.id) {
      setError("Only the game creator can start the game.");
      return;
    }

    if (game.status !== 'pending') {
        setError("The game is not in a pending state and cannot be started.");
        return;
    }

    setStartingGame(true);
    try {
      await gameApi.startGame(game.id);
    } catch (err) {
      setError(err instanceof Error ? err.message : "Failed to start game");
      console.error("Error starting game:", err);
    } finally {
      setStartingGame(false);
    }
  };

  const isCurrentUserInGame = () => {
    if (!user || !game || !game.players) return false;
    return game.players.some(p => p.user_id === user.id);
  };

  const canCurrentUserJoin = () => {
    if (!game) return false;
    return game.current_players < game.max_players && !isCurrentUserInGame();
  };

  const currentUserPlayer = game.players?.find(p => p.user_id === user?.id);
  const isCreator = game.creator_id === user?.id;
  const canStartGame = isCreator && game.status === 'pending' && (game.players?.length || 0) > 0;

  if (loading) {
    return (
      <div className="min-h-screen bg-game-bg flex items-center justify-center">
        <div className="text-center">
          <LoadingSpinner />
          <p className="mt-4 text-game-accent text-lg">Loading game lobby...</p>
        </div>
      </div>
    );
  }

  if (!game) {
    return (
      <div className="min-h-screen bg-game-bg p-8">
        <div className="max-w-6xl mx-auto">
          <div className="card text-center">
            <h1 className="text-2xl font-bold text-white mb-4">Game Not Found</h1>
            <p className="text-gray-400 mb-6">The game you're looking for doesn't exist or has been removed.</p>
            <button onClick={() => navigate('/dashboard')} className="btn-primary">
              Back to Dashboard
            </button>
          </div>
        </div>
      </div>
    );
  }

  const availableCountries = getAvailableCountries();

  return (
    <div className="min-h-screen bg-game-bg p-8">
      <div className="max-w-6xl mx-auto">
        {/* Header */}
        <div className="flex justify-between items-center mb-8">
          <div>
            <h1 className="text-3xl font-bold text-white mb-2">{game.name}</h1>
            <p className="text-gray-400">
              Created by {game.creator_username} • {game.current_players}/{game.max_players} players
            </p>
          </div>
          <button
            onClick={() => navigate('/dashboard')}
            className="btn-secondary"
          >
            Back to Dashboard
          </button>
        </div>

        {error && (
          <div className="bg-game-danger/20 border border-game-danger text-game-danger px-4 py-3 rounded-lg mb-6" role="alert">
            {error}
          </div>
        )}

        <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
          
          {/* Game Info & Join/Ready Controls */}
          <div className="lg:col-span-2">
            <div className="card">
              <h2 className="text-xl font-semibold text-white mb-4">Game Information</h2>
              
              <div className="grid grid-cols-2 gap-4 mb-6 text-sm">
                <div><strong className="text-gray-400">Status:</strong> <span className="text-white">{game.status.charAt(0).toUpperCase() + game.status.slice(1)}</span></div>
                <div><strong className="text-gray-400">Phase:</strong> <span className="text-white">{game.game_phase.charAt(0).toUpperCase() + game.game_phase.slice(1)}</span></div>
                <div><strong className="text-gray-400">Turn Duration:</strong> <span className="text-white">{game.turn_duration_hours} hours</span></div>
                <div><strong className="text-gray-400">Current Turn:</strong> <span className="text-white">{game.current_turn}</span></div>
              </div>

              {/* Join Game Form or Ready Button */}
              {!isCurrentUserInGame() && canCurrentUserJoin() && !showJoinForm && (
                <button onClick={() => setShowJoinForm(true)} className="btn-primary w-full mb-6">
                  Join Game
                </button>
              )}

              {showJoinForm && !isCurrentUserInGame() && canCurrentUserJoin() && (
                <div className="mb-6 p-4 bg-game-surface-transparent rounded-lg">
                  <h3 className="text-lg font-semibold text-white mb-3">Choose Your Nation</h3>
                  <select
                    value={selectedCountry?.id || ''}
                    onChange={(e) => setSelectedCountry(countries.find(c => c.id === parseInt(e.target.value)) || null)}
                    className="input mb-3 w-full"
                    disabled={joining}
                  >
                    <option value="">Select a Country</option>
                    {availableCountries.map(country => (
                      <option key={country.id} value={country.id} style={{ color: country.color_hex }}>
                        {country.name}
                      </option>
                    ))}
                  </select>
                  <input
                    type="text"
                    placeholder="Your Nation's Name (e.g., The Glorious Republic of Bananas)"
                    value={nationName}
                    onChange={(e) => setNationName(e.target.value)}
                    className="input mb-3 w-full"
                    disabled={joining}
                  />
                  <input
                    type="text"
                    placeholder="Your Leader's Name (e.g., El Presidente Banana)"
                    value={leaderName}
                    onChange={(e) => setLeaderName(e.target.value)}
                    className="input mb-4 w-full"
                    disabled={joining}
                  />
                  <div className="flex gap-3">
                    <button onClick={handleJoinGame} className="btn-primary flex-1" disabled={joining || !selectedCountry || !nationName.trim() || !leaderName.trim()}>
                      {joining ? <LoadingSpinner size="sm" /> : 'Confirm & Join'}
                    </button>
                     <button onClick={() => setShowJoinForm(false)} className="btn-secondary flex-1" disabled={joining}>
                      Cancel
                    </button>
                  </div>
                </div>
              )}

              {isCurrentUserInGame() && currentUserPlayer && game.status === 'pending' && (
                 <button 
                    onClick={handleToggleReady} 
                    className={`w-full mb-6 ${currentUserPlayer.is_ready ? 'btn-success' : 'btn-warning'}`}
                    disabled={togglingReady}
                  >
                    {togglingReady ? <LoadingSpinner size="sm" /> : (currentUserPlayer.is_ready ? "You're Ready! (Click to Unready)" : "Click to Ready Up!")}
                  </button>
              )}

              {/* Start Game Button for Creator */}
              {canStartGame && (
                <div className="mt-6">
                  <button 
                    onClick={handleStartGame} 
                    className="btn-primary w-full"
                    disabled={startingGame}
                  >
                    {startingGame ? <LoadingSpinner size="sm" /> : "Start Game Now"}
                  </button>
                </div>
              )}

            </div>
          </div>

          {/* Player List */}
          <div className="card">
            <h2 className="text-xl font-semibold text-white mb-4">Players ({game.players?.length || 0}/{game.max_players})</h2>
            <div className="space-y-3">
              {game.players && game.players.length > 0 ? (
                game.players.map((player) => (
                  <div key={player.id} className="flex items-center justify-between gap-3 bg-game-bg rounded-lg p-3">
                    <div className="flex items-center gap-3">
                      <div 
                        className="w-4 h-4 rounded-full border-2 border-gray-600"
                        style={{ backgroundColor: player.color_hex }}
                        title={`Country: ${player.country_name}`}
                      ></div>
                      <div>
                        <p className="text-white font-medium">{player.nation_name}</p>
                        <p className="text-gray-400 text-sm">{player.username}</p>
                      </div>
                    </div>
                    {game.status === 'pending' && (
                       <span className={`px-2 py-1 text-xs rounded-full ${player.is_ready ? 'bg-game-success/30 text-game-success' : 'bg-game-warning/30 text-game-warning'}`}>
                        {player.is_ready ? 'Ready' : 'Not Ready'}
                      </span>
                    )}
                  </div>
                ))
              ) : (
                <p className="text-gray-500">No players have joined yet.</p>
              )}
              {(!game.players || game.players.length < game.max_players) && game.status === 'pending' && (
                <p className="text-gray-500 text-sm pt-2">Waiting for more players...</p>
              )}
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default GameLobby; 