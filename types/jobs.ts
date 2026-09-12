export type JobStatus = 'pending' | 'published' | 'rejected';
export type JobType = 'Estágio' | 'Full-time' | 'Part-time' | 'Bolsa';

export interface JobOffer {
  id: string;
  company: string;
  title: string;
  type: JobType;
  location: string;
  email: string;
  phone: string;
  link?: string;
  description: string;
  requirements?: string;
  status: JobStatus;
  notes?: string;
  created_at: string;
}

export interface SubmitJobPayload {
  company: string;
  title: string;
  type: JobType;
  location: string;
  email: string;
  phone: string;
  link?: string;
  description: string;
  requirements?: string;
}

export interface SubmitJobResponse {
  success: boolean;
  message?: string;
  job?: JobOffer;
  error?: string;
}
