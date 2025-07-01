"use client"

import React from 'react'
import { MiniMap } from 'reactflow'
import type { Node } from 'reactflow'
import { type Service } from '@/lib/services-api'

interface EnhancedMiniMapProps {
  className?: string
}

export default function EnhancedMiniMap({ className }: EnhancedMiniMapProps) {
  const getNodeStrokeColor = (node: Node) => {
    const service = node.data as Service
    if (!service) return '#6b7280'
    
    switch (service.type?.toLowerCase()) {
      case 'api':
        return '#2563eb' // blue-600
      case 'db':
      case 'database':
        return '#059669' // emerald-600
      case 'web':
        return '#7c3aed' // violet-600
      default:
        return '#d97706' // amber-600
    }
    }

  const getNodeColor = (node: Node) => {
    const service = node.data as Service
    if (!service) return '#f3f4f6'
    
    const isActive = service.status === 'active'
    
    switch (service.type?.toLowerCase()) {
      case 'api':
        return isActive ? '#dbeafe' : '#fee2e2' // blue-100 or red-100
      case 'db':
      case 'database':
        return isActive ? '#d1fae5' : '#fee2e2' // emerald-100 or red-100
      case 'web':
        return isActive ? '#e9d5ff' : '#fee2e2' // violet-100 or red-100
      default:
        return isActive ? '#fef3c7' : '#fee2e2' // amber-100 or red-100
    }
  }

  return (
    <div className={`absolute bottom-5 right-5 bg-white/95 backdrop-blur-sm border-2 border-gray-200 rounded-xl shadow-xl overflow-hidden ${className || ''}`}>
      {/* Header */}
      <div className="px-4 py-2 border-b border-gray-200">
        <div className="flex items-center gap-2">
          <div className="w-2 h-2 bg-gradient-to-r from-blue-500 to-purple-500 rounded-full animate-pulse"></div>
          <span className="text-xs font-semibold text-gray-700">Map Overview</span>
        </div>
      </div>
      
      {/* MiniMap Container */}
      <div className="relative w-[200px] h-[140px] bg-gray-50">
        <MiniMap
          nodeStrokeColor={getNodeStrokeColor}
          nodeColor={getNodeColor}
          nodeBorderRadius={8}
          nodeStrokeWidth={2}
          style={{
            width: '100%',
            height: '100%',
            background: '#f9fafb',
          }}
          maskColor="rgba(79, 70, 229, 0.15)"
          maskStrokeColor="#4f46e5"
          maskStrokeWidth={2}
          pannable
          zoomable
          inversePan={false}
          zoomStep={10}
        />
      </div>
      
      {/* Legend */}
      <div className="px-3 py-2 border-t border-gray-200 bg-gray-50/50">
        <div className="flex items-center justify-center gap-3 text-xs">
          <div className="flex items-center gap-1">
            <div className="w-2 h-2 bg-blue-500 rounded-full"></div>
            <span className="text-gray-600">API</span>
          </div>
          <div className="flex items-center gap-1">
            <div className="w-2 h-2 bg-emerald-500 rounded-full"></div>
            <span className="text-gray-600">DB</span>
          </div>
          <div className="flex items-center gap-1">
            <div className="w-2 h-2 bg-violet-500 rounded-full"></div>
            <span className="text-gray-600">Web</span>
          </div>
        </div>
      </div>
    </div>
  )
} 