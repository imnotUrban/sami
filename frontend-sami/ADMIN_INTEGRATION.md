# Integración de Endpoints de Administración

Este documento describe cómo usar los endpoints de administración implementados en el frontend de SAMI.

## Endpoints Implementados

### 1. Listar Usuarios (Admin Only)
- **Endpoint**: `GET /admin/users`
- **Descripción**: Obtiene una lista paginada de todos los usuarios del sistema
- **Permisos**: Solo administradores

### 2. Estadísticas de Usuarios (Admin Only)
- **Endpoint**: `GET /admin/users/stats`
- **Descripción**: Obtiene estadísticas generales del sistema
- **Permisos**: Solo administradores

## Implementación Frontend

### API Client (`/src/lib/api.ts`)

Se agregaron las siguientes interfaces y funciones:

```typescript
// Interfaces
export interface UserListFilters {
  limit?: number;
  offset?: number;
  status?: 'active' | 'inactive' | 'suspended';
  role?: 'user' | 'admin';
  search?: string;
}

export interface UserStats {
  total_users: number;
  active_users: number;
  inactive_users: number;
  suspended_users: number;
  admin_users: number;
  regular_users: number;
  new_users_last_30_days: number;
  total_projects: number;
  active_projects: number;
}

// API Functions
export const adminApi = {
  async getAllUsers(filters?: UserListFilters): Promise<{ users: User[], total: number }>,
  async getUserStats(): Promise<UserStats>
}
```

### Hooks Personalizados (`/src/lib/use-admin.ts`)

Se crearon hooks especializados para facilitar el uso de la API de administración:

#### `useAdminUsers(options)`
Hook principal para gestionar usuarios:

```typescript
const {
  users,
  stats,
  loading,
  error,
  totalUsers,
  currentPage,
  totalPages,
  setPage,
  setFilters,
  refresh
} = useAdminUsers({
  pageSize: 20,
  initialFilters: {}
});
```

#### `useAdminPermissions()`
Verifica si el usuario actual tiene permisos de administrador:

```typescript
const { isAdmin, loading } = useAdminPermissions();
```

#### `useUserStats()`
Hook específico para estadísticas:

```typescript
const { stats, loading, error, refresh } = useUserStats();
```

### Componentes

#### Página de Administración de Usuarios (`/src/app/dashboard/users/page.tsx`)
- Lista completa de usuarios con filtros
- Paginación
- Estadísticas en tiempo real
- Búsqueda por nombre/email
- Filtrado por estado y rol

#### Widget de Estadísticas (`/src/components/admin-stats-widget.tsx`)
Componente reutilizable que muestra estadísticas resumidas:

```typescript
import AdminStatsWidget from '@/components/admin-stats-widget';

// Se renderiza automáticamente solo para administradores
<AdminStatsWidget />
```

## Características Implementadas

### Seguridad
- ✅ Verificación de permisos en el frontend
- ✅ Redirección automática si no es admin
- ✅ Manejo de tokens JWT
- ✅ Control de acceso a nivel de componente

### Funcionalidades de Usuario
- ✅ Lista paginada de usuarios (20 por página)
- ✅ Búsqueda por nombre o email
- ✅ Filtrado por estado (activo, inactivo, suspendido)
- ✅ Filtrado por rol (usuario, admin)
- ✅ Visualización de información completa del usuario
- ✅ Estadísticas en tiempo real

### Estadísticas Disponibles
- ✅ Total de usuarios
- ✅ Usuarios activos/inactivos/suspendidos
- ✅ Número de administradores
- ✅ Nuevos usuarios en los últimos 30 días
- ✅ Total de proyectos
- ✅ Proyectos activos
- ✅ Porcentajes y métricas derivadas

### UX/UI
- ✅ Interfaz responsive
- ✅ Estados de carga
- ✅ Manejo de errores
- ✅ Badges para roles y estados
- ✅ Iconografía consistente
- ✅ Paginación intuitiva

## Uso Básico

### 1. Página de Administración de Usuarios
Navega a `/dashboard/users` (solo administradores pueden acceder).

