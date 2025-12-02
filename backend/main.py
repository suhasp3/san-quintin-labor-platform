from fastapi import FastAPI, HTTPException, Depends
from fastapi.middleware.cors import CORSMiddleware
from datetime import datetime, timedelta
from typing import List, Optional
from supabase import Client

from models import Job, JobCreate, JobResponse, Contract, ContractCreate, ContractUpdate, StatsResponse, ApplicationResponse, ApplicationStatusUpdate
from db import supabase
from data_generator import insert_jobs_to_supabase

app = FastAPI(title="Mexico Labor Project API", version="1.0.0")

# CORS middleware to allow frontend requests
app.add_middleware(
    CORSMiddleware,
    allow_origins=["http://localhost:5173", "http://localhost:3000"],  # Vite default port
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)


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
    try:
        # Test Supabase connection
        jobs_count = supabase.table("jobs").select("id", count="exact").execute()
        contracts_count = supabase.table("contracts").select("id", count="exact").execute()
        return {
            "status": "healthy",
            "database": "connected",
            "jobs_count": jobs_count.count if jobs_count.count else 0,
            "contracts_count": contracts_count.count if contracts_count.count else 0
        }
    except Exception as e:
        return {
            "status": "unhealthy",
            "database": "disconnected",
            "error": str(e)
        }


@app.get("/jobs", response_model=List[JobResponse])
async def get_jobs(
    crop_type: Optional[str] = None,
    status: Optional[str] = None,
    limit: Optional[int] = None
):
    """
    Get all available jobs, optionally filtered by crop type or status.
    """
    query = supabase.table("jobs").select("*")
    
    if crop_type:
        query = query.eq("crop_type", crop_type)
    
    if status:
        query = query.eq("status", status)
    else:
        # Default to open jobs
        query = query.eq("status", "open")
    
    # Order by start_date descending
    query = query.order("start_date", desc=True)
    
    if limit:
        query = query.limit(limit)
    
    response = query.execute()
    
    # Convert to frontend format
    jobs = []
    for job in response.data:
        # Format pay for display
        pay_str = f"${float(job['pay_rate_mxn']):.2f}/{job['unit_type'].lower()}"
        
        jobs.append({
            'id': job['id'],
            'title': job['title'],
            'pay': pay_str,
            'location': job.get('description', '').split('Farm')[1].split('.')[0].strip() if 'Farm' in job.get('description', '') else 'San Quintín',
            'date': job['start_date'],
            'description': job.get('description', ''),
            'crop_type': job['crop_type'],
            'quantity': job['quantity_units'],
            'workers_requested': job['workers_requested'],
            'pay_rate_mxn': float(job['pay_rate_mxn']),
            'service_time_mins': float(job['service_time_mins']) if job.get('service_time_mins') else None,
            'arrival_time_poisson': float(job['arrival_time_poisson']) if job.get('arrival_time_poisson') else None,
        })
    
    return jobs


@app.get("/jobs/{job_id}", response_model=JobResponse)
async def get_job(job_id: int):
    """Get a specific job by ID."""
    response = supabase.table("jobs").select("*").eq("id", job_id).execute()
    
    if not response.data:
        raise HTTPException(status_code=404, detail="Job not found")
    
    job = response.data[0]
    pay_str = f"${float(job['pay_rate_mxn']):.2f}/{job['unit_type'].lower()}"
    
    return {
        'id': job['id'],
        'title': job['title'],
        'pay': pay_str,
        'location': 'San Quintín',  # Extract from description if needed
        'date': job['start_date'],
        'description': job.get('description', ''),
        'crop_type': job['crop_type'],
        'quantity': job['quantity_units'],
        'workers_requested': job['workers_requested'],
        'pay_rate_mxn': float(job['pay_rate_mxn']),
        'service_time_mins': float(job['service_time_mins']) if job.get('service_time_mins') else None,
        'arrival_time_poisson': float(job['arrival_time_poisson']) if job.get('arrival_time_poisson') else None,
    }


