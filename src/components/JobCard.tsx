import { useState } from 'react';
import type { Job } from '../types';
import VoiceRecorder from './VoiceRecorder';

interface JobCardProps {
  job: Job;
  onApply: (jobId: number, audioBlob?: Blob) => void;
}

export default function JobCard({ job, onApply }: JobCardProps) {
  const [showRecorder, setShowRecorder] = useState(false);

  const handleApply = (audioBlob?: Blob) => {
    onApply(job.id, audioBlob);
    setShowRecorder(false);
  };

  return (
    <div className="bg-white rounded-lg shadow-md p-4 mb-4">
      <div className="flex items-start justify-between mb-3">
        <h3 className="text-lg font-semibold text-gray-800">{job.title}</h3>
      </div>
      
      <div className="space-y-2 mb-4">
        <div className="flex items-center text-gray-600">
          <span className="mr-2">💵</span>
          <span className="font-medium">{job.pay}</span>
        </div>
        <div className="flex items-center text-gray-600">
          <span className="mr-2">📍</span>
          <span>{job.location}</span>
        </div>
        <div className="flex items-center text-gray-600">
          <span className="mr-2">📅</span>
          <span>{job.date}</span>
        </div>
      </div>

      {showRecorder ? (
        <VoiceRecorder
          onRecordComplete={handleApply}
          onCancel={() => setShowRecorder(false)}
        />
      ) : (
        <button
          onClick={() => setShowRecorder(true)}
          className="w-full bg-primary text-white py-3 px-4 rounded-lg font-semibold text-lg hover:bg-green-600 transition-colors active:scale-95"
        >
          Apply 🎤
        </button>
      )}
    </div>
  );
}