### 2. Usar el Widget de Estadísticas
```tsx
import AdminStatsWidget from '@/components/admin-stats-widget';

export default function Dashboard() {
  return (
    <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
      <AdminStatsWidget /> {/* Se muestra solo para admins */}
      {/* Otros componentes */}
    </div>
  );
}
```

### 3. Hook Personalizado para Estadísticas
```tsx
import { useAdminStats } from '@/components/admin-stats-widget';

export default function MyComponent() {
  const { 
    isAdmin, 
    stats, 
    loading, 
    getActiveUserPercentage,
    hasNewUsers 
  } = useAdminStats();

  if (!isAdmin || loading) return null;

  return (
    <div>
      <h3>Actividad: {getActiveUserPercentage()}%</h3>
      {hasNewUsers() && <p>¡Hay nuevos usuarios!</p>}
    </div>
  );
}
```

## Filtros Disponibles

### Búsqueda de Usuarios
```typescript
// Buscar por nombre o email
setFilters({ search: "juan@example.com" });

// Filtrar por estado
setFilters({ status: "active" });

// Filtrar por rol
setFilters({ role: "admin" });

// Combinar filtros
setFilters({ 
  search: "admin",
  status: "active",
  role: "admin"
});
```

### Paginación
```typescript
// Cambiar página
setPage(2);

// La paginación se resetea automáticamente al cambiar filtros
```

## Manejo de Errores

El sistema maneja automáticamente:
- ✅ Errores de permisos (403)
- ✅ Tokens expirados (401)
- ✅ Errores de conexión
- ✅ Datos no encontrados

## Estados de Carga

Todos los componentes muestran estados de carga apropiados:
- ✅ Spinners durante la carga
- ✅ Skeletons para contenido
- ✅ Mensajes de estado
- ✅ Indicadores de actualización

## Próximas Funcionalidades

Funcionalidades planeadas para futuras versiones:
- [ ] Gestión de roles de usuario
- [ ] Suspender/activar usuarios
- [ ] Exportar datos de usuarios
- [ ] Gráficos y métricas avanzadas
- [ ] Logs de actividad de administración
- [ ] Notificaciones push para administradores

## Ejemplos de Uso

### Ejemplo 1: Dashboard con Estadísticas Admin
```tsx
'use client';

import { useAdminPermissions } from '@/lib/use-admin';
import AdminStatsWidget from '@/components/admin-stats-widget';

export default function Dashboard() {
  const { isAdmin } = useAdminPermissions();

  return (
    <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
      {/* Contenido regular */}
      <ProjectsWidget />
      <ServicesWidget />
      
      {/* Widget de admin - se muestra solo para administradores */}
      {isAdmin && <AdminStatsWidget />}
    </div>
  );
}
```

### Ejemplo 2: Lista Personalizada de Usuarios
```tsx
'use client';

import { useAdminUsers } from '@/lib/use-admin';

export default function UserList() {
  const {
    users,
    loading,
    error,
    setFilters
  } = useAdminUsers({
    pageSize: 10,
    initialFilters: { status: 'active' }
  });

  if (loading) return <div>Cargando...</div>;
  if (error) return <div>Error: {error}</div>;

  return (
    <div>
      <input 
        placeholder="Buscar usuarios..."
        onChange={(e) => setFilters({ search: e.target.value })}
      />
      <ul>
        {users.map(user => (
          <li key={user.id}>
            {user.name} - {user.email} ({user.role})
          </li>
        ))}
      </ul>
    </div>
  );
}
```

## Notas Importantes

1. **Permisos**: Todos los endpoints requieren rol de administrador
2. **Paginación**: Por defecto se muestran 20 usuarios por página
3. **Actualización**: Las estadísticas se actualizan automáticamente al cargar la página
4. **Responsividad**: Todos los componentes son responsive
5. **Accesibilidad**: Se incluyen labels y descripciones apropiadas

## Endpoints Backend Correspondientes

Para referencia, estos son los endpoints del backend que se consumen:

```bash
# Listar usuarios
GET /admin/users?limit=20&offset=0&status=active&role=admin&search=juan

# Estadísticas
GET /admin/users/stats
```

Ver `backend/CURL_EXAMPLES.md` para ejemplos completos de uso con curl. 