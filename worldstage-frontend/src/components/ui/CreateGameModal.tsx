import React, { useState } from 'react';
import LoadingSpinner from './LoadingSpinner';

interface CreateGameModalProps {
  isOpen: boolean;
  onClose: () => void;
  onCreateGame: (name: string, maxPlayers: number) => Promise<void>;
}

const CreateGameModal: React.FC<CreateGameModalProps> = ({ isOpen, onClose, onCreateGame }) => {
  const [gameName, setGameName] = useState('');
  const [maxPlayers, setMaxPlayers] = useState(10);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    setError('');

    if (!gameName.trim()) {
      setError('Game name is required');
      setLoading(false);
      return;
    }

    if (maxPlayers < 2 || maxPlayers > 10) {
      setError('Max players must be between 2 and 10');
      setLoading(false);
      return;
    }

    try {
      await onCreateGame(gameName.trim(), maxPlayers);
      setGameName('');
      setMaxPlayers(10);
      onClose();
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to create game');
    } finally {
      setLoading(false);
    }
  };

  const handleClose = () => {
    if (!loading) {
      setGameName('');
      setMaxPlayers(10);
      setError('');
      onClose();
    }
  };

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
      <div className="bg-game-surface rounded-xl p-6 max-w-md w-full mx-4 border border-gray-700">
        <h2 className="text-xl font-semibold text-white mb-4">Create New Game</h2>
        
        {error && (
          <div className="bg-game-danger/20 border border-game-danger text-game-danger px-4 py-3 rounded-lg mb-4">
            {error}
          </div>
        )}

        <form onSubmit={handleSubmit} className="space-y-4">
          <div>
            <label htmlFor="gameName" className="block text-sm font-medium text-gray-300 mb-2">
              Game Name
            </label>
            <input
              id="gameName"
              type="text"
              value={gameName}
              onChange={(e) => setGameName(e.target.value)}
              className="input-field w-full"
              placeholder="Enter a memorable game name"
              required
              disabled={loading}
              maxLength={100}
            />
          </div>

          <div>
            <label htmlFor="maxPlayers" className="block text-sm font-medium text-gray-300 mb-2">
              Maximum Players
            </label>
            <select
              id="maxPlayers"
              value={maxPlayers}
              onChange={(e) => setMaxPlayers(parseInt(e.target.value))}
              className="input-field w-full"
              disabled={loading}
            >
              {[2, 3, 4, 5, 6, 7, 8, 9, 10].map(num => (
                <option key={num} value={num}>
                  {num} players
                </option>
              ))}
            </select>
          </div>

          <div className="text-sm text-gray-400 bg-game-bg rounded-lg p-3">
            <p className="font-medium mb-1">Game Settings:</p>
            <p>• Turn Duration: 24 hours</p>
            <p>• Campaign Length: 2-4 weeks</p>
            <p>• Victory Paths: Economic, Military, Cultural, Diplomatic</p>
          </div>

          <div className="flex gap-3 pt-2">
            <button
              type="button"
              onClick={handleClose}
              disabled={loading}
              className="btn-secondary flex-1"
            >
              Cancel
            </button>
            <button
              type="submit"
              disabled={loading}
              className="btn-primary flex-1 flex items-center justify-center"
            >
              {loading ? (
                <>
                  <LoadingSpinner size="sm" className="mr-2" />
                  Creating...
                </>
              ) : (
                'Create Game'
              )}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};

export default CreateGameModal; 