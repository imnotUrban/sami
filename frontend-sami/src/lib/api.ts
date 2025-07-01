const API_URL = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:8080';

export interface Project {
  id: number;
  name: string;
  slug: string;
  description: string;
  visibility: 'public' | 'private';
  created_at: string;
  updated_at: string;
  owner_id: number;
  owner?: {
    id: number;
    name: string;
    email: string;
    role: string;
    status: string;
    created_at: string;
    last_login?: string;
  };
  status: string;
}

export interface CreateProjectData {
  name: string;
  slug: string;
  description: string;
  visibility: 'public' | 'private';
}

export interface UpdateProjectData {
  name: string;
  description: string;
  visibility: 'public' | 'private';
}

export interface User {
  id: number;
  name: string;
  email: string;
  role: string;
  status: string;
  created_at: string;
  last_login?: string;
}

export interface Collaborator {
  id: number;
  user_id: number;
  project_id: number;
  role: 'viewer' | 'editor' | 'admin';
  created_at: string;
  user: User;
}

export interface AddCollaboratorData {
  email: string;
  role: 'viewer' | 'editor' | 'admin';
}

export interface Comment {
  id: number;
  project_id: number;
  user_id: number;
  service_id?: number;  
  parent_id?: number;   
  content: string;
  type: 'general' | 'issue' | 'improvement';
  created_at: string;
  updated_at: string;
  deleted_at?: string;
  user: User;
  project?: Project;
  replies?: Comment[];
}

export interface CreateCommentData {
  content: string;
  type: 'general' | 'issue' | 'improvement';
  service_id?: number;
  parent_id?: number;
}

export interface UpdateCommentData {
  content: string;
}

export interface CommentFilters {
  service_id?: number;
  type?: 'general' | 'issue' | 'improvement';
}

// Admin interfaces
export interface UserListFilters {
  limit?: number;
  offset?: number;
  status?: 'active' | 'inactive' | 'suspended';
  role?: 'user' | 'admin';
  search?: string;
}

export interface UserStats {
  total_users: number;
  active_users: number;
  inactive_users: number;
  suspended_users: number;
  admin_users: number;
  regular_users: number;
  new_users_last_30_days: number;
  total_projects: number;
  active_projects: number;
}

export interface InviteUserData {
  name: string;
  email: string;
  role?: 'user' | 'admin';
}

export interface InviteUserResponse {
  message: string;
  user: User;
  password: string;
}

class ApiError extends Error {
  status: number;
  
  constructor(message: string, status: number) {
    super(message);
    this.status = status;
    this.name = 'ApiError';
  }
}

const getAuthToken = (): string => {
  const token = localStorage.getItem('token');
  if (!token) {
    throw new ApiError('No authentication token found', 401);
  }
  return token;
};

const handleResponse = async (response: Response) => {
  if (!response.ok) {
    if (response.status === 401) {
      // Clear localStorage and redirect to login
      localStorage.removeItem('token');
      localStorage.removeItem('user');
      window.location.href = '/login';
      throw new ApiError('Unauthorized', 401);
    }
    
    let errorMessage = 'An error occurred';
    try {
      const errorData = await response.json();
      errorMessage = errorData.message || errorMessage;
    } catch {
      // If JSON parsing fails, use the default message
    }
    
    throw new ApiError(errorMessage, response.status);
  }
  
  return response.json();
};

