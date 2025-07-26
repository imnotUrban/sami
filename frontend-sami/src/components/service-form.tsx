"use client"

import type React from "react"

import { useState } from "react"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Textarea } from "@/components/ui/textarea"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Trash2, Loader2 } from "lucide-react"
import type { Service, ServiceData } from "@/types"

interface ServiceFormProps {
  service?: Service | null
  onSave: (service: ServiceData) => void
  onCancel: () => void
  onDelete?: (serviceId: number) => void
}

export function ServiceForm({ service, onSave, onCancel, onDelete }: ServiceFormProps) {
  const [formData, setFormData] = useState({
    name: service?.name || "",
    description: service?.description || "",
    type: service?.type || "API",
    version: service?.version || "",
    language: service?.language || "",
    environment: service?.environment || "production",
    deploy_url: service?.deploy_url || "",
    domain: service?.domain || "",
    git_repo: service?.git_repo || "",
    notes: service?.notes || "",
  })

  const [loading, setLoading] = useState(false)

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    setLoading(true)
    try {
      await onSave(formData)
    } finally {
      setLoading(false)
    }
  }

  const handleDelete = async () => {
    if (!service || !service.id || !onDelete) return
    
    if (window.confirm('Are you sure you want to delete this service? This action cannot be undone.')) {
      setLoading(true)
      try {
        await onDelete(service.id)
      } finally {
        setLoading(false)
      }
    }
  }

  const handleChange = (field: string, value: string) => {
    setFormData((prev) => ({ ...prev, [field]: value }))
  }

  return (
    <Card className="w-full max-w-2xl">
      <CardHeader>
        <CardTitle>{service ? "Edit Service" : "Create New Service"}</CardTitle>
        <CardDescription>
          {service ? "Update service information" : "Add a new service to your architecture"}
        </CardDescription>
      </CardHeader>
      <CardContent>
        <form onSubmit={handleSubmit} className="space-y-4">
          <div className="grid grid-cols-2 gap-4">
            <div className="space-y-2">
              <Label htmlFor="name">Service Name</Label>
              <Input
                id="name"
                value={formData.name}
                onChange={(e) => handleChange("name", e.target.value)}
                placeholder="API Gateway"
                required
                disabled={loading}
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="type">Type</Label>
              <Select value={formData.type} onValueChange={(value) => handleChange("type", value)} disabled={loading}>
                <SelectTrigger>
                  <SelectValue placeholder="Select type" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="API Gateway">API Gateway</SelectItem>
                  <SelectItem value="API">API</SelectItem>
                  <SelectItem value="DB">Database</SelectItem>
                  <SelectItem value="WEB">Web Service</SelectItem>
                  <SelectItem value="CACHE">Cache</SelectItem>
                  <SelectItem value="QUEUE">Message Queue</SelectItem>
                  <SelectItem value="AUTH">Auth/Security</SelectItem>
                  <SelectItem value="STORAGE">Storage/File</SelectItem>
                  <SelectItem value="MONITORING">Monitoring/Logs</SelectItem>
                </SelectContent>
              </Select>
            </div>
          </div>

          <div className="space-y-2">
            <Label htmlFor="description">Description</Label>
            <Textarea
              id="description"
              value={formData.description}
              onChange={(e) => handleChange("description", e.target.value)}
              placeholder="Brief description of the service"
              rows={3}
              disabled={loading}
            />
          </div>

          <div className="grid grid-cols-3 gap-4">
            <div className="space-y-2">
              <Label htmlFor="version">Version</Label>
              <Input
                id="version"
                value={formData.version}
                onChange={(e) => handleChange("version", e.target.value)}
                placeholder="1.0.0"
                disabled={loading}
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="language">Language</Label>
              <Input
                id="language"
                value={formData.language}
                onChange={(e) => handleChange("language", e.target.value)}
                placeholder="Node.js"
                disabled={loading}
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="environment">Environment</Label>
              <Select value={formData.environment} onValueChange={(value) => handleChange("environment", value)} disabled={loading}>
                <SelectTrigger>
                  <SelectValue placeholder="Select environment" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="production">Production</SelectItem>
                  <SelectItem value="development">Development</SelectItem>
                  <SelectItem value="staging">Staging</SelectItem>
                </SelectContent>
              </Select>
            </div>
          </div>

          <div className="grid grid-cols-2 gap-4">
            <div className="space-y-2">
              <Label htmlFor="deploy_url">Deploy URL</Label>
              <Input
                id="deploy_url"
                value={formData.deploy_url}
                onChange={(e) => handleChange("deploy_url", e.target.value)}
                placeholder="https://api.example.com"
                type="url"
                disabled={loading}
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="domain">Domain</Label>
              <Input
                id="domain"
                value={formData.domain}
                onChange={(e) => handleChange("domain", e.target.value)}
                placeholder="api.example.com"
                disabled={loading}
              />
            </div>
          </div>

          <div className="space-y-2">
            <Label htmlFor="git_repo">Git Repository</Label>
            <Input
              id="git_repo"
              value={formData.git_repo}
              onChange={(e) => handleChange("git_repo", e.target.value)}
              placeholder="https://github.com/user/repo"
              type="url"
              disabled={loading}
            />
          </div>

          <div className="space-y-2">
            <Label htmlFor="notes">Notes</Label>
            <Textarea
              id="notes"
              value={formData.notes}
              onChange={(e) => handleChange("notes", e.target.value)}
              placeholder="Additional notes about this service"
              rows={2}
              disabled={loading}
            />
          </div>

          <div className="flex justify-between pt-4">
            {service && onDelete && (
              <Button
                type="button"
                variant="destructive"
                onClick={handleDelete}
                className="flex items-center gap-2"
                disabled={loading}
              >
                {loading ? (
                  <Loader2 className="w-4 h-4 animate-spin" />
                ) : (
                  <Trash2 className="w-4 h-4" />
                )}
                Delete Service
              </Button>
            )}
            <div className="flex gap-2 ml-auto">
              <Button type="button" variant="outline" onClick={onCancel} disabled={loading}>
                Cancel
              </Button>
              <Button type="submit" disabled={loading}>
                {loading ? (
                  <>
                    <Loader2 className="w-4 h-4 animate-spin mr-2" />
                    {service ? "Updating..." : "Creating..."}
                  </>
                ) : (
                  service ? "Update Service" : "Create Service"
                )}
              </Button>
            </div>
          </div>
        </form>
      </CardContent>
    </Card>
  )
} 