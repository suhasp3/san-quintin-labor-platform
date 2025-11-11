import { useState, useEffect } from 'react';
import type { Job, Contract } from '../types';
import JobCard from '../components/JobCard';

export default function JobsPage() {
  const [jobs, setJobs] = useState<Job[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    fetchJobs();
  }, []);

  const fetchJobs = async () => {
    try {
      setLoading(true);
      const response = await fetch('http://localhost:8000/jobs');
      if (!response.ok) {
        throw new Error('Error loading jobs');
      }
      const data = await response.json();
      setJobs(data);
    } catch (err) {
      setError('Could not load jobs. Please verify the server is running.');
      console.error('Error fetching jobs:', err);
      // Fallback to sample data
      setJobs([
        { id: 1, title: 'Tomato Picker', pay: '$12/hr', location: 'Farm A', date: 'Nov 20, 2025' },
        { id: 2, title: 'Berry Harvester', pay: '$10/hr', location: 'Farm B', date: 'Nov 21, 2025' },
      ]);
    } finally {
      setLoading(false);
    }
  };

  const handleApply = async (jobId: number, audioBlob?: Blob) => {
    try {
      // In a real app, you would upload the audio blob to the server
      if (audioBlob) {
        console.log('Audio blob size:', audioBlob.size);
        // You could upload it here: await uploadAudio(jobId, audioBlob);
      }

      // Find the job and create a contract
      const job = jobs.find((j) => j.id === jobId);
      if (job) {
        const newContract: Contract = {
          id: Date.now(),
          jobId: job.id,
          jobTitle: job.title,
          pay: job.pay,
          location: job.location,
          date: job.date,
          status: 'pending',
        };

        // Save to localStorage
        const existingContracts = localStorage.getItem('contracts');
        const contracts: Contract[] = existingContracts
          ? JSON.parse(existingContracts)
          : [];
        contracts.push(newContract);
        localStorage.setItem('contracts', JSON.stringify(contracts));
      }

      alert('Application submitted! The employer will review your application.');
    } catch (err) {
      console.error('Error applying to job:', err);
      alert('Error submitting application. Please try again.');
    }
  };

  return (
    <div className="min-h-screen bg-gray-50 pb-20">
      <div className="bg-primary text-white p-6 shadow-md">
        <h1 className="text-2xl font-bold">Available Jobs</h1>
        <p className="text-sm mt-1 opacity-90">Find work in San Quintín</p>
      </div>

      <div className="p-4">
        {loading ? (
          <div className="text-center py-12">
            <div className="text-4xl mb-4">⏳</div>
            <p className="text-gray-600">Loading jobs...</p>
          </div>
        ) : error ? (
          <div className="bg-yellow-50 border border-yellow-200 rounded-lg p-4 mb-4">
            <p className="text-yellow-800 text-sm">{error}</p>
          </div>
        ) : null}

        {jobs.length === 0 && !loading ? (
          <div className="text-center py-12">
            <div className="text-4xl mb-4">📭</div>
            <p className="text-gray-600">No jobs available at this time</p>
          </div>
        ) : (
          jobs.map((job) => (
            <JobCard key={job.id} job={job} onApply={handleApply} />
          ))
        )}
      </div>
    </div>
  );
}

