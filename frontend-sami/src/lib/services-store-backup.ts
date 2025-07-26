"use client"

import { create } from 'zustand'
import { subscribeWithSelector } from 'zustand/middleware'
import { servicesApi, dependenciesApi, bulkApi, type Service, type Dependency, type BulkSaveRequest } from '@/lib/services-api'

interface ServiceBaseFields {
  pos_x: number
  pos_y: number
  name?: string
  description?: string
  type?: string
  version?: string
  language?: string
  environment?: string
  deploy_url?: string
  domain?: string
  git_repo?: string
  notes?: string
  status?: string
}

interface DependencyBaseFields {
  source_id: number
  target_id: number
  type?: string
  description?: string
  protocol?: string
  method?: string
}

interface PendingChanges {
  services: Set<number>
  dependencies: Set<number>
  deletedServices: Set<number>
  deletedDependencies: Set<number>
}

interface HistoryEntry {
  services: Service[]
  dependencies: Dependency[]
  timestamp: Date
  action: string
}

interface ServicesState {
  // Estado principal
  services: Service[]
  dependencies: Dependency[]
  projectId: number | null
  loading: boolean
  error: string | null
  
  // Estados de sincronización
  isDirty: boolean
  lastSaved: Date | null
  savingInProgress: boolean
  autoSaveEnabled: boolean
  saveInterval: number // en segundos
  autoSaveCountdown: number // segundos restantes para el próximo auto-guardado
  
  // Metadatos para seguimiento de cambios
  pendingChanges: PendingChanges
  
  // Sistema de undo
  history: HistoryEntry[]
  currentHistoryIndex: number
  maxHistorySize: number
  
  // Acciones principales
  setProject: (projectId: number) => void
  loadFromServer: (token: string) => Promise<void>
  
  // Acciones locales (no guardan inmediatamente)
  addService: (service: Service) => void
  updateService: (serviceId: number, updates: Partial<Service>) => void
  removeService: (serviceId: number) => void
  
  addDependency: (dependency: Dependency) => void
  updateDependency: (dependencyId: number, updates: Partial<Dependency>) => void
  removeDependency: (dependencyId: number) => void
  
  // Acciones de persistencia
  saveToServer: (token: string, force?: boolean) => Promise<boolean>
  enableAutoSave: () => void
  disableAutoSave: () => void
  setSaveInterval: (seconds: number) => void
  
  // Sistema de undo/redo
  saveToHistory: (action: string) => void
  undo: () => boolean
  redo: () => boolean
  canUndo: () => boolean
  canRedo: () => boolean
  clearHistory: () => void
  
  // Utilidades
  hasUnsavedChanges: () => boolean
  clearChanges: () => void
  reset: () => void
}

let autoSaveTimer: NodeJS.Timeout | null = null
let countdownTimer: NodeJS.Timeout | null = null

