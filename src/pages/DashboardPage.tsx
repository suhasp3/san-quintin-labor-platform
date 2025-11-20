import { useState } from 'react';
import JobForm from '../components/JobForm';
import type { Job } from '../types';
import { formatDate } from '../utils/dateFormatter';

export default function DashboardPage() {
  const [submittedJobs, setSubmittedJobs] = useState<Job[]>([]);

  const handleSubmit = async (jobData: {
    title: string;
    pay: string;
    location: string;
    date: string;
    description?: string;
  }) => {
    try {
      const response = await fetch('http://localhost:8000/jobs', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(jobData),
      });

      if (!response.ok) {
        throw new Error('Failed to post job');
      }

      const newJob: Job = await response.json();
      alert('Job posted successfully!');
      setSubmittedJobs([...submittedJobs, newJob]);
    } catch (error) {
      console.error('Error posting job:', error);
      alert('Error posting job. Please try again.');
    }
  };

  return (
    <div className="min-h-screen bg-gray-50 pb-20">
      <div className="bg-primary text-white p-6 shadow-md">
        <h1 className="text-2xl font-bold">Post Job</h1>
        <p className="text-sm mt-1 opacity-90">Create a new job listing</p>
      </div>

      <div className="p-4">
        <div className="bg-white rounded-lg shadow-md p-6 mb-6">
          <JobForm onSubmit={handleSubmit} />
        </div>

        {submittedJobs.length > 0 && (
          <div className="bg-white rounded-lg shadow-md p-4">
            <h2 className="text-lg font-semibold mb-3">Recently Posted Jobs</h2>
            <div className="space-y-2">
              {submittedJobs.slice(-3).map((job) => (
                <div key={job.id} className="border-l-4 border-primary pl-3 py-2">
                  <p className="font-medium">{job.title}</p>
                  <p className="text-sm text-gray-600">{job.location} • {formatDate(job.date)}</p>
                </div>
              ))}
            </div>
          </div>
        )}
      </div>
    </div>
  );
}

