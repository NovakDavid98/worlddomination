# WorldStage Development Plan

## Overview
This plan breaks down WorldStage development into 5 main phases, each building upon the previous one. We'll start with core infrastructure and basic gameplay, then add complexity progressively.

## Technology Stack Summary

**Backend:**
- Node.js + Express.js (API and game logic)
- Socket.io (real-time multiplayer communication)
- PostgreSQL (persistent game data)
- Redis (session management and caching)
- node-cron (scheduled tasks for time-based progression)

**Frontend:**
- React 18 (UI framework)
- Pixi.js (2D graphics and animations)
- Socket.io-client (real-time communication)
- Tailwind CSS (styling)
- React Router (navigation)

**Audio:**
- Howler.js (simple, powerful audio library)
- Web Audio API (for advanced effects)

**Development Tools:**
- Vite (build tool)
- TypeScript (type safety)
- ESLint + Prettier (code quality)

---

## Phase 1: Core Infrastructure & Basic Game Loop (Week 1-2)

### 1.1 Project Setup & Database Design ✅ COMPLETED
**Goal:** Set up development environment and core database schema

**Tasks:**
- [x] Initialize React + Vite project with TypeScript
- [x] Set up Node.js backend with Express
- [x] Design and implement PostgreSQL database schema
- [x] Set up Redis for session management
- [x] Create basic authentication system (register/login) - *Has TypeScript linter issues to resolve*
- [x] Implement Socket.io for real-time connections
- [x] Create `src/database/schema.sql` with comprehensive PostgreSQL schema.
- [x] Create `env.example` with environment variable configurations.
- [x] Create `src/index.ts` as the main server entry point.
- [x] Create `src/middleware/auth.ts` for JWT authentication.
- [x/o] Create `src/routes/auth.ts` for user registration, login, and profile (JWT type errors fixed).
- [x] Create `src/controllers/socketController.ts` for Socket.io event handling.
- [x/o] Create `src/routes/games.ts` for game management (Express route handler types fixed).
- [x/o] Create `src/routes/players.ts` for player-related actions (Express route handler types fixed).
- [x] Install `@types/pg`.
- [x] Resolve all TypeScript linter errors in the backend.
- [x] Successfully build the backend (`npm run build`).
- [x] Start backend development server (`npm run dev`).

**Database Tables:**
```sql
-- Core tables for Phase 1
users, games, players, countries, resources, buildings, technologies
```

**Completed:**
- ✅ Frontend project initialized with Tailwind CSS and game-themed styling
- ✅ Backend project created with proper TypeScript configuration
- ✅ Comprehensive database schema completed with 10 default countries and building/tech types
- ✅ Authentication routes created (TypeScript compatibility issues to resolve later)
- ✅ Socket.io controller implemented with real-time multiplayer support
- ✅ Basic game and player routes created
- ✅ React app structure with routing, authentication context, and socket context
- ✅ Beautiful login/register components with game-themed UI
- ✅ Dashboard component with placeholder game listings
- ✅ Development servers ready to run

**Next Steps:**
    *   Thoroughly test the existing backend API endpoints (auth, game creation, fetching game/player data) using a tool like Postman or by integrating them into the frontend.
    *   Implement the basic Pixi.js world map rendering in `worldstage-frontend/src/components/game/WorldMap.tsx`.
    *   Develop the `worldstage-frontend/src/components/game/GameLobby.tsx` component to display game details, player list, and allow players to select a country and signal readiness.
    *   Connect the `GameLobby` to the backend to fetch game state and update player status.
    *   Implement logic for the game creator to start the game from the lobby.

### 1.2 Basic Game Creation & World Map ✅ COMPLETED
**Goal:** Players can create/join games and see a simple world map

**Tasks:**
- [x] Game creation and lobby system
- [x] Basic 2D world map with Pixi.js
- [x] Country selection and player assignment
- [x] Simple resource display (money, materials, population)
- [x] Basic building placement system (placeholder)

**Completed:**
- ✅ CreateGameModal component with game creation functionality
- ✅ Updated Dashboard with real game data and API integration
- ✅ GameLobby with country selection, player list, and join functionality
- ✅ WorldMap component using Pixi.js with interactive countries
- ✅ GameView with world map display and resource management interface
- ✅ Real-time Socket.io integration for multiplayer updates
- ✅ Professional game UI with country colors, player assignments, and tooltips
- ✅ Game API service for all backend communication

