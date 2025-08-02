"use client"

import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle } from "@/components/ui/dialog"
import { DependencyForm } from "./dependency-form"
import type { Service, Dependency } from "@/lib/services-api"
import type { DependencyData } from "@/types"

interface DependencyDialogProps {
  open: boolean
  onOpenChange: (open: boolean) => void
  dependency?: Dependency
  services: Service[]
  onSave: (dependency: DependencyData) => Promise<void>
  onDelete?: (dependencyId: number) => Promise<void>
}

export function DependencyDialog({ open, onOpenChange, dependency, services, onSave, onDelete }: DependencyDialogProps) {
  const handleSave = async (dependencyData: DependencyData) => {
    await onSave(dependencyData)
    onOpenChange(false)
  }

  const handleCancel = () => {
    onOpenChange(false)
  }

  const handleDelete = async (dependencyId: number) => {
    if (onDelete) {
      await onDelete(dependencyId)
      onOpenChange(false)
    }
  }

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-2xl">
        <DialogHeader>
          <DialogTitle>{dependency ? "Edit Dependency" : "Create New Dependency"}</DialogTitle>
          <DialogDescription>
            {dependency ? "Update the dependency between services" : "Define how services connect to each other"}
          </DialogDescription>
        </DialogHeader>
        <DependencyForm 
          dependency={dependency} 
          services={services} 
          onSave={handleSave} 
          onCancel={handleCancel}
          onDelete={handleDelete}
        />
      </DialogContent>
    </Dialog>
  )
} 