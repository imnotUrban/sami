"use client"

import { useState, useEffect, useCallback } from "react"
import { useRouter } from "next/navigation"
import { servicesApi, dependenciesApi, type Service, type Dependency } from "@/lib/services-api"

export function useServices(projectId: number) {
  const [services, setServices] = useState<Service[]>([])
  const [dependencies, setDependencies] = useState<Dependency[]>([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)
  const router = useRouter()

  const getAuthToken = useCallback((): string | null => {
    const token = localStorage.getItem('token')
    if (!token) {
      router.push('/login')
      return null
    }
    return token
  }, [router])

  const refetch = useCallback(async () => {
    const token = getAuthToken()
    if (!token) return

    try {
      setLoading(true)
      setError(null)

      const [servicesData, dependenciesData] = await Promise.all([
        servicesApi.getServices(projectId, token),
        dependenciesApi.getDependencies(projectId, token),
      ])

      setServices(servicesData)
      setDependencies(dependenciesData)
    } catch (err) {
      const errorMessage = err instanceof Error ? err.message : "An error occurred"
      setError(errorMessage)
      console.error('Error fetching services data:', err)
      
      // If it's an auth error, the API should already redirect to login
      if (errorMessage.includes('401') || errorMessage.includes('Unauthorized')) {
        localStorage.removeItem('token')
        localStorage.removeItem('user')
        router.push('/login')
      }
    } finally {
      setLoading(false)
    }
  }, [projectId, router, getAuthToken])

  useEffect(() => {
    if (projectId) {
      refetch()
    }
  }, [projectId, refetch])

  const createService = async (service: Partial<Service>) => {
    const token = getAuthToken()
    if (!token) throw new Error("No token provided")

    try {
      const newService = await servicesApi.createService(projectId, service, token)
      setServices((prev) => [...prev, newService])
      return newService
    } catch (err) {
      const errorMessage = err instanceof Error ? err.message : "Failed to create service"
      setError(errorMessage)
      throw err
    }
  }

  const updateService = async (serviceId: number, service: Partial<Service>) => {
    const token = getAuthToken()
    if (!token) throw new Error("No token provided")

    try {
      const updatedService = await servicesApi.updateService(serviceId, service, token)
      setServices((prev) => prev.map((s) => (s.id === serviceId ? updatedService : s)))
      return updatedService
    } catch (err) {
      const errorMessage = err instanceof Error ? err.message : "Failed to update service"
      setError(errorMessage)
      throw err
    }
  }

  const deleteService = async (serviceId: number) => {
    const token = getAuthToken()
    if (!token) throw new Error("No token provided")

    try {
      await servicesApi.deleteService(serviceId, token)
      setServices((prev) => prev.filter((s) => s.id !== serviceId))
      setDependencies((prev) => prev.filter((d) => d.source_id !== serviceId && d.target_id !== serviceId))
    } catch (err) {
      const errorMessage = err instanceof Error ? err.message : "Failed to delete service"
      setError(errorMessage)
      throw err
    }
  }

  const createDependency = async (dependency: Partial<Dependency>) => {
    const token = getAuthToken()
    if (!token) throw new Error("No token provided")

    try {
      const newDependency = await dependenciesApi.createDependency(projectId, dependency, token)
      setDependencies((prev) => [...prev, newDependency])
      return newDependency
    } catch (err) {
      const errorMessage = err instanceof Error ? err.message : "Failed to create dependency"
      setError(errorMessage)
      throw err
    }
  }

  const updateDependency = async (dependencyId: number, dependency: Partial<Dependency>) => {
    const token = getAuthToken()
    if (!token) throw new Error("No token provided")

    try {
      const updatedDependency = await dependenciesApi.updateDependency(dependencyId, dependency, token)
      setDependencies((prev) => prev.map((d) => (d.id === dependencyId ? updatedDependency : d)))
      return updatedDependency
    } catch (err) {
      const errorMessage = err instanceof Error ? err.message : "Failed to update dependency"
      setError(errorMessage)
      throw err
    }
  }

  const deleteDependency = async (dependencyId: number) => {
    const token = getAuthToken()
    if (!token) throw new Error("No token provided")

    try {
      await dependenciesApi.deleteDependency(dependencyId, token)
      setDependencies((prev) => prev.filter((d) => d.id !== dependencyId))
    } catch (err) {
      const errorMessage = err instanceof Error ? err.message : "Failed to delete dependency"
      setError(errorMessage)
      throw err
    }
  }

  return {
    services,
    dependencies,
    loading,
    error,
    refetch,
    createService,
    updateService,
    deleteService,
    createDependency,
    updateDependency,
    deleteDependency,
  }
} 