**Deliverable:** ✅ Players can create a game, select countries, and see their nation on a world map

**Next:** Phase 1.3 - Turn-Based Time System

### 1.3 Turn-Based Time System
**Goal:** Implement asynchronous turn progression

**Tasks:**
- [ ] Turn timer system (24-48 hour turns)
- [ ] Action queuing for players
- [ ] Basic notification system
- [ ] Turn transition logic
- [ ] Simple AI placeholder for inactive players

**Deliverable:** Game progresses through turns automatically, players get notifications

---

## Phase 2: Core Gameplay Mechanics (Week 3-4)

### 2.1 Resource Management & Buildings
**Goal:** Complete economic foundation

**Tasks:**
- [ ] Resource generation algorithms
- [ ] Building construction system with real-time delays
- [ ] Population growth and happiness mechanics
- [ ] Basic economic calculations (GDP, production)
- [ ] Resource trading between players

**Building Types:**
- Factory (economic output)
- School (research boost)
- Barracks (military training)
- Cultural Center (cultural influence)

### 2.2 Research & Technology Tree
**Goal:** Technology progression over real days

**Tasks:**
- [ ] Technology tree design and implementation
- [ ] Research progress tracking (1-5 real days per tech)
- [ ] Technology effects on gameplay
- [ ] Collaborative research mechanics
- [ ] Technology trading system

### 2.3 Basic Diplomacy System
**Goal:** Player communication and simple agreements

**Tasks:**
- [ ] In-game messaging system
- [ ] Trade proposal system
- [ ] Simple alliance mechanics
- [ ] Reputation tracking
- [ ] Basic treaty system

**Deliverable:** Players can manage resources, research technologies, and make basic diplomatic agreements

---

## Phase 3: Advanced Gameplay & Visual Polish (Week 5-6)

### 3.1 Military & Conflict System
**Goal:** Add strategic conflict mechanics

**Tasks:**
- [ ] Military unit system
- [ ] Combat resolution algorithms
- [ ] Territory control mechanics
- [ ] Defensive structures
- [ ] Coalition warfare basics

### 3.2 Cultural Influence & Soft Power
**Goal:** Non-military victory path

**Tasks:**
- [ ] Cultural influence spread algorithms
- [ ] Media and entertainment systems
- [ ] International festivals and events
- [ ] Tourism mechanics
- [ ] Cultural victory conditions

### 3.3 Enhanced Visual Design
**Goal:** Professional game aesthetics

**Tasks:**
- [ ] Improved map graphics and animations
- [ ] Particle effects for actions
- [ ] Smooth UI transitions
- [ ] Resource counter animations
- [ ] Building construction animations
- [ ] Achievement notification system

**Deliverable:** Complete core gameplay loop with all victory paths and polished visuals

---

## Phase 4: Global Events & Dynamic Content (Week 7-8)

### 4.1 Event System & Crisis Management
**Goal:** Dynamic world events that reshape gameplay

**Tasks:**
- [ ] Random event generation system
- [ ] Crisis response mechanics
- [ ] Global cooperation scenarios
- [ ] Economic boom/crash events
- [ ] Natural disaster responses
- [ ] Pandemic simulation

### 4.2 Gemini LLM Integration
**Goal:** Humorous commentary and dynamic storytelling

**Tasks:**
- [ ] Gemini API integration
- [ ] Action commentary system
- [ ] Event narration with humor
- [ ] Interactive advisor system
- [ ] Dynamic news generation
- [ ] Player action analysis

### 4.3 Advanced Diplomacy
**Goal:** Complex international relations

**Tasks:**
- [ ] International organizations
- [ ] Global policy voting
- [ ] Sanction systems
- [ ] Trade war mechanics
- [ ] Peacekeeping operations

**Deliverable:** Rich, dynamic world with AI-driven events and commentary

---

## Phase 5: Polish, Optimization & Advanced Features (Week 9-10)

### 5.1 Audio Implementation
**Goal:** Simple but effective audio feedback

**Audio Strategy:**
- Use **Howler.js** for simplicity and cross-browser compatibility
- Focus on essential audio feedback rather than complex soundscapes

