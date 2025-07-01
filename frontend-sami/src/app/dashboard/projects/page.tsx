'use client';

import { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { 
  Plus, 
  Edit2, 
  Trash2, 
  Eye, 
  Search, 
  Filter,
  Globe,
  Lock,
  Calendar,
  User,
  MoreHorizontal,
  Archive,
  FolderOpen
} from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle, DialogTrigger } from '@/components/ui/dialog';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { DropdownMenu, DropdownMenuContent, DropdownMenuItem, DropdownMenuTrigger } from '@/components/ui/dropdown-menu';
import { Alert, AlertDescription } from '@/components/ui/alert';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import Layout from '@/components/Layout';

const API_URL = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:8080';

interface Owner {
  id: number;
  name: string;
  email: string;
  role: string;
  status: string;
  created_at: string;
  last_login: string;
}

interface Project {
  id: number;
  name: string;
  slug: string;
  description: string;
  owner_id: number;
  owner: Owner;
  visibility: 'public' | 'private';
  status: 'active' | 'archived';
  created_at: string;
  updated_at: string;
}

interface CreateProjectData {
  name: string;
  slug: string;
  description: string;
  visibility: 'public' | 'private';
}

export default function ProjectsPage() {
  const [projects, setProjects] = useState<Project[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState('');
  const [visibilityFilter, setVisibilityFilter] = useState<'all' | 'public' | 'private'>('all');
  const [activeTab, setActiveTab] = useState<'active' | 'archived'>('active');
  const [showCreateForm, setShowCreateForm] = useState(false);
  const [showEditForm, setShowEditForm] = useState(false);
  const [editingProject, setEditingProject] = useState<Project | null>(null);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const router = useRouter();

  const [createForm, setCreateForm] = useState<CreateProjectData>({
    name: '',
    slug: '',
    description: '',
    visibility: 'private'
  });

  const [editForm, setEditForm] = useState<CreateProjectData>({
    name: '',
    slug: '',
    description: '',
    visibility: 'private'
  });

  useEffect(() => {
    fetchProjects();
  }, []);

  const getAuthToken = () => {
    const token = localStorage.getItem('token');
    if (!token) {
      router.push('/login');
      return null;
    }
    return token;
  };

  const fetchProjects = async () => {
    const token = getAuthToken();
    if (!token) return;

    setError(null);
    try {
      const response = await fetch(`${API_URL}/projects`, {
        headers: {
          'Authorization': `Bearer ${token}`,
          'Content-Type': 'application/json',
        },
      });

      if (response.ok) {
        const data = await response.json();
        console.log('API Response:', data);
        
        if (Array.isArray(data)) {
          setProjects(data);
        } else if (data && Array.isArray(data.projects)) {
          setProjects(data.projects);
        } else if (data && Array.isArray(data.data)) {
          setProjects(data.data);
        } else {
          console.warn('Unexpected API response format:', data);
          setProjects([]);
          setError('Received unexpected response format from server');
        }
      } else if (response.status === 401) {
        router.push('/login');
      } else {
        const errorText = await response.text();
        console.error('Failed to fetch projects:', response.status, errorText);
        setError(`Failed to fetch projects: ${response.status}`);
        setProjects([]);
      }
    } catch (error) {
      console.error('Error fetching projects:', error);
      setError('Network error while fetching projects');
      setProjects([]);
    } finally {
      setIsLoading(false);
    }
  };

  const generateSlug = (name: string) => {
    return name
      .toLowerCase()
      .replace(/[^a-z0-9]+/g, '-')
      .replace(/(^-|-$)/g, '');
  };

  // Get owner display name with fallback
  const getOwnerDisplayName = (owner: Owner | null | undefined) => {
    if (!owner) return 'Unknown Owner';
    return owner.name || owner.email || 'Unknown Owner';
  };

  // Get owner initials
  const getOwnerInitials = (owner: Owner | null | undefined) => {
    const name = getOwnerDisplayName(owner);
    if (name === 'Unknown Owner') return 'U';
    return name
      .split(' ')
      .map(word => word.charAt(0))
      .join('')
      .toUpperCase()
      .slice(0, 2);
  };

  const handleCreateProject = async (e: React.FormEvent) => {
    e.preventDefault();
    const token = getAuthToken();
    if (!token) return;

    setIsSubmitting(true);
    try {
      const response = await fetch(`${API_URL}/projects`, {
        method: 'POST',
        headers: {
          'Authorization': `Bearer ${token}`,
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(createForm),
      });

      if (response.ok) {
        setShowCreateForm(false);
        setCreateForm({
          name: '',
          slug: '',
          description: '',
          visibility: 'private'
        });
        fetchProjects();
      } else {
        console.error('Failed to create project');
      }
    } catch (error) {
      console.error('Error creating project:', error);
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleUpdateProject = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!editingProject) return;
    
    const token = getAuthToken();
    if (!token) return;

    setIsSubmitting(true);
    try {
      const response = await fetch(`${API_URL}/projects/${editingProject.id}`, {
        method: 'PUT',
        headers: {
          'Authorization': `Bearer ${token}`,
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          name: editForm.name,
          description: editForm.description,
          visibility: editForm.visibility
        }),
      });

      if (response.ok) {
        setShowEditForm(false);
        setEditingProject(null);
        setEditForm({
          name: '',
          slug: '',
          description: '',
          visibility: 'private'
        });
        fetchProjects();
      } else {
        console.error('Failed to update project');
      }
    } catch (error) {
      console.error('Error updating project:', error);
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleDeleteProject = async (projectId: number) => {
    const token = getAuthToken();
    if (!token) return;

    if (window.confirm('¿Estás seguro de que quieres eliminar este proyecto?')) {
      try {
        const response = await fetch(`${API_URL}/projects/${projectId}`, {
          method: 'DELETE',
          headers: {
            'Authorization': `Bearer ${token}`,
          },
        });

        if (response.ok) {
          fetchProjects();
        } else {
          console.error('Failed to delete project');
        }
      } catch (error) {
        console.error('Error deleting project:', error);
      }
    }
  };

  const filteredProjects = projects.filter(project => {
    const matchesSearch = project.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
                         project.description.toLowerCase().includes(searchTerm.toLowerCase());
    const matchesVisibility = visibilityFilter === 'all' || project.visibility === visibilityFilter;
    const matchesStatus = project.status === activeTab;
    
    return matchesSearch && matchesVisibility && matchesStatus;
  });

  if (isLoading) {
    return (
      <Layout title="Projects">
        <div className="flex items-center justify-center min-h-[60vh]">
          <div className="text-center">
            <div className="animate-spin rounded-full h-32 w-32 border-b-2 border-gray-900 mx-auto mb-4"></div>
            <p className="text-gray-600">Loading projects...</p>
          </div>
        </div>
      </Layout>
    );
  }

  return (
    <Layout title="Projects">
      <div className="p-6">
        {/* Header */}
        <div className="flex flex-col sm:flex-row sm:items-center justify-between mb-8">
          <div>
            <h1 className="text-3xl font-bold text-gray-900 mb-2">Projects</h1>
            <p className="text-gray-600">Manage your architecture projects</p>
          </div>
          
          <Dialog open={showCreateForm} onOpenChange={setShowCreateForm}>
            <DialogTrigger asChild>
              <Button className="bg-blue-600 hover:bg-blue-700 text-white shadow-sm">
                <Plus className="w-4 h-4 mr-2" />
                New Project
              </Button>
            </DialogTrigger>
            <DialogContent>
              <DialogHeader>
                <DialogTitle>Create New Project</DialogTitle>
                <DialogDescription>
                  Create a new architecture project to start mapping your system.
                </DialogDescription>
              </DialogHeader>
              <form onSubmit={handleCreateProject} className="space-y-4">
                <div>
                  <Input
                    placeholder="Project name"
                    value={createForm.name}
                    onChange={(e) => {
                      const name = e.target.value;
                      setCreateForm({ 
                        ...createForm, 
                        name,
                        slug: generateSlug(name)
                      });
                    }}
                    required
                  />
                </div>
                <div>
                  <Input
                    placeholder="Project slug"
                    value={createForm.slug}
                    onChange={(e) => setCreateForm({ ...createForm, slug: e.target.value })}
                    required
                  />
                </div>
                <div>
                  <textarea
                    placeholder="Project description"
                    value={createForm.description}
                    onChange={(e) => setCreateForm({ ...createForm, description: e.target.value })}
                    className="w-full min-h-[100px] px-3 py-2 text-sm ring-offset-background file:border-0 file:bg-transparent file:text-sm file:font-medium placeholder:text-muted-foreground focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 disabled:cursor-not-allowed disabled:opacity-50 border border-input bg-background rounded-md"
                    rows={3}
                  />
                </div>
                <div>
                  <select
                    value={createForm.visibility}
                    onChange={(e) => setCreateForm({ ...createForm, visibility: e.target.value as 'public' | 'private' })}
                    className="w-full px-3 py-2 text-sm ring-offset-background file:border-0 file:bg-transparent file:text-sm file:font-medium placeholder:text-muted-foreground focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 disabled:cursor-not-allowed disabled:opacity-50 border border-input bg-background rounded-md"
                  >
                    <option value="private">Privado</option>
                    <option value="public">Público</option>
                  </select>
                </div>
                <div className="flex justify-end space-x-2">
                  <Button type="button" variant="outline" onClick={() => setShowCreateForm(false)}>
                    Cancel
                  </Button>
                  <Button type="submit" disabled={isSubmitting}>
                    {isSubmitting ? 'Creating...' : 'Create Project'}
                  </Button>
                </div>
              </form>
            </DialogContent>
          </Dialog>
        </div>

        {/* Tabs */}
        <Tabs value={activeTab} onValueChange={(value) => setActiveTab(value as 'active' | 'archived')} className="mb-6">
          <TabsList className="grid w-full max-w-[400px] grid-cols-2">
            <TabsTrigger value="active" className="flex items-center gap-2">
              <FolderOpen className="w-4 h-4" />
              Active Projects
            </TabsTrigger>
            <TabsTrigger value="archived" className="flex items-center gap-2">
              <Archive className="w-4 h-4" />
              Archived Projects
            </TabsTrigger>
          </TabsList>
          
          <TabsContent value="active" className="mt-6">
            {/* Filters */}
            <div className="mb-8">
              <Card className="p-4 shadow-sm border-0 ring-1 ring-gray-200">
                <div className="flex flex-col sm:flex-row gap-4">
                  <div className="relative flex-1">
                    <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 w-4 h-4" />
                    <Input
                      placeholder="Search active projects..."
                      value={searchTerm}
                      onChange={(e) => setSearchTerm(e.target.value)}
                      className="pl-9 border-gray-200 focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                    />
                  </div>
                  <div className="flex gap-3">
                    <select
                      value={visibilityFilter}
                      onChange={(e) => setVisibilityFilter(e.target.value as typeof visibilityFilter)}
                      className="px-3 py-2 text-sm border border-gray-200 bg-white rounded-md focus:ring-2 focus:ring-blue-500 focus:border-blue-500 min-w-[140px]"
                    >
                      <option value="all">All Visibilities</option>
                      <option value="public">Public</option>
                      <option value="private">Private</option>
                    </select>
                  </div>
                </div>
              </Card>
            </div>

            {/* Error Message */}
            {error && (
              <Alert variant="destructive" className="mb-6">
                <AlertDescription>{error}</AlertDescription>
              </Alert>
            )}

            {/* Projects Table */}
            {filteredProjects.length > 0 ? (
              <Card className="shadow-sm border-0 ring-1 ring-gray-200">
                <Table>
                  <TableHeader>
                    <TableRow className="border-b border-gray-200 bg-gray-50/50">
                      <TableHead className="font-semibold text-gray-700">Project</TableHead>
                      <TableHead className="font-semibold text-gray-700">Owner</TableHead>
                      <TableHead className="font-semibold text-gray-700">Visibility</TableHead>
                      <TableHead className="font-semibold text-gray-700">Status</TableHead>
                      <TableHead className="font-semibold text-gray-700">Created</TableHead>
                      <TableHead className="w-[100px] font-semibold text-gray-700">Actions</TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {filteredProjects.map((project, index) => (
                      <TableRow 
                        key={project.id} 
                        className={`border-b border-gray-100 hover:bg-gray-50/50 transition-colors ${
                          index === filteredProjects.length - 1 ? 'border-b-0' : ''
                        }`}
                      >
                        <TableCell>
                          <div>
                            <div className="font-semibold text-gray-900">{project.name}</div>
                            {project.description && (
                              <div className="text-sm text-gray-600 mt-1 max-w-md overflow-hidden line-clamp-2" style={{
                                display: '-webkit-box',
                                WebkitLineClamp: 2,
                                WebkitBoxOrient: 'vertical'
                              }}>{project.description}</div>
                            )}
                          </div>
                        </TableCell>
                        <TableCell>
                          <div className="flex items-center space-x-3">
                            <div className="w-8 h-8 rounded-full bg-gradient-to-br from-blue-500 to-purple-600 flex items-center justify-center text-white text-sm font-semibold">
                              {getOwnerInitials(project.owner)}
                            </div>
                            <div>
                              <p className="text-sm font-medium text-gray-900">{getOwnerDisplayName(project.owner)}</p>
                              <p className="text-xs text-gray-500">{project.owner?.email || 'No email'}</p>
                            </div>
                          </div>
                        </TableCell>
                        <TableCell>
                          <Badge variant={project.visibility === 'public' ? 'default' : 'secondary'} className="text-xs">
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
                        </TableCell>
                        <TableCell>
                          <Badge 
                            variant={project.status === 'active' ? 'default' : 'secondary'}
                            className={`text-xs ${
                              project.status === 'active' 
                                ? 'bg-green-100 text-green-800 border-green-200' 
                                : 'bg-gray-100 text-gray-800 border-gray-200'
                            }`}
                          >
                            {project.status === 'active' ? 'Active' : 'Archived'}
                          </Badge>
                        </TableCell>
                        <TableCell>
                          <div className="flex items-center text-sm text-gray-600">
                            <Calendar className="w-3 h-3 mr-1" />
                            {new Date(project.created_at).toLocaleDateString()}
                          </div>
                        </TableCell>
                        <TableCell>
                          <DropdownMenu>
                            <DropdownMenuTrigger asChild>
                              <Button variant="ghost" className="h-8 w-8 p-0 hover:bg-gray-100">
                                <MoreHorizontal className="h-4 w-4" />
                              </Button>
                            </DropdownMenuTrigger>
                            <DropdownMenuContent align="end" className="w-48">
                              <DropdownMenuItem onClick={() => router.push(`/dashboard/projects/${project.id}`)}>
                                <Eye className="w-4 h-4 mr-2" />
                                View Details
                              </DropdownMenuItem>
                              <DropdownMenuItem onClick={() => {
                                setEditingProject(project);
                                setShowEditForm(true);
                              }}>
                                <Edit2 className="w-4 h-4 mr-2" />
                                Edit
                              </DropdownMenuItem>
                              <DropdownMenuItem 
                                className="text-red-600 focus:text-red-600"
                                onClick={() => handleDeleteProject(project.id)}
                              >
                                <Trash2 className="w-4 h-4 mr-2" />
                                Delete
                              </DropdownMenuItem>
                            </DropdownMenuContent>
                          </DropdownMenu>
                        </TableCell>
                      </TableRow>
                    ))}
                  </TableBody>
                </Table>
              </Card>
            ) : (
              <Card className="shadow-sm border-0 ring-1 ring-gray-200">
                <div className="p-12 text-center">
                  <div className="w-20 h-20 mx-auto mb-6 bg-gray-100 rounded-full flex items-center justify-center">
                    <FolderOpen className="w-10 h-10 text-gray-400" />
                  </div>
                  <h3 className="text-xl font-semibold text-gray-900 mb-3">No active projects found</h3>
                  <p className="text-gray-500 text-center mb-8 max-w-md">
                    {searchTerm || visibilityFilter !== 'all' 
                      ? 'No active projects match your current filters. Try adjusting your search criteria.' 
                      : 'Start building amazing things by creating your first architecture project.'
                    }
                  </p>
                  {(!searchTerm && visibilityFilter === 'all') && (
                    <Button 
                      onClick={() => setShowCreateForm(true)}
                      className="bg-blue-600 hover:bg-blue-700 text-white"
                    >
                      <Plus className="w-4 h-4 mr-2" />
                      Create Your First Project
                    </Button>
                  )}
                </div>
              </Card>
            )}
          </TabsContent>
          
          <TabsContent value="archived" className="mt-6">
            {/* Filters */}
            <div className="mb-8">
              <Card className="p-4 shadow-sm border-0 ring-1 ring-gray-200">
                <div className="flex flex-col sm:flex-row gap-4">
                  <div className="relative flex-1">
                    <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 w-4 h-4" />
                    <Input
                      placeholder="Search archived projects..."
                      value={searchTerm}
                      onChange={(e) => setSearchTerm(e.target.value)}
                      className="pl-9 border-gray-200 focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                    />
                  </div>
                  <div className="flex gap-3">
                    <select
                      value={visibilityFilter}
                      onChange={(e) => setVisibilityFilter(e.target.value as typeof visibilityFilter)}
                      className="px-3 py-2 text-sm border border-gray-200 bg-white rounded-md focus:ring-2 focus:ring-blue-500 focus:border-blue-500 min-w-[140px]"
                    >
                      <option value="all">All Visibilities</option>
                      <option value="public">Public</option>
                      <option value="private">Private</option>
                    </select>
                  </div>
                </div>
              </Card>
            </div>

            {/* Error Message */}
            {error && (
              <Alert variant="destructive" className="mb-6">
                <AlertDescription>{error}</AlertDescription>
              </Alert>
            )}

            {/* Projects Table */}
            {filteredProjects.length > 0 ? (
              <Card className="shadow-sm border-0 ring-1 ring-gray-200">
                <Table>
                  <TableHeader>
                    <TableRow className="border-b border-gray-200 bg-gray-50/50">
                      <TableHead className="font-semibold text-gray-700">Project</TableHead>
                      <TableHead className="font-semibold text-gray-700">Owner</TableHead>
                      <TableHead className="font-semibold text-gray-700">Visibility</TableHead>
                      <TableHead className="font-semibold text-gray-700">Status</TableHead>
                      <TableHead className="font-semibold text-gray-700">Created</TableHead>
                      <TableHead className="w-[100px] font-semibold text-gray-700">Actions</TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {filteredProjects.map((project, index) => (
                      <TableRow 
                        key={project.id} 
                        className={`border-b border-gray-100 hover:bg-gray-50/50 transition-colors ${
                          index === filteredProjects.length - 1 ? 'border-b-0' : ''
                        }`}
                      >
                        <TableCell>
                          <div>
                            <div className="font-semibold text-gray-900">{project.name}</div>
                            {project.description && (
                              <div className="text-sm text-gray-600 mt-1 max-w-md overflow-hidden line-clamp-2" style={{
                                display: '-webkit-box',
                                WebkitLineClamp: 2,
                                WebkitBoxOrient: 'vertical'
                              }}>{project.description}</div>
                            )}
                          </div>
                        </TableCell>
                        <TableCell>
                          <div className="flex items-center space-x-3">
                            <div className="w-8 h-8 rounded-full bg-gradient-to-br from-blue-500 to-purple-600 flex items-center justify-center text-white text-sm font-semibold">
                              {getOwnerInitials(project.owner)}
                            </div>
                            <div>
                              <p className="text-sm font-medium text-gray-900">{getOwnerDisplayName(project.owner)}</p>
                              <p className="text-xs text-gray-500">{project.owner?.email || 'No email'}</p>
                            </div>
                          </div>
                        </TableCell>
                        <TableCell>
                          <Badge variant={project.visibility === 'public' ? 'default' : 'secondary'} className="text-xs">
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
                        </TableCell>
                        <TableCell>
                          <Badge 
                            variant={project.status === 'active' ? 'default' : 'secondary'}
                            className={`text-xs ${
                              project.status === 'active' 
                                ? 'bg-green-100 text-green-800 border-green-200' 
                                : 'bg-gray-100 text-gray-800 border-gray-200'
                            }`}
                          >
                            {project.status === 'active' ? 'Active' : 'Archived'}
                          </Badge>
                        </TableCell>
                        <TableCell>
                          <div className="flex items-center text-sm text-gray-600">
                            <Calendar className="w-3 h-3 mr-1" />
                            {new Date(project.created_at).toLocaleDateString()}
                          </div>
                        </TableCell>
                        <TableCell>
                          <DropdownMenu>
                            <DropdownMenuTrigger asChild>
                              <Button variant="ghost" className="h-8 w-8 p-0 hover:bg-gray-100">
                                <MoreHorizontal className="h-4 w-4" />
                              </Button>
                            </DropdownMenuTrigger>
                            <DropdownMenuContent align="end" className="w-48">
                              <DropdownMenuItem onClick={() => router.push(`/dashboard/projects/${project.id}`)}>
                                <Eye className="w-4 h-4 mr-2" />
                                View Details
                              </DropdownMenuItem>
                              <DropdownMenuItem onClick={() => {
                                setEditingProject(project);
                                setShowEditForm(true);
                              }}>
                                <Edit2 className="w-4 h-4 mr-2" />
                                Edit
                              </DropdownMenuItem>
                              <DropdownMenuItem 
                                className="text-red-600 focus:text-red-600"
                                onClick={() => handleDeleteProject(project.id)}
                              >
                                <Trash2 className="w-4 h-4 mr-2" />
                                Delete
                              </DropdownMenuItem>
                            </DropdownMenuContent>
                          </DropdownMenu>
                        </TableCell>
                      </TableRow>
                    ))}
                  </TableBody>
                </Table>
              </Card>
            ) : (
              <Card className="shadow-sm border-0 ring-1 ring-gray-200">
                <div className="p-12 text-center">
                  <div className="w-20 h-20 mx-auto mb-6 bg-gray-100 rounded-full flex items-center justify-center">
                    <Archive className="w-10 h-10 text-gray-400" />
                  </div>
                  <h3 className="text-xl font-semibold text-gray-900 mb-3">No archived projects found</h3>
                  <p className="text-gray-500 text-center mb-8 max-w-md">
                    {searchTerm || visibilityFilter !== 'all' 
                      ? 'No archived projects match your current filters. Try adjusting your search criteria.' 
                      : 'You don\'t have any archived projects yet.'
                    }
                  </p>
                </div>
              </Card>
            )}
          </TabsContent>
        </Tabs>

        {/* Edit Project Dialog */}
        <Dialog open={showEditForm} onOpenChange={setShowEditForm}>
          <DialogContent>
            <DialogHeader>
              <DialogTitle>Edit Project</DialogTitle>
              <DialogDescription>
                Update your project information.
              </DialogDescription>
            </DialogHeader>
            {editingProject && (
              <form onSubmit={handleUpdateProject} className="space-y-4">
                <div>
                  <Input
                    placeholder="Project name"
                    value={editForm.name}
                    onChange={(e) => setEditForm({ ...editForm, name: e.target.value })}
                    required
                  />
                </div>
                <div>
                  <Input
                    placeholder="Project slug"
                    value={editForm.slug}
                    onChange={(e) => setEditForm({ ...editForm, slug: e.target.value })}
                    required
                  />
                </div>
                <div>
                  <textarea
                    placeholder="Project description"
                    value={editForm.description}
                    onChange={(e) => setEditForm({ ...editForm, description: e.target.value })}
                    className="w-full min-h-[100px] px-3 py-2 text-sm ring-offset-background file:border-0 file:bg-transparent file:text-sm file:font-medium placeholder:text-muted-foreground focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 disabled:cursor-not-allowed disabled:opacity-50 border border-input bg-background rounded-md"
                    rows={3}
                  />
                </div>
                <div>
                  <select
                    value={editForm.visibility}
                    onChange={(e) => setEditForm({ ...editForm, visibility: e.target.value as 'public' | 'private' })}
                    className="w-full px-3 py-2 text-sm ring-offset-background file:border-0 file:bg-transparent file:text-sm file:font-medium placeholder:text-muted-foreground focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 disabled:cursor-not-allowed disabled:opacity-50 border border-input bg-background rounded-md"
                  >
                    <option value="private">Private</option>
                    <option value="public">Public</option>
                  </select>
                </div>
                <div className="flex justify-end space-x-2">
                  <Button type="button" variant="outline" onClick={() => setShowEditForm(false)}>
                    Cancel
                  </Button>
                  <Button type="submit" disabled={isSubmitting}>
                    {isSubmitting ? 'Updating...' : 'Update Project'}
                  </Button>
                </div>
              </form>
            )}
          </DialogContent>
        </Dialog>
      </div>
    </Layout>
  );
} 