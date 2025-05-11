# Twitter Dashboard

A modern Twitter-like social media dashboard built with GraphQL, Neo4j, and vanilla JavaScript. This application allows users to create posts, follow other users, search for tweets and users, and maintain a personalized feed.

## 🏗️ Tech Stack

- **Frontend**: Vanilla JavaScript 
- **Backend**: GraphQL API with Apollo Server
- **Database**: Neo4j graph database

## 📋 Prerequisites

Before you begin, ensure you have the following installed:

- [Node.js](https://nodejs.org/) (v14 or higher)
- [Neo4j Desktop](https://neo4j.com/download/) or Neo4j instance

## 🚀 Quick Start

### 1. Clone the Repository

```bash
git clone https://github.com/noob-master-cell/twitter-dashboard.git
cd twitter-dashboard
```

### 2. Database Setup

1. Install and start Neo4j Desktop
2. Create a new project and start a database instance
3. Set the database password (default: `twitter123`)
4. Restore the provided database dump:
   ```bash
   neo4j-admin load --from=data/twitter-v2-50.dump
   ```

### 3. Backend Setup

1. Navigate to the root directory and install dependencies:
   ```bash
   npm install
   ```

2. Create a `.env` file (if not already present):
   ```env
   NEO4J_URI=bolt://localhost:7687
   NEO4J_USER=neo4j
   NEO4J_PASSWORD=YOUR_PASSWORD
   NEO4J_DATABASE=neo4j
   ```

3. Start the GraphQL server:
   ```bash
   cd twitter-dashboard\graphql
   npm start
   ```

   The GraphQL server will start at `http://localhost:4000`

### 4. Start frontend

```bash
cd code/frontend
npx serve .
```

## 📁 Project Structure

```
twitter-v2/
├── code/frontend/          # Frontend JavaScript modules
│   ├── api.js             # GraphQL API handlers
│   ├── app.js             # Main application logic
│   ├── events.js          # Event handling
│   ├── feed.js            # Feed management
│   ├── index.html         # Main HTML file
│   ├── styles.css         # Application styles
│   ├── ui.js              # UI rendering functions
│   └── utils.js           # Utility functions
├── data/                   # Database dumps
│   └── twitter-v2-50.dump # Sample data
├── .env                   # Environment variables
├── index.js               # Server entry point
├── package.json           # Dependencies
├── README.md              # This file
└── schema.graphql         # GraphQL schema definition
```

## 🔧 Configuration

### Environment Variables

| Variable | Description | Default |
|----------|-------------|---------|
| `NEO4J_URI` | Neo4j connection URI | `bolt://localhost:7687` |
| `NEO4J_USER` | Neo4j username | `neo4j` |
| `NEO4J_PASSWORD` | Neo4j password | `YOUR_PASSWORD` |
| `NEO4J_DATABASE` | Neo4j database name | `neo4j` |

## 🎯 Features

- **User Authentication**: Login and signup functionality
- **Profile Management**: Update profile information and profile picture
- **Tweet Creation**: Post tweets with timestamps
- **Search**: Search for users and tweets
- **Feed**: Personalized feed showing tweets from followed users
- **Responsive Design**: Works on desktop and mobile devices

## 🔌 API Endpoints

The GraphQL API runs on `http://localhost:4000` and includes the following main operations:

### Queries
- `users`: Get users with various filters
- `tweets`: Search for tweets
- `me`: Get current user data
- `userByScreenName`: Get specific user by screen name

### Mutations
- `createUsers`: Create new users
- `updateUsers`: Update user profiles
- `createTweet`: Post new tweets
- `deleteUsers`: Delete users (admin)
