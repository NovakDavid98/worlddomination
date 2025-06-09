import React, { useState } from 'react';
import type { PlayerResources } from '../../services/gameApi';

interface Technology {
  id: string;
  name: string;
  description: string;
  icon: string;
  category: 'economic' | 'military' | 'cultural' | 'environmental';
  cost_money: number;
  cost_materials: number;
  research_time: number; // turns
  prerequisites: string[];
  effects: {
    money_bonus?: number;
    materials_bonus?: number;
    population_bonus?: number;
    happiness_bonus?: number;
    building_cost_reduction?: number;
    special_ability?: string;
  };
}

interface PlayerTechnology {
  id: string;
  technology_id: string;
  status: 'available' | 'researching' | 'completed';
  progress: number; // 0-100
  turns_remaining?: number;
}

interface TechnologyPanelProps {
  technologies: PlayerTechnology[];
  resources: PlayerResources;
  onStartResearch: (technologyId: string) => void;
  className?: string;
}

const TECHNOLOGY_TREE: Technology[] = [
  // Economic Technologies
  {
    id: 'advanced_economics',
    name: 'Advanced Economics',
    description: 'Unlock sophisticated economic models and increase money generation',
    icon: '📈',
    category: 'economic',
    cost_money: 1500,
    cost_materials: 300,
    research_time: 3,
    prerequisites: [],
    effects: {
      money_bonus: 25,
      building_cost_reduction: 10,
      special_ability: 'Trade agreements generate 20% more income'
    }
  },
  {
    id: 'industrial_automation',
    name: 'Industrial Automation',
    description: 'Automate production processes for massive efficiency gains',
    icon: '🤖',
    category: 'economic',
    cost_money: 2500,
    cost_materials: 800,
    research_time: 4,
    prerequisites: ['advanced_economics'],
    effects: {
      materials_bonus: 40,
      population_bonus: -200, // Automation reduces jobs
      special_ability: 'Factories produce 50% more materials'
    }
  },
  
  // Military Technologies
  {
    id: 'military_doctrine',
    name: 'Modern Military Doctrine',
    description: 'Advanced military strategies and unit coordination',
    icon: '⚔️',
    category: 'military',
    cost_money: 1200,
    cost_materials: 600,
    research_time: 3,
    prerequisites: [],
    effects: {
      special_ability: 'Military units are 25% more effective'
    }
  },
  {
    id: 'cyber_warfare',
    name: 'Cyber Warfare',
    description: 'Digital espionage and defense capabilities',
    icon: '💻',
    category: 'military',
    cost_money: 2000,
    cost_materials: 400,
    research_time: 4,
    prerequisites: ['military_doctrine'],
    effects: {
      special_ability: 'Can hack enemy buildings to reduce their efficiency'
    }
  },

  // Cultural Technologies
  {
    id: 'mass_media',
    name: 'Mass Media',
    description: 'Broadcast your culture and influence across the globe',
    icon: '📺',
    category: 'cultural',
    cost_money: 1000,
    cost_materials: 200,
    research_time: 2,
    prerequisites: [],
    effects: {
      happiness_bonus: 15,
      special_ability: 'Cultural influence spreads 30% faster'
    }
  },
  {
    id: 'social_networks',
    name: 'Social Networks',
    description: 'Connect your citizens and influence global opinion',
    icon: '🌐',
    category: 'cultural',
    cost_money: 1800,
    cost_materials: 300,
    research_time: 3,
    prerequisites: ['mass_media'],
    effects: {
      happiness_bonus: 20,
      special_ability: 'Can influence other nations happiness by ±5%'
    }
  },

  // Environmental Technologies
  {
    id: 'renewable_energy',
    name: 'Renewable Energy',
    description: 'Clean energy solutions for sustainable development',
    icon: '🌱',
    category: 'environmental',
    cost_money: 1600,
    cost_materials: 500,
    research_time: 3,
    prerequisites: [],
    effects: {
      happiness_bonus: 10,
      building_cost_reduction: 15,
      special_ability: 'Reduces environmental impact of all buildings'
    }
  },
  {
    id: 'climate_engineering',
    name: 'Climate Engineering',
    description: 'Advanced weather control and environmental restoration',
    icon: '🌤️',
    category: 'environmental',
    cost_money: 3000,
    cost_materials: 1000,
    research_time: 5,
    prerequisites: ['renewable_energy'],
    effects: {
      happiness_bonus: 25,
      population_bonus: 500,
      special_ability: 'Can trigger weather events that affect all players'
    }
  }
];

