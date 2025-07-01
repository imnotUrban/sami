"use client"

import React from 'react'
import { Badge } from '@/components/ui/badge'
import { Button } from '@/components/ui/button'
import { Card, CardContent } from '@/components/ui/card'
import { 
  Save, 
  Cloud, 
  CloudOff, 
  Clock, 
  CheckCircle, 
  AlertCircle, 
  Loader2,
  Settings 
} from 'lucide-react'

interface SaveStatusIndicatorProps {
  isDirty: boolean
  lastSaved: Date | null
  savingInProgress: boolean
  autoSaveEnabled: boolean
  autoSaveCountdown: number
  hasUnsavedChanges: boolean
  error?: string | null
  onSave: () => Promise<void>
  onToggleAutoSave: () => void
  onOpenSettings?: () => void
  className?: string
}

export function SaveStatusIndicator({
  isDirty,
  lastSaved,
  savingInProgress,
  autoSaveEnabled,
  autoSaveCountdown,
  hasUnsavedChanges,
  error,
  onSave,
  onToggleAutoSave,
  onOpenSettings,
  className = ""
}: SaveStatusIndicatorProps) {
  
  const getStatusIcon = () => {
    if (savingInProgress) {
      return <Loader2 className="h-4 w-4 animate-spin" />
    }
    
    if (error) {
      return <AlertCircle className="h-4 w-4 text-red-500" />
    }
    
    if (hasUnsavedChanges) {
      return <CloudOff className="h-4 w-4 text-yellow-500" />
    }
    
    return <CheckCircle className="h-4 w-4 text-green-500" />
  }
  
  const getStatusText = () => {
    if (savingInProgress) {
      return "Saving..."
    }
    
    if (error) {
      return "Save error"
    }
    
    if (hasUnsavedChanges) {
      return "Unsaved changes"
    }
    
    if (lastSaved) {
      const timeAgo = Math.floor((Date.now() - lastSaved.getTime()) / 1000)
      if (timeAgo < 60) {
        return "Saved a few seconds ago"
      } else if (timeAgo < 3600) {
        const minutes = Math.floor(timeAgo / 60)
        return `Saved ${minutes} minute${minutes > 1 ? 's' : ''} ago`
      } else {
        return `Saved at ${lastSaved.toLocaleTimeString()}`
      }
    }
    
    return "Not saved"
  }
  
  const getStatusVariant = () => {
    if (error) return "destructive"
    if (hasUnsavedChanges) return "secondary"
    return "default"
  }

  return (
    <Card className={`border-0 shadow-sm ${className}`}>
      <CardContent className="p-3">
        <div className="flex items-center justify-between gap-3">
          {/* Estado principal */}
          <div className="flex items-center gap-2">
            {getStatusIcon()}
            <div className="flex flex-col">
              <Badge variant={getStatusVariant()} className="text-xs">
                {getStatusText()}
              </Badge>
              {autoSaveEnabled && (
                <div className="flex items-center gap-1 mt-1">
                  <Clock className="h-3 w-3 text-muted-foreground" />
                  <span className="text-xs text-muted-foreground">
                    Auto-save in {autoSaveCountdown}s
                  </span>
                </div>
              )}
            </div>
          </div>
          
          {/* Controles */}
          <div className="flex items-center gap-1">
            {/* Botón de guardado manual */}
            <Button
              size="sm"
              variant={hasUnsavedChanges ? "default" : "ghost"}
              onClick={onSave}
              disabled={savingInProgress || (!hasUnsavedChanges && !error)}
              className="h-8"
            >
              <Save className="h-3 w-3 mr-1" />
              Save
            </Button>
            
            {/* Toggle auto-save */}
            <Button
              size="sm"
              variant="ghost"
              onClick={onToggleAutoSave}
              className="h-8"
              title={autoSaveEnabled ? "Disable auto-save" : "Enable auto-save"}
            >
              <Cloud className={`h-3 w-3 ${autoSaveEnabled ? 'text-blue-500' : 'text-gray-400'}`} />
            </Button>
            
            {/* Configuración (opcional) */}
            {onOpenSettings && (
              <Button
                size="sm"
                variant="ghost"
                onClick={onOpenSettings}
                className="h-8"
                title="Save settings"
              >
                <Settings className="h-3 w-3" />
              </Button>
            )}
          </div>
        </div>
        
        {/* Mensaje de error expandido */}
        {error && (
          <div className="mt-2 p-2 bg-red-50 border border-red-200 rounded text-xs text-red-700">
            <div className="flex items-center gap-1">
              <AlertCircle className="h-3 w-3" />
              <span className="font-medium">Error:</span>
            </div>
            <p className="mt-1">{error}</p>
            <Button
              size="sm"
              variant="outline"
              onClick={onSave}
              className="mt-2 h-6 text-xs"
              disabled={savingInProgress}
            >
              Retry
            </Button>
          </div>
        )}
      </CardContent>
    </Card>
  )
}

