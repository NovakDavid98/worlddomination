import React, { useEffect, useRef, useState } from 'react';
import * as PIXI from 'pixi.js';
import type { Country, Player } from '../../services/gameApi';

interface WorldMapProps {
  countries: Country[];
  players?: Player[];
  onCountryClick?: (country: Country) => void;
  width?: number;
  height?: number;
}

const WorldMap: React.FC<WorldMapProps> = ({
  countries,
  players = [],
  onCountryClick,
  width = 800,
  height = 600
}) => {
  const canvasRef = useRef<HTMLDivElement>(null);
  const appRef = useRef<PIXI.Application | null>(null);
  const [selectedCountry, setSelectedCountry] = useState<Country | null>(null);
  const [isInitialized, setIsInitialized] = useState(false);
  const [initError, setInitError] = useState<string | null>(null);

  useEffect(() => {
    if (!canvasRef.current) return;

    // Clear any existing content
    if (canvasRef.current.firstChild) {
      canvasRef.current.removeChild(canvasRef.current.firstChild);
    }

    // Initialize PIXI application using the new async pattern
    const initPixi = async () => {
      try {
        setInitError(null);
        
        // Create new application instance
        const app = new PIXI.Application();
        
        // Initialize with new API
        await app.init({
          width,
          height,
          backgroundColor: 0x0a1120, // game-bg color
          antialias: true,
        });

        // Store reference
        appRef.current = app;
        
        // Access canvas using the new property (not view)
        if (app.canvas && canvasRef.current) {
          canvasRef.current.appendChild(app.canvas);
        } else {
          throw new Error('Failed to create canvas');
        }

        // Create the map
        createWorldMap(app);
        setIsInitialized(true);
        
      } catch (error) {
        console.error('Failed to initialize PIXI:', error);
        setInitError(error instanceof Error ? error.message : 'Unknown PIXI error');
        setIsInitialized(false);
      }
    };

    initPixi();

    return () => {
      if (appRef.current) {
        try {
          appRef.current.destroy(true, { children: true, texture: true });
          appRef.current = null;
        } catch (e) {
          console.warn('Error destroying PIXI app:', e);
        }
      }
      setIsInitialized(false);
    };
  }, [width, height]);

  useEffect(() => {
    if (appRef.current && isInitialized) {
      // Update the map when countries or players change
      updateMap();
    }
  }, [countries, players, isInitialized]);

  const createWorldMap = (app: PIXI.Application) => {
    if (!app.stage) return;

    // Clear stage
    app.stage.removeChildren();

    // Create a container for the world map
    const worldContainer = new PIXI.Container();
    app.stage.addChild(worldContainer);

    // Draw background (simple ocean)
    const background = new PIXI.Graphics();
    background.rect(0, 0, width, height);
    background.fill(0x1e2d3d); // game-surface color for ocean
    worldContainer.addChild(background);

    // Add grid lines for visual reference
    const grid = new PIXI.Graphics();
    grid.stroke({ color: 0x2d4a73, alpha: 0.3, width: 1 });
    
    // Vertical lines
    for (let x = 0; x <= width; x += 50) {
      grid.moveTo(x, 0);
      grid.lineTo(x, height);
    }
    
    // Horizontal lines
    for (let y = 0; y <= height; y += 50) {
      grid.moveTo(0, y);
      grid.lineTo(width, y);
    }
    
    worldContainer.addChild(grid);

    updateMap();
  };

  const updateMap = () => {
    if (!appRef.current || !appRef.current.stage) return;

    // Clear existing country graphics
    const existingCountries = appRef.current.stage.children.find(
      child => child.name === 'countries'
    );
    if (existingCountries) {
      appRef.current.stage.removeChild(existingCountries);
    }

    // Create countries container
    const countriesContainer = new PIXI.Container();
    countriesContainer.name = 'countries';
    appRef.current.stage.addChild(countriesContainer);

    countries.forEach(country => {
      const countryGraphics = createCountryGraphics(country);
      countriesContainer.addChild(countryGraphics);
    });
  };

  const createCountryGraphics = (country: Country): PIXI.Container => {
    const container = new PIXI.Container();
    container.name = `country-${country.id}`;

    // Calculate position (convert from 0-100 range to canvas coordinates)
    const x = (country.position_x / 100) * width;
    const y = (country.position_y / 100) * height;

    // Check if this country has a player
    const player = players.find(p => p.country_id === country.id);
    const isOccupied = !!player;
    const color = isOccupied ? player!.color_hex : country.color_hex;

    // Country circle
    const countryCircle = new PIXI.Graphics();
    const radius = isOccupied ? 25 : 15;
    
    countryCircle.circle(0, 0, radius);
    countryCircle.fill(parseInt(color.replace('#', '0x')));
    countryCircle.stroke({ color: 0xffffff, alpha: 0.8, width: 2 });

    // Add glow effect for occupied countries
    if (isOccupied) {
      const glow = new PIXI.Graphics();
      glow.circle(0, 0, radius + 8);
      glow.fill({ color: parseInt(color.replace('#', '0x')), alpha: 0.3 });
      container.addChild(glow);
    }

    container.addChild(countryCircle);

    // Country name
    const nameText = new PIXI.Text({
      text: country.name,
      style: {
        fontFamily: 'Inter, sans-serif',
        fontSize: 12,
        fill: 0xffffff,
        align: 'center',
      }
    });
    nameText.anchor.set(0.5, 0);
    nameText.y = radius + 5;
    container.addChild(nameText);

    // Player name (if occupied)
    if (isOccupied && player) {
      const playerText = new PIXI.Text({
        text: player.nation_name || player.username,
        style: {
          fontFamily: 'Inter, sans-serif',
          fontSize: 10,
          fill: 0x4299e1, // game-accent color
          align: 'center',
        }
      });
      playerText.anchor.set(0.5, 0);
      playerText.y = radius + 20;
      container.addChild(playerText);
    }

    // Position the container
    container.x = x;
    container.y = y;

    // Make it interactive
    container.eventMode = 'static';
    container.cursor = 'pointer';

    // Event handlers
    container.on('pointerover', () => {
      countryCircle.tint = 0xdddddd; // Lighten on hover
      setSelectedCountry(country);
    });

    container.on('pointerout', () => {
      countryCircle.tint = 0xffffff; // Reset tint
      setSelectedCountry(null);
    });

    container.on('pointerdown', () => {
      if (onCountryClick) {
        onCountryClick(country);
      }
    });

    return container;
  };

  if (initError) {
    return (
      <div className="w-full h-full flex items-center justify-center bg-game-surface border border-gray-700 rounded-lg" style={{width, height}}>
        <div className="text-center text-red-400">
          <div className="text-2xl mb-2">⚠️</div>
          <div>Map Error: {initError}</div>
          <button 
            onClick={() => window.location.reload()} 
            className="mt-2 text-sm text-game-accent hover:text-blue-400"
          >
            Reload Page
          </button>
        </div>
      </div>
    );
  }

  return (
    <div className="relative">
      {!isInitialized && (
        <div className="w-full h-full flex items-center justify-center bg-game-surface border border-gray-700 rounded-lg" style={{width, height}}>
          <div className="text-white">Loading map...</div>
        </div>
      )}
      <div ref={canvasRef} className="border border-gray-700 rounded-lg overflow-hidden" />
      
      {/* Country info tooltip */}
      {selectedCountry && (
        <div className="absolute top-4 left-4 bg-game-surface border border-gray-700 rounded-lg p-3 max-w-xs">
          <h3 className="text-white font-semibold">{selectedCountry.name}</h3>
          <p className="text-gray-400 text-sm">Capital: {selectedCountry.capital_name}</p>
          <p className="text-gray-400 text-sm">Government: {selectedCountry.government_type}</p>
          {selectedCountry.description && (
            <p className="text-gray-300 text-sm mt-2">{selectedCountry.description}</p>
          )}
          
          {/* Show player info if occupied */}
          {players.find(p => p.country_id === selectedCountry.id) && (
            <div className="mt-2 pt-2 border-t border-gray-600">
              <p className="text-game-accent text-sm font-medium">
                Controlled by: {players.find(p => p.country_id === selectedCountry.id)?.username}
              </p>
            </div>
          )}
        </div>
      )}
    </div>
  );
};

export default WorldMap; 