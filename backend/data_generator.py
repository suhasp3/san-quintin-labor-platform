import numpy as np
import pandas as pd
from datetime import datetime, timedelta
from typing import List, Dict, Any


def generate_baja_harvest_data(num_jobs=100, arrival_rate_minutes=30):
    """
    Generate synthetic job data using Poisson process for arrivals.
    
    Args:
        num_jobs: Number of jobs to generate
        arrival_rate_minutes: Average time between job arrivals (for Poisson process)
    
    Returns:
        DataFrame with job data including arrival times
    """
    np.random.seed(42)
    
    job_ids = range(1, num_jobs + 1)
    crops = np.random.choice(['Tomato', 'Strawberry'], size=num_jobs, p=[0.6, 0.4])
    
    quantities = []
    crew_sizes = []
    pay_rates = []
    service_times = []
    total_payouts = []
    
    for crop in crops:
        if crop == 'Tomato':
            qty = np.random.randint(1000, 3000)  # random job size measured in lbs
            crew = np.random.randint(20, 40)
            rate = np.round(np.random.uniform(5.0, 8.0), 2)  # in MXN
            prod_rate = np.random.normal(22, 3)  # buckets/worker/hr, added noise
        else:
            qty = np.random.randint(500, 1500)  # measured in boxes
            crew = np.random.randint(15, 30)  # subject to change
            rate = np.round(np.random.uniform(30.0, 45.0), 2)
            prod_rate = np.random.normal(7, 1.5)
        
        duration_hours = qty / (crew * max(0.1, prod_rate))
        duration_minutes = duration_hours * 60
        
        quantities.append(qty)
        crew_sizes.append(crew)
        pay_rates.append(rate)
        service_times.append(round(duration_minutes, 1))
        total_payouts.append(round(qty * rate, 2))
    
    # Queuing logic
    # Constant arrival time
    inter_arrival_const = np.full(num_jobs, arrival_rate_minutes)
    arrival_times_const = np.cumsum(inter_arrival_const)
    
    # Exponential arrival time (Poisson process)
    inter_arrival_poisson = np.random.exponential(scale=arrival_rate_minutes, size=num_jobs)
    arrival_times_poisson = np.cumsum(inter_arrival_poisson)
    
    df = pd.DataFrame({
        'Job_ID': job_ids,
        'Crop_Type': crops,
        'Quantity_Units': quantities,
        'Unit_Type': ['Buckets' if c == 'Tomato' else 'Flats' for c in crops],
        'Workers_Requested': crew_sizes,
        'Pay_Rate_MXN': pay_rates,
        'Total_Job_Value_MXN': total_payouts,
        'Service_Time_Mins': service_times,
        'Arrival_Time_Const': arrival_times_const,
        'Arrival_Time_Poisson': arrival_times_poisson
    })
    
    return df


def convert_to_job_format(df: pd.DataFrame, base_date: datetime = None) -> List[Dict[str, Any]]:
    """
    Convert the generated DataFrame to the format expected by the frontend.
    
    Args:
        df: DataFrame from generate_baja_harvest_data
        base_date: Base date to calculate job dates from arrival times
    
    Returns:
        List of job dictionaries in frontend format
    """
    if base_date is None:
        base_date = datetime.now()
    
    jobs = []
    farm_names = ['Farm A', 'Farm B', 'Farm C', 'Farm D', 'Farm E', 'Farm F']
    
    for _, row in df.iterrows():
        # Calculate job date based on Poisson arrival time
        arrival_minutes = row['Arrival_Time_Poisson']
        job_date = base_date + timedelta(minutes=arrival_minutes)
        
        # Format job title
        crop = row['Crop_Type']
        if crop == 'Tomato':
            title = f"{crop} Picker"
        else:
            title = f"{crop} Harvester"
        
        # Format pay rate
        pay_rate = row['Pay_Rate_MXN']
        if crop == 'Tomato':
            pay_str = f"${pay_rate:.2f}/bucket"
        else:
            pay_str = f"${pay_rate:.2f}/flat"
        
        # Select farm location
        farm_idx = int(row['Job_ID']) % len(farm_names)
        location = farm_names[farm_idx]
        
        # Create description
        description = (
            f"{crop} harvesting job. "
            f"Quantity: {int(row['Quantity_Units'])} {row['Unit_Type']}. "
            f"Workers needed: {int(row['Workers_Requested'])}. "
            f"Estimated duration: {int(row['Service_Time_Mins'])} minutes."
        )
        
        jobs.append({
            'id': int(row['Job_ID']),
            'title': title,
            'pay': pay_str,
            'location': location,
            'date': job_date.strftime('%Y-%m-%d'),
            'description': description,
            # Additional metadata for backend use
            'crop_type': crop,
            'quantity': int(row['Quantity_Units']),
            'workers_requested': int(row['Workers_Requested']),
            'pay_rate_mxn': float(pay_rate),
            'total_value_mxn': float(row['Total_Job_Value_MXN']),
            'service_time_mins': float(row['Service_Time_Mins']),
            'arrival_time_poisson': float(row['Arrival_Time_Poisson']),
        })
    
    return jobs

