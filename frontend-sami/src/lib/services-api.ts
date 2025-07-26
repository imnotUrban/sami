// API functions for services and dependencies
const API_URL = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:8080'

export interface HealthMetrics {
  status?: 'healthy' | 'degraded' | 'unhealthy'
  uptime?: number
  responseTime?: number
  lastChecked?: string
  errorCount?: number
  [key: string]: unknown
}

export interface ServiceMetadata {
  tags?: string[]
  team?: string
  owner?: string
  documentation?: string
  config?: Record<string, unknown>
  [key: string]: unknown
}

export interface Service {
  id: number
  project_id: number
  name: string
  description?: string
  type: string
  status: string
  version?: string
  language?: string
  environment: string
  deploy_url?: string
  domain?: string
  git_repo?: string
  health_metrics?: HealthMetrics
  metadata?: ServiceMetadata
  pos_x?: number
  pos_y?: number
  notes?: string
  created_by: number
  updated_by?: number
  created_at: string
  updated_at: string
}

export interface Dependency {
  id: number
  source_id: number
  target_id: number
  type?: string
  description?: string
  protocol?: string
  method?: string
  created_by: number
  updated_by?: number
  created_at: string
  updated_at: string
}

// Bulk save interfaces
export interface BulkSaveRequest {
  services: Partial<Service>[]
  dependencies: Partial<Dependency>[]
  updated_services: Partial<Service>[]
  updated_dependencies: Partial<Dependency>[]
  deleted_services: number[]
  deleted_dependencies: number[]
}

export interface BulkSaveResult {
  created_services: Service[]
  created_dependencies: Dependency[]
  updated_services: Service[]
  updated_dependencies: Dependency[]
  deleted_services_count: number
  deleted_dependencies_count: number
}

class ApiError extends Error {
  constructor(message: string, public status: number) {
    super(message)
    this.name = 'ApiError'
  }
}

const handleResponse = async (response: Response) => {
  if (!response.ok) {
    if (response.status === 401) {
      // Clear localStorage and redirect to login
      localStorage.removeItem('token')
      localStorage.removeItem('user')
      window.location.href = '/login'
      throw new ApiError('Unauthorized', 401)
    }
    
    let errorMessage = 'An error occurred'
    try {
      const errorData = await response.json()
      errorMessage = errorData.error || errorData.message || errorMessage
      
      // Log detallado del error del backend
      console.error('🚨 Backend Error:', {
        status: response.status,
        url: response.url,
        errorMessage,
        fullErrorData: errorData
      })
    } catch {
      // If JSON parsing fails, use the default message
      console.error('🚨 Failed to parse error response:', {
        status: response.status,
        url: response.url,
        statusText: response.statusText
      })
    }
    
    throw new ApiError(errorMessage, response.status)
  }
  
  return response.json()
}