**Tasks:**
- [ ] Set up Howler.js audio system
- [ ] Implement core sound effects:
  - Building construction complete
  - Resource gain notifications
  - Diplomatic message received
  - Technology research complete
  - Military action sounds
  - Achievement unlocked
- [ ] Background ambient music (optional, toggleable)
- [ ] Audio settings and volume controls
- [ ] Sound effect priority system (prevent audio spam)

### 5.2 Advanced UI/UX
**Goal:** Premium game feel

**Tasks:**
- [ ] Loading screens with game lore
- [ ] Comprehensive settings panel
- [ ] Keyboard shortcuts
- [ ] Mobile-responsive design
- [ ] Accessibility features
- [ ] Tutorial and onboarding system

### 5.3 Performance & Optimization
**Goal:** Smooth experience for 10 concurrent players

**Tasks:**
- [ ] Database query optimization
- [ ] Redis caching strategy
- [ ] Frontend performance optimization
- [ ] Socket.io connection management
- [ ] Memory leak prevention
- [ ] Mobile performance optimization

### 5.4 Advanced Features
**Goal:** Long-term engagement

**Tasks:**
- [ ] Espionage and intelligence system
- [ ] Environmental mechanics (pollution, climate)
- [ ] Advanced economic simulation
- [ ] Replay system and game statistics
- [ ] Community features and forums

**Deliverable:** Complete, polished game ready for players

---

## Audio Implementation Details

### Simple Audio Solution with Howler.js

**Why Howler.js:**
- Lightweight (~15KB)
- Cross-browser compatibility
- Simple API
- Automatic format selection
- Built-in caching

**Audio Categories:**
1. **UI Feedback:** Button clicks, menu transitions
2. **Game Actions:** Building construction, research completion
3. **Notifications:** Diplomatic messages, crisis alerts
4. **Ambient:** Subtle background music (optional)

**Implementation Plan:**
```javascript
// Simple audio manager
class AudioManager {
  constructor() {
    this.sounds = {
      buttonClick: new Howl({ src: ['sounds/click.mp3'] }),
      buildingComplete: new Howl({ src: ['sounds/construction.mp3'] }),
      notification: new Howl({ src: ['sounds/notification.mp3'] }),
      achievement: new Howl({ src: ['sounds/achievement.mp3'] })
    };
  }
  
  play(soundName) {
    if (this.sounds[soundName]) {
      this.sounds[soundName].play();
    }
  }
}
```

---

## Development Workflow

### Daily Development Process:
1. **Morning:** Review previous day's work, plan daily tasks
2. **Core Work:** Focus on current phase tasks
3. **Testing:** Test new features with multiple browser tabs (simulate multiplayer)
4. **Evening:** Commit progress, update plan if needed

### Testing Strategy:
- **Local Testing:** Multiple browser tabs for multiplayer simulation
- **Database Testing:** Automated tests for game logic
- **Real-time Testing:** Socket.io connection stress testing
- **User Testing:** Friends/family test sessions for feedback

### Deployment Strategy:
- **Development:** Local environment
- **Staging:** Heroku or similar for testing
- **Production:** Cloud deployment when ready

---

## Success Metrics for Each Phase

**Phase 1:** ✅ Players can create games and see basic world map
**Phase 2:** Complete game loop with economic and diplomatic mechanics
**Phase 3:** All victory conditions working with polished visuals
**Phase 4:** Dynamic events and AI commentary enhancing experience
**Phase 5:** Professional-quality game ready for extended testing

---

## Next Steps

1. **Start backend server and test authentication flow**
2. **Set up PostgreSQL database and run schema**
3. **Test full registration/login process**
4. **Begin Phase 1.2: Game creation and world map**
5. **Implement basic Pixi.js world map**

Let's continue coding! Next priority: Database setup and authentication testing. 

**Next Steps:**
*   Thoroughly test the existing backend API endpoints (auth, game creation, fetching game/player data) using a tool like Postman or by integrating them into the frontend.
*   Implement the basic Pixi.js world map rendering in `worldstage-frontend/src/components/game/WorldMap.tsx`.
*   Develop the `worldstage-frontend/src/components/game/GameLobby.tsx` component to display game details, player list, and allow players to select a country and signal readiness.
*   Connect the `GameLobby` to the backend to fetch game state and update player status.
*   Implement logic for the game creator to start the game from the lobby.