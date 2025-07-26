// Shared TypeScript interfaces for the application

export interface Service {
  id: number
  name: string
  type: string
  description?: string
  version?: string
  language?: string
  environment?: string
  deploy_url?: string
  domain?: string
  git_repo?: string
  notes?: string
}

export interface ServiceData {
  name: string
  description: string
  type: string
  version: string
  language: string
  environment: string
  deploy_url: string
  domain: string
  git_repo: string
  notes: string
}

export interface Dependency {
  id?: number
  source_id: number
  target_id: number
  type: string
  description: string
  protocol: string
  method: string
}

export interface DependencyData {
  source_id: number
  target_id: number
  type: string
  description: string
  protocol: string
  method: string
}

export interface User {
  id: number
  name: string
  email: string
  role: string
  status: string
  created_at: string
  last_login?: string
}

export interface Project {
  id: number
  name: string
  slug: string
  description: string
  visibility: 'public' | 'private'
  status: 'active' | 'archived'
  created_at: string
  updated_at: string
  owner_id: number
  owner?: User
}

export interface Comment {
  id: number
  content: string
  type: 'general' | 'issue' | 'improvement'
  author_id: number
  author?: User
  project_id?: number
  service_id?: number
  created_at: string
  updated_at: string
}

export interface Collaborator {
  id: number
  user_id: number
  project_id: number
  role: 'viewer' | 'editor' | 'admin'
  created_at: string
  user: User
}

export interface AddCollaboratorData {
  email: string
  role: 'viewer' | 'editor' | 'admin'
} 