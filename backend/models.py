from pydantic import BaseModel
from typing import Optional
from datetime import datetime


class Job(BaseModel):
    id: int
    title: str
    pay: str
    location: str
    date: str
    description: Optional[str] = None


class JobCreate(BaseModel):
    title: str
    pay: str
    location: str
    date: str
    description: Optional[str] = None


class JobResponse(Job):
    crop_type: Optional[str] = None
    quantity: Optional[int] = None
    workers_requested: Optional[int] = None
    pay_rate_mxn: Optional[float] = None
    total_value_mxn: Optional[float] = None
    service_time_mins: Optional[float] = None


class Contract(BaseModel):
    id: int
    job_id: int
    job_title: str
    pay: str
    location: str
    date: str
    status: str  # 'pending', 'accepted', 'rejected', 'signed', 'completed'
    worker_id: Optional[str] = None  # UUID string
    created_at: Optional[str] = None


class ContractCreate(BaseModel):
    job_id: int
    worker_id: Optional[str] = None  # UUID string
    audio_url: Optional[str] = None  # URL of uploaded voice recording
    notes: Optional[str] = None  # Text application notes


class ContractUpdate(BaseModel):
    status: str  # 'accepted', 'rejected'


class StatsResponse(BaseModel):
    active_jobs: int
    total_applications: int
    weekly_jobs: list
    weekly_applications: list
    labor_demand_forecast: list
    category_stats: list


class ApplicationResponse(BaseModel):
    id: int
    job_id: int
    job_title: str
    worker_id: Optional[str] = None
    worker_name: Optional[str] = None
    worker_phone: Optional[str] = None
    status: str
    audio_url: Optional[str] = None
    notes: Optional[str] = None
    submitted_at: Optional[str] = None
    grower_id: Optional[str] = None
    farm_name: Optional[str] = None


class ApplicationStatusUpdate(BaseModel):
    status: str  # 'pending', 'accepted', 'rejected'

