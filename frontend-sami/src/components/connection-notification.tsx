"use client"

import { useEffect, useState } from "react"
import { Card, CardContent } from "@/components/ui/card"
import { CheckCircle, X } from "lucide-react"
import { Button } from "@/components/ui/button"

interface ConnectionNotificationProps {
  show: boolean
  sourceNode: string
  targetNode: string
  onClose: () => void
  onEdit: () => void
}

export function ConnectionNotification({ show, sourceNode, targetNode, onClose, onEdit }: ConnectionNotificationProps) {
  const [isVisible, setIsVisible] = useState(false)

  useEffect(() => {
    if (show) {
      setIsVisible(true)
      const timer = setTimeout(() => {
        setIsVisible(false)
        onClose()
      }, 5000)
      return () => clearTimeout(timer)
    }
  }, [show, onClose])

  if (!isVisible) return null

  return (
    <div className="fixed top-4 right-4 z-50 animate-in slide-in-from-right">
      <Card className="w-80 shadow-lg border-green-200 bg-green-50">
        <CardContent className="p-4">
          <div className="flex items-start gap-3">
            <CheckCircle className="w-5 h-5 text-green-600 mt-0.5" />
            <div className="flex-1">
              <h4 className="text-sm font-semibold text-green-800">Dependency Created!</h4>
              <p className="text-sm text-green-700 mt-1">
                <span className="font-medium">{sourceNode}</span> now depends on{" "}
                <span className="font-medium">{targetNode}</span>
              </p>
              <div className="flex gap-2 mt-3">
                <Button size="sm" variant="outline" onClick={onEdit}>
                  Edit Details
                </Button>
                <Button size="sm" variant="ghost" onClick={onClose}>
                  <X className="w-3 h-3" />
                </Button>
              </div>
            </div>
          </div>
        </CardContent>
      </Card>
    </div>
  )
} 