@app.post("/jobs", response_model=JobResponse)
async def create_job(job: JobCreate):
    """Create a new job posting."""
    # Parse job data
    job_data = {
        'title': job.title,
        'crop_type': 'Other',  # Default, can be extracted from title
        'pay_rate_mxn': 0.0,  # Parse from pay string if needed
        'quantity_units': 0,
        'unit_type': 'unit',
        'workers_requested': 1,
        'start_date': job.date,
        'description': job.description or '',
        'status': 'open',
    }
    
    # Try to extract crop type from title
    if 'tomato' in job.title.lower():
        job_data['crop_type'] = 'Tomato'
    elif 'strawberry' in job.title.lower():
        job_data['crop_type'] = 'Strawberry'
    
    response = supabase.table("jobs").insert(job_data).execute()
    
    if not response.data:
        raise HTTPException(status_code=500, detail="Failed to create job")
    
    new_job = response.data[0]
    return {
        'id': new_job['id'],
        'title': new_job['title'],
        'pay': job.pay,
        'location': job.location,
        'date': new_job['start_date'],
        'description': new_job.get('description', ''),
        'crop_type': new_job['crop_type'],
        'quantity': new_job['quantity_units'],
        'workers_requested': new_job['workers_requested'],
        'pay_rate_mxn': float(new_job['pay_rate_mxn']),
        'service_time_mins': None,
        'arrival_time_poisson': None,
    }


@app.delete("/jobs/{job_id}")
async def delete_job(job_id: int):
    """Delete a job posting."""
    response = supabase.table("jobs").delete().eq("id", job_id).execute()
    
    if not response.data:
        raise HTTPException(status_code=404, detail="Job not found")
    
    return {"message": "Job deleted successfully"}


@app.get("/contracts", response_model=List[Contract])
async def get_contracts(worker_id: Optional[str] = None, status: Optional[str] = None):
    """Get all contracts, optionally filtered by worker_id or status."""
    query = supabase.table("contracts").select("*, jobs(*), workers(*)")
    
    if worker_id:
        query = query.eq("worker_id", worker_id)
    
    if status:
        query = query.eq("status", status)
    
    response = query.execute()
    
    contracts = []
    for contract in response.data:
        job = contract.get('jobs', {})
        contracts.append({
            'id': contract['id'],
            'job_id': contract['job_id'],
            'job_title': job.get('title', 'Unknown Job'),
            'pay': f"${float(job.get('pay_rate_mxn', 0)):.2f}/{job.get('unit_type', 'unit')}",
            'location': 'San Quintín',
            'date': job.get('start_date', ''),
            'status': contract['status'],
            'worker_id': contract['worker_id'],
            'created_at': contract.get('created_at', ''),
        })
    
    return contracts


@app.get("/contracts/{contract_id}", response_model=Contract)
async def get_contract(contract_id: int):
    """Get a specific contract by ID."""
    response = supabase.table("contracts").select("*, jobs(*)").eq("id", contract_id).execute()
    
    if not response.data:
        raise HTTPException(status_code=404, detail="Contract not found")
    
    contract = response.data[0]
    job = contract.get('jobs', {})
    
    return {
        'id': contract['id'],
        'job_id': contract['job_id'],
        'job_title': job.get('title', 'Unknown Job'),
        'pay': f"${float(job.get('pay_rate_mxn', 0)):.2f}/{job.get('unit_type', 'unit')}",
        'location': 'San Quintín',
        'date': job.get('start_date', ''),
        'status': contract['status'],
        'worker_id': contract['worker_id'],
        'created_at': contract.get('created_at', ''),
    }


