'use client';

import { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { 
  Users, 
  UserCheck, 
  UserX, 
  Shield, 
  Search, 
  Filter,
  Calendar,
  TrendingUp,
  Settings,
  Eye,
  RefreshCw,
  UserPlus,
  Copy,
  CheckCircle2
} from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Alert, AlertDescription } from '@/components/ui/alert';
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle, DialogTrigger } from '@/components/ui/dialog';
import { Label } from '@/components/ui/label';
import Layout from '@/components/Layout';
import { useAdminUsers, useAdminPermissions } from '@/lib/use-admin';
import { adminApi, InviteUserData } from '@/lib/api';

export default function UsersPage() {
  const [searchTerm, setSearchTerm] = useState('');
  const [statusFilter, setStatusFilter] = useState<'all' | 'active' | 'inactive' | 'suspended'>('all');
  const [roleFilter, setRoleFilter] = useState<'all' | 'user' | 'admin'>('all');
  const [selectedUser, setSelectedUser] = useState<any>(null);
  const [userModalOpen, setUserModalOpen] = useState(false);
  const [inviteModalOpen, setInviteModalOpen] = useState(false);
  const [updating, setUpdating] = useState(false);
  const [inviting, setInviting] = useState(false);
  const [inviteResult, setInviteResult] = useState<{ user: any; password: string } | null>(null);
  const [passwordCopied, setPasswordCopied] = useState(false);
  const router = useRouter();

  // Helper function to get user initials safely
  const getUserInitials = (user: any): string => {
    if (!user) return 'U';
    
    // Try different name fields
    const name = user.full_name || user.name || user.email || '';
    
    if (!name || typeof name !== 'string') return 'U';
    
    return name.charAt(0).toUpperCase();
  };
  
  const { isAdmin, loading: permissionsLoading } = useAdminPermissions();
  
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

  // Check if user is admin and redirect if not
  useEffect(() => {
    if (!permissionsLoading && !isAdmin) {
      router.push('/dashboard');
    }
  }, [isAdmin, permissionsLoading, router]);

  const handleSearch = () => {
    const filters: any = {};
    
    if (searchTerm.trim()) {
      filters.search = searchTerm.trim();
    }
    
    if (statusFilter !== 'all') {
      filters.status = statusFilter;
    }
    
    if (roleFilter !== 'all') {
      filters.role = roleFilter;
    }
    
    setFilters(filters);
  };

  const handleKeyPress = (e: React.KeyboardEvent) => {
    if (e.key === 'Enter') {
      handleSearch();
    }
  };

  const handleManageUser = (user: any) => {
    setSelectedUser(user);
    setUserModalOpen(true);
  };

  const handleUpdateUser = async (userData: { status?: string; role?: string }) => {
    if (!selectedUser) return;
    
    setUpdating(true);
    try {
      // Llamar a la API para actualizar el usuario
      await adminApi.updateUser(selectedUser.id, userData);
      
      // Cerrar modal y refrescar datos
      setUserModalOpen(false);
      setSelectedUser(null);
      await refresh();
      
    } catch (error: any) {
      console.error('Error updating user:', error);
      alert('Error al actualizar usuario: ' + (error.message || 'Error desconocido'));
    } finally {
      setUpdating(false);
    }
  };

  const handleDeleteUser = async (userId: number) => {
    if (!confirm('¿Estás seguro de que quieres eliminar este usuario? Esta acción no se puede deshacer.')) return;
    
    setUpdating(true);
    try {
      // Llamar a la API para eliminar el usuario
      await adminApi.deleteUser(userId);
      
      // Cerrar modal y refrescar datos
      setUserModalOpen(false);
      setSelectedUser(null);
      await refresh();
      
    } catch (error: any) {
      console.error('Error deleting user:', error);
      alert('Error al eliminar usuario: ' + (error.message || 'Error desconocido'));
    } finally {
      setUpdating(false);
    }
  };

  const handleInviteUser = async (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    
    const formData = new FormData(e.currentTarget);
    const inviteData: InviteUserData = {
      name: formData.get('name') as string,
      email: formData.get('email') as string,
      role: (formData.get('role') as 'user' | 'admin') || 'user',
    };

    setInviting(true);
    try {
      const result = await adminApi.inviteUser(inviteData);
      setInviteResult(result);
      await refresh(); // Refrescar la lista de usuarios
    } catch (error: any) {
      console.error('Error inviting user:', error);
      alert('Error al invitar usuario: ' + (error.message || 'Error desconocido'));
    } finally {
      setInviting(false);
    }
  };

  const copyPasswordToClipboard = async () => {
    if (inviteResult?.password) {
      await navigator.clipboard.writeText(inviteResult.password);
      setPasswordCopied(true);
      setTimeout(() => setPasswordCopied(false), 2000);
    }
  };

  const closeInviteModal = () => {
    setInviteModalOpen(false);
    setInviteResult(null);
    setPasswordCopied(false);
  };

  const getStatusBadge = (status: string) => {
    switch (status) {
      case 'active':
        return <Badge variant="default" className="bg-green-100 text-green-800">Activo</Badge>;
      case 'inactive':
        return <Badge variant="secondary">Inactivo</Badge>;
      case 'suspended':
        return <Badge variant="destructive">Suspendido</Badge>;
      default:
        return <Badge variant="outline">{status}</Badge>;
    }
  };

  const getRoleBadge = (role: string) => {
    switch (role) {
      case 'admin':
        return <Badge variant="default" className="bg-purple-100 text-purple-800"><Shield className="w-3 h-3 mr-1" />Admin</Badge>;
      case 'user':
        return <Badge variant="outline"><Users className="w-3 h-3 mr-1" />Usuario</Badge>;
      default:
        return <Badge variant="outline">{role}</Badge>;
    }
  };

  const formatDate = (dateString: string) => {
    return new Date(dateString).toLocaleDateString('es-ES', {
      year: 'numeric',
      month: 'short',
      day: 'numeric',
      hour: '2-digit',
      minute: '2-digit'
    });
  };

  if (permissionsLoading) {
    return (
      <Layout>
        <div className="container mx-auto px-4 py-8">
          <div className="flex justify-center items-center py-8">
            <RefreshCw className="w-6 h-6 animate-spin mr-2" />
            Verificando permisos...
          </div>
        </div>
      </Layout>
    );
  }

  if (!isAdmin) {
    return (
      <Layout>
        <div className="container mx-auto px-4 py-8">
          <Alert>
            <Shield className="h-4 w-4" />
            <AlertDescription>No tienes permisos para acceder a esta página</AlertDescription>
          </Alert>
        </div>
      </Layout>
    );
  }

  return (
    <Layout>
      <div className="container mx-auto px-4 py-8">
        {/* Header */}
        <div className="flex justify-between items-center mb-8">
          <div>
            <h1 className="text-3xl font-bold text-gray-900 flex items-center">
              <Users className="w-8 h-8 mr-3 text-blue-600" />
              Gestión de Usuarios
            </h1>
            <p className="text-gray-600 mt-2">Administra usuarios, roles y permisos del sistema</p>
          </div>
          
          <Dialog open={inviteModalOpen} onOpenChange={setInviteModalOpen}>
            <DialogTrigger asChild>
              <Button className="bg-blue-600 hover:bg-blue-700">
                <UserPlus className="w-4 h-4 mr-2" />
                Invitar Usuario
              </Button>
            </DialogTrigger>
            <DialogContent className="max-w-md">
              <DialogHeader>
                <DialogTitle>
                  {inviteResult ? 'Usuario Invitado Exitosamente' : 'Invitar Nuevo Usuario'}
                </DialogTitle>
                <DialogDescription>
                  {inviteResult 
                    ? 'El usuario ha sido creado con una contraseña temporal'
                    : 'Completa los datos para enviar una invitación'
                  }
                </DialogDescription>
              </DialogHeader>
              
              {inviteResult ? (
                <div className="space-y-4">
                  {/* User Created Successfully */}
                  <div className="flex items-center space-x-3 p-4 bg-green-50 rounded-lg border border-green-200">
                    <CheckCircle2 className="w-6 h-6 text-green-600" />
                    <div>
                      <div className="font-medium text-green-900">{inviteResult.user.name}</div>
                      <div className="text-sm text-green-700">{inviteResult.user.email}</div>
                    </div>
                  </div>
                  
                  {/* Generated Password */}
                  <div className="space-y-2">
                    <Label className="text-sm font-medium text-gray-700">Contraseña Temporal</Label>
                    <div className="flex items-center space-x-2">
                      <Input 
                        type="text" 
                        value={inviteResult.password} 
                        readOnly 
                        className="font-mono bg-gray-50"
                      />
                      <Button 
                        type="button" 
                        variant="outline" 
                        size="sm"
                        onClick={copyPasswordToClipboard}
                        className={passwordCopied ? 'text-green-600' : ''}
                      >
                        {passwordCopied ? <CheckCircle2 className="w-4 h-4" /> : <Copy className="w-4 h-4" />}
                      </Button>
                    </div>
                    <p className="text-xs text-gray-500">
                      {passwordCopied ? 'Contraseña copiada al portapapeles' : 'Copia esta contraseña para compartir con el usuario'}
                    </p>
                  </div>
                  
                  <div className="flex justify-end pt-4">
                    <Button onClick={closeInviteModal}>
                      Cerrar
                    </Button>
                  </div>
                </div>
              ) : (
                <form onSubmit={handleInviteUser} className="space-y-4">
                  <div className="space-y-2">
                    <Label htmlFor="name">Nombre Completo</Label>
                    <Input
                      id="name"
                      name="name"
                      type="text"
                      placeholder="Ej: Juan Pérez"
                      required
                      disabled={inviting}
                    />
                  </div>
                  
                  <div className="space-y-2">
                    <Label htmlFor="email">Correo Electrónico</Label>
                    <Input
                      id="email"
                      name="email"
                      type="email"
                      placeholder="usuario@ejemplo.com"
                      required
                      disabled={inviting}
                    />
                  </div>
                  
                  <div className="space-y-2">
                    <Label htmlFor="role">Rol</Label>
                    <Select name="role" defaultValue="user" disabled={inviting}>
                      <SelectTrigger>
                        <SelectValue />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="user">
                          <div className="flex items-center">
                            <Users className="w-4 h-4 mr-2" />
                            Usuario
                          </div>
                        </SelectItem>
                        <SelectItem value="admin">
                          <div className="flex items-center">
                            <Shield className="w-4 h-4 mr-2" />
                            Administrador
                          </div>
                        </SelectItem>
                      </SelectContent>
                    </Select>
                  </div>
                  
                  <div className="flex justify-end space-x-2 pt-4">
                    <Button 
                      type="button" 
                      variant="outline" 
                      onClick={() => setInviteModalOpen(false)}
                      disabled={inviting}
                    >
                      Cancelar
                    </Button>
                    <Button type="submit" disabled={inviting}>
                      {inviting ? (
                        <>
                          <RefreshCw className="w-4 h-4 mr-2 animate-spin" />
                          Invitando...
                        </>
                      ) : (
                        <>
                          <UserPlus className="w-4 h-4 mr-2" />
                          Invitar Usuario
                        </>
                      )}
                    </Button>
                  </div>
                </form>
              )}
            </DialogContent>
          </Dialog>
        </div>

        {/* Statistics Cards */}
        {stats && (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6 mb-8">
            <Card>
              <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                <CardTitle className="text-sm font-medium">Total de Usuarios</CardTitle>
                <Users className="h-4 w-4 text-muted-foreground" />
              </CardHeader>
              <CardContent>
                <div className="text-2xl font-bold">{stats.total_users}</div>
                <p className="text-xs text-muted-foreground">
                  {stats.new_users_last_30_days} nuevos en 30 días
                </p>
              </CardContent>
            </Card>

            <Card>
              <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                <CardTitle className="text-sm font-medium">Usuarios Activos</CardTitle>
                <UserCheck className="h-4 w-4 text-green-600" />
              </CardHeader>
              <CardContent>
                <div className="text-2xl font-bold text-green-600">{stats.active_users}</div>
                <p className="text-xs text-muted-foreground">
                  {Math.round((stats.active_users / stats.total_users) * 100)}% del total
                </p>
              </CardContent>
            </Card>

            <Card>
              <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                <CardTitle className="text-sm font-medium">Administradores</CardTitle>
                <Shield className="h-4 w-4 text-purple-600" />
              </CardHeader>
              <CardContent>
                <div className="text-2xl font-bold text-purple-600">{stats.admin_users}</div>
                <p className="text-xs text-muted-foreground">
                  {stats.regular_users} usuarios regulares
                </p>
              </CardContent>
            </Card>

            <Card>
              <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                <CardTitle className="text-sm font-medium">Proyectos Totales</CardTitle>
                <TrendingUp className="h-4 w-4 text-blue-600" />
              </CardHeader>
              <CardContent>
                <div className="text-2xl font-bold text-blue-600">{stats.total_projects}</div>
                <p className="text-xs text-muted-foreground">
                  {stats.active_projects} activos
                </p>
              </CardContent>
            </Card>
          </div>
        )}

        {/* Filters */}
        <Card className="mb-6">
          <CardHeader>
            <CardTitle className="text-lg">Filtros y Búsqueda</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
              <div className="flex space-x-2">
                <Input
                  placeholder="Buscar por nombre o email..."
                  value={searchTerm}
                  onChange={(e) => setSearchTerm(e.target.value)}
                  onKeyPress={handleKeyPress}
                  className="flex-1"
                />
                <Button onClick={handleSearch} variant="outline">
                  <Search className="w-4 h-4" />
                </Button>
                <Button onClick={refresh} variant="outline" disabled={loading}>
                  <RefreshCw className={`w-4 h-4 ${loading ? 'animate-spin' : ''}`} />
                </Button>
              </div>

              <Select value={statusFilter} onValueChange={(value) => setStatusFilter(value as any)}>
                <SelectTrigger>
                  <SelectValue placeholder="Estado" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">Todos los estados</SelectItem>
                  <SelectItem value="active">Activos</SelectItem>
                  <SelectItem value="inactive">Inactivos</SelectItem>
                  <SelectItem value="suspended">Suspendidos</SelectItem>
                </SelectContent>
              </Select>

              <Select value={roleFilter} onValueChange={(value) => setRoleFilter(value as any)}>
                <SelectTrigger>
                  <SelectValue placeholder="Rol" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">Todos los roles</SelectItem>
                  <SelectItem value="admin">Administradores</SelectItem>
                  <SelectItem value="user">Usuarios</SelectItem>
                </SelectContent>
              </Select>

              <div className="text-sm text-gray-600 flex items-center">
                <Eye className="w-4 h-4 mr-1" />
                {totalUsers} usuario(s) encontrado(s)
              </div>
            </div>
          </CardContent>
        </Card>

        {/* Users Table */}
        <Card>
          <CardHeader>
            <CardTitle>Lista de Usuarios</CardTitle>
            <CardDescription>
              Gestiona todos los usuarios del sistema
            </CardDescription>
          </CardHeader>
          <CardContent>
            {loading ? (
              <div className="flex justify-center items-center py-8">
                <RefreshCw className="w-6 h-6 animate-spin mr-2" />
                Cargando usuarios...
              </div>
            ) : error ? (
              <Alert>
                <AlertDescription>{error}</AlertDescription>
              </Alert>
            ) : (
              <>
                <Table>
                  <TableHeader>
                    <TableRow>
                      <TableHead>Usuario</TableHead>
                      <TableHead>Email</TableHead>
                      <TableHead>Rol</TableHead>
                      <TableHead>Estado</TableHead>
                      <TableHead>Registrado</TableHead>
                      <TableHead>Último Acceso</TableHead>
                      <TableHead>Acciones</TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {users.map((user) => (
                      <TableRow key={user.id}>
                        <TableCell>
                          <div className="flex items-center space-x-3">
                            <div className="w-8 h-8 bg-gray-200 rounded-full flex items-center justify-center">
                              <span className="text-sm font-medium text-gray-700">
                                {getUserInitials(user)}
                              </span>
                            </div>
                            <div>
                              <div className="font-medium text-gray-900">{user.name || user.email || 'Usuario'}</div>
                              <div className="text-sm text-gray-500">ID: {user.id}</div>
                            </div>
                          </div>
                        </TableCell>
                        <TableCell>{user.email}</TableCell>
                        <TableCell>{getRoleBadge(user.role)}</TableCell>
                        <TableCell>{getStatusBadge(user.status)}</TableCell>
                        <TableCell>
                          <div className="flex items-center text-sm text-gray-600">
                            <Calendar className="w-4 h-4 mr-1" />
                            {formatDate(user.created_at)}
                          </div>
                        </TableCell>
                        <TableCell>
                          {user.last_login ? (
                            <div className="text-sm text-gray-600">
                              {formatDate(user.last_login)}
                            </div>
                          ) : (
                            <span className="text-sm text-gray-400">Nunca</span>
                          )}
                        </TableCell>
                        <TableCell>
                          <Button 
                            variant="outline" 
                            size="sm"
                            onClick={() => handleManageUser(user)}
                          >
                            <Settings className="w-4 h-4 mr-1" />
                            Gestionar
                          </Button>
                        </TableCell>
                      </TableRow>
                    ))}
                  </TableBody>
                </Table>

                {/* Pagination */}
                {totalPages > 1 && (
                  <div className="flex justify-between items-center mt-6">
                    <div className="text-sm text-gray-600">
                      Mostrando {(currentPage - 1) * 20 + 1} a {Math.min(currentPage * 20, totalUsers)} de {totalUsers} usuarios
                    </div>
                    <div className="flex space-x-2">
                      <Button
                        variant="outline"
                        size="sm"
                        onClick={() => setPage(Math.max(currentPage - 1, 1))}
                        disabled={currentPage === 1}
                      >
                        Anterior
                      </Button>
                      <span className="flex items-center px-3 py-1 text-sm">
                        Página {currentPage} de {totalPages}
                      </span>
                      <Button
                        variant="outline"
                        size="sm"
                        onClick={() => setPage(Math.min(currentPage + 1, totalPages))}
                        disabled={currentPage === totalPages}
                      >
                        Siguiente
                      </Button>
                    </div>
                  </div>
                )}
              </>
            )}
          </CardContent>
        </Card>

        {/* User Management Modal */}
        <Dialog open={userModalOpen} onOpenChange={setUserModalOpen}>
          <DialogContent className="max-w-md">
            <DialogHeader>
              <DialogTitle>Gestionar Usuario</DialogTitle>
              <DialogDescription>
                Edita la información y permisos del usuario seleccionado
              </DialogDescription>
            </DialogHeader>
            
            {selectedUser && (
              <div className="space-y-6">
                {/* User Info */}
                <div className="flex items-center space-x-3 p-4 bg-gray-50 rounded-lg">
                  <div className="w-12 h-12 bg-gray-200 rounded-full flex items-center justify-center">
                    <span className="text-lg font-medium text-gray-700">
                      {getUserInitials(selectedUser)}
                    </span>
                  </div>
                  <div>
                    <div className="font-medium text-gray-900">{selectedUser.name || selectedUser.email || 'Usuario'}</div>
                    <div className="text-sm text-gray-500">{selectedUser.email}</div>
                    <div className="text-xs text-gray-400">ID: {selectedUser.id}</div>
                  </div>
                </div>

                {/* Status Selection */}
                <div className="space-y-2">
                  <label className="text-sm font-medium text-gray-700">Estado</label>
                  <Select 
                    defaultValue={selectedUser.status}
                    onValueChange={(value) => handleUpdateUser({ status: value })}
                    disabled={updating}
                  >
                    <SelectTrigger>
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="active">
                        <div className="flex items-center">
                          <div className="w-2 h-2 bg-green-500 rounded-full mr-2"></div>
                          Activo
                        </div>
                      </SelectItem>
                      <SelectItem value="inactive">
                        <div className="flex items-center">
                          <div className="w-2 h-2 bg-gray-500 rounded-full mr-2"></div>
                          Inactivo
                        </div>
                      </SelectItem>
                      <SelectItem value="suspended">
                        <div className="flex items-center">
                          <div className="w-2 h-2 bg-red-500 rounded-full mr-2"></div>
                          Suspendido
                        </div>
                      </SelectItem>
                    </SelectContent>
                  </Select>
                </div>

                {/* Role Selection */}
                <div className="space-y-2">
                  <label className="text-sm font-medium text-gray-700">Rol</label>
                  <Select 
                    defaultValue={selectedUser.role}
                    onValueChange={(value) => handleUpdateUser({ role: value })}
                    disabled={updating}
                  >
                    <SelectTrigger>
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="user">
                        <div className="flex items-center">
                          <Users className="w-4 h-4 mr-2" />
                          Usuario
                        </div>
                      </SelectItem>
                      <SelectItem value="admin">
                        <div className="flex items-center">
                          <Shield className="w-4 h-4 mr-2" />
                          Administrador
                        </div>
                      </SelectItem>
                    </SelectContent>
                  </Select>
                </div>

                {/* User Stats */}
                <div className="space-y-2 pt-4 border-t">
                  <div className="text-sm font-medium text-gray-700">Información</div>
                  <div className="space-y-1 text-sm text-gray-600">
                    <div className="flex justify-between">
                      <span>Fecha de registro:</span>
                      <span>{formatDate(selectedUser.created_at)}</span>
                    </div>
                    <div className="flex justify-between">
                      <span>Último acceso:</span>
                      <span>
                        {selectedUser.last_login 
                          ? formatDate(selectedUser.last_login) 
                          : 'Nunca'
                        }
                      </span>
                    </div>
                  </div>
                </div>

                {/* Actions */}
                <div className="flex justify-between pt-4 border-t">
                  <Button
                    variant="destructive"
                    size="sm"
                    onClick={() => handleDeleteUser(selectedUser.id)}
                    disabled={updating}
                  >
                    Eliminar Usuario
                  </Button>
                  
                  <div className="flex space-x-2">
                    <Button
                      variant="outline"
                      onClick={() => setUserModalOpen(false)}
                      disabled={updating}
                    >
                      Cerrar
                    </Button>
                  </div>
                </div>

                {updating && (
                  <div className="flex items-center justify-center py-4">
                    <RefreshCw className="w-4 h-4 animate-spin mr-2" />
                    Actualizando...
                  </div>
                )}
              </div>
            )}
          </DialogContent>
        </Dialog>
      </div>
    </Layout>
  );
} 