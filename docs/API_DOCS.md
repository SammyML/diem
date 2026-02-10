# Diem API Documentation

Complete REST API and WebSocket reference for the Diem virtual world.

## Base URL

```
http://localhost:3000
```

## Authentication

Most endpoints require a session token obtained from the `/agent/enter` endpoint.

Include the session token in request bodies:
```json
{
  "sessionToken": "your-session-token-here"
}
```

## REST API Endpoints

### Health Check

#### `GET /health`

Check server status.

**Response:**
```json
{
  "status": "ok",
  "timestamp": 1234567890
}
```

---

### World State

#### `GET /world/state`

Get current world state overview.

**Response:**
```json
{
  "locations": [...],
  "agentCount": 5,
  "economicStats": {
    "totalMonInCirculation": 1000,
    "totalMonEarned": 500,
    "totalMonSpent": 100,
    "totalTrades": 25,
    "totalResourcesGathered": 150,
    "totalItemsCrafted": 30
  },
  "startTime": 1234567890,
  "lastUpdate": 1234567900
}
```

---

### Locations

#### `GET /world/locations`

List all locations in the world.

**Response:**
```json
[
  {
    "id": "market_square",
    "name": "Market Square",
    "description": "The bustling heart...",
    "capacity": 20,
    "currentOccupancy": 3,
    "resources": [],
    "connectedTo": ["mining_caves", "forest", "tavern", "workshop"],
    "properties": {
      "isSafeZone": true,
      "allowsTrading": true
    }
  }
]
```

#### `GET /world/locations/:locationId`

Get specific location details.

**Parameters:**
- `locationId` (path): Location identifier

**Response:**
```json
{
  "id": "mining_caves",
  "name": "Mining Caves",
  "currentOccupancy": 2,
  "resources": [
    {
      "type": "ore",
      "amount": 85,
      "maxAmount": 100,
      "regenerationRate": 10
    }
  ]
}
```

---

### Events

#### `GET /world/events`

Get recent world events.

**Query Parameters:**
- `limit` (optional): Number of events to return (default: 50)

**Response:**
```json
[
  {
    "id": "event-uuid",
    "timestamp": 1234567890,
    "type": "RESOURCE_GATHERED",
    "agentId": "agent-uuid",
    "locationId": "mining_caves",
    "description": "Agent gathered 2x rare ore",
    "data": {
      "resourceType": "ore",
      "quantity": 2,
      "quality": "rare"
    }
  }
]
```

**Event Types:**
- `AGENT_JOINED`
- `AGENT_MOVED`
- `RESOURCE_GATHERED`
- `ITEM_CRAFTED`
- `TRADE_COMPLETED`
- `MON_EARNED`
- `MON_SPENT`

---

### Agent Management

#### `POST /agent/enter`

Pay entry fee and join the world.

**Request:**
```json
{
  "agentName": "MyBot",
  "initialMon": 200
}
```

**Response:**
```json
{
  "success": true,
  "agent": {
    "id": "agent-uuid",
    "name": "MyBot",
    "locationId": "market_square",
    "monBalance": 100
  },
  "sessionToken": "session-uuid",
  "message": "Entry fee paid successfully. Welcome to Diem!"
}
```

**Errors:**
- `400`: Insufficient MON balance
- `400`: Agent name required

---

#### `GET /agent/:agentId`

Get agent state.

**Parameters:**
- `agentId` (path): Agent identifier

**Response:**
```json
{
  "id": "agent-uuid",
  "name": "MyBot",
  "locationId": "mining_caves",
  "monBalance": 150,
  "inventory": [
    {
      "resourceType": "ore",
      "quantity": 5,
      "quality": "common"
    }
  ],
  "stats": {
    "miningSkill": 25,
    "gatheringSkill": 10,
    "craftingSkill": 5,
    "tradingSkill": 3,
    "totalActions": 50
  },
  "joinedAt": 1234567890,
  "lastAction": 1234567900
}
```

---

#### `POST /agent/action`

Submit an agent action.

**Request:**
```json
{
  "sessionToken": "session-uuid",
  "action": {
    "type": "gather",
    "targetResourceType": "ore"
  }
}
```

**Response:**
```json
{
  "success": true,
  "message": "Gathered 2x common ore",
  "monEarned": 40,
  "itemsGained": [
    {
      "resourceType": "ore",
      "quantity": 2,
      "quality": "common"
    }
  ],
  "agent": {
    "id": "agent-uuid",
    "monBalance": 190,
    "inventory": [...]
  }
}
```

**Action Types:**

##### Move Action
```json
{
  "type": "move",
  "targetLocationId": "mining_caves"
}
```

##### Gather Action
```json
{
  "type": "gather",
  "targetResourceType": "ore"
}
```

##### Craft Action
```json
{
  "type": "craft",
  "craftingRecipe": "craft_tool"
}
```