@app.post("/contracts", response_model=Contract)
async def create_contract(contract: ContractCreate):
    """Create a new contract (job application)."""
    worker_id = contract.worker_id
    
    # If worker_id is provided and not the default UUID, ensure worker record exists
    if worker_id and worker_id != '00000000-0000-0000-0000-000000000000':
        # Check if worker record exists
        worker_check = supabase.table("workers").select("user_id").eq("user_id", worker_id).execute()
        
        if not worker_check.data:
            # Check if user exists and is a worker
            user_check = supabase.table("users").select("id, role").eq("id", worker_id).execute()
            
            if user_check.data:
                user = user_check.data[0]
                # Only create worker record if user role is 'worker'
                if user.get('role') == 'worker':
                    # Create worker record
                    try:
                        supabase.table("workers").insert({
                            'user_id': worker_id
                        }).execute()
                    except Exception as e:
                        # Worker might already exist (race condition), check again
                        worker_check = supabase.table("workers").select("user_id").eq("user_id", worker_id).execute()
                        if not worker_check.data:
                            # If still doesn't exist, don't include worker_id
                            worker_id = None
                else:
                    # User is not a worker, don't include worker_id
                    worker_id = None
            else:
                # User doesn't exist, don't include worker_id
                worker_id = None
    else:
        # Invalid or default UUID, don't include worker_id
        worker_id = None
    
    # First, create an application
    application_data = {
        'job_id': contract.job_id,
        'status': 'pending',
    }
    
    # Only add worker_id if it's valid
    if worker_id:
        application_data['worker_id'] = worker_id
    
    # Add audio_url if provided
    if contract.audio_url:
        application_data['audio_url'] = contract.audio_url
    
    # Add notes if provided
    if contract.notes:
        application_data['notes'] = contract.notes
    
    app_response = supabase.table("applications").insert(application_data).execute()
    
    if not app_response.data:
        raise HTTPException(status_code=500, detail="Failed to create application")
    
    application = app_response.data[0]
    
    # Get job details
    job_response = supabase.table("jobs").select("*").eq("id", contract.job_id).execute()
    
    if not job_response.data:
        raise HTTPException(status_code=404, detail="Job not found")
    
    job = job_response.data[0]
    
    # Create contract
    contract_data = {
        'job_id': contract.job_id,
        'application_id': application['id'],
        'status': 'pending',
    }
    
    # Only add worker_id if it's valid
    if worker_id:
        contract_data['worker_id'] = worker_id
    
    contract_response = supabase.table("contracts").insert(contract_data).execute()
    
    if not contract_response.data:
        raise HTTPException(status_code=500, detail="Failed to create contract")
    
    new_contract = contract_response.data[0]
    
    return {
        'id': new_contract['id'],
        'job_id': new_contract['job_id'],
        'job_title': job['title'],
        'pay': f"${float(job['pay_rate_mxn']):.2f}/{job['unit_type']}",
        'location': 'San Quintín',
        'date': job['start_date'],
        'status': new_contract['status'],
        'worker_id': new_contract['worker_id'],
        'created_at': new_contract.get('created_at', ''),
    }


@app.patch("/contracts/{contract_id}", response_model=Contract)
async def update_contract(contract_id: int, update: ContractUpdate):
    """Update contract status (accept/reject)."""
    if update.status not in ['accepted', 'rejected', 'pending', 'signed', 'completed']:
        raise HTTPException(status_code=400, detail="Invalid status")
    
    # Update contract
    response = supabase.table("contracts").update({
        'status': update.status,
        'signed_at': datetime.now().isoformat() if update.status == 'signed' else None
    }).eq("id", contract_id).execute()
    
    if not response.data:
        raise HTTPException(status_code=404, detail="Contract not found")
    
    contract = response.data[0]
    
    # Get job details
    job_response = supabase.table("jobs").select("*").eq("id", contract['job_id']).execute()
    job = job_response.data[0] if job_response.data else {}
    
    return {
        'id': contract['id'],
        'job_id': contract['job_id'],
        'job_title': job.get('title', 'Unknown Job'),
        'pay': f"${float(job.get('pay_rate_mxn', 0)):.2f}/{job.get('unit_type', 'unit')}",
        'location': 'San Quintín',
        'date': job.get('start_date', ''),
        'status': contract['status'],
        'worker_id': contract['worker_id'],
        'created_at': contract.get('created_at', ''),
    }


