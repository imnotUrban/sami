'use client';

import { useState, useEffect, useCallback } from 'react';
import { useForm } from 'react-hook-form';
import { 
  Users, 
  Plus, 
  Mail, 
  User, 
  Trash2,
  Crown,
  Shield,
  Eye
} from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Alert, AlertDescription } from '@/components/ui/alert';
import { Avatar } from '@/components/ui/avatar';
import { 
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from '@/components/ui/dialog';
import {
  Form,
  FormControl,
  FormField,
  FormItem,
  FormLabel,
  FormMessage,
} from '@/components/ui/form';
import { Input } from '@/components/ui/input';
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu';
import { 
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from '@/components/ui/table';
import { collaboratorApi, type Collaborator, type AddCollaboratorData, ApiError } from '@/lib/api';

interface ProjectCollaboratorsProps {
  projectId: number;
  isOwner?: boolean;
}

interface AddCollaboratorFormData {
  email: string;
  role: 'viewer' | 'editor' | 'admin';
}

const roleIcons = {
  viewer: Eye,
  editor: User,
  admin: Shield,
  owner: Crown,
};

const roleColors = {
  viewer: 'bg-gray-100 text-gray-800',
  editor: 'bg-blue-100 text-blue-800',
  admin: 'bg-purple-100 text-purple-800',
  owner: 'bg-yellow-100 text-yellow-800',
};

export default function ProjectCollaborators({ projectId, isOwner = false }: ProjectCollaboratorsProps) {
  const [collaborators, setCollaborators] = useState<Collaborator[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [isAddDialogOpen, setIsAddDialogOpen] = useState(false);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [removingCollaboratorId, setRemovingCollaboratorId] = useState<number | null>(null);

  const form = useForm<AddCollaboratorFormData>({
    defaultValues: {
      email: '',
      role: 'viewer',
    },
  });

  const fetchCollaborators = useCallback(async () => {
    try {
      setIsLoading(true);
      setError(null);
      const data = await collaboratorApi.getProjectCollaborators(projectId);
      setCollaborators(data);
    } catch (error) {
      console.error('Error fetching collaborators:', error);
      if (error instanceof ApiError) {
        setError(error.message);
      } else {
        setError('Failed to load collaborators');
      }
    } finally {
      setIsLoading(false);
    }
  }, [projectId]);

  useEffect(() => {
    fetchCollaborators();
  }, [fetchCollaborators]);

  const handleAddCollaborator = async (data: AddCollaboratorFormData) => {
    try {
      setIsSubmitting(true);
      setError(null);
      
      const collaboratorData: AddCollaboratorData = {
        email: data.email,
        role: data.role,
      };

      const newCollaborator = await collaboratorApi.addCollaborator(projectId, collaboratorData);
      setCollaborators(prev => [...prev, newCollaborator]);
      setIsAddDialogOpen(false);
      form.reset();
    } catch (error) {
      console.error('Error adding collaborator:', error);
      if (error instanceof ApiError) {
        setError(error.message);
      } else {
        setError('Failed to add collaborator');
      }
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleRemoveCollaborator = async (email: string, userId: number) => {
    if (!confirm('Are you sure you want to remove this collaborator?')) {
      return;
    }

    try {
      setRemovingCollaboratorId(userId);
      setError(null);
      
      await collaboratorApi.removeCollaborator(projectId, email);
      setCollaborators(prev => prev.filter(collab => collab.user.email !== email));
    } catch (error) {
      console.error('Error removing collaborator:', error);
      if (error instanceof ApiError) {
        setError(error.message);
      } else {
        setError('Failed to remove collaborator');
      }
    } finally {
      setRemovingCollaboratorId(null);
    }
  };

  const handleUpdateRole = async (userId: number, newRole: 'viewer' | 'editor' | 'admin') => {
    try {
      setError(null);
      
      const updatedCollaborator = await collaboratorApi.updateCollaboratorRole(projectId, userId, newRole);
      setCollaborators(prev => 
        prev.map(collab => 
          collab.user.id === userId ? updatedCollaborator : collab
        )
      );
    } catch (error) {
      console.error('Error updating collaborator role:', error);
      if (error instanceof ApiError) {
        setError(error.message);
      } else {
        setError('Failed to update collaborator role');
      }
    }
  };

  const getRoleDisplay = (role: string) => {
    const Icon = roleIcons[role as keyof typeof roleIcons] || User;
    const colorClass = roleColors[role as keyof typeof roleColors] || 'bg-gray-100 text-gray-800';
    
    return (
      <Badge className={colorClass}>
        <Icon className="w-3 h-3 mr-1" />
        {role.charAt(0).toUpperCase() + role.slice(1)}
      </Badge>
    );
  };

  const getInitials = (name: string | undefined | null) => {
    if (!name) return 'U';
    return name
      .split(' ')
      .map(word => word.charAt(0))
      .join('')
      .toUpperCase()
      .slice(0, 2);
  };

  if (isLoading) {
    return (
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Users className="h-5 w-5" />
            Collaborators
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="flex items-center justify-center py-8">
            <div className="text-sm text-gray-500">Loading collaborators...</div>
          </div>
        </CardContent>
      </Card>
    );
  }

  return (
    <Card>
      <CardHeader>
        <div className="flex items-center justify-between">
          <div>
            <CardTitle className="flex items-center gap-2">
              <Users className="h-5 w-5" />
              Collaborators
            </CardTitle>
            <CardDescription>
              Manage who has access to this project
            </CardDescription>
          </div>
          {isOwner && (
            <Dialog open={isAddDialogOpen} onOpenChange={setIsAddDialogOpen}>
              <DialogTrigger asChild>
                <Button size="sm">
                  <Plus className="h-4 w-4 mr-2" />
                  Add Collaborator
                </Button>
              </DialogTrigger>
              <DialogContent>
                <DialogHeader>
                  <DialogTitle>Add Collaborator</DialogTitle>
                  <DialogDescription>
                    Add a new collaborator to this project. Enter the user&apos;s email and select their role.
                  </DialogDescription>
                </DialogHeader>
                <Form {...form}>
                  <form onSubmit={form.handleSubmit(handleAddCollaborator)} className="space-y-4">
                    <FormField
                      control={form.control}
                      name="email"
                      rules={{ 
                        required: 'Email is required',
                        pattern: {
                          value: /^[A-Z0-9._%+-]+@[A-Z0-9.-]+\.[A-Z]{2,}$/i,
                          message: 'Invalid email address'
                        }
                      }}
                      render={({ field }) => (
                        <FormItem>
                          <FormLabel>User Email</FormLabel>
                          <FormControl>
                            <Input 
                              type="email"
                              placeholder="Enter user email" 
                              {...field} 
                            />
                          </FormControl>
                          <FormMessage />
                        </FormItem>
                      )}
                    />
                    <FormField
                      control={form.control}
                      name="role"
                      render={({ field }) => (
                        <FormItem>
                          <FormLabel>Role</FormLabel>
                          <FormControl>
                            <DropdownMenu>
                              <DropdownMenuTrigger asChild>
                                <Button variant="outline" className="w-full justify-start">
                                  {getRoleDisplay(field.value)}
                                </Button>
                              </DropdownMenuTrigger>
                              <DropdownMenuContent>
                                <DropdownMenuItem 
                                  onClick={() => field.onChange('viewer')}
                                >
                                  <Eye className="w-4 h-4 mr-2" />
                                  Viewer - Can view the project
                                </DropdownMenuItem>
                                <DropdownMenuItem 
                                  onClick={() => field.onChange('editor')}
                                >
                                  <User className="w-4 h-4 mr-2" />
                                  Editor - Can edit the project
                                </DropdownMenuItem>
                                <DropdownMenuItem 
                                  onClick={() => field.onChange('admin')}
                                >
                                  <Shield className="w-4 h-4 mr-2" />
                                  Admin - Full project access
                                </DropdownMenuItem>
                              </DropdownMenuContent>
                            </DropdownMenu>
                          </FormControl>
                          <FormMessage />
                        </FormItem>
                      )}
                    />
                    <DialogFooter>
                      <Button 
                        type="button" 
                        variant="outline" 
                        onClick={() => setIsAddDialogOpen(false)}
                        disabled={isSubmitting}
                      >
                        Cancel
                      </Button>
                      <Button type="submit" disabled={isSubmitting}>
                        {isSubmitting ? 'Adding...' : 'Add Collaborator'}
                      </Button>
                    </DialogFooter>
                  </form>
                </Form>
              </DialogContent>
            </Dialog>
          )}
        </div>
      </CardHeader>
      <CardContent>
        {error && (
          <Alert className="mb-4">
            <AlertDescription>{error}</AlertDescription>
          </Alert>
        )}
        
        {collaborators.length === 0 ? (
          <div className="text-center py-8">
            <Users className="h-12 w-12 mx-auto text-gray-400 mb-4" />
            <div className="text-sm text-gray-500">
              No collaborators yet. {isOwner && 'Add some to get started!'}
            </div>
          </div>
        ) : (
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>Collaborator</TableHead>
                <TableHead>Email</TableHead>
                <TableHead>Role</TableHead>
                <TableHead>Joined</TableHead>
                {isOwner && <TableHead>Actions</TableHead>}
              </TableRow>
            </TableHeader>
            <TableBody>
              {collaborators.map((collaborator) => (
                <TableRow key={`collaborator-${collaborator.id}-${collaborator.user.id}`}>
                  <TableCell>
                    <div className="flex items-center gap-3">
                      <Avatar className="h-8 w-8 bg-blue-100 text-blue-600 flex items-center justify-center text-sm font-medium">
                        {getInitials(collaborator.user.name)}
                      </Avatar>
                      <div>
                        <div className="font-medium">{collaborator.user.name}</div>
                        <div className="text-sm text-gray-500">
                          {collaborator.user.status}
                        </div>
                      </div>
                    </div>
                  </TableCell>
                  <TableCell>
                    <div className="flex items-center gap-2">
                      <Mail className="h-4 w-4 text-gray-400" />
                      {collaborator.user.email}
                    </div>
                  </TableCell>
                  <TableCell>
                    {isOwner ? (
                      <DropdownMenu>
                        <DropdownMenuTrigger asChild>
                          <Button variant="ghost" size="sm">
                            {getRoleDisplay(collaborator.role)}
                          </Button>
                        </DropdownMenuTrigger>
                        <DropdownMenuContent>
                          <DropdownMenuItem 
                            onClick={() => handleUpdateRole(collaborator.user.id, 'viewer')}
                          >
                            <Eye className="w-4 h-4 mr-2" />
                            Viewer
                          </DropdownMenuItem>
                          <DropdownMenuItem 
                            onClick={() => handleUpdateRole(collaborator.user.id, 'editor')}
                          >
                            <User className="w-4 h-4 mr-2" />
                            Editor
                          </DropdownMenuItem>
                          <DropdownMenuItem 
                            onClick={() => handleUpdateRole(collaborator.user.id, 'admin')}
                          >
                            <Shield className="w-4 h-4 mr-2" />
                            Admin
                          </DropdownMenuItem>
                        </DropdownMenuContent>
                      </DropdownMenu>
                    ) : (
                      getRoleDisplay(collaborator.role)
                    )}
                  </TableCell>
                  <TableCell>
                    {new Date(collaborator.created_at).toLocaleDateString()}
                  </TableCell>
                  {isOwner && (
                    <TableCell>
                      <Button
                        variant="ghost"
                        size="sm"
                        onClick={() => handleRemoveCollaborator(collaborator.user.email, collaborator.user.id)}
                        disabled={removingCollaboratorId === collaborator.user.id}
                        className="text-red-600 hover:text-red-700 hover:bg-red-50"
                      >
                        <Trash2 className="h-4 w-4" />
                      </Button>
                    </TableCell>
                  )}
                </TableRow>
              ))}
            </TableBody>
          </Table>
        )}
      </CardContent>
    </Card>
  );
} 