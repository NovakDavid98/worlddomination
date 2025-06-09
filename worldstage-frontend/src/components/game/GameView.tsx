import React, { useState, useEffect, useRef } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { useSocket } from '../../contexts/SocketContext';
import { useAuth } from '../../contexts/AuthContext';
import { gameApi } from '../../services/gameApi';
import type { Game, Country, Player, PlayerResources } from '../../services/gameApi';
import WorldMap from './WorldMap';
import ResourcePanel from './ResourcePanel';
import BuildingsPanel from './BuildingsPanel';
import TechnologyPanel from './TechnologyPanel';
import TurnPanel from './TurnPanel';
import LoadingSpinner from '../ui/LoadingSpinner';

const GameView: React.FC = () => {
  const { gameId } = useParams<{ gameId: string }>();
  const navigate = useNavigate();
  const { socket, connected } = useSocket();
  const { user } = useAuth();
  const [game, setGame] = useState<Game | null>(null);
  const [countries, setCountries] = useState<Country[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [selectedTab, setSelectedTab] = useState<'overview' | 'diplomacy' | 'research' | 'buildings'>('overview');

  const [playerResources, setPlayerResources] = useState<PlayerResources | null>(null);
  const [playerBuildings, setPlayerBuildings] = useState<any[]>([]);
  const [playerTechnologies, setPlayerTechnologies] = useState<any[]>([]);
  const [loadingResources, setLoadingResources] = useState(false);

  const hasJoinedRoomRef = useRef(false);

  // Reset join status if gameId changes
  useEffect(() => {
    hasJoinedRoomRef.current = false;
  }, [gameId]);

  useEffect(() => {
    if (gameId && socket && connected && !hasJoinedRoomRef.current) {
      loadGameData(); // Still load game data
      joinGameRoom();
      hasJoinedRoomRef.current = true;
    } else if (gameId && !socket) {
      // If gameId is present but socket is not yet, still try to load game data.
      // Joining room will be handled once socket connects.
      loadGameData();
    }
  }, [gameId, socket, connected]); // Added socket and connected

  useEffect(() => {
    if (game && getCurrentPlayer()) {
      loadPlayerData();
    }
  }, [game, user]);

  useEffect(() => {
    if (socket && connected) {
      socket.on('game_update', handleGameUpdate);
      socket.on('new_message', handleNewMessage);
      
      return () => {
        socket.off('game_update', handleGameUpdate);
        socket.off('new_message', handleNewMessage);
      };
    }
  }, [socket, connected]);

  const loadGameData = async () => {
    try {
      setLoading(true);
      const [gameData, countriesData] = await Promise.all([
        gameApi.getGameDetails(parseInt(gameId!)),
        gameApi.getCountries()
      ]);
      setGame(gameData);
      setCountries(countriesData);
      setError(null);
    } catch (err) {
      setError('Failed to load game data');
      console.error('Error loading game data:', err);
    } finally {
      setLoading(false);
    }
  };

  const loadPlayerData = async () => {
    const currentPlayer = getCurrentPlayer();
    if (!currentPlayer) return;

    try {
      setLoadingResources(true);
      const [resourcesData, buildingsData, technologiesData] = await Promise.all([
        gameApi.getPlayerResources(currentPlayer.id),
        gameApi.getPlayerBuildings(currentPlayer.id),
        gameApi.getPlayerTechnologies(currentPlayer.id)
      ]);
      
      setPlayerResources(resourcesData);
      setPlayerBuildings(buildingsData);
      setPlayerTechnologies(technologiesData);
    } catch (err) {
      console.error('Error loading player data:', err);
      setError('Failed to load player data');
    } finally {
      setLoadingResources(false);
    }
  };

  const joinGameRoom = () => {
    if (socket && gameId) {
      socket.emit('join_game', parseInt(gameId));
    }
  };

  const handleGameUpdate = (data: any) => {
    console.log('Game update received:', data);
    // Refresh game data when updates occur
    loadGameData();
  };

  const handleNewMessage = (data: any) => {
    console.log('New message received:', data);
    // Handle diplomatic messages
  };

  const handleConstructBuilding = async (buildingTypeId: string) => {
    const currentPlayer = getCurrentPlayer();
    if (!currentPlayer) return;

    try {
      await gameApi.constructBuilding(currentPlayer.id, buildingTypeId);
      // Refresh player data to show the new building and updated resources
      await loadPlayerData();
      // Show success message instead of alert
      console.log(`✅ ${buildingTypeId} construction completed!`);
    } catch (error) {
      console.error('Construction failed:', error);
      setError(error instanceof Error ? error.message : 'Failed to construct building');
    }
  };

  const handleUpgradeBuilding = async (buildingId: number) => {
    try {
      await gameApi.upgradeBuilding(buildingId);
      // Refresh player data to show the upgraded building and updated resources
      await loadPlayerData();
      console.log(`✅ Building upgrade completed!`);
    } catch (error) {
      console.error('Upgrade failed:', error);
      setError(error instanceof Error ? error.message : 'Failed to upgrade building');
    }
  };

  const handleStartResearch = async (technologyId: string) => {
    const currentPlayer = getCurrentPlayer();
    if (!currentPlayer) return;

    try {
      await gameApi.startResearch(currentPlayer.id, technologyId);
      // Refresh player data to show the new research and updated resources
      await loadPlayerData();
      console.log(`🔬 Research started on technology ${technologyId}!`);
    } catch (error) {
      console.error('Research failed:', error);
      setError(error instanceof Error ? error.message : 'Failed to start research');
    }
  };

  const handleEndTurn = () => {
    console.log('Ending turn for current player');
    // TODO: Implement end turn API call
    alert('Turn ended! (Backend implementation needed)');
  };

  const getCurrentPlayer = (): Player | undefined => {
    return game?.players?.find(p => p.user_id === user?.id);
  };

  const handleCountryClick = (country: Country) => {
    console.log('Country clicked:', country);
    // Handle country selection for actions
  };

  const getGamePhaseColor = (phase: string) => {
    switch (phase) {
      case 'foundation': return 'text-game-warning';
      case 'expansion': return 'text-blue-400';
      case 'competition': return 'text-red-400';
      case 'resolution': return 'text-purple-400';
      default: return 'text-gray-400';
    }
  };

  if (loading) {
    return (
      <div className="min-h-screen bg-game-bg flex items-center justify-center">
        <div className="text-center">
          <LoadingSpinner />
          <p className="mt-4 text-game-accent text-lg">Loading world stage...</p>
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
            <p className="text-gray-400 mb-6">The game you're looking for doesn't exist or you don't have access to it.</p>
            <button onClick={() => navigate('/dashboard')} className="btn-primary">
              Back to Dashboard
            </button>
          </div>
        </div>
      </div>
    );
  }

  const currentPlayer = getCurrentPlayer();

  return (
    <div className="min-h-screen bg-game-bg">
      {/* Header */}
      <header className="bg-game-surface border-b border-gray-700">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex justify-between items-center h-16">
            <div className="flex items-center gap-6">
              <div>
                <h1 className="text-xl font-bold text-white">{game.name}</h1>
                <p className="text-sm text-gray-400">
                  Turn {game.current_turn} • Phase: <span className={getGamePhaseColor(game.game_phase)}>{game.game_phase}</span>
                </p>
              </div>
              
              {/* Connection Status */}
              <div className="flex items-center">
                <div className={`w-2 h-2 rounded-full ${connected ? 'bg-game-success' : 'bg-game-danger'}`}></div>
                <span className="ml-2 text-sm text-gray-400">
                  {connected ? 'Connected' : 'Disconnected'}
                </span>
              </div>
            </div>
            
            <div className="flex items-center space-x-4">
              {currentPlayer && (
                <div className="flex items-center gap-2">
                  <div 
                    className="w-3 h-3 rounded-full"
                    style={{ backgroundColor: currentPlayer.color_hex }}
                  ></div>
                  <span className="text-white text-sm">{currentPlayer.nation_name}</span>
                </div>
              )}
              <button
                onClick={() => navigate('/dashboard')}
                className="btn-secondary"
              >
                Exit Game
              </button>
            </div>
          </div>
        </div>
      </header>

      {/* Main Game Interface */}
      <div className="max-w-7xl mx-auto p-4">
        {error && (
          <div className="bg-game-danger/20 border border-game-danger text-game-danger px-4 py-3 rounded-lg mb-6">
            {error}
          </div>
        )}

        <div className="grid grid-cols-1 lg:grid-cols-4 gap-6">
          {/* Main Game Area - World Map */}
          <div className="lg:col-span-3">
            <div className="card">
              <div className="flex items-center justify-between mb-4">
                <h2 className="text-xl font-semibold text-white">World Map</h2>
                <div className="flex bg-game-bg rounded-lg p-1">
                  {(['overview', 'diplomacy', 'research', 'buildings'] as const).map((tab) => (
                    <button
                      key={tab}
                      onClick={() => setSelectedTab(tab)}
                      className={`px-3 py-1 text-sm rounded transition-all capitalize ${
                        selectedTab === tab
                          ? 'bg-game-accent text-white'
                          : 'text-gray-400 hover:text-white'
                      }`}
                    >
                      {tab}
                    </button>
                  ))}
                </div>
              </div>

              {selectedTab === 'overview' && (
                <WorldMap
                  countries={countries}
                  players={game.players}
                  onCountryClick={handleCountryClick}
                  width={800}
                  height={500}
                />
              )}

              {selectedTab === 'buildings' && (
                <div className="bg-game-bg rounded-lg p-4">
                  {playerResources && (
                    <BuildingsPanel
                      buildings={playerBuildings}
                      resources={playerResources}
                      onConstructBuilding={handleConstructBuilding}
                      onUpgradeBuilding={handleUpgradeBuilding}
                    />
                  )}
                </div>
              )}

              {selectedTab === 'diplomacy' && (
                <div className="bg-game-bg rounded-lg p-6 text-center">
                  <div className="text-4xl mb-4">🤝</div>
                  <h3 className="text-white text-lg font-semibold mb-2">Diplomacy System</h3>
                  <p className="text-gray-400">Coming in Phase 3! Send messages, form alliances, and negotiate treaties.</p>
                </div>
              )}

              {selectedTab === 'research' && (
                <div className="bg-game-bg rounded-lg p-4">
                  {playerResources ? (
                    <TechnologyPanel
                      technologies={playerTechnologies}
                      resources={playerResources}
                      onStartResearch={handleStartResearch}
                    />
                  ) : (
                    <div className="text-center py-8">
                      <div className="text-4xl mb-4">🔬</div>
                      <h3 className="text-white text-lg font-semibold mb-2">Research & Technology</h3>
                      <p className="text-gray-400">Loading technology data...</p>
                    </div>
                  )}
                </div>
              )}
            </div>
          </div>

          {/* Sidebar */}
          <div className="space-y-6">
            {/* Resources Panel */}
            {loadingResources ? (
              <div className="card">
                <div className="flex items-center justify-center py-8">
                  <LoadingSpinner size="sm" />
                  <span className="ml-2 text-gray-400">Loading resources...</span>
                </div>
              </div>
            ) : playerResources ? (
              <ResourcePanel resources={playerResources} />
            ) : (
              <div className="card">
                <div className="text-center py-8 text-gray-400">
                  <div className="text-2xl mb-2">⚠️</div>
                  <p>Unable to load resources</p>
                </div>
              </div>
            )}

            {/* Current Player Info */}
            {currentPlayer && (
              <div className="card">
                <h3 className="text-lg font-semibold text-white mb-4">Your Nation</h3>
                <div className="space-y-3">
                  <div className="flex items-center gap-3">
                    <div 
                      className="w-6 h-6 rounded-full"
                      style={{ backgroundColor: currentPlayer.color_hex }}
                    ></div>
                    <div>
                      <p className="text-white font-medium">{currentPlayer.nation_name}</p>
                      <p className="text-gray-400 text-sm">Led by {currentPlayer.leader_name}</p>
                    </div>
                  </div>
                  <div className="bg-game-bg rounded-lg p-3">
                    <div className="flex justify-between text-sm">
                      <span className="text-gray-400">Reputation:</span>
                      <span className="text-game-accent font-medium">{currentPlayer.reputation_score}</span>
                    </div>
                    <div className="flex justify-between text-sm mt-1">
                      <span className="text-gray-400">Country:</span>
                      <span className="text-white">{currentPlayer.country_name}</span>
                    </div>
                  </div>
                </div>
              </div>
            )}

            {/* Other Nations */}
            <div className="card">
              <h3 className="text-lg font-semibold text-white mb-4">Other Nations</h3>
              <div className="space-y-2">
                {game.players?.filter(p => p.user_id !== user?.id).map((player) => (
                  <div key={player.id} className="flex items-center gap-2 bg-game-bg rounded-lg p-2">
                    <div 
                      className="w-3 h-3 rounded-full"
                      style={{ backgroundColor: player.color_hex }}
                    ></div>
                    <div className="flex-1">
                      <p className="text-white text-sm font-medium">{player.nation_name}</p>
                      <p className="text-gray-400 text-xs">{player.username}</p>
                    </div>
                    <button className="text-game-accent hover:text-blue-400 text-xs">
                      Contact
                    </button>
                  </div>
                ))}
              </div>
            </div>

            {/* Turn Panel */}
            <TurnPanel
              currentTurn={game.current_turn}
              gamePhase={game.game_phase}
              turnDurationHours={game.turn_duration_hours}
              onEndTurn={handleEndTurn}
            />
          </div>
        </div>
      </div>
    </div>
  );
};

export default GameView; 