@app.get("/applications", response_model=List[ApplicationResponse])
async def get_applications(
    grower_id: Optional[str] = None,
    job_id: Optional[int] = None,
    status: Optional[str] = None
):
    """
    Get all applications with job and worker details.
    For admins: returns all applications
    For growers: can filter by grower_id
    """
    # First get applications
    query = supabase.table("applications").select("*")
    
    if job_id:
        query = query.eq("job_id", job_id)
    
    if status:
        query = query.eq("status", status)
    
    # Order by submitted_at descending (newest first)
    query = query.order("submitted_at", desc=True)
    
    response = query.execute()
    
    # If filtering by grower_id, we need to filter after getting jobs
    if grower_id:
        # Get all jobs for this grower first
        jobs_response = supabase.table("jobs").select("id").eq("grower_id", grower_id).execute()
        grower_job_ids = [job['id'] for job in jobs_response.data]
        # Filter applications to only those jobs
        response.data = [app for app in response.data if app['job_id'] in grower_job_ids]
    
    applications = []
    for app in response.data:
        # Get job details
        try:
            job_response = supabase.table("jobs").select("*, growers(*)").eq("id", app['job_id']).execute()
            job = job_response.data[0] if job_response.data else {}
            grower = job.get('growers', {}) if isinstance(job.get('growers'), dict) else {}
        except:
            job = {}
            grower = {}
        
        # Get worker details
        worker_name = 'Unknown Worker'
        worker_phone = 'N/A'
        
        if app.get('worker_id'):
            try:
                # Try to get worker and user info
                worker_response = supabase.table("workers").select("*, users(*)").eq("user_id", app['worker_id']).execute()
                if worker_response.data:
                    worker = worker_response.data[0]
                    user = worker.get('users', {}) if isinstance(worker.get('users'), dict) else {}
                    worker_name = user.get('name', 'Unknown Worker')
                    worker_phone = user.get('phone', 'N/A')
                else:
                    # Try direct user lookup
                    user_response = supabase.table("users").select("*").eq("id", app['worker_id']).execute()
                    if user_response.data:
                        user = user_response.data[0]
                        worker_name = user.get('name', 'Unknown Worker')
                        worker_phone = user.get('phone', 'N/A')
            except:
                pass
        
        applications.append({
            'id': app['id'],
            'job_id': app['job_id'],
            'job_title': job.get('title', 'Unknown Job'),
            'worker_id': app.get('worker_id'),
            'worker_name': worker_name,
            'worker_phone': worker_phone,
            'status': app.get('status', 'pending'),
            'audio_url': app.get('audio_url'),
            'notes': app.get('notes'),
            'submitted_at': app.get('submitted_at', ''),
            'grower_id': grower.get('user_id') if grower else job.get('grower_id'),
            'farm_name': grower.get('farm_name', 'Unknown Farm') if grower else None,
        })
    
    return applications


@app.patch("/applications/{application_id}")
async def update_application_status(
    application_id: int,
    update: ApplicationStatusUpdate
):
    """Update application status (accept/reject)."""
    if update.status not in ['pending', 'accepted', 'rejected']:
        raise HTTPException(status_code=400, detail="Invalid status")
    
    response = supabase.table("applications").update({
        'status': update.status
    }).eq("id", application_id).execute()
    
    if not response.data:
        raise HTTPException(status_code=404, detail="Application not found")
    
    # Also update the associated contract if it exists
    contract_response = supabase.table("contracts").select("*").eq("application_id", application_id).execute()
    if contract_response.data:
        contract_status = 'accepted' if update.status == 'accepted' else 'pending'
        supabase.table("contracts").update({
            'status': contract_status
        }).eq("application_id", application_id).execute()
    
    return {"message": f"Application {application_id} status updated to {update.status}"}