export const useServicesStore = create<ServicesState>()(
  subscribeWithSelector((set, get) => ({
    // Estado inicial
    services: [],
    dependencies: [],
    projectId: null,
    loading: false,
    error: null,
    
    isDirty: false,
    lastSaved: null,
    savingInProgress: false,
    autoSaveEnabled: false,
    saveInterval: 30, // 30 segundos por defecto
    autoSaveCountdown: 30, // inicia con el valor del saveInterval
    
    pendingChanges: {
      services: new Set<number>(),
      dependencies: new Set<number>(),
      deletedServices: new Set<number>(),
      deletedDependencies: new Set<number>(),
    },
    
    history: [],
    currentHistoryIndex: -1,
    maxHistorySize: 100,
    
    setProject: (projectId: number) => {
      set({ projectId, services: [], dependencies: [], isDirty: false })
    },
    
    loadFromServer: async (token: string) => {
      const { projectId } = get()
      if (!projectId) return
      
      set({ loading: true, error: null })
      
      try {
        const [servicesData, dependenciesData] = await Promise.all([
          servicesApi.getServices(projectId, token),
          dependenciesApi.getDependencies(projectId, token),
        ])
        
        set({
          services: servicesData,
          dependencies: dependenciesData,
          loading: false,
          isDirty: false,
          lastSaved: new Date(),
          pendingChanges: {
            services: new Set(),
            dependencies: new Set(),
            deletedServices: new Set(),
            deletedDependencies: new Set(),
          },
          history: [],
          currentHistoryIndex: -1
        })
        
      } catch (error) {
        const errorMessage = error instanceof Error ? error.message : 'Error loading data'
        set({ error: errorMessage, loading: false })
        throw error
      }
    },
    
    addService: (service: Service) => {
      // Guardar estado actual antes del cambio
      get().saveToHistory('Add Service')
      
      set((state) => ({
        services: [...state.services, service],
        isDirty: true,
        pendingChanges: {
          ...state.pendingChanges,
          services: new Set([...state.pendingChanges.services, service.id])
        }
      }))
    },
    
    updateService: (serviceId: number, updates: Partial<Service>) => {
      // Para movimientos de drag, el historial ya se guardó en handleNodeDragStart
      // Solo guardar historial para cambios que NO sean movimientos de drag
      const isDragUpdate = updates.pos_x !== undefined || updates.pos_y !== undefined
      const isOnlyDragUpdate = isDragUpdate && Object.keys(updates).every(key => key === 'pos_x' || key === 'pos_y')
      
      if (!isOnlyDragUpdate) {
        get().saveToHistory('Update Service')
      }
      
      set((state) => ({
        services: state.services.map(s => s.id === serviceId ? { ...s, ...updates } : s),
        isDirty: true,
        pendingChanges: {
          ...state.pendingChanges,
          services: new Set([...state.pendingChanges.services, serviceId])
        }
      }))
    },
    
    removeService: (serviceId: number) => {
      // Guardar estado actual antes del cambio
      get().saveToHistory('Remove Service')
      
      set((state) => ({
        services: state.services.filter(s => s.id !== serviceId),
        dependencies: state.dependencies.filter(d => d.source_id !== serviceId && d.target_id !== serviceId),
        isDirty: true,
        pendingChanges: {
          ...state.pendingChanges,
          deletedServices: new Set([...state.pendingChanges.deletedServices, serviceId]),
          // Remover de pendientes si estaba ahí
          services: new Set([...state.pendingChanges.services].filter(id => id !== serviceId))
        }
      }))
    },
    
    addDependency: (dependency: Dependency) => {
      // Guardar estado actual antes del cambio
      get().saveToHistory('Add Dependency')
      
      set((state) => ({
        dependencies: [...state.dependencies, dependency],
        isDirty: true,
        pendingChanges: {
          ...state.pendingChanges,
          dependencies: new Set([...state.pendingChanges.dependencies, dependency.id])
        }
      }))
    },
    
    updateDependency: (dependencyId: number, updates: Partial<Dependency>) => {
      // Guardar estado actual antes del cambio
      get().saveToHistory('Update Dependency')
      
      set((state) => ({
        dependencies: state.dependencies.map(d => d.id === dependencyId ? { ...d, ...updates } : d),
        isDirty: true,
        pendingChanges: {
          ...state.pendingChanges,
          dependencies: new Set([...state.pendingChanges.dependencies, dependencyId])
        }
      }))
    },
    
    removeDependency: (dependencyId: number) => {
      // Guardar estado actual antes del cambio
      get().saveToHistory('Remove Dependency')
      
      set((state) => {
        // Si la dependencia tiene ID temporal (negativo), solo removerla del estado local
        if (dependencyId < 0) {
          return {
            dependencies: state.dependencies.filter(d => d.id !== dependencyId),
            isDirty: state.pendingChanges.services.size > 0 || 
                    state.pendingChanges.dependencies.size > 1 || 
                    state.pendingChanges.deletedServices.size > 0 || 
                    state.pendingChanges.deletedDependencies.size > 0,
            pendingChanges: {
              ...state.pendingChanges,
              dependencies: new Set([...state.pendingChanges.dependencies].filter(id => id !== dependencyId))
            }
          }
        }
        
        // Si la dependencia tiene ID real (positivo), marcarla para eliminación en servidor
        return {
          dependencies: state.dependencies.filter(d => d.id !== dependencyId),
          isDirty: true,
          pendingChanges: {
            ...state.pendingChanges,
            deletedDependencies: new Set([...state.pendingChanges.deletedDependencies, dependencyId]),
            dependencies: new Set([...state.pendingChanges.dependencies].filter(id => id !== dependencyId))
          }
        }
      })
    },
    
    saveToServer: async (token: string, force = false) => {
      const state = get()
      
      if (!state.isDirty && !force) {
        return true // Nada que guardar
      }
      
      if (!state.projectId) {
        throw new Error('No hay proyecto seleccionado')
      }
      
      set({ savingInProgress: true, error: null })
      
      try {
        const { pendingChanges } = state
        
        // Preparar datos para bulk save
        const bulkData: BulkSaveRequest = {
          services: [],
          dependencies: [],
          updated_services: [],
          updated_dependencies: [],
          deleted_services: Array.from(pendingChanges.deletedServices).filter(id => id > 0),
          deleted_dependencies: Array.from(pendingChanges.deletedDependencies).filter(id => id > 0),
        }
        
        // Preparar servicios (nuevos y actualizados)
        for (const serviceId of pendingChanges.services) {
          const service = state.services.find(s => s.id === serviceId)
          if (service) {
            // Sanitizar datos antes de enviar - asegurar valores válidos
            const baseFields: ServiceBaseFields = {
              pos_x: Math.round(service.pos_x || 0),
              pos_y: Math.round(service.pos_y || 0)
            }

            // Campos requeridos/importantes - siempre incluir si tienen valores válidos
            const name = service.name?.trim()
            const type = service.type?.trim()
            const status = service.status?.trim()
            const environment = service.environment?.trim()

            if (name && name.length >= 2) baseFields.name = name
            if (type && type.length >= 2) baseFields.type = type
            if (status && ['active', 'inactive'].includes(status)) baseFields.status = status
            if (environment && ['production', 'development', 'staging'].includes(environment)) baseFields.environment = environment

            // Solo agregar campos opcionales si tienen valores
            if (service.description?.trim()) baseFields.description = service.description.trim()
            if (service.version?.trim()) baseFields.version = service.version.trim()
            if (service.language?.trim()) baseFields.language = service.language.trim()
            if (service.deploy_url?.trim()) baseFields.deploy_url = service.deploy_url.trim()
            if (service.domain?.trim()) baseFields.domain = service.domain.trim()
            if (service.git_repo?.trim()) baseFields.git_repo = service.git_repo.trim()
            if (service.notes?.trim()) baseFields.notes = service.notes.trim()

            if (service.id < 0) {
              // Nuevo servicio
              bulkData.services.push(baseFields as Partial<Service>)
            } else {
              // Servicio existente
              bulkData.updated_services.push({
                id: service.id,
                ...baseFields
              } as Partial<Service>)
            }
          }
        }
        
        // Preparar dependencias (nuevas y actualizadas)
        for (const dependencyId of pendingChanges.dependencies) {
          const dependency = state.dependencies.find(d => d.id === dependencyId)
          if (dependency) {
            // Verificar si la dependencia referencia servicios temporales (IDs negativos)
            const hasTemporaryIds = dependency.source_id < 0 || dependency.target_id < 0
            
            if (hasTemporaryIds) {
              // Saltear dependencias con IDs temporales por ahora
              console.log('⏭️ Saltando dependencia con IDs temporales:', {
                id: dependency.id,
                source_id: dependency.source_id,
                target_id: dependency.target_id
              })
              continue
            }

            const baseFields: DependencyBaseFields = {
              source_id: dependency.source_id,
              target_id: dependency.target_id
            }

            // Solo agregar campos opcionales si tienen valores
            if (dependency.type?.trim()) baseFields.type = dependency.type.trim()
            if (dependency.description?.trim()) baseFields.description = dependency.description.trim()
            if (dependency.protocol?.trim()) baseFields.protocol = dependency.protocol.trim()
            if (dependency.method?.trim()) baseFields.method = dependency.method.trim()

            if (dependency.id < 0) {
              // Nueva dependencia
              bulkData.dependencies.push(baseFields as Partial<Dependency>)
            } else {
              // Dependencia existente
              bulkData.updated_dependencies.push({
                id: dependency.id,
                ...baseFields
              } as Partial<Dependency>)
            }
          }
        }
        
        console.log('📤 Enviando bulk save:', bulkData)
        
        // Realizar bulk save
        const result = await bulkApi.bulkSave(state.projectId, bulkData, token)
        
        console.log('📥 Resultado bulk save:', result)
        
        // Crear mapa de IDs temporales a IDs reales
        const idMapping = new Map<number, number>()
        
        // Mapear servicios creados
        result.created_services.forEach((serverService, index) => {
          const tempService = bulkData.services[index]
          // Encontrar el servicio temporal correspondiente
          const tempServiceInState = state.services.find(s => 
            s.id < 0 && s.name === tempService.name && s.type === tempService.type
          )
          if (tempServiceInState) {
            idMapping.set(tempServiceInState.id, serverService.id)
          }
        })

        console.log('🗺️ Mapa de IDs temporales a reales:', Object.fromEntries(idMapping))

        // Actualizar estado con los datos del servidor
        set((currentState) => {
          let updatedServices = [...currentState.services]
          let updatedDependencies = [...currentState.dependencies]
          
          // Actualizar servicios creados (reemplazar IDs temporales)
          result.created_services.forEach((serverService, index) => {
            const tempService = bulkData.services[index]
            const tempIndex = updatedServices.findIndex(s => 
              s.id < 0 && s.name === tempService.name && s.type === tempService.type
            )
            if (tempIndex !== -1) {
              updatedServices[tempIndex] = serverService
            }
          })
          
          // Actualizar servicios modificados
          result.updated_services.forEach((serverService) => {
            const index = updatedServices.findIndex(s => s.id === serverService.id)
            if (index !== -1) {
              updatedServices[index] = serverService
            }
          })
          
          // Actualizar dependencias creadas (reemplazar IDs temporales)
          result.created_dependencies.forEach((serverDep, index) => {
            const tempDep = bulkData.dependencies[index]
            const tempIndex = updatedDependencies.findIndex(d => 
              d.id < 0 && d.source_id === tempDep.source_id && d.target_id === tempDep.target_id
            )
            if (tempIndex !== -1) {
              updatedDependencies[tempIndex] = serverDep
            }
          })
          
          // Actualizar dependencias modificadas
          result.updated_dependencies.forEach((serverDep) => {
            const index = updatedDependencies.findIndex(d => d.id === serverDep.id)
            if (index !== -1) {
              updatedDependencies[index] = serverDep
            }
          })
          
          // Remover elementos eliminados
          updatedServices = updatedServices.filter(s => 
            !pendingChanges.deletedServices.has(s.id)
          )
          updatedDependencies = updatedDependencies.filter(d => 
            !pendingChanges.deletedDependencies.has(d.id)
          )
          
          return {
            services: updatedServices,
            dependencies: updatedDependencies,
            isDirty: false,
            lastSaved: new Date(),
            savingInProgress: false,
            pendingChanges: {
              services: new Set(),
              dependencies: new Set(),
              deletedServices: new Set(),
              deletedDependencies: new Set(),
            }
          }
        })
        
        // Crear dependencias que fueron saltadas (con IDs temporales)
        const pendingDependencies = []
        for (const dependencyId of state.pendingChanges.dependencies) {
          const dependency = state.dependencies.find(d => d.id === dependencyId)
          if (dependency && (dependency.source_id < 0 || dependency.target_id < 0)) {
            // Mapear IDs temporales a IDs reales
            const realSourceId = dependency.source_id < 0 ? idMapping.get(dependency.source_id) : dependency.source_id
            const realTargetId = dependency.target_id < 0 ? idMapping.get(dependency.target_id) : dependency.target_id
            
            if (realSourceId && realTargetId) {
              const depData: DependencyBaseFields = {
                source_id: realSourceId,
                target_id: realTargetId
              }
              
              if (dependency.type?.trim()) depData.type = dependency.type.trim()
              if (dependency.description?.trim()) depData.description = dependency.description.trim()
              if (dependency.protocol?.trim()) depData.protocol = dependency.protocol.trim()
              if (dependency.method?.trim()) depData.method = dependency.method.trim()
              
              pendingDependencies.push({
                originalDependency: dependency,
                data: depData as Partial<Dependency>
              })
            }
          }
        }

        // Crear dependencias pendientes una por una
        if (pendingDependencies.length > 0) {
          console.log('🔗 Creando dependencias pendientes:', pendingDependencies.length)
          
          for (const { originalDependency, data } of pendingDependencies) {
            try {
              const createdDep = await dependenciesApi.createDependency(state.projectId!, data, token)
              
              // Actualizar la dependencia en el estado
              set((currentState) => ({
                dependencies: currentState.dependencies.map(d => 
                  d.id === originalDependency.id ? createdDep : d
                )
              }))
              
              console.log('✅ Dependencia creada:', createdDep.id)
            } catch (error) {
              console.error('❌ Error creando dependencia:', error)
            }
          }
        }

        console.log('✅ Bulk save exitoso a las', new Date().toLocaleTimeString())
        
        return true
        
      } catch (error) {
        let errorMessage = 'Error guardando datos'
        
        if (error instanceof Error) {
          errorMessage = error.message
          console.error('❌ Error bulk save:', {
            message: error.message,
            projectId: state.projectId,
            pendingChanges: state.pendingChanges
          })
        } else {
          console.error('❌ Error desconocido:', error)
        }
        
        set({ 
          error: errorMessage, 
          savingInProgress: false 
        })
        throw error
      }
    },
    
    enableAutoSave: () => {
      const state = get()
      
      // Limpiar timers existentes
      if (autoSaveTimer) {
        clearInterval(autoSaveTimer)
      }
      if (countdownTimer) {
        clearInterval(countdownTimer)
      }
      
      set({ 
        autoSaveEnabled: true,
        autoSaveCountdown: state.saveInterval // Resetear countdown
      })
      
      // Timer para el countdown que se ejecuta cada segundo
      countdownTimer = setInterval(() => {
        const currentState = get()
        if (currentState.autoSaveCountdown > 0) {
          set({ autoSaveCountdown: currentState.autoSaveCountdown - 1 })
        }
      }, 1000)
      
      // Timer para auto-guardado
      autoSaveTimer = setInterval(async () => {
        const currentState = get()
        if (currentState.isDirty && !currentState.savingInProgress) {
          const token = localStorage.getItem('token')
          if (token) {
            try {
              await currentState.saveToServer(token)
              // Resetear countdown después del guardado
              set({ autoSaveCountdown: currentState.saveInterval })
            } catch (error) {
              console.error('Error en auto-guardado:', error)
            }
          }
        } else {
          // Resetear countdown aunque no haya cambios
          set({ autoSaveCountdown: currentState.saveInterval })
        }
      }, state.saveInterval * 1000)
    },
    
    disableAutoSave: () => {
      if (autoSaveTimer) {
        clearInterval(autoSaveTimer)
        autoSaveTimer = null
      }
      if (countdownTimer) {
        clearInterval(countdownTimer)
        countdownTimer = null
      }
      set({ 
        autoSaveEnabled: false,
        autoSaveCountdown: 0
      })
    },
    
    setSaveInterval: (seconds: number) => {
      set({ saveInterval: seconds })
      const { autoSaveEnabled } = get()
      if (autoSaveEnabled) {
        // Restart auto-save with new interval
        get().disableAutoSave()
        get().enableAutoSave()
      }
    },
    
    hasUnsavedChanges: () => {
      const { isDirty } = get()
      return isDirty
    },
    
    clearChanges: () => {
      set({
        isDirty: false,
        pendingChanges: {
          services: new Set(),
          dependencies: new Set(),
          deletedServices: new Set(),
          deletedDependencies: new Set(),
        }
      })
    },
    
    reset: () => {
      if (autoSaveTimer) {
        clearInterval(autoSaveTimer)
        autoSaveTimer = null
      }
      if (countdownTimer) {
        clearInterval(countdownTimer)
        countdownTimer = null
      }
      
      set({
        services: [],
        dependencies: [],
        projectId: null,
        loading: false,
        error: null,
        isDirty: false,
        lastSaved: null,
        savingInProgress: false,
        autoSaveEnabled: false,
        saveInterval: 30,
        autoSaveCountdown: 30,
        pendingChanges: {
          services: new Set(),
          dependencies: new Set(),
          deletedServices: new Set(),
          deletedDependencies: new Set(),
        },
        history: [],
        currentHistoryIndex: -1,
        maxHistorySize: 100
      })
    },
    
    saveToHistory: (action: string) => {
      const state = get()
      const { services, dependencies } = state
      
      // No guardar si no hay servicios (estado vacío inicial)
      if (services.length === 0 && dependencies.length === 0) {
        return
      }
      
      // Crear una copia profunda del estado actual ANTES del cambio
      const historyEntry: HistoryEntry = {
        services: JSON.parse(JSON.stringify(services)),
        dependencies: JSON.parse(JSON.stringify(dependencies)),
        timestamp: new Date(),
        action
      }
      
      let newHistory = [...state.history]
      let newIndex = state.currentHistoryIndex
      
      // Si estamos en el medio del historial (después de hacer undo), 
      // eliminar entradas futuras
      if (newIndex >= 0 && newIndex < newHistory.length - 1) {
        newHistory = newHistory.slice(0, newIndex + 1)
      }
      
      // Agregar nueva entrada
      newHistory.push(historyEntry)
      newIndex = newHistory.length - 1
      
      // Mantener tamaño máximo del historial
      if (newHistory.length > state.maxHistorySize) {
        newHistory.shift()
        newIndex--
      }
      
      set({
        history: newHistory,
        currentHistoryIndex: newIndex
      })
      
      console.log('💾 Saved to history:', action, 'Index:', newIndex, 'Total:', newHistory.length)
    },
    
    undo: () => {
      const state = get()
      
      // Verificar si hay entradas en el historial para hacer undo
      if (state.history.length === 0 || state.currentHistoryIndex < 0) {
        return false
      }
      
      // Obtener la entrada del historial a restaurar
      const historyEntry = state.history[state.currentHistoryIndex]
      
      if (!historyEntry) return false
      
      // Decrementar el índice DESPUÉS de obtener la entrada
      const newIndex = state.currentHistoryIndex - 1
      
      set({
        services: JSON.parse(JSON.stringify(historyEntry.services)),
        dependencies: JSON.parse(JSON.stringify(historyEntry.dependencies)),
        isDirty: true,
        currentHistoryIndex: newIndex,
        pendingChanges: {
          services: new Set(),
          dependencies: new Set(),
          deletedServices: new Set(),
          deletedDependencies: new Set(),
        }
      })
      
      console.log('🔙 Undo:', historyEntry.action)
      return true
    },
    
    redo: () => {
      const state = get()
      
      // Verificar si podemos hacer redo (hay entradas futuras en el historial)
      const nextIndex = state.currentHistoryIndex + 2 // +2 porque queremos el estado después del actual
      if (nextIndex >= state.history.length) {
        return false
      }
      
      const historyEntry = state.history[nextIndex]
      
      if (!historyEntry) return false
      
      set({
        services: JSON.parse(JSON.stringify(historyEntry.services)),
        dependencies: JSON.parse(JSON.stringify(historyEntry.dependencies)),
        isDirty: true,
        currentHistoryIndex: nextIndex,
        pendingChanges: {
          services: new Set(),
          dependencies: new Set(),
          deletedServices: new Set(),
          deletedDependencies: new Set(),
        }
      })
      
      console.log('🔄 Redo:', historyEntry.action)
      return true
    },
    
    canUndo: () => {
      const state = get()
      return state.history.length > 0 && state.currentHistoryIndex >= 0
    },
     
    canRedo: () => {
      const state = get()
      return state.currentHistoryIndex + 2 < state.history.length
    },
    
    clearHistory: () => {
      set({
        history: [],
        currentHistoryIndex: -1
      })
      console.log('🧹 History cleared')
    }
  }))
)

// Utilidad para generar IDs temporales para nuevos elementos
let nextTempId = -1
export const generateTempId = () => nextTempId-- 