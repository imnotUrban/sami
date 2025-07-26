'use client';

import { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { User, FolderOpen, MessageSquare, ExternalLink, Calendar, Settings } from 'lucide-react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import Layout from '@/components/Layout';
import { projectApi, type Project } from '@/lib/api';


interface User {
  id: number;
  name: string;
  email: string;
  role: string;
  status: string;
  created_at: string;
}

export default function DashboardPage() {
  const [user, setUser] = useState<User | null>(null);
  const [projects, setProjects] = useState<Project[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [projectsLoading, setProjectsLoading] = useState(false);
  const router = useRouter();

  const loadProjects = async () => {
    try {
      setProjectsLoading(true);
      const projectsData = await projectApi.getProjects();
      
      // Filter out archived projects and show only active ones, then sort by updated_at (most recent first)
      const activeProjects = projectsData
        .filter(project => {
          const status = project.status?.toLowerCase();
          // Only show active projects, exclude any archived or inactive ones
          return status === 'active' || (status !== 'archived' && status !== 'archive' && status !== 'inactive');
        })
        .sort((a, b) => new Date(b.updated_at).getTime() - new Date(a.updated_at).getTime());
      
      setProjects(activeProjects);
    } catch (error) {
      console.error('Error loading projects:', error);
    } finally {
      setProjectsLoading(false);
    }
  };

  useEffect(() => {
    // Check if there's a token and user data stored
    const token = localStorage.getItem('token');
    const userData = localStorage.getItem('user');

    if (!token || !userData) {
      router.push('/login');
      return;
    }

    try {
      const parsedUser = JSON.parse(userData);
      setUser(parsedUser);
      
      // Load projects after user is set
      loadProjects();
    } catch (error) {
      console.error('Error parsing user data:', error);
      router.push('/login');
    } finally {
      setIsLoading(false);
    }
  }, [router]);

  if (isLoading) {
    return (
      <Layout title="Dashboard">
        <div className="flex items-center justify-center min-h-[60vh]">
          <div className="text-center">
            <div className="animate-spin rounded-full h-32 w-32 border-b-2 border-gray-900 mx-auto mb-4"></div>
            <p className="text-gray-600">Loading...</p>
          </div>
        </div>
      </Layout>
    );
  }

  if (!user) {
    return null;
  }

  const quickActions = [
    {
      title: 'Projects',
      description: 'Manage your architecture projects',
      icon: FolderOpen,
      href: '/dashboard/projects',
      color: 'bg-blue-500',
      stats: ''
    },
    {
      title: 'Comments',
      description: 'Review comments and feedback',
      icon: MessageSquare,
      href: '/dashboard/comments',
      color: 'bg-pink-500',
      stats: ''
    },
    ...(user?.role === 'admin' ? [{
      title: 'Users',
      description: 'User management and control',
      icon: User,
      href: '/dashboard/users',
      color: 'bg-indigo-500',
      stats: 'Admin access'
    }] : [])
  ];

  return (
    <Layout title="Dashboard">
      <div className="p-6">
        {/* Welcome Section */}
        <div className="mb-8">
          <h1 className="text-3xl font-bold text-gray-900 mb-2">
            Welcome back, {user.name}!
          </h1>
          <p className="text-gray-600">
            Here&apos;s an overview of your architecture system
          </p>
        </div>
        
        {/* User Information Card */}
        <div className="mb-8">
          <Card className="max-w-2xl">
            <CardHeader>
              <CardTitle className="flex items-center space-x-2">
                <User size={20} />
                <span>Account Information</span>
              </CardTitle>
              <CardDescription>
                Your account details and status
              </CardDescription>
            </CardHeader>
            <CardContent>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div className="space-y-3">
                  <div className="flex justify-between">
                    <span className="text-sm font-medium text-gray-500">Name:</span>
                    <span className="text-sm text-gray-900">{user.name}</span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-sm font-medium text-gray-500">Email:</span>
                    <span className="text-sm text-gray-900">{user.email}</span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-sm font-medium text-gray-500">Role:</span>
                    <Badge variant="outline" className="text-xs">
                      {user.role}
                    </Badge>
                  </div>
                </div>
                <div className="space-y-3">
                  <div className="flex justify-between">
                    <span className="text-sm font-medium text-gray-500">Status:</span>
                    <Badge variant={user.status === 'active' ? 'default' : 'secondary'}>
                      {user.status}
                    </Badge>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-sm font-medium text-gray-500">Member since:</span>
                    <span className="text-sm text-gray-900">
                                              {new Date(user.created_at).toLocaleDateString('en-US')}
                    </span>
                  </div>
                </div>
              </div>
            </CardContent>
          </Card>
        </div>

        {/* Quick Actions */}
        <div className="mb-8">
          <h2 className="text-xl font-semibold text-gray-900 mb-4">Quick Actions</h2>
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            {quickActions.map((action) => {
              const Icon = action.icon;
              return (
                <Card 
                  key={action.title}
                  className="hover:shadow-lg transition-shadow cursor-pointer group" 
                  onClick={() => router.push(action.href)}
                >
                  <CardHeader className="pb-3">
                    <div className="flex items-center justify-between">
                      <div className={`w-10 h-10 ${action.color} rounded-lg flex items-center justify-center group-hover:scale-110 transition-transform`}>
                        <Icon className="w-5 h-5 text-white" />
                      </div>
                      <Badge variant="secondary" className="text-xs">
                        {action.stats}
                      </Badge>
                    </div>
                  </CardHeader>
                  <CardContent>
                    <h3 className="font-semibold text-gray-900 mb-1">{action.title}</h3>
                    <p className="text-sm text-gray-600">{action.description}</p>
                  </CardContent>
                </Card>
              );
            })}
          </div>
        </div>

        {/* Projects Section */}
        <div className="mb-8">
          <div className="flex items-center justify-between mb-4">
            <h2 className="text-xl font-semibold text-gray-900">Your Projects</h2>
            <Button 
              variant="outline" 
              size="sm"
              onClick={() => router.push('/dashboard/projects')}
            >
              View All Projects
            </Button>
          </div>
          
          {projectsLoading ? (
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
              {[1, 2, 3].map((i) => (
                <Card key={i} className="animate-pulse">
                  <CardHeader>
                    <div className="h-4 bg-gray-200 rounded w-3/4 mb-2"></div>
                    <div className="h-3 bg-gray-200 rounded w-1/2"></div>
                  </CardHeader>
                  <CardContent>
                    <div className="h-3 bg-gray-200 rounded w-full mb-2"></div>
                    <div className="h-3 bg-gray-200 rounded w-2/3"></div>
                  </CardContent>
                </Card>
              ))}
            </div>
          ) : projects.length > 0 ? (
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
              {projects.slice(0, 6).map((project, index) => (
                <Card 
                  key={project.id}
                  className={`hover:shadow-lg transition-all duration-200 cursor-pointer group border-l-4 ${
                    index === 0 ? 'border-l-green-500 ring-2 ring-green-100' : 'border-l-blue-500'
                  }`}
                >
                  <CardHeader className="pb-3">
                    {index === 0 && (
                      <div className="flex items-center space-x-1 mb-2">
                        <Badge variant="secondary" className="text-xs bg-green-100 text-green-700 border-green-200">
                          <Calendar className="w-3 h-3 mr-1" />
                          Last Updated
                        </Badge>
                      </div>
                    )}
                    <div className="flex items-start justify-between">
                      <div className="flex-1">
                        <CardTitle className={`text-lg font-semibold mb-1 transition-colors ${
                          index === 0 
                            ? 'text-green-900 group-hover:text-green-600' 
                            : 'text-gray-900 group-hover:text-blue-600'
                        }`}>
                          {project.name}
                        </CardTitle>
                        <CardDescription className="text-sm text-gray-600 line-clamp-2">
                          {project.description}
                        </CardDescription>
                      </div>
                      <Badge 
                        variant={project.visibility === 'public' ? 'default' : 'secondary'}
                        className="text-xs"
                      >
                        {project.visibility}
                      </Badge>
                    </div>
                  </CardHeader>
                  <CardContent className="pt-0">
                    <div className="flex items-center justify-between text-xs text-gray-500 mb-4">
                      <div className="flex items-center space-x-1">
                        <Calendar className="w-3 h-3" />
                        <span>
                          {index === 0 ? (
                            <>
                              Updated {new Date(project.updated_at).toLocaleDateString()}
                            </>
                          ) : (
                            <>
                              Created {new Date(project.created_at).toLocaleDateString()}
                            </>
                          )}
                        </span>
                      </div>
                      <Badge variant="outline" className="text-xs">
                        {project.status}
                      </Badge>
                    </div>
                    
                    <div className="flex space-x-2">
                      <Button 
                        size="sm" 
                        className={`flex-1 ${
                          index === 0 
                            ? 'bg-green-600 hover:bg-green-700 text-white' 
                            : ''
                        }`}
                        onClick={() => router.push(`/dashboard/projects/${project.id}/services`)}
                      >
                        <Settings className="w-3 h-3 mr-1" />
                        Services
                      </Button>
                      <Button 
                        size="sm" 
                        variant="outline"
                        className={index === 0 ? 'border-green-600 text-green-600 hover:bg-green-50' : ''}
                        onClick={() => router.push(`/dashboard/projects/${project.id}`)}
                      >
                        <ExternalLink className="w-3 h-3" />
                      </Button>
                    </div>
                  </CardContent>
                </Card>
              ))}
            </div>
          ) : (
            <Card className="p-8 text-center">
              <FolderOpen className="w-12 h-12 mx-auto text-gray-400 mb-4" />
              <h3 className="text-lg font-medium text-gray-900 mb-2">No projects yet</h3>
              <p className="text-gray-600 mb-4">Create your first project to start building your architecture.</p>
              <Button onClick={() => router.push('/dashboard/projects')}>
                Create Project
              </Button>
            </Card>
          )}
        </div>
        
      </div>
    </Layout>
  );
} 