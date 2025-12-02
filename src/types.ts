export type Job = {
  id: number;
  title: string;
  pay: string;
  location: string;
  date: string;
  description?: string;
  crop_type?: string;
  workers_requested?: number;
  pay_rate_mxn?: number;
  service_time_mins?: number;
};

export type Contract = {
  id: number;
  jobId: number;
  jobTitle: string;
  pay: string;
  location: string;
  date: string;
  status: 'pending' | 'signed' | 'completed' | 'rejected';
  workerId?: string;
  createdAt?: string;
  contractPdfUrl?: string;
};

