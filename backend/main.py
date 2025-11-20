from fastapi import FastAPI, HTTPException
from fastapi.middleware.cors import CORSMiddleware
from datetime import datetime, timedelta
from typing import List, Optional
import json
import os

from models import Job, JobCreate, JobResponse, Contract, ContractCreate, ContractUpdate, StatsResponse
from data_generator import generate_baja_harvest_data, convert_to_job_format

app = FastAPI(title="Mexico Labor Project API", version="1.0.0")

# CORS middleware to allow frontend requests
app.add_middleware(
    CORSMiddleware,
    allow_origins=["http://localhost:5173", "http://localhost:3000"],  # Vite default port
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

# In-memory storage (in production, use a database)
jobs_db: List[dict] = []
contracts_db: List[dict] = []

# Initialize with generated data
def initialize_data():
    """Initialize the database with generated job data using Poisson process."""
    global jobs_db
    if not jobs_db:
        df = generate_baja_harvest_data(num_jobs=50, arrival_rate_minutes=30)
        jobs_db = convert_to_job_format(df, base_date=datetime.now())
        print(f"Initialized {len(jobs_db)} jobs using Poisson process")

# Initialize on startup
@app.on_event("startup")
async def startup_event():
    initialize_data()


@app.get("/")
async def root():
    return {
        "message": "Mexico Labor Project API",
        "version": "1.0.0",
        "endpoints": {
            "jobs": "/jobs",
            "contracts": "/contracts",
            "stats": "/stats",
            "health": "/health"
        }
    }


@app.get("/health")
async def health():
    return {"status": "healthy", "jobs_count": len(jobs_db), "contracts_count": len(contracts_db)}


@app.get("/jobs", response_model=List[JobResponse])
async def get_jobs(
    crop_type: Optional[str] = None,
    location: Optional[str] = None,
    limit: Optional[int] = None
):
    """
    Get all available jobs, optionally filtered by crop type or location.
    """
    filtered_jobs = jobs_db.copy()
    
    if crop_type:
        filtered_jobs = [j for j in filtered_jobs if j.get('crop_type', '').lower() == crop_type.lower()]
    
    if location:
        filtered_jobs = [j for j in filtered_jobs if j.get('location', '').lower() == location.lower()]
    
    # Sort by date (most recent first)
    filtered_jobs.sort(key=lambda x: x.get('date', ''), reverse=True)
    
    if limit:
        filtered_jobs = filtered_jobs[:limit]
    
    return filtered_jobs


@app.get("/jobs/{job_id}", response_model=JobResponse)
async def get_job(job_id: int):
    """Get a specific job by ID."""
    job = next((j for j in jobs_db if j['id'] == job_id), None)
    if not job:
        raise HTTPException(status_code=404, detail="Job not found")
    return job


@app.post("/jobs", response_model=JobResponse)
async def create_job(job: JobCreate):
    """Create a new job posting."""
    new_job = {
        'id': max([j['id'] for j in jobs_db], default=0) + 1,
        **job.dict(),
        'crop_type': None,
        'quantity': None,
        'workers_requested': None,
        'pay_rate_mxn': None,
        'total_value_mxn': None,
        'service_time_mins': None,
        'arrival_time_poisson': None,
    }
    jobs_db.append(new_job)
    return new_job


@app.delete("/jobs/{job_id}")
async def delete_job(job_id: int):
    """Delete a job posting."""
    global jobs_db
    job = next((j for j in jobs_db if j['id'] == job_id), None)
    if not job:
        raise HTTPException(status_code=404, detail="Job not found")
    jobs_db = [j for j in jobs_db if j['id'] != job_id]
    return {"message": "Job deleted successfully"}


@app.get("/contracts", response_model=List[Contract])
async def get_contracts(worker_id: Optional[int] = None, status: Optional[str] = None):
    """Get all contracts, optionally filtered by worker_id or status."""
    filtered = contracts_db.copy()
    
    if worker_id:
        filtered = [c for c in filtered if c.get('worker_id') == worker_id]
    
    if status:
        filtered = [c for c in filtered if c.get('status', '').lower() == status.lower()]
    
    return filtered


@app.get("/contracts/{contract_id}", response_model=Contract)
async def get_contract(contract_id: int):
    """Get a specific contract by ID."""
    contract = next((c for c in contracts_db if c['id'] == contract_id), None)
    if not contract:
        raise HTTPException(status_code=404, detail="Contract not found")
    return contract


@app.post("/contracts", response_model=Contract)
async def create_contract(contract: ContractCreate):
    """Create a new contract (job application)."""
    # Find the job
    job = next((j for j in jobs_db if j['id'] == contract.job_id), None)
    if not job:
        raise HTTPException(status_code=404, detail="Job not found")
    
    new_contract = {
        'id': max([c['id'] for c in contracts_db], default=0) + 1,
        'job_id': contract.job_id,
        'job_title': job['title'],
        'pay': job['pay'],
        'location': job['location'],
        'date': job['date'],
        'status': 'pending',
        'worker_id': contract.worker_id or 1,  # Default worker ID
        'created_at': datetime.now().isoformat(),
    }
    contracts_db.append(new_contract)
    return new_contract


@app.patch("/contracts/{contract_id}", response_model=Contract)
async def update_contract(contract_id: int, update: ContractUpdate):
    """Update contract status (accept/reject)."""
    contract = next((c for c in contracts_db if c['id'] == contract_id), None)
    if not contract:
        raise HTTPException(status_code=404, detail="Contract not found")
    
    if update.status not in ['accepted', 'rejected', 'pending']:
        raise HTTPException(status_code=400, detail="Status must be 'accepted', 'rejected', or 'pending'")
    
    contract['status'] = update.status
    return contract


@app.get("/stats", response_model=StatsResponse)
async def get_stats():
    """Get statistics for the admin dashboard."""
    # Calculate weekly stats
    today = datetime.now()
    week_ago = today - timedelta(days=7)
    
    # Filter jobs from last week
    recent_jobs = [
        j for j in jobs_db 
        if j.get('date') and datetime.strptime(j['date'], '%Y-%m-%d') >= week_ago
    ]
    
    # Group by day of week
    weekly_jobs_data = {}
    weekly_applications_data = {}
    
    for i in range(7):
        day = (week_ago + timedelta(days=i)).strftime('%a')
        weekly_jobs_data[day] = 0
        weekly_applications_data[day] = 0
    
    # Count jobs by day
    for job in recent_jobs:
        job_date = datetime.strptime(job['date'], '%Y-%m-%d')
        day = job_date.strftime('%a')
        if day in weekly_jobs_data:
            weekly_jobs_data[day] += 1
    
    # Count applications by day
    for contract in contracts_db:
        if contract.get('created_at'):
            contract_date = datetime.fromisoformat(contract['created_at'])
            if contract_date >= week_ago:
                day = contract_date.strftime('%a')
                if day in weekly_applications_data:
                    weekly_applications_data[day] += 1
    
    # Format for charts
    weekly_jobs = [{'name': day, 'jobs': weekly_jobs_data[day]} for day in weekly_jobs_data.keys()]
    weekly_applications = [{'name': day, 'applications': weekly_applications_data[day]} for day in weekly_applications_data.keys()]
    
    # Labor demand forecast (using Poisson process data)
    # Generate forecast for next 6 months
    forecast_data = []
    months = ['Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun']
    base_demand = len(jobs_db) // 2  # Base demand
    
    for i, month in enumerate(months):
        # Simulate seasonal variation
        seasonal_factor = 1.0 + (i * 0.15)  # Increasing demand
        demand = int(base_demand * seasonal_factor)
        forecast_data.append({'month': month, 'demand': demand})
    
    # Category stats
    category_stats = []
    crop_counts = {}
    for job in jobs_db:
        crop = job.get('crop_type', 'Other')
        if crop not in crop_counts:
            crop_counts[crop] = {'jobs': 0, 'workers': 0}
        crop_counts[crop]['jobs'] += 1
        crop_counts[crop]['workers'] += job.get('workers_requested', 0)
    
    for crop, counts in crop_counts.items():
        category_stats.append({
            'category': crop,
            'jobs': counts['jobs'],
            'workers': counts['workers']
        })
    
    return StatsResponse(
        active_jobs=len([j for j in jobs_db if j.get('date') and datetime.strptime(j['date'], '%Y-%m-%d') >= datetime.now()]),
        total_applications=len(contracts_db),
        weekly_jobs=weekly_jobs,
        weekly_applications=weekly_applications,
        labor_demand_forecast=forecast_data,
        category_stats=category_stats
    )


@app.post("/jobs/regenerate")
async def regenerate_jobs(num_jobs: int = 50, arrival_rate_minutes: float = 30.0):
    """
    Regenerate jobs using the Poisson process.
    Useful for testing and refreshing data.
    """
    global jobs_db
    df = generate_baja_harvest_data(num_jobs=num_jobs, arrival_rate_minutes=arrival_rate_minutes)
    jobs_db = convert_to_job_format(df, base_date=datetime.now())
    return {
        "message": f"Regenerated {len(jobs_db)} jobs",
        "jobs_count": len(jobs_db)
    }