export const projectApi = {
  // Get all projects
  async getProjects(): Promise<Project[]> {
    const token = getAuthToken();
    const response = await fetch(`${API_URL}/projects`, {
      headers: {
        'Authorization': `Bearer ${token}`,
        'Content-Type': 'application/json',
      },
    });
    
    const data = await handleResponse(response);
    return data.projects;
  },

  // Get project by ID
  async getProject(id: number): Promise<Project> {
    const token = getAuthToken();
    const response = await fetch(`${API_URL}/projects/${id}`, {
      headers: {
        'Authorization': `Bearer ${token}`,
        'Content-Type': 'application/json',
      },
    });
    
    const data = await handleResponse(response);
    return data.project;
  },

  // Create new project
  async createProject(data: CreateProjectData): Promise<Project> {
    const token = getAuthToken();
    const response = await fetch(`${API_URL}/projects`, {
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${token}`,
        'Content-Type': 'application/json',
      },
      body: JSON.stringify(data),
    });
    
    const result = await handleResponse(response);
    return result.project;
  },

  // Update project
  async updateProject(id: number, data: UpdateProjectData): Promise<Project> {
    const token = getAuthToken();
    const response = await fetch(`${API_URL}/projects/${id}`, {
      method: 'PUT',
      headers: {
        'Authorization': `Bearer ${token}`,
        'Content-Type': 'application/json',
      },
      body: JSON.stringify(data),
    });
    
    const result = await handleResponse(response);
    return result.project;
  },

  // Delete project
  async deleteProject(id: number): Promise<void> {
    const token = getAuthToken();
    const response = await fetch(`${API_URL}/projects/${id}`, {
      method: 'DELETE',
      headers: {
        'Authorization': `Bearer ${token}`,
      },
    });
    
    if (!response.ok) {
      if (response.status === 401) {
        localStorage.removeItem('token');
        localStorage.removeItem('user');
        window.location.href = '/login';
        throw new ApiError('Unauthorized', 401);
      }
      throw new ApiError('Failed to delete project', response.status);
    }
  },
};

export const collaboratorApi = {
  // Get project collaborators
  async getProjectCollaborators(projectId: number): Promise<Collaborator[]> {
    const token = getAuthToken();
    const response = await fetch(`${API_URL}/projects/${projectId}/collaborators`, {
      headers: {
        'Authorization': `Bearer ${token}`,
        'Content-Type': 'application/json',
      },
    });
    
    const data = await handleResponse(response);
    return data.collaborators || [];
  },

  // Add collaborator to project
  async addCollaborator(projectId: number, data: AddCollaboratorData): Promise<Collaborator> {
    const token = getAuthToken();
    const response = await fetch(`${API_URL}/projects/${projectId}/collaborators`, {
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${token}`,
        'Content-Type': 'application/json',
      },
      body: JSON.stringify(data),
    });
    
    const result = await handleResponse(response);
    return result.collaborator;
  },

  // Remove collaborator from project
  async removeCollaborator(projectId: number, email: string): Promise<void> {
    const token = getAuthToken();
    const response = await fetch(`${API_URL}/projects/${projectId}/collaborators/${encodeURIComponent(email)}`, {
      method: 'DELETE',
      headers: {
        'Authorization': `Bearer ${token}`,
      },
    });
    
    if (!response.ok) {
      if (response.status === 401) {
        localStorage.removeItem('token');
        localStorage.removeItem('user');
        window.location.href = '/login';
        throw new ApiError('Unauthorized', 401);
      }
      throw new ApiError('Failed to remove collaborator', response.status);
    }
  },

  // Update collaborator role
  async updateCollaboratorRole(projectId: number, userId: number, role: 'viewer' | 'editor' | 'admin'): Promise<Collaborator> {
    const token = getAuthToken();
    const response = await fetch(`${API_URL}/projects/${projectId}/collaborators/${userId}`, {
      method: 'PUT',
      headers: {
        'Authorization': `Bearer ${token}`,
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({ role }),
    });
    
    const result = await handleResponse(response);
    return result.collaborator;
  },
};

