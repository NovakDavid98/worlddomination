import React, { useState } from 'react';
import type { PlayerResources } from '../../services/gameApi';

interface Building {
  id: number;
  name: string;
  description: string;
  icon: string;
  cost_money: number;
  cost_materials: number;
  level: number;
  max_level: number;
  money_per_turn: number;
  materials_per_turn: number;
  population_bonus: number;
  happiness_bonus: number;
}

interface BuildingType {
  id: string;
  name: string;
  description: string;
  icon: string;
  base_cost_money: number;
  base_cost_materials: number;
  money_per_turn: number;
  materials_per_turn: number;
  population_bonus: number;
  happiness_bonus: number;
  category: 'economic' | 'military' | 'research' | 'cultural';
}

interface BuildingsPanelProps {
  buildings: Building[];
  resources: PlayerResources;
  onConstructBuilding: (buildingTypeId: string) => void;
  onUpgradeBuilding: (buildingId: number) => void;
  className?: string;
}

const BUILDING_TYPES: BuildingType[] = [
  {
    id: 'factory',
    name: 'Factory',
    description: 'Produces money and materials for your economy',
    icon: '🏭',
    base_cost_money: 1000,
    base_cost_materials: 500,
    money_per_turn: 200,
    materials_per_turn: 100,
    population_bonus: 50,
    happiness_bonus: -5,
    category: 'economic'
  },
  {
    id: 'barracks',
    name: 'Barracks', 
    description: 'Train military units and boost defense',
    icon: '🏰',
    base_cost_money: 800,
    base_cost_materials: 600,
    money_per_turn: 0,
    materials_per_turn: 50,
    population_bonus: 30,
    happiness_bonus: 10,
    category: 'military'
  },
  {
    id: 'university',
    name: 'University',
    description: 'Research new technologies and innovations',
    icon: '🎓',
    base_cost_money: 1200,
    base_cost_materials: 400,
    money_per_turn: 50,
    materials_per_turn: 0,
    population_bonus: 100,
    happiness_bonus: 15,
    category: 'research'
  },
  {
    id: 'cultural_center',
    name: 'Cultural Center',
    description: 'Boost happiness and cultural influence',
    icon: '🎭',
    base_cost_money: 900,
    base_cost_materials: 300,
    money_per_turn: 100,
    materials_per_turn: 0,
    population_bonus: 20,
    happiness_bonus: 25,
    category: 'cultural'
  }
];

