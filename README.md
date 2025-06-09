# WorldStage - World Domination

A strategic multiplayer civilization building game with real-time multiplayer capabilities.

## 🎮 Game Overview

WorldStage is an immersive strategy game where players build and manage civilizations, compete for resources, develop technologies, and engage in diplomatic or military conflicts to achieve world domination.

## 🏗️ Project Structure

```
worlddomination/
├── worldstage-frontend/     # React + TypeScript frontend
├── worldstage-backend/      # Node.js + Express backend
├── package.json             # Root package configuration
└── README.md               # This file
```

## 🚀 Features

- **Real-time Multiplayer**: WebSocket-based real-time game interactions
- **Resource Management**: Collect and manage various resources (food, wood, stone, gold, etc.)
- **Technology Tree**: Research and unlock new technologies
- **Building System**: Construct and upgrade various buildings
- **Turn-based Strategy**: Strategic gameplay with turn management
- **User Authentication**: Secure login and registration system
- **Responsive UI**: Modern, responsive interface built with React and Tailwind CSS

## 🛠️ Tech Stack

### Frontend
- **React 18** with TypeScript
- **Vite** for build tooling
- **Tailwind CSS** for styling
- **Socket.io Client** for real-time communication

### Backend
- **Node.js** with Express
- **TypeScript** for type safety
- **Socket.io** for WebSocket communication
- **JWT** for authentication
- **PostgreSQL** for database (schema included)

## 📦 Installation & Setup

### Prerequisites
- Node.js (v16 or higher)
- npm or yarn
- PostgreSQL database

### Backend Setup
```bash
cd worldstage-backend
npm install
cp env.example .env
# Configure your database and other environment variables in .env
npm run dev
```

### Frontend Setup
```bash
cd worldstage-frontend
npm install
npm run dev
```

### Database Setup
The database schema is included in `worldstage-backend/src/database/schema.sql`. Import this into your PostgreSQL database to set up the required tables.

## 🎯 Game Mechanics

- **Resource Collection**: Gather essential resources to build your civilization
- **Technology Research**: Advance through different technological eras
- **Building Construction**: Build farms, markets, barracks, and more
- **Military Units**: Train armies for defense and conquest
- **Diplomacy**: Form alliances or declare war on other players
- **Victory Conditions**: Multiple paths to victory including military conquest, technological advancement, and economic dominance

## 🤝 Contributing

1. Fork the repository
2. Create a feature branch (`git checkout -b feature/amazing-feature`)
3. Commit your changes (`git commit -m 'Add some amazing feature'`)
4. Push to the branch (`git push origin feature/amazing-feature`)
5. Open a Pull Request

## 📝 License

This project is open source and available under the [MIT License](LICENSE).

## 🔗 Links

- [Repository](https://github.com/NovakDavid98/worlddomination)
- [Issues](https://github.com/NovakDavid98/worlddomination/issues)
- [Development Plan](WorldStage_Development_Plan.md)
- [Game Description](WorldStage:%20Full%20Game%20Description.md)

---

**Ready to dominate the world? Clone this repository and start building your empire!** 🌍👑 