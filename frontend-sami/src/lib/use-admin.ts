import { useState, useEffect, useCallback } from 'react';
import { adminApi, User, UserStats, UserListFilters } from './api';

export interface UseAdminUsersOptions {
  initialFilters?: UserListFilters;
  pageSize?: number;
  autoLoad?: boolean;
}

export interface UseAdminUsersReturn {
  users: User[];
  stats: UserStats | null;
  loading: boolean;
  error: string | null;
  totalUsers: number;
  currentPage: number;
  totalPages: number;
  filters: UserListFilters;
  
  // Actions
  loadUsers: () => Promise<void>;
  loadStats: () => Promise<void>;
  setPage: (page: number) => void;
  setFilters: (filters: Partial<UserListFilters>) => void;
  refresh: () => Promise<void>;
  clearError: () => void;
}

export const useAdminUsers = (options: UseAdminUsersOptions = {}): UseAdminUsersReturn => {
  const {
    initialFilters = {},
    pageSize = 20,
    autoLoad = true
  } = options;

  const [users, setUsers] = useState<User[]>([]);
  const [stats, setStats] = useState<UserStats | null>(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [totalUsers, setTotalUsers] = useState(0);
  const [currentPage, setCurrentPage] = useState(1);
  const [filters, setFiltersState] = useState<UserListFilters>({
    limit: pageSize,
    offset: 0,
    ...initialFilters
  });

  const totalPages = Math.ceil(totalUsers / pageSize);

  const loadUsers = useCallback(async () => {
    try {
      setLoading(true);
      setError(null);

      const filterParams = {
        ...filters,
        limit: pageSize,
        offset: (currentPage - 1) * pageSize,
      };

      const response = await adminApi.getAllUsers(filterParams);
      setUsers(response.users);
      setTotalUsers(response.total);
    } catch (err: unknown) {
      console.error('Error loading users:', err);
      const error = err as Error & { status?: number };
      if (error.status === 403) {
        setError('No tienes permisos para acceder a esta funcionalidad');
      } else if (error.status === 401) {
        setError('Tu sesión ha expirado. Por favor, inicia sesión nuevamente.');
      } else {
        setError(error.message || 'Error al cargar los usuarios');
      }
    } finally {
      setLoading(false);
    }
  }, [filters, currentPage, pageSize]);

  const loadStats = useCallback(async () => {
    try {
      const statsData = await adminApi.getUserStats();
      setStats(statsData);
    } catch (err: unknown) {
      console.error('Error loading stats:', err);
      // No mostramos error para estadísticas, ya que es información adicional
    }
  }, []);

  const setPage = useCallback((page: number) => {
    if (page >= 1 && page <= totalPages) {
      setCurrentPage(page);
    }
  }, [totalPages]);

  const setFilters = useCallback((newFilters: Partial<UserListFilters>) => {
    setFiltersState(prev => ({ ...prev, ...newFilters }));
    setCurrentPage(1); // Reset to first page when filters change
  }, []);

  const refresh = useCallback(async () => {
    await Promise.all([loadUsers(), loadStats()]);
  }, [loadUsers, loadStats]);

  const clearError = useCallback(() => {
    setError(null);
  }, []);

  // Auto-load on mount and when dependencies change
  useEffect(() => {
    if (autoLoad) {
      loadUsers();
    }
  }, [loadUsers, autoLoad]);

  // Load stats once on mount
  useEffect(() => {
    if (autoLoad) {
      loadStats();
    }
  }, [loadStats, autoLoad]);

  return {
    users,
    stats,
    loading,
    error,
    totalUsers,
    currentPage,
    totalPages,
    filters,
    
    // Actions
    loadUsers,
    loadStats,
    setPage,
    setFilters,
    refresh,
    clearError
  };
};

// Hook para verificar permisos de admin
export const useAdminPermissions = () => {
  const [isAdmin, setIsAdmin] = useState(false);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    try {
      const user = localStorage.getItem('user');
      if (user) {
        const userData = JSON.parse(user);
        setIsAdmin(userData.role === 'admin');
      } else {
        setIsAdmin(false);
      }
    } catch (err) {
      console.error('Error checking admin permissions:', err);
      setIsAdmin(false);
    } finally {
      setLoading(false);
    }
  }, []);

  return { isAdmin, loading };
};

// Hook para obtener estadísticas de usuarios
export const useUserStats = () => {
  const [stats, setStats] = useState<UserStats | null>(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const loadStats = useCallback(async () => {
    try {
      setLoading(true);
      setError(null);
      const statsData = await adminApi.getUserStats();
      setStats(statsData);
    } catch (err: unknown) {
      console.error('Error loading user stats:', err);
      const error = err as Error;
      setError(error.message || 'Error al cargar las estadísticas');
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    loadStats();
  }, [loadStats]);

  return {
    stats,
    loading,
    error,
    refresh: loadStats
  };
}; 