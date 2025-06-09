import { BrowserRouter as Router, Routes, Route, Navigate } from 'react-router-dom';
import Auth from './components/Auth';
import Dashboard from './components/Dashboard';
import GameLobby from './components/game/GameLobby';
import GameView from './components/game/GameView';
import { AuthProvider, useAuth } from './contexts/AuthContext';
import { SocketProvider } from './contexts/SocketContext';
import LoadingSpinner from './components/ui/LoadingSpinner';

function AppContent() {
  const { user, loading } = useAuth();

  if (loading) {
    return (
      <div className="min-h-screen bg-gray-900 flex items-center justify-center">
        <div className="text-center">
          <LoadingSpinner />
          <p className="mt-4 text-blue-400 text-lg">Loading WorldStage...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-900">
      <Routes>
        {/* Authentication route */}
        <Route 
          path="/auth" 
          element={user ? <Navigate to="/dashboard" /> : <Auth />} 
        />
        
        {/* Protected routes */}
        <Route 
          path="/dashboard" 
          element={user ? <Dashboard /> : <Navigate to="/auth" />} 
        />
        <Route 
          path="/game/:gameId/lobby" 
          element={user ? <GameLobby /> : <Navigate to="/auth" />} 
        />
        <Route 
          path="/game/:gameId" 
          element={user ? <GameView /> : <Navigate to="/auth" />} 
        />
        
        {/* Default redirect */}
        <Route 
          path="/" 
          element={<Navigate to={user ? "/dashboard" : "/auth"} />} 
        />
        
        {/* Backward compatibility redirects */}
        <Route 
          path="/login" 
          element={<Navigate to="/auth" />} 
        />
        <Route 
          path="/register" 
          element={<Navigate to="/auth" />} 
        />
      </Routes>
    </div>
  );
}

function App() {
  return (
    <AuthProvider>
      <SocketProvider>
        <Router>
          <AppContent />
        </Router>
      </SocketProvider>
    </AuthProvider>
  );
}

export default App;