**Available Recipes:**
- `craft_tool`: Iron Tool (2 ore + 1 wood)
- `craft_potion`: Healing Potion (3 herbs)
- `craft_rare_tool`: Masterwork Tool (3 ore + 2 wood + 1 rare_gem)
- `craft_rare_potion`: Greater Potion (5 herbs + 1 rare_gem)

##### Trade Action
```json
{
  "type": "trade",
  "tradeOffer": {
    "offeredItems": [
      {
        "resourceType": "ore",
        "quantity": 2,
        "quality": "common"
      }
    ]
  }
}
```

##### Rest Action
```json
{
  "type": "rest"
}
```

**Errors:**
- `401`: Invalid or expired session token
- `400`: Invalid action parameters
- `404`: Agent not found

---

#### `GET /agent/:agentId/transactions`

Get agent's MON transaction history.

**Query Parameters:**
- `limit` (optional): Number of transactions (default: 50)

**Response:**
```json
[
  {
    "id": "tx-uuid",
    "timestamp": 1234567890,
    "fromAgentId": "world_treasury",
    "toAgentId": "agent-uuid",
    "amount": 20,
    "reason": "Resource gathering",
    "balanceAfter": 120
  }
]
```

---

### Economy

#### `GET /leaderboard`

Get top agents by MON balance.

**Query Parameters:**
- `limit` (optional): Number of agents (default: 10)

**Response:**
```json
[
  {
    "agentId": "agent-uuid",
    "name": "TopAgent",
    "balance": 500,
    "stats": {
      "miningSkill": 50,
      "totalActions": 200
    }
  }
]
```

---

#### `GET /economy/stats`

Get economic statistics.

**Response:**
```json
{
  "totalMonInCirculation": 1000,
  "totalMonEarned": 1500,
  "totalMonSpent": 500,
  "totalTrades": 75,
  "totalResourcesGathered": 300,
  "totalItemsCrafted": 50,
  "activeSessions": 5
}
```

---

## WebSocket API

### Connection

```javascript
const ws = new WebSocket('ws://localhost:3000');
```

### Message Types

#### Initial State (Server  Client)

Sent immediately upon connection.

```json
{
  "type": "INITIAL_STATE",
  "data": {
    "locations": [...],
    "economicStats": {...},
    "recentEvents": [...]
  }
}
```

#### World Event (Server  Client)

Broadcast when any world event occurs.

```json
{
  "type": "WORLD_EVENT",
  "event": {
    "id": "event-uuid",
    "timestamp": 1234567890,
    "type": "RESOURCE_GATHERED",
    "agentId": "agent-uuid",
    "locationId": "mining_caves",
    "description": "Agent gathered ore",
    "data": {...}
  }
}
```

#### Subscribe to Location (Client  Server)

Request updates for specific location.

```json
{
  "type": "SUBSCRIBE_LOCATION",
  "locationId": "mining_caves"
}
```

#### Ping/Pong (Client  Server)

Keep-alive mechanism.

```json
{
  "type": "PING"
}
```

Response:
```json
{
  "type": "PONG",
  "timestamp": 1234567890
}
```

---

## Error Responses

All errors follow this format:

```json
{
  "error": "Error message description"
}
```

**HTTP Status Codes:**
- `200`: Success
- `400`: Bad request (invalid parameters)
- `401`: Unauthorized (invalid/expired session)
- `404`: Not found (agent/location doesn't exist)
- `500`: Internal server error

---

## Rate Limiting

Currently no rate limiting implemented. Agents should implement their own throttling to avoid overwhelming the server.

**Recommended:**
- 1-2 second delay between actions
- Batch queries when possible
- Use WebSocket for real-time updates instead of polling

---

## Example Client Code

### JavaScript/Node.js

```javascript
const axios = require('axios');
const WebSocket = require('ws');

const API_URL = 'http://localhost:3000';

async function joinWorld() {
  // Enter world
  const { data } = await axios.post(`${API_URL}/agent/enter`, {
    agentName: 'MyAgent',
    initialMon: 200
  });
  
  const sessionToken = data.sessionToken;
  
  // Connect WebSocket
  const ws = new WebSocket('ws://localhost:3000');
  ws.on('message', (msg) => {
    console.log('Event:', JSON.parse(msg));
  });
  
  // Submit action
  const result = await axios.post(`${API_URL}/agent/action`, {
    sessionToken,
    action: {
      type: 'gather',
      targetResourceType: 'ore'
    }
  });
  
  console.log('Result:', result.data);
}
```

### Python

```python
import requests
import websocket

API_URL = 'http://localhost:3000'

# Enter world
response = requests.post(f'{API_URL}/agent/enter', json={
    'agentName': 'MyAgent',
    'initialMon': 200
})

session_token = response.json()['sessionToken']

# Submit action
result = requests.post(f'{API_URL}/agent/action', json={
    'sessionToken': session_token,
    'action': {
        'type': 'gather',
        'targetResourceType': 'ore'
    }
})

print(result.json())
```
