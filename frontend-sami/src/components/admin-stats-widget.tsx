'use client';

import { useState, useEffect } from 'react';
import { Users, UserCheck, Shield, TrendingUp } from 'lucide-react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { useUserStats, useAdminPermissions } from '@/lib/use-admin';

export default function AdminStatsWidget() {
  const { isAdmin, loading: permissionsLoading } = useAdminPermissions();
  const { stats, loading, error } = useUserStats();

  // Don't render if not admin or still loading permissions
  if (permissionsLoading || !isAdmin) {
    return null;
  }

  if (loading) {
    return (
      <Card>
        <CardHeader>
          <CardTitle className="text-sm font-medium">Estadísticas del Sistema</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="flex items-center justify-center py-4">
            <div className="animate-spin rounded-full h-6 w-6 border-b-2 border-blue-600"></div>
          </div>
        </CardContent>
      </Card>
    );
  }

  if (error || !stats) {
    return (
      <Card>
        <CardHeader>
          <CardTitle className="text-sm font-medium">Estadísticas del Sistema</CardTitle>
        </CardHeader>
        <CardContent>
          <p className="text-sm text-gray-500">Error al cargar estadísticas</p>
          <p className="text-xs text-gray-400 mt-1">Solo disponible para administradores</p>
        </CardContent>
      </Card>
    );
  }

  return (
    <Card>
      <CardHeader>
        <CardTitle className="flex items-center gap-2 text-sm font-medium">
          <Shield className="h-4 w-4 text-purple-600" />
          Administración del Sistema
        </CardTitle>
        <CardDescription>Estadísticas y métricas de usuarios</CardDescription>
      </CardHeader>
      <CardContent className="space-y-4">
        {/* Total Users */}
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-2">
            <Users className="h-4 w-4 text-gray-500" />
            <span className="text-sm font-medium">Usuarios Totales</span>
          </div>
          <Badge variant="outline">{stats.total_users}</Badge>
        </div>

        {/* Active Users */}
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-2">
            <UserCheck className="h-4 w-4 text-green-600" />
            <span className="text-sm font-medium">Usuarios Activos</span>
          </div>
          <Badge variant="default" className="bg-green-100 text-green-800">
            {stats.active_users}
          </Badge>
        </div>

        {/* Admin Users */}
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-2">
            <Shield className="h-4 w-4 text-purple-600" />
            <span className="text-sm font-medium">Administradores</span>
          </div>
          <Badge variant="default" className="bg-purple-100 text-purple-800">
            {stats.admin_users}
          </Badge>
        </div>

        {/* Total Projects */}
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-2">
            <TrendingUp className="h-4 w-4 text-blue-600" />
            <span className="text-sm font-medium">Proyectos</span>
          </div>
          <Badge variant="default" className="bg-blue-100 text-blue-800">
            {stats.total_projects}
          </Badge>
        </div>

        {/* New Users */}
        {stats.new_users_last_30_days > 0 && (
          <div className="pt-2 border-t">
            <div className="flex items-center justify-between">
              <span className="text-xs text-gray-500">Nuevos usuarios (30 días)</span>
              <Badge variant="secondary" className="bg-yellow-100 text-yellow-800">
                +{stats.new_users_last_30_days}
              </Badge>
            </div>
          </div>
        )}

        {/* Quick Stats */}
        <div className="pt-2 border-t text-xs text-gray-500 space-y-1">
          <div className="flex justify-between">
            <span>Tasa de actividad:</span>
            <span>{Math.round((stats.active_users / stats.total_users) * 100)}%</span>
          </div>
          <div className="flex justify-between">
            <span>Proyectos activos:</span>
            <span>{stats.active_projects}</span>
          </div>
        </div>
      </CardContent>
    </Card>
  );
}

// Hook para usar en otras partes de la aplicación
export const useAdminStats = () => {
  const { isAdmin } = useAdminPermissions();
  const { stats, loading, error, refresh } = useUserStats();

  return {
    isAdmin,
    stats,
    loading,
    error,
    refresh,
    // Helper functions
    getActiveUserPercentage: () => stats ? Math.round((stats.active_users / stats.total_users) * 100) : 0,
    hasNewUsers: () => stats ? stats.new_users_last_30_days > 0 : false,
    getProjectActivityRatio: () => stats ? Math.round((stats.active_projects / stats.total_projects) * 100) : 0
  };
}; 