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
      alert('Error updating user: ' + (error.message || 'Unknown error'));
    } finally {
      setUpdating(false);
    }
  };

  const handleDeleteUser = async (userId: number) => {
    if (!confirm('Are you sure you want to delete this user? This action cannot be undone.')) return;
    
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
      alert('Error deleting user: ' + (error.message || 'Unknown error'));
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
      alert('Error inviting user: ' + (error.message || 'Unknown error'));
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
        return <Badge variant="default" className="bg-green-100 text-green-800">Active</Badge>;
      case 'inactive':
        return <Badge variant="secondary">Inactive</Badge>;
      case 'suspended':
        return <Badge variant="destructive">Suspended</Badge>;
      default:
        return <Badge variant="outline">{status}</Badge>;
    }
  };

  const getRoleBadge = (role: string) => {
    switch (role) {
      case 'admin':
        return <Badge variant="default" className="bg-purple-100 text-purple-800"><Shield className="w-3 h-3 mr-1" />Admin</Badge>;
      case 'user':
        return <Badge variant="outline"><Users className="w-3 h-3 mr-1" />User</Badge>;
      default:
        return <Badge variant="outline">{role}</Badge>;
    }
  };

  const formatDate = (dateString: string) => {
    return new Date(dateString).toLocaleDateString('en-US', {
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
            Checking permissions...
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
            <AlertDescription>You don't have permission to access this page</AlertDescription>
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
              User Management
            </h1>
            <p className="text-gray-600 mt-2">Manage users, roles and system permissions</p>
          </div>
          
          <Dialog open={inviteModalOpen} onOpenChange={setInviteModalOpen}>
            <DialogTrigger asChild>
              <Button className="bg-blue-600 hover:bg-blue-700">
                <UserPlus className="w-4 h-4 mr-2" />
                Invite User
              </Button>
            </DialogTrigger>
            <DialogContent className="max-w-md">
              <DialogHeader>
                <DialogTitle>
                  {inviteResult ? 'User Invited Successfully' : 'Invite New User'}
                </DialogTitle>
                <DialogDescription>
                  {inviteResult 
                    ? 'The user has been created with a temporary password'
                    : 'Complete the details to send an invitation'
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
                    <Label className="text-sm font-medium text-gray-700">Temporary Password</Label>
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
                      {passwordCopied ? 'Password copied to clipboard' : 'Copy this password to share with the user'}
                    </p>
                  </div>
                  
                  <div className="flex justify-end pt-4">
                    <Button onClick={closeInviteModal}>
                      Close
                    </Button>
                  </div>
                </div>
              ) : (
                <form onSubmit={handleInviteUser} className="space-y-4">
                  <div className="space-y-2">
                    <Label htmlFor="name">Full Name</Label>
                    <Input
                      id="name"
                      name="name"
                      type="text"
                      placeholder="e.g. John Doe"
                      required
                      disabled={inviting}
                    />
                  </div>
                  
                  <div className="space-y-2">
                    <Label htmlFor="email">Email Address</Label>
                    <Input
                      id="email"
                      name="email"
                      type="email"
                      placeholder="user@example.com"
                      required
                      disabled={inviting}
                    />
                  </div>
                  
                  <div className="space-y-2">
                    <Label htmlFor="role">Role</Label>
                    <Select name="role" defaultValue="user" disabled={inviting}>
                      <SelectTrigger>
                        <SelectValue />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="user">
                          <div className="flex items-center">
                            <Users className="w-4 h-4 mr-2" />
                            User
                          </div>
                        </SelectItem>
                        <SelectItem value="admin">
                          <div className="flex items-center">
                            <Shield className="w-4 h-4 mr-2" />
                            Administrator
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
                      Cancel
                    </Button>
                    <Button type="submit" disabled={inviting}>
                      {inviting ? (
                        <>
                          <RefreshCw className="w-4 h-4 mr-2 animate-spin" />
                          Inviting...
                        </>
                      ) : (
                        <>
                          <UserPlus className="w-4 h-4 mr-2" />
                          Invite User
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
                <CardTitle className="text-sm font-medium">Total Users</CardTitle>
                <Users className="h-4 w-4 text-muted-foreground" />
              </CardHeader>
              <CardContent>
                <div className="text-2xl font-bold">{stats.total_users}</div>
                <p className="text-xs text-muted-foreground">
                  {stats.new_users_last_30_days} new in 30 days
                </p>
              </CardContent>
            </Card>

            <Card>
              <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                <CardTitle className="text-sm font-medium">Active Users</CardTitle>
                <UserCheck className="h-4 w-4 text-green-600" />
              </CardHeader>
              <CardContent>
                <div className="text-2xl font-bold text-green-600">{stats.active_users}</div>
                <p className="text-xs text-muted-foreground">
                  {Math.round((stats.active_users / stats.total_users) * 100)}% of total
                </p>
              </CardContent>
            </Card>

            <Card>
              <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                <CardTitle className="text-sm font-medium">Administrators</CardTitle>
                <Shield className="h-4 w-4 text-purple-600" />
              </CardHeader>
              <CardContent>
                <div className="text-2xl font-bold text-purple-600">{stats.admin_users}</div>
                <p className="text-xs text-muted-foreground">
                  {stats.regular_users} regular users
                </p>
              </CardContent>
            </Card>

            <Card>
              <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                <CardTitle className="text-sm font-medium">Total Projects</CardTitle>
                <TrendingUp className="h-4 w-4 text-blue-600" />
              </CardHeader>
              <CardContent>
                <div className="text-2xl font-bold text-blue-600">{stats.total_projects}</div>
                <p className="text-xs text-muted-foreground">
                  {stats.active_projects} active
                </p>
              </CardContent>
            </Card>
          </div>
        )}

        {/* Filters */}
        <Card className="mb-6">
          <CardHeader>
            <CardTitle className="text-lg">Filters and Search</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
              <div className="flex space-x-2">
                <Input
                  placeholder="Search by name or email..."
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
                  <SelectValue placeholder="Status" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">All statuses</SelectItem>
                  <SelectItem value="active">Active</SelectItem>
                  <SelectItem value="inactive">Inactive</SelectItem>
                  <SelectItem value="suspended">Suspended</SelectItem>
                </SelectContent>
              </Select>

              <Select value={roleFilter} onValueChange={(value) => setRoleFilter(value as any)}>
                <SelectTrigger>
                  <SelectValue placeholder="Role" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">All roles</SelectItem>
                  <SelectItem value="admin">Administrators</SelectItem>
                  <SelectItem value="user">Users</SelectItem>
                </SelectContent>
              </Select>

              <div className="text-sm text-gray-600 flex items-center">
                <Eye className="w-4 h-4 mr-1" />
                {totalUsers} user(s) found
              </div>
            </div>
          </CardContent>
        </Card>

        {/* Users Table */}
        <Card>
          <CardHeader>
            <CardTitle>Users List</CardTitle>
            <CardDescription>
              Manage all system users
            </CardDescription>
          </CardHeader>
          <CardContent>
            {loading ? (
              <div className="flex justify-center items-center py-8">
                <RefreshCw className="w-6 h-6 animate-spin mr-2" />
                Loading users...
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
                      <TableHead>User</TableHead>
                      <TableHead>Email</TableHead>
                      <TableHead>Role</TableHead>
                      <TableHead>Status</TableHead>
                      <TableHead>Registered</TableHead>
                      <TableHead>Last Login</TableHead>
                      <TableHead>Actions</TableHead>
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
                              <div className="font-medium text-gray-900">{user.name || user.email || 'User'}</div>
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
                            <span className="text-sm text-gray-400">Never</span>
                          )}
                        </TableCell>
                        <TableCell>
                          <Button 
                            variant="outline" 
                            size="sm"
                            onClick={() => handleManageUser(user)}
                          >
                            <Settings className="w-4 h-4 mr-1" />
                            Manage
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
                      Showing {(currentPage - 1) * 20 + 1} to {Math.min(currentPage * 20, totalUsers)} of {totalUsers} users
                    </div>
                    <div className="flex space-x-2">
                      <Button
                        variant="outline"
                        size="sm"
                        onClick={() => setPage(Math.max(currentPage - 1, 1))}
                        disabled={currentPage === 1}
                      >
                        Previous
                      </Button>
                      <span className="flex items-center px-3 py-1 text-sm">
                        Page {currentPage} of {totalPages}
                      </span>
                      <Button
                        variant="outline"
                        size="sm"
                        onClick={() => setPage(Math.min(currentPage + 1, totalPages))}
                        disabled={currentPage === totalPages}
                      >
                        Next
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
              <DialogTitle>Manage User</DialogTitle>
              <DialogDescription>
                Edit information and permissions for the selected user
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
                    <div className="font-medium text-gray-900">{selectedUser.name || selectedUser.email || 'User'}</div>
                    <div className="text-sm text-gray-500">{selectedUser.email}</div>
                    <div className="text-xs text-gray-400">ID: {selectedUser.id}</div>
                  </div>
                </div>

                {/* Status Selection */}
                <div className="space-y-2">
                  <label className="text-sm font-medium text-gray-700">Status</label>
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
                          Active
                        </div>
                      </SelectItem>
                      <SelectItem value="inactive">
                        <div className="flex items-center">
                          <div className="w-2 h-2 bg-gray-500 rounded-full mr-2"></div>
                          Inactive
                        </div>
                      </SelectItem>
                      <SelectItem value="suspended">
                        <div className="flex items-center">
                          <div className="w-2 h-2 bg-red-500 rounded-full mr-2"></div>
                          Suspended
                        </div>
                      </SelectItem>
                    </SelectContent>
                  </Select>
                </div>

                {/* Role Selection */}
                <div className="space-y-2">
                  <label className="text-sm font-medium text-gray-700">Role</label>
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
                          User
                        </div>
                      </SelectItem>
                      <SelectItem value="admin">
                        <div className="flex items-center">
                          <Shield className="w-4 h-4 mr-2" />
                          Administrator
                        </div>
                      </SelectItem>
                    </SelectContent>
                  </Select>
                </div>

                {/* User Stats */}
                <div className="space-y-2 pt-4 border-t">
                  <div className="text-sm font-medium text-gray-700">Information</div>
                  <div className="space-y-1 text-sm text-gray-600">
                    <div className="flex justify-between">
                      <span>Registration date:</span>
                      <span>{formatDate(selectedUser.created_at)}</span>
                    </div>
                    <div className="flex justify-between">
                      <span>Last login:</span>
                      <span>
                        {selectedUser.last_login 
                          ? formatDate(selectedUser.last_login) 
                          : 'Never'
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
                    Delete User
                  </Button>
                  
                  <div className="flex space-x-2">
                    <Button
                      variant="outline"
                      onClick={() => setUserModalOpen(false)}
                      disabled={updating}
                    >
                      Close
                    </Button>
                  </div>
                </div>

                {updating && (
                  <div className="flex items-center justify-center py-4">
                    <RefreshCw className="w-4 h-4 animate-spin mr-2" />
                    Updating...
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