import React from 'react';
import type { PlayerResources } from '../../services/gameApi';

interface ResourcePanelProps {
  resources: PlayerResources;
  className?: string;
}

const ResourcePanel: React.FC<ResourcePanelProps> = ({ resources, className = '' }) => {
  const resourceItems = [
    {
      name: 'Money',
      value: resources.money,
      icon: '💰',
      color: 'text-yellow-400',
      bgColor: 'bg-yellow-400/10',
      borderColor: 'border-yellow-400/30'
    },
    {
      name: 'Materials', 
      value: resources.materials,
      icon: '🔧',
      color: 'text-orange-400',
      bgColor: 'bg-orange-400/10',
      borderColor: 'border-orange-400/30'
    },
    {
      name: 'Population',
      value: resources.population,
      icon: '👥', 
      color: 'text-blue-400',
      bgColor: 'bg-blue-400/10',
      borderColor: 'border-blue-400/30'
    },
    {
      name: 'Happiness',
      value: `${resources.happiness}%`,
      icon: resources.happiness >= 70 ? '😊' : resources.happiness >= 40 ? '😐' : '😔',
      color: resources.happiness >= 70 ? 'text-green-400' : resources.happiness >= 40 ? 'text-yellow-400' : 'text-red-400',
      bgColor: resources.happiness >= 70 ? 'bg-green-400/10' : resources.happiness >= 40 ? 'bg-yellow-400/10' : 'bg-red-400/10',
      borderColor: resources.happiness >= 70 ? 'border-green-400/30' : resources.happiness >= 40 ? 'border-yellow-400/30' : 'border-red-400/30'
    }
  ];

  const formatNumber = (num: number): string => {
    if (num >= 1000000) {
      return `${(num / 1000000).toFixed(1)}M`;
    } else if (num >= 1000) {
      return `${(num / 1000).toFixed(1)}K`;
    }
    return num.toString();
  };

  return (
    <div className={`card ${className}`}>
      <div className="flex items-center justify-between mb-4">
        <h3 className="text-lg font-semibold text-white">Resources</h3>
        <div className="text-xs text-gray-400">
          Turn {resources.last_updated || 1}
        </div>
      </div>
      
      <div className="grid grid-cols-2 gap-3">
        {resourceItems.map((resource, index) => (
          <div
            key={index}
            className={`${resource.bgColor} ${resource.borderColor} border rounded-lg p-3 transition-all hover:scale-105`}
          >
            <div className="flex items-center gap-2 mb-1">
              <span className="text-lg">{resource.icon}</span>
              <span className="text-sm text-gray-300 font-medium">{resource.name}</span>
            </div>
            <div className={`text-xl font-bold ${resource.color}`}>
              {typeof resource.value === 'number' ? formatNumber(resource.value) : resource.value}
            </div>
          </div>
        ))}
      </div>

      {/* Resource Generation Info */}
      <div className="mt-4 pt-3 border-t border-gray-600">
        <div className="text-xs text-gray-400 space-y-1">
          <div className="flex justify-between">
            <span>💰 Income/Turn:</span>
            <span className="text-green-400">+{formatNumber(resources.money_per_turn || 0)}</span>
          </div>
          <div className="flex justify-between">
            <span>🔧 Production/Turn:</span>
            <span className="text-orange-400">+{formatNumber(resources.materials_per_turn || 0)}</span>
          </div>
          <div className="flex justify-between">
            <span>👥 Growth/Turn:</span>
            <span className="text-blue-400">+{formatNumber(resources.population_growth || 0)}</span>
          </div>
        </div>
      </div>
    </div>
  );
};

export default ResourcePanel; 