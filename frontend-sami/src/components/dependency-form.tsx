"use client"

import type React from "react"

import { useState, useEffect, useCallback } from "react"
import { Button } from "@/components/ui/button"
import { Label } from "@/components/ui/label"
import { Textarea } from "@/components/ui/textarea"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { ArrowRight, Trash2, Loader2 } from "lucide-react"
import type { Service, Dependency } from "@/lib/services-api"
import type { DependencyData } from "@/types"

// Define connection types and their protocols
const connectionTypes = {
  "HTTP": {
    protocols: ["REST", "GraphQL", "SOAP"],
    methods: ["GET", "POST", "PUT", "DELETE", "PATCH"]
  },
  "Database": {
    protocols: ["PostgreSQL", "MySQL", "MongoDB", "Redis", "SQLite"],
    methods: ["SELECT", "INSERT", "UPDATE", "DELETE", "UPSERT"]
  },
  "Message Queue": {
    protocols: ["Kafka", "RabbitMQ", "Redis Pub/Sub", "Amazon SQS", "Apache Pulsar"],
    methods: ["PUBLISH", "SUBSCRIBE", "SEND", "RECEIVE", "CONSUME"]
  },
  "gRPC": {
    protocols: ["gRPC", "gRPC-Web"],
    methods: ["UNARY", "SERVER_STREAMING", "CLIENT_STREAMING", "BIDIRECTIONAL"]
  },
  "WebSocket": {
    protocols: ["WebSocket", "Socket.IO", "Server-Sent Events"],
    methods: ["CONNECT", "MESSAGE", "PING", "CLOSE", "BROADCAST"]
  },
  "File System": {
    protocols: ["NFS", "SMB", "FTP", "SFTP", "S3"],
    methods: ["READ", "WRITE", "DELETE", "COPY", "MOVE"]
  },
  "Cache": {
    protocols: ["Redis", "Memcached", "Hazelcast"],
    methods: ["GET", "SET", "DELETE", "EXPIRE", "FLUSH"]
  }
}

interface DependencyFormProps {
  dependency?: Dependency
  services: Service[]
  onSave: (dependency: DependencyData) => void
  onCancel: () => void
  onDelete?: (dependencyId: number) => void
}