const TechnologyPanel: React.FC<TechnologyPanelProps> = ({
  technologies,
  resources,
  onStartResearch,
  className = ''
}) => {
  const [selectedCategory, setSelectedCategory] = useState<string>('all');

  const getTechnologyStatus = (techId: string): PlayerTechnology | null => {
    return technologies.find(t => t.technology_id === techId) || null;
  };

  const isAvailable = (tech: Technology): boolean => {
    if (tech.prerequisites.length === 0) return true;
    
    return tech.prerequisites.every(prereqId => {
      const prereq = getTechnologyStatus(prereqId);
      return prereq && prereq.status === 'completed';
    });
  };

  const canAfford = (tech: Technology): boolean => {
    return resources.money >= tech.cost_money && resources.materials >= tech.cost_materials;
  };

  const getCategoryColor = (category: string) => {
    switch (category) {
      case 'economic': return 'text-yellow-400 border-yellow-400/30 bg-yellow-400/10';
      case 'military': return 'text-red-400 border-red-400/30 bg-red-400/10';
      case 'cultural': return 'text-pink-400 border-pink-400/30 bg-pink-400/10';
      case 'environmental': return 'text-green-400 border-green-400/30 bg-green-400/10';
      default: return 'text-gray-400 border-gray-400/30 bg-gray-400/10';
    }
  };

  const getCategoryIcon = (category: string) => {
    switch (category) {
      case 'economic': return '💰';
      case 'military': return '⚔️';
      case 'cultural': return '🎭';
      case 'environmental': return '🌍';
      default: return '🔬';
    }
  };

  const formatNumber = (num: number): string => {
    if (num >= 1000) {
      return `${(num / 1000).toFixed(1)}K`;
    }
    return num.toString();
  };

  const filteredTechnologies = selectedCategory === 'all' 
    ? TECHNOLOGY_TREE 
    : TECHNOLOGY_TREE.filter(tech => tech.category === selectedCategory);

  const categories = [
    { id: 'all', name: 'All', icon: '🔬' },
    { id: 'economic', name: 'Economic', icon: '💰' },
    { id: 'military', name: 'Military', icon: '⚔️' },
    { id: 'cultural', name: 'Cultural', icon: '🎭' },
    { id: 'environmental', name: 'Environmental', icon: '🌍' }
  ];

  return (
    <div className={`card ${className}`}>
      {/* Header */}
      <div className="flex items-center justify-between mb-4">
        <h3 className="text-lg font-semibold text-white">Technology Research</h3>
        <div className="text-xs text-gray-400">
          {technologies.filter(t => t.status === 'completed').length} / {TECHNOLOGY_TREE.length} Complete
        </div>
      </div>

      {/* Category Filter */}
      <div className="flex flex-wrap gap-2 mb-4">
        {categories.map(category => (
          <button
            key={category.id}
            onClick={() => setSelectedCategory(category.id)}
            className={`px-3 py-1 text-xs rounded-full transition-all flex items-center gap-1 ${
              selectedCategory === category.id
                ? 'bg-game-accent text-white'
                : 'bg-game-bg text-gray-400 hover:text-white'
            }`}
          >
            <span>{category.icon}</span>
            <span>{category.name}</span>
          </button>
        ))}
      </div>

      {/* Technology Grid */}
      <div className="space-y-3 max-h-96 overflow-y-auto">
        {filteredTechnologies.map(tech => {
          const playerTech = getTechnologyStatus(tech.id);
          const available = isAvailable(tech);
          const affordable = canAfford(tech);
          
          return (
            <div
              key={tech.id}
              className={`border rounded-lg p-3 transition-all ${getCategoryColor(tech.category)} ${
                !available ? 'opacity-50' : ''
              }`}
            >
              {/* Tech Header */}
              <div className="flex items-center justify-between mb-2">
                <div className="flex items-center gap-2">
                  <span className="text-xl">{tech.icon}</span>
                  <div>
                    <h4 className="text-white font-medium">{tech.name}</h4>
                    <p className="text-xs text-gray-400">{tech.description}</p>
                  </div>
                </div>

                {/* Status/Action Button */}
                {playerTech?.status === 'completed' ? (
                  <div className="text-green-400 text-xs font-medium">✅ Complete</div>
                ) : playerTech?.status === 'researching' ? (
                  <div className="text-blue-400 text-xs">
                    <div>🔬 Researching</div>
                    <div>{playerTech.turns_remaining} turns left</div>
                  </div>
                ) : available ? (
                  <button
                    onClick={() => onStartResearch(tech.id)}
                    disabled={!affordable}
                    className={`text-xs px-3 py-1 rounded transition-all ${
                      affordable
                        ? 'btn-primary'
                        : 'bg-gray-600 text-gray-400 cursor-not-allowed'
                    }`}
                  >
                    Research
                  </button>
                ) : (
                  <div className="text-gray-500 text-xs">🔒 Locked</div>
                )}
              </div>

              {/* Research Progress */}
              {playerTech?.status === 'researching' && (
                <div className="mb-2">
                  <div className="w-full bg-gray-700 rounded-full h-2">
                    <div 
                      className="bg-blue-400 h-2 rounded-full transition-all duration-300"
                      style={{ width: `${playerTech.progress}%` }}
                    ></div>
                  </div>
                  <div className="text-xs text-gray-400 mt-1">
                    Progress: {playerTech.progress}%
                  </div>
                </div>
              )}

              {/* Cost */}
              <div className="flex items-center gap-3 text-xs mb-2">
                <div className="flex items-center gap-1">
                  <span>💰</span>
                  <span className={affordable && resources.money >= tech.cost_money ? 'text-yellow-400' : 'text-red-400'}>
                    {formatNumber(tech.cost_money)}
                  </span>
                </div>
                <div className="flex items-center gap-1">
                  <span>🔧</span>
                  <span className={affordable && resources.materials >= tech.cost_materials ? 'text-orange-400' : 'text-red-400'}>
                    {formatNumber(tech.cost_materials)}
                  </span>
                </div>
                <div className="flex items-center gap-1">
                  <span>⏱️</span>
                  <span className="text-gray-300">{tech.research_time} turns</span>
                </div>
              </div>

              {/* Prerequisites */}
              {tech.prerequisites.length > 0 && (
                <div className="mb-2">
                  <div className="text-xs text-gray-500 mb-1">Requires:</div>
                  <div className="flex flex-wrap gap-1">
                    {tech.prerequisites.map(prereqId => {
                      const prereqTech = TECHNOLOGY_TREE.find(t => t.id === prereqId);
                      const prereqStatus = getTechnologyStatus(prereqId);
                      const isCompleted = prereqStatus?.status === 'completed';
                      
                      return (
                        <span
                          key={prereqId}
                          className={`text-xs px-2 py-1 rounded ${
                            isCompleted ? 'bg-green-400/20 text-green-400' : 'bg-red-400/20 text-red-400'
                          }`}
                        >
                          {prereqTech?.name || prereqId}
                        </span>
                      );
                    })}
                  </div>
                </div>
              )}

              {/* Effects */}
              <div className="text-xs">
                <div className="text-gray-500 mb-1">Effects:</div>
                <div className="grid grid-cols-2 gap-1">
                  {tech.effects.money_bonus && (
                    <div className="flex items-center gap-1">
                      <span>💰</span>
                      <span className="text-yellow-400">+{tech.effects.money_bonus}%</span>
                    </div>
                  )}
                  {tech.effects.materials_bonus && (
                    <div className="flex items-center gap-1">
                      <span>🔧</span>
                      <span className="text-orange-400">+{tech.effects.materials_bonus}%</span>
                    </div>
                  )}
                  {tech.effects.population_bonus && (
                    <div className="flex items-center gap-1">
                      <span>👥</span>
                      <span className={tech.effects.population_bonus > 0 ? 'text-blue-400' : 'text-red-400'}>
                        {tech.effects.population_bonus > 0 ? '+' : ''}{formatNumber(tech.effects.population_bonus)}
                      </span>
                    </div>
                  )}
                  {tech.effects.happiness_bonus && (
                    <div className="flex items-center gap-1">
                      <span>😊</span>
                      <span className="text-green-400">+{tech.effects.happiness_bonus}%</span>
                    </div>
                  )}
                  {tech.effects.building_cost_reduction && (
                    <div className="flex items-center gap-1">
                      <span>🏗️</span>
                      <span className="text-purple-400">-{tech.effects.building_cost_reduction}% cost</span>
                    </div>
                  )}
                </div>
                {tech.effects.special_ability && (
                  <div className="mt-2 p-2 bg-game-bg rounded text-game-accent">
                    <span className="text-purple-400">🌟 Special:</span> {tech.effects.special_ability}
                  </div>
                )}
              </div>
            </div>
          );
        })}
      </div>
    </div>
  );
};

export default TechnologyPanel; 