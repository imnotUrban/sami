"use client"

import { useCallback, useEffect, useMemo, useState } from 'react'
import { useRouter } from 'next/navigation'
import { type Node, type Edge, type Connection, MarkerType } from 'reactflow'
import { useServicesStore, generateTempId } from '@/lib/services-store'
import { type Service, type Dependency } from '@/lib/services-api'

interface FlowHookOptions {
  projectId: number
  autoSaveInterval?: number // en segundos, por defecto 30
  enableAutoSave?: boolean // por defecto true
}

export function useServicesFlow({ 
  projectId, 
  autoSaveInterval = 30,
  enableAutoSave = true 
}: FlowHookOptions) {
  const router = useRouter()
  
  // Estado para copiar/pegar
  const [copiedService, setCopiedService] = useState<Service | null>(null)
  
  // Zustand store
  const {
    services,
    dependencies,
    loading,
    error,
    isDirty,
    lastSaved,
    savingInProgress,
    autoSaveEnabled,
    autoSaveCountdown,
    
    // Acciones
    setProject,
    loadFromServer,
    addService,
    updateService,
    removeService,
    addDependency,
    updateDependency,
    removeDependency,
    saveToServer,
    enableAutoSave: enableStoreAutoSave,
    disableAutoSave,
    setSaveInterval,
    hasUnsavedChanges,
    reset
  } = useServicesStore()

  // Helper para obtener token
  const getAuthToken = useCallback((): string | null => {
    const token = localStorage.getItem('token')
    if (!token) {
      router.push('/login')
      return null
    }
    return token
  }, [router])

  // Inicializar cuando cambia el proyecto
  useEffect(() => {
    if (projectId) {
      setProject(projectId)
      setSaveInterval(autoSaveInterval)
      
      // Cargar datos iniciales
      const token = getAuthToken()
      if (token) {
        loadFromServer(token).catch(console.error)
      }
    }
  }, [projectId, autoSaveInterval, setProject, setSaveInterval, loadFromServer, getAuthToken])

  // Configurar autosave
  useEffect(() => {
    if (enableAutoSave && !autoSaveEnabled) {
      enableStoreAutoSave()
    } else if (!enableAutoSave && autoSaveEnabled) {
      disableAutoSave()
    }
    
    return () => {
      if (autoSaveEnabled) {
        disableAutoSave()
      }
    }
  }, [enableAutoSave, autoSaveEnabled, enableStoreAutoSave, disableAutoSave])

  // Convertir services a nodes para React Flow
  const nodes: Node[] = useMemo(() => {
    return services.map((service) => ({
      id: service.id.toString(),
      type: 'serviceNode',
      position: { 
        x: service.pos_x || 0, 
        y: service.pos_y || 0 
      },
      data: service,
      draggable: true,
    }))
  }, [services])

  // Convertir dependencies a edges para React Flow
  const edges: Edge[] = useMemo(() => {
    return dependencies.map((dep, index) => {
      // Lógica para determinar el estilo del edge basado en tipo y protocolo
      const getEdgeStyle = (type: string, protocol: string) => {
        const lowerType = type?.toLowerCase() || ''
        const lowerProtocol = protocol?.toLowerCase() || ''
        
        if (lowerType.includes('database') || lowerProtocol.includes('postgresql') || 
            lowerProtocol.includes('mysql') || lowerProtocol.includes('mongodb')) {
          return { color: '#10b981', dashArray: '0' }
        }
        
        if (lowerType.includes('message queue') || lowerType.includes('queue') ||
            lowerProtocol.includes('kafka') || lowerProtocol.includes('rabbitmq')) {
          return { color: '#f59e0b', dashArray: '8,4' }
        }
        
        if (lowerType.includes('cache') || lowerProtocol.includes('redis')) {
          return { color: '#ef4444', dashArray: '0' }
        }
        
        if (lowerType.includes('grpc') || lowerProtocol.includes('grpc')) {
          return { color: '#8b5cf6', dashArray: '0' }
        }
        
        if (lowerProtocol.includes('websocket')) {
          return { color: '#06b6d4', dashArray: '4,2' }
        }
        
        // Default HTTP/REST
        return { color: '#3b82f6', dashArray: '0' }
      }

      const edgeStyle = getEdgeStyle(dep.type || '', dep.protocol || '')
      
      return {
        id: dep.id.toString(),
        source: dep.source_id.toString(),
        target: dep.target_id.toString(),
        label: `${dep.protocol || 'HTTP'} - ${dep.method || 'GET'}`,
        type: "smoothstep",
        animated: dep.protocol?.toLowerCase().includes('kafka') || 
                 dep.type?.toLowerCase().includes('queue') ||
                 dep.protocol?.toLowerCase().includes('websocket'),
        style: {
          stroke: edgeStyle.color,
          strokeWidth: 2,
          strokeDasharray: edgeStyle.dashArray,
        },
        markerEnd: {
          type: MarkerType.ArrowClosed,
          color: edgeStyle.color,
          width: 25,
          height: 25,
        },
        labelStyle: {
          fill: edgeStyle.color,
          fontWeight: 600,
          fontSize: 11,
        },
        labelBgStyle: {
          fill: '#ffffff',
          fillOpacity: 0.95,
          stroke: edgeStyle.color,
          strokeWidth: 1,
          strokeOpacity: 0.3,
        },
        labelBgPadding: [6, 3] as [number, number],
        labelBgBorderRadius: 4,
      }
    })
  }, [dependencies])

  // Handlers optimizados para React Flow

  const handleNodeDragStart = useCallback((event: any, node: Node) => {
    // Guardar historial antes de empezar el drag
    useServicesStore.getState().saveToHistory('Move Service')
  }, [])

  const handleNodeDragStop = useCallback((event: any, node: Node) => {
    // Solo actualiza la posición localmente, se guardará con autosave
    updateService(parseInt(node.id), {
      pos_x: node.position.x,
      pos_y: node.position.y
    })
  }, [updateService])

  const handleConnect = useCallback(async (params: Edge | Connection) => {
    const sourceService = services.find((s) => s.id.toString() === params.source)
    const targetService = services.find((s) => s.id.toString() === params.target)

    const newDependency: Dependency = {
      id: generateTempId(), // ID temporal hasta que se guarde
      source_id: parseInt(params.source!),
      target_id: parseInt(params.target!),
      type: "HTTP",
      description: `${sourceService?.name} calls ${targetService?.name}`,
      protocol: "REST",
      method: "GET",
      created_by: 1, // TODO: usar ID de usuario actual
      created_at: new Date().toISOString(),
      updated_at: new Date().toISOString(),
    }

    // Agregar localmente - se guardará con autosave o manualmente
    addDependency(newDependency)
  }, [services, projectId, addDependency])

  // Funciones para manejo de servicios
  const createService = useCallback(async (serviceData: Partial<Service>) => {
    const newService: Service = {
      id: generateTempId(), // ID temporal
      project_id: projectId,
      name: serviceData.name || 'New Service',
      description: serviceData.description || '',
      type: serviceData.type || 'API',
      language: serviceData.language || '',
      version: serviceData.version || '',
      status: serviceData.status || 'active',
      environment: serviceData.environment || 'development',
      pos_x: Math.random() * 400,
      pos_y: Math.random() * 400,
      created_by: 1, // TODO: usar ID de usuario actual
      created_at: new Date().toISOString(),
      updated_at: new Date().toISOString(),
      ...serviceData
    }
    
    addService(newService)
    return newService
  }, [projectId, addService])

  const editService = useCallback(async (serviceId: number, updates: Partial<Service>) => {
    updateService(serviceId, updates)
  }, [updateService])

  const deleteService = useCallback(async (serviceId: number) => {
    removeService(serviceId)
  }, [removeService])

  // Funciones para manejo de dependencias
  const createDependency = useCallback(async (dependencyData: Partial<Dependency>) => {
    const newDependency: Dependency = {
      id: generateTempId(),
      source_id: dependencyData.source_id!,
      target_id: dependencyData.target_id!,
      type: dependencyData.type || 'HTTP',
      description: dependencyData.description || '',
      protocol: dependencyData.protocol || 'REST',
      method: dependencyData.method || 'GET',
      created_by: 1, // TODO: usar ID de usuario actual
      created_at: new Date().toISOString(),
      updated_at: new Date().toISOString(),
      ...dependencyData
    }
    
    addDependency(newDependency)
    return newDependency
  }, [projectId, addDependency])

  const editDependency = useCallback(async (dependencyId: number, updates: Partial<Dependency>) => {
    updateDependency(dependencyId, updates)
  }, [updateDependency])

  const deleteDependency = useCallback(async (dependencyId: number) => {
    console.log('🗑️ Deleting dependency:', dependencyId)
    const dependency = dependencies.find(d => d.id === dependencyId)
    console.log('🔍 Dependency found:', dependency)
    
    removeDependency(dependencyId)
    
    console.log('✅ Dependency removed from store')
  }, [removeDependency, dependencies])

  // Función para guardado manual (para eventos explícitos)
  const saveChanges = useCallback(async (force = false) => {
    const token = getAuthToken()
    if (!token) return false
    
    try {
      return await saveToServer(token, force)
    } catch (error) {
      console.error('Error saving changes:', error)
      return false
    }
  }, [getAuthToken, saveToServer])

  // Función para refrescar desde servidor
  const refresh = useCallback(async () => {
    const token = getAuthToken()
    if (!token) return
    
    try {
      await loadFromServer(token)
    } catch (error) {
      console.error('Error refreshing data:', error)
    }
  }, [getAuthToken, loadFromServer])

  // Funciones de copiar/pegar
  const copyService = useCallback((service: Service) => {
    setCopiedService(service)
    console.log('📋 Service copied:', service.name)
  }, [])

  const pasteService = useCallback(async (position?: { x: number; y: number }) => {
    if (!copiedService) {
      console.warn('No service to paste')
      return null
    }

    // Generar nombre único
    const baseName = copiedService.name
    const existingNames = services.map(s => s.name)
    let newName = `${baseName} (Copy)`
    let counter = 1
    
    while (existingNames.includes(newName)) {
      counter++
      newName = `${baseName} (Copy ${counter})`
    }

    // Determinar posición
    const newPosition = position || {
      x: (copiedService.pos_x || 0) + 50,
      y: (copiedService.pos_y || 0) + 50
    }

    // Crear el nuevo servicio
    const newService: Service = {
      ...copiedService,
      id: generateTempId(),
      name: newName,
      pos_x: newPosition.x,
      pos_y: newPosition.y,
      created_at: new Date().toISOString(),
      updated_at: new Date().toISOString(),
    }

    addService(newService)
    console.log('📌 Service pasted:', newName)
    return newService
  }, [copiedService, services, addService])

  const duplicateService = useCallback(async (service: Service) => {
    copyService(service)
    return await pasteService()
  }, [copyService, pasteService])

  // Función para manejar atajos de teclado (se llamará desde el componente)
  const handleKeyboardShortcut = useCallback((event: KeyboardEvent, selectedService?: Service | null) => {
    // Solo procesar si Ctrl está presionado (Cmd en Mac)
    if (!(event.ctrlKey || event.metaKey)) return false
    
    switch (event.key.toLowerCase()) {
      case 'c':
        if (selectedService) {
          event.preventDefault()
          copyService(selectedService)
          return true
        }
        break
      case 'v':
        if (copiedService) {
          event.preventDefault()
          pasteService()
          return true
        }
        break
      case 'z':
        if (event.shiftKey) {
          // Ctrl+Shift+Z = Redo
          event.preventDefault()
          const redoResult = useServicesStore.getState().redo()
          if (redoResult) {
            console.log('🔄 Redo action performed')
          }
          return true
        } else {
          // Ctrl+Z = Undo
          event.preventDefault()
          const undoResult = useServicesStore.getState().undo()
          if (undoResult) {
            console.log('↩️ Undo action performed')
          }
          return true
        }
    }
    return false
  }, [copyService, pasteService, copiedService])

  // Limpiar al desmontar
  useEffect(() => {
    return () => {
      if (autoSaveEnabled) {
        // Intentar guardar antes de cerrar si hay cambios
        if (hasUnsavedChanges()) {
          const token = localStorage.getItem('token')
          if (token) {
            saveToServer(token).catch(console.error)
          }
        }
        disableAutoSave()
      }
    }
  }, [autoSaveEnabled, hasUnsavedChanges, saveToServer, disableAutoSave])

  return {
    // Estado de React Flow
    nodes,
    edges,
    
    // Estado de la aplicación
    services,
    dependencies,
    loading,
    error,
    isDirty,
    lastSaved,
    savingInProgress,
    hasUnsavedChanges: hasUnsavedChanges(),
    
    // Handlers de React Flow
    onNodeDragStart: handleNodeDragStart,
    onNodeDragStop: handleNodeDragStop,
    onConnect: handleConnect,
    
    // CRUD Operations (optimizadas para guardado local)
    createService,
    updateService: editService,
    deleteService,
    
    createDependency,
    updateDependency: editDependency,
    deleteDependency,
    
    // Control de guardado
    saveChanges,
    refresh,
    
    // Control de autosave
    enableAutoSave: enableStoreAutoSave,
    disableAutoSave,
    autoSaveEnabled,
    autoSaveCountdown,
    setSaveInterval,
    
    // Funciones de copiar/pegar
    copyService,
    pasteService,
    duplicateService,
    copiedService,
    handleKeyboardShortcut,
    
    // Funciones de undo/redo
    undo: useServicesStore.getState().undo,
    redo: useServicesStore.getState().redo,
    canUndo: useServicesStore.getState().canUndo,
    canRedo: useServicesStore.getState().canRedo,
    
    // Utilidades
    reset
  }
} 