export const commentApi = {
  // Get all user accessible comments with optional filters
  async getAllComments(filters?: CommentFilters & { project_id?: number }): Promise<Comment[]> {
    const token = getAuthToken();
    const searchParams = new URLSearchParams();
    
    if (filters?.type) {
      searchParams.append('type', filters.type);
    }
    if (filters?.project_id) {
      searchParams.append('project_id', filters.project_id.toString());
    }
    
    const url = `${API_URL}/comments${searchParams.toString() ? `?${searchParams.toString()}` : ''}`;
    const response = await fetch(url, {
      headers: {
        'Authorization': `Bearer ${token}`,
        'Content-Type': 'application/json',
      },
    });
    
    const data = await handleResponse(response);
    return data.comments || [];
  },

  // Get project comments with optional filters
  async getProjectComments(projectId: number, filters?: CommentFilters): Promise<Comment[]> {
    const token = getAuthToken();
    const searchParams = new URLSearchParams();
    
    if (filters?.service_id) {
      searchParams.append('service_id', filters.service_id.toString());
    }
    if (filters?.type) {
      searchParams.append('type', filters.type);
    }
    
    const url = `${API_URL}/projects/${projectId}/comments${searchParams.toString() ? `?${searchParams.toString()}` : ''}`;
    const response = await fetch(url, {
      headers: {
        'Authorization': `Bearer ${token}`,
        'Content-Type': 'application/json',
      },
    });
    
    const data = await handleResponse(response);
    return data.comments || [];
  },

  // Create a new comment
  async createComment(projectId: number, data: CreateCommentData): Promise<Comment> {
    const token = getAuthToken();
    const response = await fetch(`${API_URL}/projects/${projectId}/comments`, {
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${token}`,
        'Content-Type': 'application/json',
      },
      body: JSON.stringify(data),
    });
    
    const result = await handleResponse(response);
    return result.comment;
  },

  // Get a specific comment by ID
  async getComment(commentId: number): Promise<Comment> {
    const token = getAuthToken();
    const response = await fetch(`${API_URL}/comments/${commentId}`, {
      headers: {
        'Authorization': `Bearer ${token}`,
        'Content-Type': 'application/json',
      },
    });
    
    const data = await handleResponse(response);
    return data.comment;
  },

  // Update a comment
  async updateComment(commentId: number, data: UpdateCommentData): Promise<Comment> {
    const token = getAuthToken();
    const response = await fetch(`${API_URL}/comments/${commentId}`, {
      method: 'PUT',
      headers: {
        'Authorization': `Bearer ${token}`,
        'Content-Type': 'application/json',
      },
      body: JSON.stringify(data),
    });
    
    const result = await handleResponse(response);
    return result.comment;
  },

  // Delete a comment (logical deletion)
  async deleteComment(commentId: number): Promise<void> {
    const token = getAuthToken();
    const response = await fetch(`${API_URL}/comments/${commentId}`, {
      method: 'DELETE',
      headers: {
        'Authorization': `Bearer ${token}`,
      },
    });
    
    if (!response.ok) {
      if (response.status === 401) {
        localStorage.removeItem('token');
        localStorage.removeItem('user');
        window.location.href = '/login';
        throw new ApiError('Unauthorized', 401);
      }
      throw new ApiError('Failed to delete comment', response.status);
    }
  },
};

export const adminApi = {
  // Get all users (admin only)
  async getAllUsers(filters?: UserListFilters): Promise<{ users: User[], total: number }> {
    const token = getAuthToken();
    const searchParams = new URLSearchParams();
    
    if (filters?.limit) searchParams.append('limit', filters.limit.toString());
    if (filters?.offset) searchParams.append('offset', filters.offset.toString());
    if (filters?.status) searchParams.append('status', filters.status);
    if (filters?.role) searchParams.append('role', filters.role);
    if (filters?.search) searchParams.append('search', filters.search);
    
    const url = `${API_URL}/admin/users${searchParams.toString() ? `?${searchParams.toString()}` : ''}`;
    const response = await fetch(url, {
      headers: {
        'Authorization': `Bearer ${token}`,
        'Content-Type': 'application/json',
      },
    });
    
    const data = await handleResponse(response);
    return {
      users: data.users || [],
      total: data.total || 0
    };
  },

  // Invite a new user (admin only)
  async inviteUser(data: InviteUserData): Promise<InviteUserResponse> {
    const token = getAuthToken();
    const response = await fetch(`${API_URL}/admin/users/invite`, {
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${token}`,
        'Content-Type': 'application/json',
      },
      body: JSON.stringify(data),
    });
    
    const result = await handleResponse(response);
    return {
      message: result.message,
      user: result.user,
      password: result.password
    };
  },

  // Get user statistics (admin only)
  async getUserStats(): Promise<UserStats> {
    const token = getAuthToken();
    const response = await fetch(`${API_URL}/admin/users/stats`, {
      headers: {
        'Authorization': `Bearer ${token}`,
        'Content-Type': 'application/json',
      },
    });
    
    const data = await handleResponse(response);
    return data.stats;
  },

  // Update user (admin only)
  async updateUser(userId: number, updates: { status?: string; role?: string }): Promise<User> {
    const token = getAuthToken();
    const response = await fetch(`${API_URL}/admin/users/${userId}`, {
      method: 'PUT',
      headers: {
        'Authorization': `Bearer ${token}`,
        'Content-Type': 'application/json',
      },
      body: JSON.stringify(updates),
    });
    
    const result = await handleResponse(response);
    return result.user;
  },

  // Delete user (admin only)
  async deleteUser(userId: number): Promise<void> {
    const token = getAuthToken();
    const response = await fetch(`${API_URL}/admin/users/${userId}`, {
      method: 'DELETE',
      headers: {
        'Authorization': `Bearer ${token}`,
      },
    });
    
    if (!response.ok) {
      if (response.status === 401) {
        localStorage.removeItem('token');
        localStorage.removeItem('user');
        window.location.href = '/login';
        throw new ApiError('Unauthorized', 401);
      }
      throw new ApiError('Failed to delete user', response.status);
    }
  },
};

// Utility functions
export const generateSlug = (name: string): string => {
  return name
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, '-')
    .replace(/(^-|-$)/g, '');
};

export const formatDate = (dateString: string): string => {
  return new Date(dateString).toLocaleDateString('en-US', {
    year: 'numeric',
    month: 'long',
    day: 'numeric'
  });
};

export { ApiError }; 