// Services API
export const servicesApi = {
  // Get all services for a project
  async getServices(projectId: number, token: string): Promise<Service[]> {
    const response = await fetch(`${API_URL}/projects/${projectId}/services`, {
      headers: {
        'Authorization': `Bearer ${token}`,
        'Content-Type': 'application/json',
      },
    })
    
    const data = await handleResponse(response)
    return data.services || []
  },

  // Get a specific service
  async getService(serviceId: number, token: string): Promise<Service> {
    const response = await fetch(`${API_URL}/services/${serviceId}`, {
      headers: {
        'Authorization': `Bearer ${token}`,
        'Content-Type': 'application/json',
      },
    })
    
    const data = await handleResponse(response)
    return data.service
  },

  // Create a new service
  async createService(projectId: number, service: Partial<Service>, token: string): Promise<Service> {
    const response = await fetch(`${API_URL}/projects/${projectId}/services`, {
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${token}`,
        'Content-Type': 'application/json',
      },
      body: JSON.stringify(service),
    })
    
    const data = await handleResponse(response)
    return data.service
  },

  // Update a service
  async updateService(serviceId: number, service: Partial<Service>, token: string): Promise<Service> {
    // Log de la request para debugging
    console.log('📤 UPDATE Service Request:', {
      serviceId,
      url: `${API_URL}/services/${serviceId}`,
      payload: service,
      payloadSize: JSON.stringify(service).length
    })

    const response = await fetch(`${API_URL}/services/${serviceId}`, {
      method: 'PUT',
      headers: {
        'Authorization': `Bearer ${token}`,
        'Content-Type': 'application/json',
      },
      body: JSON.stringify(service),
    })
    
    const data = await handleResponse(response)
    return data.service
  },

  // Delete a service
  async deleteService(serviceId: number, token: string): Promise<void> {
    const response = await fetch(`${API_URL}/services/${serviceId}`, {
      method: 'DELETE',
      headers: {
        'Authorization': `Bearer ${token}`,
      },
    })
    
    if (!response.ok) {
      if (response.status === 401) {
        localStorage.removeItem('token')
        localStorage.removeItem('user')
        window.location.href = '/login'
        throw new ApiError('Unauthorized', 401)
      }
      throw new ApiError('Failed to delete service', response.status)
    }
  },
}

// Dependencies API
export const dependenciesApi = {
  // Get all dependencies for a project
  async getDependencies(projectId: number, token: string): Promise<Dependency[]> {
    const response = await fetch(`${API_URL}/projects/${projectId}/dependencies`, {
      headers: {
        'Authorization': `Bearer ${token}`,
        'Content-Type': 'application/json',
      },
    })
    
    const data = await handleResponse(response)
    return data.dependencies || []
  },

  // Get a specific dependency
  async getDependency(dependencyId: number, token: string): Promise<Dependency> {
    const response = await fetch(`${API_URL}/dependencies/${dependencyId}`, {
      headers: {
        'Authorization': `Bearer ${token}`,
        'Content-Type': 'application/json',
      },
    })
    
    const data = await handleResponse(response)
    return data.dependency
  },

  // Create a new dependency
  async createDependency(projectId: number, dependency: Partial<Dependency>, token: string): Promise<Dependency> {
    const response = await fetch(`${API_URL}/projects/${projectId}/dependencies`, {
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${token}`,
        'Content-Type': 'application/json',
      },
      body: JSON.stringify(dependency),
    })
    
    const data = await handleResponse(response)
    return data.dependency
  },

  // Update a dependency
  async updateDependency(dependencyId: number, dependency: Partial<Dependency>, token: string): Promise<Dependency> {
    const response = await fetch(`${API_URL}/dependencies/${dependencyId}`, {
      method: 'PUT',
      headers: {
        'Authorization': `Bearer ${token}`,
        'Content-Type': 'application/json',
      },
      body: JSON.stringify(dependency),
    })
    
    const data = await handleResponse(response)
    return data.dependency
  },

  // Delete a dependency
  async deleteDependency(dependencyId: number, token: string): Promise<void> {
    const response = await fetch(`${API_URL}/dependencies/${dependencyId}`, {
      method: 'DELETE',
      headers: {
        'Authorization': `Bearer ${token}`,
      },
    })
    
    if (!response.ok) {
      if (response.status === 401) {
        localStorage.removeItem('token')
        localStorage.removeItem('user')
        window.location.href = '/login'
        throw new ApiError('Unauthorized', 401)
      }
      throw new ApiError('Failed to delete dependency', response.status)
    }
  },
}

// Bulk API
export const bulkApi = {
  // Bulk save all changes for a project
  async bulkSave(projectId: number, data: BulkSaveRequest, token: string): Promise<BulkSaveResult> {
    console.log('📤 BULK SAVE Request:', {
      projectId,
      servicesCount: data.services.length,
      dependenciesCount: data.dependencies.length,
      updatedServicesCount: data.updated_services.length,
      updatedDependenciesCount: data.updated_dependencies.length,
      deletedServicesCount: data.deleted_services.length,
      deletedDependenciesCount: data.deleted_dependencies.length,
    })

    const response = await fetch(`${API_URL}/projects/${projectId}/bulk-save`, {
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${token}`,
        'Content-Type': 'application/json',
      },
      body: JSON.stringify(data),
    })
    
    const result = await handleResponse(response)
    
    console.log('📥 BULK SAVE Response:', {
      success: true,
      createdServices: result.result?.created_services?.length || 0,
      createdDependencies: result.result?.created_dependencies?.length || 0,
      updatedServices: result.result?.updated_services?.length || 0,
      updatedDependencies: result.result?.updated_dependencies?.length || 0,
      deletedServices: result.result?.deleted_services_count || 0,
      deletedDependencies: result.result?.deleted_dependencies_count || 0,
    })
    
    return result.result
  },
} 