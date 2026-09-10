export interface JobOpportunity {
  id: number;
  title: string;
  company: string;
  type: 'Estágio' | 'Full-time' | 'Part-time' | 'Bolsa';
  location: string;
  description: string;
  requirements: string[];
  postedDate: string;
}

export interface Project {
  id: number;
  title: string;
  category: string;
  description: string;
  imageUrl: string;
}

export interface TeamMember {
  id: number;
  name: string;
  role: string;
  imageUrl: string;
}

export enum ExecutionStatus {
  IDLE = 'IDLE',
  RUNNING = 'RUNNING',
  SUCCESS = 'SUCCESS',
  ERROR = 'ERROR',
  TIMEOUT = 'TIMEOUT',
  SECURITY_VIOLATION = 'SECURITY_VIOLATION'
}

export interface ExecutionResult {
  status: ExecutionStatus;
  output: string;
  details?: string;
  hint?: string; // Novo campo para dicas da IA
  passedTests?: number;
  totalTests?: number;
}

export type Language = 'c' | 'java';

export interface Exercise {
  id: string;
  title: string;
  description: string;
  initialCode: string;
  solutionCode?: string;
  testCases: { input: string; expectedOutput: string }[];
}

export interface Course {
  id: string;
  name: string;
  shortName: string;
  language: Language;
  exercises: Exercise[];
}