// Componente más compacto para usar en la barra superior
export function CompactSaveStatus({
  isDirty,
  lastSaved,
  savingInProgress,
  autoSaveEnabled,
  autoSaveCountdown,
  hasUnsavedChanges,
  error,
  onSave,
  onToggleAutoSave,
  className = ""
}: Pick<SaveStatusIndicatorProps, 'isDirty' | 'lastSaved' | 'savingInProgress' | 'autoSaveEnabled' | 'autoSaveCountdown' | 'hasUnsavedChanges' | 'error' | 'onSave' | 'onToggleAutoSave' | 'className'>) {
  
  const getStatusColor = () => {
    if (error) return "text-red-500"
    if (hasUnsavedChanges) return "text-yellow-500"
    return "text-green-500"
  }
  
  const getStatusIcon = () => {
    if (savingInProgress) {
      return <Loader2 className="h-3 w-3 animate-spin" />
    }
    
    if (error) {
      return <AlertCircle className="h-3 w-3" />
    }
    
    if (hasUnsavedChanges) {
      return <CloudOff className="h-3 w-3" />
    }
    
    return <CheckCircle className="h-3 w-3" />
  }

  const getDetailedTime = () => {
    if (savingInProgress) return "Saving..."
    if (error) return "Save error"
    if (hasUnsavedChanges) return "Unsaved"
    
    if (lastSaved) {
      const timeAgo = Math.floor((Date.now() - lastSaved.getTime()) / 1000)
      if (timeAgo < 60) {
        return "a few seconds ago"
      } else if (timeAgo < 3600) {
        const minutes = Math.floor(timeAgo / 60)
        return `${minutes}m ago`
      } else {
        return `${lastSaved.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}`
      }
    }
    
    return "Not saved"
  }

  return (
    <div className={`flex items-center gap-2 ${className}`}>
      {/* Status principal */}
      <div className="flex flex-col">
      <div className={`flex items-center gap-1 ${getStatusColor()}`}>
        {getStatusIcon()}
          <span className="text-xs font-medium">
            {getDetailedTime()}
          </span>
        </div>
        
        {/* Auto-save countdown */}
        {autoSaveEnabled && autoSaveCountdown > 0 && !savingInProgress && (
          <div className="flex items-center gap-1 mt-0.5">
            <Clock className="h-2 w-2 text-gray-400" />
            <span className="text-xs text-gray-500">
              Auto: {autoSaveCountdown}s
        </span>
          </div>
        )}
      </div>
      
      {/* Controles compactos */}
      <div className="flex items-center gap-1">
        {/* Botón de guardado */}
      {(hasUnsavedChanges || error) && (
        <Button
          size="sm"
          variant="ghost"
          onClick={onSave}
          disabled={savingInProgress}
          className="h-6 px-2 text-xs"
            title="Guardar cambios"
        >
            <Save className="h-3 w-3" />
          </Button>
        )}
        
        {/* Toggle auto-save */}
        {onToggleAutoSave && (
          <Button
            size="sm"
            variant="ghost"
            onClick={onToggleAutoSave}
            className="h-6 px-2"
            title={autoSaveEnabled ? "Disable auto-save" : "Active auto-save"}
          >
            <Cloud className={`h-3 w-3 ${autoSaveEnabled ? 'text-blue-500' : 'text-gray-400'}`} />
        </Button>
      )}
      </div>
    </div>
  )
} 