export function DependencyForm({ dependency, services, onSave, onCancel, onDelete }: DependencyFormProps) {
  const [formData, setFormData] = useState({
    source_id: dependency?.source_id?.toString() || "",
    target_id: dependency?.target_id?.toString() || "",
    type: dependency?.type || "HTTP",
    description: dependency?.description || "",
    protocol: dependency?.protocol || "REST",
    method: dependency?.method || "GET",
  })

  const [loading, setLoading] = useState(false)

  // Get available protocols for current type
  const getAvailableProtocols = useCallback((type: string) => {
    return connectionTypes[type as keyof typeof connectionTypes]?.protocols || []
  }, [])

  // Get available methods for current protocol/type
  const getAvailableMethods = useCallback((type: string, protocol: string) => {
    const typeConfig = connectionTypes[type as keyof typeof connectionTypes]
    if (!typeConfig) return []
    
    // Special cases for more specific methods based on protocol
    if (protocol === "GraphQL") return ["QUERY", "MUTATION", "SUBSCRIPTION"]
    if (protocol === "MongoDB") return ["FIND", "INSERT", "UPDATE", "DELETE", "AGGREGATE"]
    if (protocol === "Redis" && type === "Database") return ["GET", "SET", "HGET", "LPUSH", "SADD"]
    
    return typeConfig.methods
  }, [])

  // Update protocol and method when type changes
  useEffect(() => {
    const availableProtocols = getAvailableProtocols(formData.type)
    if (availableProtocols.length > 0 && !availableProtocols.includes(formData.protocol)) {
      const newProtocol = availableProtocols[0]
      const availableMethods = getAvailableMethods(formData.type, newProtocol)
      setFormData(prev => ({
        ...prev,
        protocol: newProtocol,
        method: availableMethods.length > 0 ? availableMethods[0] : ""
      }))
    }
  }, [formData.type, formData.protocol, getAvailableProtocols, getAvailableMethods])

  // Update method when protocol changes
  useEffect(() => {
    const availableMethods = getAvailableMethods(formData.type, formData.protocol)
    if (availableMethods.length > 0 && !availableMethods.includes(formData.method)) {
      setFormData(prev => ({
        ...prev,
        method: availableMethods[0]
      }))
    }
  }, [formData.protocol, formData.type, formData.method, getAvailableMethods])

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    setLoading(true)
    try {
      await onSave({
        ...formData,
        source_id: Number.parseInt(formData.source_id),
        target_id: Number.parseInt(formData.target_id),
      })
    } finally {
      setLoading(false)
    }
  }

  const handleDelete = async () => {
    if (!dependency || !dependency.id || !onDelete) return
    
    if (window.confirm('Are you sure you want to delete this dependency? This action cannot be undone.')) {
      setLoading(true)
      try {
        await onDelete(dependency.id)
      } finally {
        setLoading(false)
      }
    }
  }

  const handleChange = (field: string, value: string) => {
    setFormData((prev) => ({ ...prev, [field]: value }))
  }

  const sourceService = services.find((s) => s.id === Number.parseInt(formData.source_id))
  const targetService = services.find((s) => s.id === Number.parseInt(formData.target_id))

  return (
    <Card className="w-full max-w-2xl">
      <CardHeader>
        <CardTitle>{dependency ? "Edit Dependency" : "Create New Dependency"}</CardTitle>
        <CardDescription>
          {dependency ? "Update dependency information" : "Add a new dependency between services"}
        </CardDescription>
      </CardHeader>
      <CardContent>
        <form onSubmit={handleSubmit} className="space-y-4">
          <div className="grid grid-cols-2 gap-4">
            <div className="space-y-2">
              <Label htmlFor="source_id">Source Service</Label>
              <Select value={formData.source_id} onValueChange={(value) => handleChange("source_id", value)} disabled={loading}>
                <SelectTrigger>
                  <SelectValue placeholder="Select source service" />
                </SelectTrigger>
                <SelectContent>
                  {services.map((service) => (
                    <SelectItem key={service.id} value={service.id.toString()}>
                      {service.name} ({service.type})
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
            <div className="space-y-2">
              <Label htmlFor="target_id">Target Service</Label>
              <Select value={formData.target_id} onValueChange={(value) => handleChange("target_id", value)} disabled={loading}>
                <SelectTrigger>
                  <SelectValue placeholder="Select target service" />
                </SelectTrigger>
                <SelectContent>
                  {services.map((service) => (
                    <SelectItem key={service.id} value={service.id.toString()}>
                      {service.name} ({service.type})
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
          </div>

          {/* Preview of dependency */}
          {sourceService && targetService && (
            <div className="p-3 bg-muted rounded-lg">
              <div className="flex items-center gap-2 text-sm">
                <span className="font-medium">{sourceService.name}</span>
                <ArrowRight className="w-4 h-4 text-blue-600" />
                <span className="font-medium">{targetService.name}</span>
              </div>
              <div className="text-xs text-muted-foreground mt-1">
                {sourceService.name} will depend on {targetService.name}
              </div>
            </div>
          )}

          <div className="space-y-2">
            <Label htmlFor="description">Description</Label>
            <Textarea
              id="description"
              value={formData.description}
              onChange={(e) => handleChange("description", e.target.value)}
              placeholder="Describe how these services are connected"
              rows={3}
              disabled={loading}
            />
          </div>

          <div className="grid grid-cols-3 gap-4">
            <div className="space-y-2">
              <Label htmlFor="type">Connection Type</Label>
              <Select value={formData.type} onValueChange={(value) => handleChange("type", value)} disabled={loading}>
                <SelectTrigger>
                  <SelectValue placeholder="Select type" />
                </SelectTrigger>
                <SelectContent>
                  {Object.keys(connectionTypes).map((type) => (
                    <SelectItem key={type} value={type}>{type}</SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
            <div className="space-y-2">
              <Label htmlFor="protocol">Protocol</Label>
              <Select value={formData.protocol} onValueChange={(value) => handleChange("protocol", value)} disabled={loading}>
                <SelectTrigger>
                  <SelectValue placeholder="Select protocol" />
                </SelectTrigger>
                <SelectContent>
                  {getAvailableProtocols(formData.type).map((protocol) => (
                    <SelectItem key={protocol} value={protocol}>{protocol}</SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
            <div className="space-y-2">
              <Label htmlFor="method">Method/Action</Label>
              <Select value={formData.method} onValueChange={(value) => handleChange("method", value)} disabled={loading}>
                <SelectTrigger>
                  <SelectValue placeholder="Select method" />
                </SelectTrigger>
                <SelectContent>
                  {getAvailableMethods(formData.type, formData.protocol).map((method) => (
                    <SelectItem key={method} value={method}>{method}</SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
          </div>

          <div className="flex justify-between pt-4">
            {dependency && onDelete && (
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
                Delete Dependency
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
                    {dependency ? "Updating..." : "Creating..."}
                  </>
                ) : (
                  dependency ? "Update Dependency" : "Create Dependency"
                )}
              </Button>
            </div>
          </div>
        </form>
      </CardContent>
    </Card>
  )
} 