export type Job = {
  id: number;
  title: string;
  pay: string;
  location: string;
  date: string;
  description?: string;
};

export type Contract = {
  id: number;
  jobId: number;
  jobTitle: string;
  pay: string;
  location: string;
  date: string;
  status: 'pending' | 'accepted' | 'rejected';
};

