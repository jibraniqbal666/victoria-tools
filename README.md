# Victoria Tools

A web application for managing and interacting with Victoria Metrics components, featuring a tab-based interface for various VM tools.

## Features

- **VM Alert Replay**: Replay alerting rules against historical data to test and validate alert configurations
- **Tab-based UI**: Extensible interface for adding more Victoria Metrics tools in the future
- **Container-ready**: Designed to run in containers where VM components like vmalert are available

## Prerequisites

- Node.js 18+ and npm
- Victoria Metrics vmalert binary (available in the container or system PATH)
- Docker and Docker Compose (for containerized deployment)

## Development Setup

### Local Development

1. Install dependencies:
```bash
npm install
cd server && npm install && cd ..
```

2. Start the development server:
```bash
npm run dev
```

The frontend will be available at `http://localhost:3000`

3. In another terminal, start the backend server:
```bash
cd server && npm start
```

The backend API will be available at `http://localhost:8080`

### Environment Variables

Create a `.env` file in the root directory:

```env
VITE_API_BASE_URL=http://localhost:8080/api
```

For the server, you can set:
- `PORT`: Server port (default: 8080)
- `VMALERT_PATH`: Path to vmalert binary (default: 'vmalert' from PATH)

## Building for Production

```bash
npm run build
```

The built files will be in the `dist` directory.

## Docker Deployment

### Build and Run

```bash
# Build the image
docker build -t victoria-tools .

# Run the container
docker run -p 3000:8080 \
  -e VMALERT_PATH=/usr/local/bin/vmalert \
  -v /path/to/rules:/app/rules:ro \
  victoria-tools
```

### Using Docker Compose

```bash
docker-compose up -d
```

The application will be available at `http://localhost:3000`

## Usage

### VM Alert Replay

1. Navigate to the "VM Alert Replay" tab
2. Enter the path to your alerting rules file (YAML format)
3. Specify the start and end time for the replay period
4. Optionally configure the datasource URL (defaults to `http://localhost:8428`)
5. Click "Run Replay" to execute

The replay will execute the vmalert replay command against your specified time range and display the results.

## Project Structure

```
victoria-tools/
├── src/
│   ├── components/          # React components
│   │   ├── TabNavigation.tsx
│   │   └── VMAlertReplay.tsx
│   ├── services/            # API services
│   │   └── vmalertService.ts
│   ├── App.tsx             # Main app component
│   └── main.tsx            # Entry point
├── server/                 # Backend API server
│   ├── index.js           # Express server
│   └── package.json
├── Dockerfile             # Docker configuration
├── docker-compose.yml     # Docker Compose configuration
└── package.json          # Frontend dependencies
```

## Adding New Tabs

To add a new feature tab:

1. Create a new component in `src/components/`
2. Add the tab to the `tabs` array in `src/App.tsx`:

```typescript
const tabs: Tab[] = [
  {
    id: 'replay',
    label: 'VM Alert Replay',
    component: <VMAlertReplay />
  },
  {
    id: 'new-feature',
    label: 'New Feature',
    component: <NewFeatureComponent />
  }
]
```

## API Endpoints

### POST /vmalert/replay

Execute vmalert replay command.

**Request Body:**
```json
{
  "ruleFile": "/path/to/rules.yml",
  "startTime": "2023-01-01T00:00:00Z",
  "endTime": "2023-01-02T00:00:00Z",
  "datasourceUrl": "http://localhost:8428"
}
```

**Response:**
```json
{
  "output": "Replay output..."
}
```

### GET /health

Health check endpoint.

**Response:**
```json
{
  "status": "ok",
  "timestamp": "2023-01-01T00:00:00.000Z"
}
```

## License

MIT

