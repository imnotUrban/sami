"use client"

import type React from "react"
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog"
import { ServiceForm } from "@/components/service-form"
import { type Service } from "@/lib/services-api"

interface ServiceDialogProps {
  open: boolean
  onOpenChange: (open: boolean) => void
  service?: Service | null
  onSave: (serviceData: any) => Promise<void>
  onDelete?: (serviceId: number) => Promise<void>
}

export function ServiceDialog({ open, onOpenChange, service, onSave, onDelete }: ServiceDialogProps) {
  const handleSave = async (serviceData: any) => {
    await onSave(serviceData)
    onOpenChange(false)
  }

  const handleCancel = () => {
    onOpenChange(false)
  }

  const handleDelete = async (serviceId: number) => {
    if (onDelete) {
      await onDelete(serviceId)
      onOpenChange(false)
    }
  }

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-2xl max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle>{service ? "Edit Service" : "Add New Service"}</DialogTitle>
        </DialogHeader>
        <ServiceForm
          service={service}
          onSave={handleSave}
          onCancel={handleCancel}
          onDelete={handleDelete}
        />
      </DialogContent>
    </Dialog>
  )
} 