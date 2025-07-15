'use client';

import { useState, useEffect, useCallback } from 'react';
import { useRouter, useParams } from 'next/navigation';
import { useForm } from 'react-hook-form';
import { 
  ArrowLeft, 
  Edit2, 
  Trash2, 
  Globe,
  Lock,
  Calendar,
  User,
  Activity,
  Server,
  MessageCircle
} from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Separator } from '@/components/ui/separator';
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
import ProjectCollaborators from '@/components/ProjectCollaborators';
import { CommentList } from '@/components/comment-list';

const API_URL = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:8080';

interface Project {
  id: number;
  name: string;
  slug: string;
  description: string;
  visibility: 'public' | 'private';
  created_at: string;
  updated_at: string;
  owner_id: number;
  owner?: {
    id: number;
    name: string;
    email: string;
    role: string;
    status: string;
    created_at: string;
    last_login?: string;
  };
  status: string;
}

interface ProjectFormData {
  name: string;
  description: string;
  visibility: 'public' | 'private';
}

export default function ProjectDetailPage() {
  const [project, setProject] = useState<Project | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [isEditDialogOpen, setIsEditDialogOpen] = useState(false);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const router = useRouter();
  const params = useParams();
  
  const projectId = params.id as string;

  const form = useForm<ProjectFormData>({
    defaultValues: {
      name: '',
      description: '',
      visibility: 'private',
    },
  });

  const getAuthToken = useCallback(() => {
    const token = localStorage.getItem('token');
    if (!token) {
      router.push('/login');
      return null;
    }
    return token;
  }, [router]);

  const fetchProject = useCallback(async () => {
    const token = getAuthToken();
    if (!token) return;

    try {
      const response = await fetch(`${API_URL}/projects/${projectId}`, {
        headers: {
          'Authorization': `Bearer ${token}`,
          'Content-Type': 'application/json',
        },
      });

      if (response.ok) {
        const data = await response.json();
        setProject(data.project);
      } else if (response.status === 401) {
        router.push('/login');
      } else if (response.status === 404) {
        setError('Project not found');
      } else {
        setError('Failed to load project');
      }
    } catch (error) {
      console.error('Error fetching project:', error);
      setError('Failed to load project');
    } finally {
      setIsLoading(false);
    }
  }, [projectId, router, getAuthToken]);

  useEffect(() => {
    if (projectId) {
      fetchProject();
    }
  }, [projectId, fetchProject]);

  // Actualizar valores del formulario cuando se carga el proyecto
  useEffect(() => {
    if (project) {
      form.reset({
        name: project.name,
        description: project.description,
        visibility: project.visibility,
      });
    }
  }, [project, form]);

  const getCurrentUserId = () => {
    const userStr = localStorage.getItem('user');
    if (!userStr) return null;
    try {
      const user = JSON.parse(userStr);
      return user.id;
    } catch {
      return null;
    }
  };

  const handleEditProject = async (data: ProjectFormData) => {
    if (!project) return;

    setIsSubmitting(true);
    const token = getAuthToken();
    if (!token) return;

    try {
      const response = await fetch(`${API_URL}/projects/${project.id}`, {
        method: 'PUT',
        headers: {
          'Authorization': `Bearer ${token}`,
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(data),
      });

      if (response.ok) {
        const updatedData = await response.json();
        setProject(updatedData.project);
        setIsEditDialogOpen(false);
        form.reset();
        // Mostrar mensaje de éxito
      } else {
        console.error('Failed to update project');
        // Mostrar mensaje de error
      }
    } catch (error) {
      console.error('Error updating project:', error);
      // Mostrar mensaje de error
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleDeleteProject = async () => {
    if (!project) return;
    
    if (!confirm('Are you sure you want to delete this project? This action cannot be undone.')) {
      return;
    }

    const token = getAuthToken();
    if (!token) return;

    try {
      const response = await fetch(`${API_URL}/projects/${project.id}`, {
        method: 'DELETE',
        headers: {
          'Authorization': `Bearer ${token}`,
        },
      });

      if (response.ok) {
        router.push('/dashboard/projects');
      } else {
        console.error('Failed to delete project');
      }
    } catch (error) {
      console.error('Error deleting project:', error);
    }
  };

  if (isLoading) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="text-center">
          <div className="animate-spin rounded-full h-32 w-32 border-b-2 border-gray-900 mx-auto mb-4"></div>
                      <p className="text-gray-600">Loading project...</p>
        </div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <Card className="w-full max-w-md">
          <CardContent className="flex flex-col items-center justify-center py-16">
            <div className="w-16 h-16 bg-red-100 rounded-full flex items-center justify-center mb-4">
              <Activity className="w-8 h-8 text-red-600" />
            </div>
            <h3 className="text-lg font-semibold text-gray-900 mb-2">Error</h3>
            <p className="text-gray-600 mb-6 text-center">{error}</p>
            <Button onClick={() => router.push('/dashboard/projects')}>
              <ArrowLeft className="w-4 h-4 mr-2" />
              Back to Projects
            </Button>
          </CardContent>
        </Card>
      </div>
    );
  }

  if (!project) {
    return null;
  }

  return (
    <div className="min-h-screen bg-gray-50">
      {/* Header */}
      <div className="bg-white shadow-sm border-b">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex items-center justify-between h-16">
            <div className="flex items-center space-x-4">
              <Button
                variant="ghost"
                size="sm"
                onClick={() => router.push('/dashboard/projects')}
                className="flex items-center"
              >
                <ArrowLeft className="w-4 h-4 mr-2" />
                Back
              </Button>
              <Separator orientation="vertical" className="h-6" />
              <div>
                <h1 className="text-xl font-semibold text-gray-900">{project.name}</h1>
              </div>
            </div>
            
            <div className="flex items-center space-x-4">
              <Badge variant={project.visibility === 'public' ? 'default' : 'secondary'}>
                {project.visibility === 'public' ? (
                  <>
                    <Globe className="w-3 h-3 mr-1" />
                    Public
                  </>
                ) : (
                  <>
                    <Lock className="w-3 h-3 mr-1" />
                    Private
                  </>
                )}
              </Badge>
              
              <Dialog open={isEditDialogOpen} onOpenChange={setIsEditDialogOpen}>
                <DialogTrigger asChild>
                  <Button variant="outline" size="sm">
                    <Edit2 className="w-4 h-4 mr-2" />
                    Edit
                  </Button>
                </DialogTrigger>
                <DialogContent className="sm:max-w-[425px]">
                  <DialogHeader>
                                <DialogTitle>Edit Project</DialogTitle>
            <DialogDescription>
              Modify your project information here. Click save when finished.
            </DialogDescription>
                  </DialogHeader>
                  <Form {...form}>
                    <form onSubmit={form.handleSubmit(handleEditProject)} className="space-y-4">
                      <FormField
                        control={form.control}
                        name="name"
                        render={({ field }) => (
                          <FormItem>
                            <FormLabel>Project Name</FormLabel>
                            <FormControl>
                                                              <Input placeholder="My Amazing Project" {...field} />
                            </FormControl>
                            <FormMessage />
                          </FormItem>
                        )}
                      />
                      
                      <FormField
                        control={form.control}
                        name="description"
                        render={({ field }) => (
                          <FormItem>
                            <FormLabel>Description</FormLabel>
                            <FormControl>
                                                              <Input placeholder="Describe your project..." {...field} />
                            </FormControl>
                            <FormMessage />
                          </FormItem>
                        )}
                      />

                      <FormField
                        control={form.control}
                        name="visibility"
                        render={({ field }) => (
                          <FormItem>
                            <FormLabel>Visibility</FormLabel>
                            <DropdownMenu>
                              <DropdownMenuTrigger asChild>
                                <FormControl>
                                  <Button variant="outline" className="w-full justify-between">
                                    <span className="flex items-center">
                                      {field.value === 'public' ? (
                                        <>
                                          <Globe className="w-4 h-4 mr-2" />
                                          Public
                                        </>
                                      ) : (
                                        <>
                                          <Lock className="w-4 h-4 mr-2" />
                                          Private
                                        </>
                                      )}
                                    </span>
                                  </Button>
                                </FormControl>
                              </DropdownMenuTrigger>
                              <DropdownMenuContent className="w-full">
                                <DropdownMenuItem
                                  onClick={() => field.onChange('public')}
                                  className="flex items-center"
                                >
                                  <Globe className="w-4 h-4 mr-2" />
                                  Public
                                </DropdownMenuItem>
                                <DropdownMenuItem
                                  onClick={() => field.onChange('private')}
                                  className="flex items-center"
                                >
                                  <Lock className="w-4 h-4 mr-2" />
                                  Private
                                </DropdownMenuItem>
                              </DropdownMenuContent>
                            </DropdownMenu>
                            <FormMessage />
                          </FormItem>
                        )}
                      />

                      <DialogFooter>
                        <Button 
                          type="button" 
                          variant="outline" 
                          onClick={() => setIsEditDialogOpen(false)}
                          disabled={isSubmitting}
                        >
                          Cancel
                        </Button>
                        <Button type="submit" disabled={isSubmitting}>
                          {isSubmitting ? 'Saving...' : 'Save Changes'}
                        </Button>
                      </DialogFooter>
                    </form>
                  </Form>
                </DialogContent>
              </Dialog>
              
              <Button
                variant="outline"
                size="sm"
                onClick={handleDeleteProject}
                className="text-red-600 hover:text-red-700 hover:bg-red-50"
              >
                <Trash2 className="w-4 h-4 mr-2" />
                Delete
              </Button>
            </div>
          </div>
        </div>
      </div>

      {/* Main Content */}
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
          {/* Main Content */}
          <div className="lg:col-span-2 space-y-6">
            {/* Project Overview */}
            <Card>
              <CardHeader>
                <CardTitle>Project Overview</CardTitle>
                <CardDescription>
                  Basic information about this project
                </CardDescription>
              </CardHeader>
              <CardContent>
                <div className="space-y-4">
                  <div>
                    <h3 className="text-sm font-medium text-gray-500 mb-1">Description</h3>
                    <p className="text-gray-900">
                      {project.description || 'No description provided'}
                    </p>
                  </div>
                  
                  <Separator />

                  {/* Quick Actions */}
                  <div>
                    <h3 className="text-sm font-medium text-gray-500 mb-3">Quick Actions</h3>
                    <div className="flex flex-wrap gap-2">
                      <Button
                        variant="default"
                        size="sm"
                        onClick={() => router.push(`/dashboard/projects/${project.id}/services`)}
                        className="flex items-center gap-2"
                      >
                        <Server className="w-4 h-4" />
                        View Services
                      </Button>
                      
                    </div>
                  </div>
                  
                  <Separator />
                  
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    <div>
                      <h3 className="text-sm font-medium text-gray-500 mb-1">Status</h3>
                      <Badge variant={project.status === 'active' ? 'default' : 'secondary'}>
                        {project.status === 'active' ? 'Active' : project.status}
                      </Badge>
                    </div>
                    
                    <div>
                      <h3 className="text-sm font-medium text-gray-500 mb-1">Visibility</h3>
                      <Badge variant={project.visibility === 'public' ? 'default' : 'secondary'}>
                        {project.visibility === 'public' ? (
                          <>
                            <Globe className="w-3 h-3 mr-1" />
                            Public
                          </>
                        ) : (
                          <>
                            <Lock className="w-3 h-3 mr-1" />
                            Private
                          </>
                        )}
                      </Badge>
                    </div>
                  </div>
                </div>
              </CardContent>
            </Card>

           

            {/* Project Collaborators */}
            <ProjectCollaborators 
              projectId={project.id} 
              isOwner={getCurrentUserId() === project.owner_id} 
            />


          </div>

          {/* Sidebar */}
          <div className="space-y-6">
            {/* Project Details */}
            <Card>
              <CardHeader>
                <CardTitle>Project Details</CardTitle>
              </CardHeader>
              <CardContent>
                <div className="space-y-4">
                  <div>
                    <h3 className="text-sm font-medium text-gray-500 mb-1">Project ID</h3>
                    <p className="text-sm text-gray-900">{project.id}</p>
                  </div>
                  
                  <div>
                    <h3 className="text-sm font-medium text-gray-500 mb-1">Created</h3>
                    <div className="flex items-center text-sm text-gray-900">
                      <Calendar className="w-4 h-4 mr-2" />
                      {new Date(project.created_at).toLocaleDateString('en-US', {
                        year: 'numeric',
                        month: 'long',
                        day: 'numeric'
                      })}
                    </div>
                  </div>
                  
                  <div>
                    <h3 className="text-sm font-medium text-gray-500 mb-1">Last Updated</h3>
                    <div className="flex items-center text-sm text-gray-900">
                      <Calendar className="w-4 h-4 mr-2" />
                      {new Date(project.updated_at).toLocaleDateString('en-US', {
                        year: 'numeric',
                        month: 'long',
                        day: 'numeric'
                      })}
                    </div>
                  </div>
                </div>
              </CardContent>
            </Card>

            {/* Owner Information */}
            {project.owner && (
              <Card>
                <CardHeader>
                  <CardTitle>Owner</CardTitle>
                </CardHeader>
                <CardContent>
                  <div className="space-y-3">
                    <div className="flex items-center space-x-3">
                      <div className="w-10 h-10 bg-gray-100 rounded-full flex items-center justify-center">
                        <User className="w-5 h-5 text-gray-600" />
                      </div>
                      <div>
                        <p className="font-medium text-gray-900">{project.owner.name}</p>
                        <p className="text-sm text-gray-500">{project.owner.email}</p>
                      </div>
                    </div>
                    
                    <div>
                      <Badge variant="outline" className="text-xs">
                        {project.owner.role}
                      </Badge>
                    </div>
                  </div>
                </CardContent>
              </Card>
            )}

            {/* Comment List */}
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <MessageCircle className="w-5 h-5" />
                  Comments
                </CardTitle>
              </CardHeader>
              <CardContent className="p-0">
                <div className="p-6">
                  <CommentList 
                    projectId={project.id} 
                    autoRefresh={true}
                    showFilters={true}
                    maxHeight="500px"
                  />
                </div>
              </CardContent>
            </Card>
          </div>
        </div>
      </div>
    </div>
  );
} 