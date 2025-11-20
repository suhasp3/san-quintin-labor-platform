# Mexico Labor Project - Backend API

FastAPI backend for the mobile-based employment system for agricultural day laborers in Baja California.

## Features

- **Poisson Process Job Generation**: Uses constant rate Poisson process to simulate job arrivals
- **RESTful API**: Full CRUD operations for jobs and contracts
- **Statistics Dashboard**: Admin endpoints for analytics and forecasting
- **CORS Enabled**: Configured to work with the React frontend

## Setup

1. Install dependencies:
```bash
cd backend
pip install -r requirements.txt
```

2. Run the server:
```bash
uvicorn main:app --reload --port 8000
```

The API will be available at `http://localhost:8000`

## API Endpoints

### Jobs
- `GET /jobs` - Get all jobs (with optional filters: `crop_type`, `location`, `limit`)
- `GET /jobs/{job_id}` - Get a specific job
- `POST /jobs` - Create a new job posting
- `DELETE /jobs/{job_id}` - Delete a job
- `POST /jobs/regenerate` - Regenerate jobs using Poisson process

### Contracts
- `GET /contracts` - Get all contracts (with optional filters: `worker_id`, `status`)
- `GET /contracts/{contract_id}` - Get a specific contract
- `POST /contracts` - Create a new contract (job application)
- `PATCH /contracts/{contract_id}` - Update contract status

### Statistics
- `GET /stats` - Get dashboard statistics (jobs, applications, forecasts)

### Health
- `GET /health` - Health check endpoint
- `GET /` - API information

## Data Generation

The backend uses a Poisson process to generate realistic job data:
- **Arrival Rate**: Configurable average time between job arrivals (default: 30 minutes)
- **Crop Types**: Tomato (60%) and Strawberry (40%)
- **Job Characteristics**: Quantity, crew size, pay rates, service times based on crop type
- **Farm Locations**: Distributed across 6 farms in San Quintín

## API Documentation

Once the server is running, visit:
- Swagger UI: `http://localhost:8000/docs`
- ReDoc: `http://localhost:8000/redoc`

