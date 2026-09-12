export type CollaboratorStatus = 'pending' | 'contacted' | 'accepted' | 'rejected';

export interface CollaboratorApplication {
  id: string;
  name: string;
  student_number: string;
  email: string;
  phone: string;
  academic_year: string;
  course: string;
  areas_of_interest: string;
  motivation: string;
  status: CollaboratorStatus;
  notes?: string;
  created_at: string;
}

export interface ApplyCollaboratorPayload {
  name: string;
  student_number: string;
  email?: string;
  phone: string;
  academic_year: string;
  course: string;
  areas_of_interest: string[] | string;
  motivation: string;
}

export interface ApplyCollaboratorResponse {
  success: boolean;
  message?: string;
  application?: CollaboratorApplication;
  error?: string;
}