@app.get("/stats", response_model=StatsResponse)
async def get_stats():
    """Get statistics for the admin dashboard."""
    # Get active jobs
    active_jobs_response = supabase.table("jobs").select("id", count="exact").eq("status", "open").execute()
    active_jobs = active_jobs_response.count if active_jobs_response.count else 0
    
    # Get total applications
    apps_response = supabase.table("applications").select("id", count="exact").execute()
    total_applications = apps_response.count if apps_response.count else 0
    
    # Get weekly jobs (last 7 days)
    week_ago = (datetime.now() - timedelta(days=7)).strftime('%Y-%m-%d')
    weekly_jobs_response = supabase.table("jobs").select("start_date").gte("start_date", week_ago).execute()
    
    # Group by day
    weekly_jobs_data = {}
    for i in range(7):
        day = (datetime.now() - timedelta(days=6-i)).strftime('%a')
        weekly_jobs_data[day] = 0
    
    for job in weekly_jobs_response.data:
        job_date = datetime.strptime(job['start_date'], '%Y-%m-%d')
        day = job_date.strftime('%a')
        if day in weekly_jobs_data:
            weekly_jobs_data[day] += 1
    
    # Get weekly applications
    weekly_apps_response = supabase.table("applications").select("submitted_at").gte("submitted_at", week_ago).execute()
    
    weekly_applications_data = {}
    for i in range(7):
        day = (datetime.now() - timedelta(days=6-i)).strftime('%a')
        weekly_applications_data[day] = 0
    
    for app in weekly_apps_response.data:
        if app.get('submitted_at'):
            app_date = datetime.fromisoformat(app['submitted_at'].replace('Z', '+00:00'))
            day = app_date.strftime('%a')
            if day in weekly_applications_data:
                weekly_applications_data[day] += 1
    
    weekly_jobs = [{'name': day, 'jobs': weekly_jobs_data[day]} for day in weekly_jobs_data.keys()]
    weekly_applications = [{'name': day, 'applications': weekly_applications_data[day]} for day in weekly_applications_data.keys()]
    
    # Get labor demand forecast from demand_forecast table
    forecast_response = supabase.table("demand_forecast").select("*").order("generated_at", desc=True).limit(1).execute()
    
    if forecast_response.data:
        summary = forecast_response.data[0].get('summary_json', {})
        # Use forecast data if available
        forecast_data = [
            {'month': 'Jan', 'demand': int(summary.get('total_jobs', 0) * 0.8)},
            {'month': 'Feb', 'demand': int(summary.get('total_jobs', 0) * 0.9)},
            {'month': 'Mar', 'demand': int(summary.get('total_jobs', 0) * 1.0)},
            {'month': 'Apr', 'demand': int(summary.get('total_jobs', 0) * 1.1)},
            {'month': 'May', 'demand': int(summary.get('total_jobs', 0) * 1.2)},
            {'month': 'Jun', 'demand': int(summary.get('total_jobs', 0) * 1.3)},
        ]
    else:
        forecast_data = [
            {'month': 'Jan', 'demand': 0},
            {'month': 'Feb', 'demand': 0},
            {'month': 'Mar', 'demand': 0},
            {'month': 'Apr', 'demand': 0},
            {'month': 'May', 'demand': 0},
            {'month': 'Jun', 'demand': 0},
        ]
    
    # Get category stats
    category_response = supabase.table("jobs").select("crop_type, workers_requested").execute()
    
    category_stats = []
    crop_counts = {}
    for job in category_response.data:
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
        active_jobs=active_jobs,
        total_applications=total_applications,
        weekly_jobs=weekly_jobs,
        weekly_applications=weekly_applications,
        labor_demand_forecast=forecast_data,
        category_stats=category_stats
    )


@app.post("/jobs/regenerate")
async def regenerate_jobs(num_jobs: int = 50, arrival_rate_minutes: float = 30.0):
    """
    Regenerate jobs using the Poisson process and insert into Supabase.
    Useful for testing and refreshing data.
    """
    result = insert_jobs_to_supabase(
        num_jobs=num_jobs,
        arrival_rate_minutes=arrival_rate_minutes
    )
    
    if result['success']:
        return {
            "message": result['message'],
            "jobs_inserted": result['jobs_inserted']
        }
    else:
        raise HTTPException(status_code=500, detail=result['error'])
