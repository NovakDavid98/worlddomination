const API_BASE = 'http://localhost:3001/api';

export interface Game {
  id: number;
  name: string;
  creator_id: number;
  creator_username: string;
  status: string;
  max_players: number;
  current_players: number;
  turn_duration_hours: number;
  current_turn: number;
  game_phase: string;
  created_at: string;
  players?: Player[];
}

export interface Player {
  id: number;
  user_id: number;
  username: string;
  country_id: number;
  country_name: string;
  color_hex: string;
  nation_name: string;
  leader_name: string;
  is_active: boolean;
  is_ready: boolean;
  reputation_score: number;
}

export interface Country {
  id: number;
  name: string;
  code: string;
  position_x: number;
  position_y: number;
  color_hex: string;
  capital_name: string;
  government_type: string;
  description: string;
}

export interface PlayerResources {
  id: number;
  player_id: number;
  money: number;
  materials: number;
  population: number;
  happiness: number;
  money_per_turn: number;
  materials_per_turn: number;
  population_growth: number;
  updated_at: string;
  last_updated?: string;
}

export interface Building {
  // ... existing code ...
}

class GameApiService {
  private getAuthHeaders(): HeadersInit {
    const token = localStorage.getItem('worldstage_token');
    return {
      'Content-Type': 'application/json',
      'Authorization': token ? `Bearer ${token}` : '',
    };
  }

  async getGames(): Promise<Game[]> {
    const response = await fetch(`${API_BASE}/games`, {
      headers: this.getAuthHeaders(),
    });

    if (!response.ok) {
      throw new Error('Failed to fetch games');
    }

    const data = await response.json();
    return data.games;
  }

  async createGame(name: string, maxPlayers: number = 10): Promise<Game> {
    const response = await fetch(`${API_BASE}/games`, {
      method: 'POST',
      headers: this.getAuthHeaders(),
      body: JSON.stringify({ 
        name, 
        maxPlayers, 
        turnDurationHours: 24 
      }),
    });

    if (!response.ok) {
      throw new Error('Failed to create game');
    }

    const data = await response.json();
    return data.game;
  }

  async getGameDetails(gameId: number): Promise<Game> {
    const response = await fetch(`${API_BASE}/games/${gameId}`, {
      headers: this.getAuthHeaders(),
    });

    if (!response.ok) {
      throw new Error('Failed to fetch game details');
    }

    const data = await response.json();
    return data.game;
  }

  async joinGame(gameId: number, countryId: number, nationName: string, leaderName: string): Promise<Player> {
    const response = await fetch(`${API_BASE}/games/${gameId}/join`, {
      method: 'POST',
      headers: this.getAuthHeaders(),
      body: JSON.stringify({
        countryId,
        nationName,
        leaderName,
      }),
    });

    if (!response.ok) {
      const errorData = await response.json();
      throw new Error(errorData.message || 'Failed to join game');
    }

    const data = await response.json();
    return data.player;
  }

  async getCountries(): Promise<Country[]> {
    const response = await fetch(`${API_BASE}/players/countries`, {
      headers: this.getAuthHeaders(),
    });

    if (!response.ok) {
      throw new Error('Failed to fetch countries');
    }

    const data = await response.json();
    return data.countries;
  }

  async getPlayerGames(): Promise<Game[]> {
    const response = await fetch(`${API_BASE}/players/games`, {
      headers: this.getAuthHeaders(),
    });

    if (!response.ok) {
      throw new Error('Failed to fetch player games');
    }

    const data = await response.json();
    return data.games;
  }

  async getPlayerResources(playerId: number): Promise<PlayerResources> {
    const response = await fetch(`${API_BASE}/players/${playerId}/resources`, {
      headers: this.getAuthHeaders(),
    });

    if (!response.ok) {
      const errorText = await response.text();
      console.error(`Failed to fetch player resources (${response.status}):`, errorText);
      throw new Error(`Failed to fetch player resources: ${response.status} ${errorText}`);
    }

    const data = await response.json();
    return data.resources;
  }

  async getPlayerBuildings(playerId: number): Promise<any[]> {
    const response = await fetch(`${API_BASE}/players/${playerId}/buildings`, {
      headers: this.getAuthHeaders(),
    });

    if (!response.ok) {
      const errorText = await response.text();
      console.error(`Failed to fetch player buildings (${response.status}):`, errorText);
      throw new Error(`Failed to fetch player buildings: ${response.status} ${errorText}`);
    }

    const data = await response.json();
    return data.buildings;
  }

  async constructBuilding(playerId: number, buildingTypeId: string): Promise<any> {
    const response = await fetch(`${API_BASE}/players/${playerId}/buildings`, {
      method: 'POST',
      headers: this.getAuthHeaders(),
      body: JSON.stringify({
        buildingTypeId,
      }),
    });

    if (!response.ok) {
      const errorData = await response.json();
      throw new Error(errorData.message || 'Failed to construct building');
    }

    const data = await response.json();
    return data.building;
  }

  async upgradeBuilding(buildingId: number): Promise<any> {
    const response = await fetch(`${API_BASE}/players/buildings/${buildingId}/upgrade`, {
      method: 'POST',
      headers: this.getAuthHeaders(),
    });

    if (!response.ok) {
      const errorData = await response.json();
      throw new Error(errorData.message || 'Failed to upgrade building');
    }

    const data = await response.json();
    return data.building;
  }

  async getPlayerTechnologies(playerId: number): Promise<any[]> {
    const response = await fetch(`${API_BASE}/players/${playerId}/technologies`, {
      headers: this.getAuthHeaders(),
    });

    if (!response.ok) {
      const errorText = await response.text();
      console.error(`Failed to fetch player technologies (${response.status}):`, errorText);
      throw new Error(`Failed to fetch player technologies: ${response.status} ${errorText}`);
    }

    const data = await response.json();
    return data.technologies;
  }

  async startResearch(playerId: number, technologyId: string): Promise<any> {
    const response = await fetch(`${API_BASE}/players/${playerId}/technologies/research`, {
      method: 'POST',
      headers: this.getAuthHeaders(),
      body: JSON.stringify({
        technologyId,
      }),
    });

    if (!response.ok) {
      const errorData = await response.json();
      throw new Error(errorData.message || 'Failed to start research');
    }

    const data = await response.json();
    return data.technology;
  }

  async togglePlayerReadyStatus(playerId: number): Promise<Player> {
    const response = await fetch(`${API_BASE}/players/${playerId}/ready`, {
      method: 'POST',
      headers: this.getAuthHeaders(),
    });

    if (!response.ok) {
      const errorData = await response.json();
      throw new Error(errorData.message || 'Failed to toggle ready status');
    }

    const data = await response.json();
    return data.player;
  }

  async startGame(gameId: number): Promise<Game> {
    const response = await fetch(`${API_BASE}/games/${gameId}/start`, {
      method: 'POST',
      headers: this.getAuthHeaders(),
    });

    if (!response.ok) {
      const errorData = await response.json();
      throw new Error(errorData.message || 'Failed to start game');
    }

    const data = await response.json();
    return data.game;
  }
}

export const gameApi = new GameApiService(); 