const BuildingsPanel: React.FC<BuildingsPanelProps> = ({
  buildings,
  resources,
  onConstructBuilding,
  onUpgradeBuilding,
  className = ''
}) => {
  const [selectedTab, setSelectedTab] = useState<'owned' | 'construct'>('owned');

  const canAfford = (money: number, materials: number): boolean => {
    return resources.money >= money && resources.materials >= materials;
  };

  const getCategoryColor = (category: string) => {
    switch (category) {
      case 'economic': return 'text-yellow-400 border-yellow-400/30 bg-yellow-400/10';
      case 'military': return 'text-red-400 border-red-400/30 bg-red-400/10';
      case 'research': return 'text-purple-400 border-purple-400/30 bg-purple-400/10';
      case 'cultural': return 'text-pink-400 border-pink-400/30 bg-pink-400/10';
      default: return 'text-gray-400 border-gray-400/30 bg-gray-400/10';
    }
  };

  const formatNumber = (num: number): string => {
    if (num >= 1000) {
      return `${(num / 1000).toFixed(1)}K`;
    }
    return num.toString();
  };

  return (
    <div className={`card ${className}`}>
      {/* Header with tabs */}
      <div className="flex items-center justify-between mb-4">
        <h3 className="text-lg font-semibold text-white">Buildings</h3>
        <div className="flex bg-game-bg rounded-lg p-1">
          <button
            onClick={() => setSelectedTab('owned')}
            className={`px-3 py-1 text-sm rounded transition-all ${
              selectedTab === 'owned'
                ? 'bg-game-accent text-white'
                : 'text-gray-400 hover:text-white'
            }`}
          >
            Owned ({buildings.length})
          </button>
          <button
            onClick={() => setSelectedTab('construct')}
            className={`px-3 py-1 text-sm rounded transition-all ${
              selectedTab === 'construct'
                ? 'bg-game-accent text-white'
                : 'text-gray-400 hover:text-white'
            }`}
          >
            Construct
          </button>
        </div>
      </div>

      {/* Content */}
      <div className="space-y-3 max-h-96 overflow-y-auto">
        {selectedTab === 'owned' ? (
          // Owned Buildings
          buildings.length > 0 ? (
            buildings.map((building) => (
              <div
                key={building.id}
                className="bg-game-bg border border-gray-600 rounded-lg p-3 hover:border-game-accent/50 transition-all"
              >
                <div className="flex items-center justify-between mb-2">
                  <div className="flex items-center gap-2">
                    <span className="text-xl">{building.icon}</span>
                    <div>
                      <h4 className="text-white font-medium">{building.name}</h4>
                      <p className="text-xs text-gray-400">Level {building.level}/{building.max_level}</p>
                    </div>
                  </div>
                  {building.level < building.max_level && (
                    <button
                      onClick={() => onUpgradeBuilding(building.id)}
                      className="btn-secondary text-xs px-2 py-1"
                    >
                      Upgrade
                    </button>
                  )}
                </div>
                
                <div className="grid grid-cols-2 gap-2 text-xs">
                  {building.money_per_turn > 0 && (
                    <div className="flex items-center gap-1">
                      <span>💰</span>
                      <span className="text-yellow-400">+{formatNumber(building.money_per_turn)}/turn</span>
                    </div>
                  )}
                  {building.materials_per_turn > 0 && (
                    <div className="flex items-center gap-1">
                      <span>🔧</span>
                      <span className="text-orange-400">+{formatNumber(building.materials_per_turn)}/turn</span>
                    </div>
                  )}
                  {building.population_bonus > 0 && (
                    <div className="flex items-center gap-1">
                      <span>👥</span>
                      <span className="text-blue-400">+{formatNumber(building.population_bonus)}</span>
                    </div>
                  )}
                  {building.happiness_bonus !== 0 && (
                    <div className="flex items-center gap-1">
                      <span>😊</span>
                      <span className={building.happiness_bonus > 0 ? 'text-green-400' : 'text-red-400'}>
                        {building.happiness_bonus > 0 ? '+' : ''}{building.happiness_bonus}%
                      </span>
                    </div>
                  )}
                </div>
              </div>
            ))
          ) : (
            <div className="text-center py-8 text-gray-400">
              <div className="text-4xl mb-2">🏗️</div>
              <p>No buildings constructed yet</p>
              <p className="text-xs mt-1">Switch to Construct tab to build your first building!</p>
            </div>
          )
        ) : (
          // Construction Options
          BUILDING_TYPES.map((buildingType) => (
            <div
              key={buildingType.id}
              className={`border rounded-lg p-3 transition-all hover:scale-105 ${getCategoryColor(buildingType.category)}`}
            >
              <div className="flex items-center justify-between mb-2">
                <div className="flex items-center gap-2">
                  <span className="text-xl">{buildingType.icon}</span>
                  <div>
                    <h4 className="text-white font-medium">{buildingType.name}</h4>
                    <p className="text-xs text-gray-400">{buildingType.description}</p>
                  </div>
                </div>
                <button
                  onClick={() => onConstructBuilding(buildingType.id)}
                  disabled={!canAfford(buildingType.base_cost_money, buildingType.base_cost_materials)}
                  className={`text-xs px-3 py-1 rounded transition-all ${
                    canAfford(buildingType.base_cost_money, buildingType.base_cost_materials)
                      ? 'btn-primary'
                      : 'bg-gray-600 text-gray-400 cursor-not-allowed'
                  }`}
                >
                  Build
                </button>
              </div>
              
              {/* Cost */}
              <div className="flex items-center gap-3 text-xs mb-2">
                <div className="flex items-center gap-1">
                  <span>💰</span>
                  <span className={canAfford(buildingType.base_cost_money, 0) ? 'text-yellow-400' : 'text-red-400'}>
                    {formatNumber(buildingType.base_cost_money)}
                  </span>
                </div>
                <div className="flex items-center gap-1">
                  <span>🔧</span>
                  <span className={canAfford(0, buildingType.base_cost_materials) ? 'text-orange-400' : 'text-red-400'}>
                    {formatNumber(buildingType.base_cost_materials)}
                  </span>
                </div>
              </div>

              {/* Benefits */}
              <div className="grid grid-cols-2 gap-1 text-xs">
                {buildingType.money_per_turn > 0 && (
                  <div className="flex items-center gap-1">
                    <span>💰</span>
                    <span className="text-yellow-400">+{formatNumber(buildingType.money_per_turn)}/turn</span>
                  </div>
                )}
                {buildingType.materials_per_turn > 0 && (
                  <div className="flex items-center gap-1">
                    <span>🔧</span>
                    <span className="text-orange-400">+{formatNumber(buildingType.materials_per_turn)}/turn</span>
                  </div>
                )}
                {buildingType.population_bonus > 0 && (
                  <div className="flex items-center gap-1">
                    <span>👥</span>
                    <span className="text-blue-400">+{formatNumber(buildingType.population_bonus)}</span>
                  </div>
                )}
                {buildingType.happiness_bonus !== 0 && (
                  <div className="flex items-center gap-1">
                    <span>😊</span>
                    <span className={buildingType.happiness_bonus > 0 ? 'text-green-400' : 'text-red-400'}>
                      {buildingType.happiness_bonus > 0 ? '+' : ''}{buildingType.happiness_bonus}%
                    </span>
                  </div>
                )}
              </div>
            </div>
          ))
        )}
      </div>
    </div>
  );
};

export default BuildingsPanel; 