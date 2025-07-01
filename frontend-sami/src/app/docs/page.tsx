'use client';

import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Separator } from '@/components/ui/separator';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import Layout from '@/components/Layout';
import { 
  Shield, 
  FolderOpen, 
  Users, 
  MessageCircle,
  Network,
  History,
  UserCheck,
  Heart,
  BookOpen,
  Code,
  Server
} from 'lucide-react';

export default function DocsPage() {
  const baseURL = "http://localhost:8080";

  const endpoints = {
    auth: [
      {
        method: "POST",
        path: "/auth/register",
        description: "Register new user",
        body: `{
  "name": "Test User",
  "email": "test@example.com",
  "password": "password123"
}`
      },
      {
        method: "POST", 
        path: "/auth/login",
        description: "Login and obtain JWT token",
        body: `{
  "email": "test@example.com",
  "password": "password123"
}`
      },
      {
        method: "GET",
        path: "/auth/me",
        description: "Get authenticated user profile",
        auth: true
      },
      {
        method: "PUT",
        path: "/auth/profile", 
        description: "Update user profile",
        auth: true,
        body: `{
  "full_name": "Full Name",
  "email": "new@email.com",
  "phone": "+56912345678"
}`
      },
      {
        method: "POST",
        path: "/auth/change-password",
        description: "Change user password",
        auth: true,
        body: `{
  "current_password": "password123",
  "new_password": "newpassword123"
}`
      },
      {
        method: "POST",
        path: "/auth/logout",
        description: "Logout user session",
        auth: true
      }
    ],
    projects: [
      {
        method: "GET",
        path: "/projects",
        description: "List all user projects",
        auth: true
      },
      {
        method: "POST",
        path: "/projects",
        description: "Create new project",
        auth: true,
        body: `{
  "name": "My First Project",
  "slug": "my-first-project", 
  "description": "Project description",
  "visibility": "private"
}`
      },
      {
        method: "GET",
        path: "/projects/{id}",
        description: "Get specific project by ID",
        auth: true
      },
      {
        method: "PUT", 
        path: "/projects/{id}",
        description: "Update existing project",
        auth: true,
        body: `{
  "name": "Updated Project",
  "description": "New description",
  "visibility": "public"
}`
      },
      {
        method: "DELETE",
        path: "/projects/{id}",
        description: "Delete project",
        auth: true
      }
    ],
    services: [
      {
        method: "GET",
        path: "/projects/{id}/services",
        description: "List project services",
        auth: true
      },
      {
        method: "POST",
        path: "/projects/{id}/services",
        description: "Create new service in project",
        auth: true,
        body: `{
  "name": "API Gateway",
  "description": "Main API gateway service",
  "type": "API",
  "version": "1.0.0",
  "language": "Go",
  "environment": "production",
  "deploy_url": "https://api.example.com",
  "domain": "api.example.com",
  "git_repo": "https://github.com/user/api-gateway",
  "pos_x": 100,
  "pos_y": 200,
  "notes": "Main entry point for all requests"
}`
      },
      {
        method: "GET",
        path: "/services/{id}",
        description: "Get specific service by ID",
        auth: true
      },
      {
        method: "PUT",
        path: "/services/{id}",
        description: "Update existing service",
        auth: true,
        body: `{
  "name": "Updated API Gateway",
  "version": "1.1.0",
  "status": "active",
  "pos_x": 150,
  "pos_y": 250
}`
      },
      {
        method: "DELETE",
        path: "/services/{id}",
        description: "Delete service",
        auth: true
      }
    ],
    dependencies: [
      {
        method: "GET",
        path: "/projects/{id}/dependencies",
        description: "List project dependencies",
        auth: true
      },
      {
        method: "POST",
        path: "/projects/{id}/dependencies",
        description: "Create dependency between services",
        auth: true,
        body: `{
  "source_id": 1,
  "target_id": 2,
  "type": "HTTP",
  "description": "API Gateway calls User Service",
  "protocol": "REST",
  "method": "GET"
}`
      },
      {
        method: "PUT",
        path: "/dependencies/{id}",
        description: "Update existing dependency",
        auth: true,
        body: `{
  "type": "gRPC",
  "description": "Updated: API Gateway calls User Service via gRPC",
  "protocol": "gRPC",
  "method": "GetUser"
}`
      },
      {
        method: "DELETE",
        path: "/dependencies/{id}",
        description: "Delete dependency",
        auth: true
      }
    ],
    comments: [
      {
        method: "GET",
        path: "/projects/{id}/comments",
        description: "List project comments",
        auth: true
      },
      {
        method: "GET",
        path: "/comments",
        description: "Get all user comments",
        auth: true
      },
      {
        method: "POST",
        path: "/projects/{id}/comments",
        description: "Create comment in project",
        auth: true,
        body: `{
  "content": "This is a general comment",
  "type": "general"
}

// Comment on specific service
{
  "service_id": 1,
  "content": "This service needs optimization",
  "type": "improvement"
}

// Reply to another comment
{
  "parent_id": 1,
  "content": "I agree with this suggestion",
  "type": "general"
}`
      },
      {
        method: "GET",
        path: "/comments/{id}",
        description: "Get specific comment",
        auth: true
      },
      {
        method: "PUT",
        path: "/comments/{id}",
        description: "Update comment",
        auth: true,
        body: `{
  "content": "Updated comment content"
}`
      },
      {
        method: "DELETE",
        path: "/comments/{id}",
        description: "Delete comment (logical deletion)",
        auth: true
      }
    ],

    admin: [
      {
        method: "GET",
        path: "/admin/users",
        description: "List all users (admin only)",
        auth: true
      },
      {
        method: "POST",
        path: "/admin/users/invite",
        description: "Invite a new user with random password (admin only)",
        auth: true,
        body: `{
  "name": "Juan Pérez",
  "email": "juan@ejemplo.com",
  "role": "user"
}

// Response includes generated password:
{
  "message": "User invited successfully",
  "user": {...},
  "password": "randomPassword123"
}`
      },
      {
        method: "GET",
        path: "/admin/users/stats",
        description: "Get user statistics (admin only)",
        auth: true
      },
      {
        method: "PUT",
        path: "/admin/users/{id}",
        description: "Update user status or role (admin only)",
        auth: true,
        body: `{
  "status": "suspended",
  "role": "admin"
}`
      },
      {
        method: "DELETE",
        path: "/admin/users/{id}",
        description: "Soft delete user (admin only)",
        auth: true
      }
    ]
  };

  const getMethodColor = (method: string) => {
    switch (method) {
      case 'GET': return 'bg-green-100 text-green-800 border-green-200';
      case 'POST': return 'bg-blue-100 text-blue-800 border-blue-200';
      case 'PUT': return 'bg-yellow-100 text-yellow-800 border-yellow-200';
      case 'DELETE': return 'bg-red-100 text-red-800 border-red-200';
      default: return 'bg-gray-100 text-gray-800 border-gray-200';
    }
  };

  const EndpointCard = ({ endpoint, category }: { endpoint: any, category: string }) => (
    <Card className="mb-4">
      <CardHeader className="pb-3">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-3">
            <Badge className={getMethodColor(endpoint.method)}>
              {endpoint.method}
            </Badge>
            <code className="text-sm font-mono bg-gray-100 px-2 py-1 rounded">
              {baseURL}{endpoint.path}
            </code>
          </div>
          <div className="flex gap-1">
            {endpoint.auth && (
              <Badge variant="outline" className="text-xs">
                <Shield className="w-3 h-3 mr-1" />
                Auth Required
              </Badge>
            )}
            {endpoint.admin && (
              <Badge variant="outline" className="text-xs text-red-600">
                <UserCheck className="w-3 h-3 mr-1" />
                Admin Only
              </Badge>
            )}
          </div>
        </div>
      </CardHeader>
      <CardContent>
        <p className="text-gray-700 mb-3">{endpoint.description}</p>
        {endpoint.body && (
          <div>
            <h5 className="font-medium text-sm text-gray-900 mb-2">Request Body:</h5>
            <pre className="bg-gray-50 border rounded p-3 text-xs overflow-x-auto">
              <code>{endpoint.body}</code>
            </pre>
          </div>
        )}
      </CardContent>
    </Card>
  );

  return (
    <Layout title="API Documentation">
      <div className="p-6">
        <div className="max-w-6xl mx-auto">
          {/* Header */}
          <div className="mb-8">
            <h1 className="text-3xl font-bold text-gray-900 mb-2">API Documentation</h1>
            <p className="text-gray-600">
              Complete documentation of all available endpoints in the SAMI API
            </p>
            <div className="mt-4 p-4 bg-blue-50 border border-blue-200 rounded-lg">
              <h3 className="font-medium text-blue-900 mb-2">Base URL</h3>
              <code className="text-blue-700 bg-blue-100 px-2 py-1 rounded text-sm">
                {baseURL}
              </code>
            </div>
          </div>

          <Tabs defaultValue="auth" className="space-y-6">
            <TabsList className="grid w-full grid-cols-6">
              <TabsTrigger value="auth" className="flex items-center gap-1 text-xs">
                <Shield className="w-3 h-3" />
                Auth
              </TabsTrigger>
              <TabsTrigger value="projects" className="flex items-center gap-1 text-xs">
                <FolderOpen className="w-3 h-3" />
                Projects
              </TabsTrigger>
              <TabsTrigger value="services" className="flex items-center gap-1 text-xs">
                <Server className="w-3 h-3" />
                Services
              </TabsTrigger>
              <TabsTrigger value="dependencies" className="flex items-center gap-1 text-xs">
                <Network className="w-3 h-3" />
                Dependencies
              </TabsTrigger>
              <TabsTrigger value="comments" className="flex items-center gap-1 text-xs">
                <MessageCircle className="w-3 h-3" />
                Comments
              </TabsTrigger>
              <TabsTrigger value="admin" className="flex items-center gap-1 text-xs">
                <UserCheck className="w-3 h-3" />
                Admin
              </TabsTrigger>
            </TabsList>

            {/* Authentication Endpoints */}
            <TabsContent value="auth" className="space-y-4">
              <Card>
                <CardHeader>
                  <CardTitle className="flex items-center gap-2">
                    <Shield className="w-5 h-5" />
                    Authentication Endpoints
                  </CardTitle>
                  <CardDescription>
                    Endpoints for registration, login, profile management and authentication
                  </CardDescription>
                </CardHeader>
              </Card>
              {endpoints.auth.map((endpoint, index) => (
                <EndpointCard key={index} endpoint={endpoint} category="auth" />
              ))}
            </TabsContent>

            {/* Projects Endpoints */}
            <TabsContent value="projects" className="space-y-4">
              <Card>
                <CardHeader>
                  <CardTitle className="flex items-center gap-2">
                    <FolderOpen className="w-5 h-5" />
                    Projects Endpoints
                  </CardTitle>
                  <CardDescription>
                    Complete management of architecture projects
                  </CardDescription>
                </CardHeader>
              </Card>
              {endpoints.projects.map((endpoint, index) => (
                <EndpointCard key={index} endpoint={endpoint} category="projects" />
              ))}
            </TabsContent>

            {/* Services Endpoints */}
            <TabsContent value="services" className="space-y-4">
              <Card>
                <CardHeader>
                  <CardTitle className="flex items-center gap-2">
                    <Server className="w-5 h-5" />
                    Services Endpoints
                  </CardTitle>
                  <CardDescription>
                    Management of services and microservices within projects
                  </CardDescription>
                </CardHeader>
              </Card>
              {endpoints.services.map((endpoint, index) => (
                <EndpointCard key={index} endpoint={endpoint} category="services" />
              ))}
            </TabsContent>

            {/* Dependencies Endpoints */}
            <TabsContent value="dependencies" className="space-y-4">
              <Card>
                <CardHeader>
                  <CardTitle className="flex items-center gap-2">
                    <Network className="w-5 h-5" />
                    Dependencies Endpoints
                  </CardTitle>
                  <CardDescription>
                    Management of dependencies and connections between services
                  </CardDescription>
                </CardHeader>
              </Card>
              {endpoints.dependencies.map((endpoint, index) => (
                <EndpointCard key={index} endpoint={endpoint} category="dependencies" />
              ))}
            </TabsContent>

            {/* Comments Endpoints */}
            <TabsContent value="comments" className="space-y-4">
              <Card>
                <CardHeader>
                  <CardTitle className="flex items-center gap-2">
                    <MessageCircle className="w-5 h-5" />
                    Comments Endpoints
                  </CardTitle>
                  <CardDescription>
                    Collaborative comments system for projects and services
                  </CardDescription>
                </CardHeader>
              </Card>
              {endpoints.comments.map((endpoint, index) => (
                <EndpointCard key={index} endpoint={endpoint} category="comments" />
              ))}
            </TabsContent>

            {/* Admin Endpoints */}
            <TabsContent value="admin" className="space-y-4">
              <Card>
                <CardHeader>
                  <CardTitle className="flex items-center gap-2">
                    <UserCheck className="w-5 h-5" />
                    Admin Endpoints
                  </CardTitle>
                  <CardDescription>
                    Administrative endpoints - Only accessible to admin users
                  </CardDescription>
                </CardHeader>
              </Card>
              {endpoints.admin.map((endpoint, index) => (
                <EndpointCard key={index} endpoint={endpoint} category="admin" />
              ))}
            </TabsContent>
          </Tabs>

          {/* Authentication Info */}
          <Card className="mt-8">
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <BookOpen className="w-5 h-5" />
                Authentication Information
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              <div>
                <h4 className="font-medium text-gray-900 mb-2">JWT Token</h4>
                <p className="text-sm text-gray-700 mb-2">
                  All endpoints marked with "Auth Required" need a JWT token in the header:
                </p>
                <pre className="bg-gray-50 border rounded p-3 text-xs">
                  <code>Authorization: Bearer your-jwt-token-here</code>
                </pre>
              </div>
              <div>
                <h4 className="font-medium text-gray-900 mb-2">Get Token</h4>
                <p className="text-sm text-gray-700">
                  Use the POST /auth/login endpoint to obtain your JWT token after registration.
                </p>
              </div>
              <div>
                <h4 className="font-medium text-gray-900 mb-2">Admin Permissions</h4>
                <p className="text-sm text-gray-700">
                  Endpoints marked with "Admin Only" require the user to have administrator role.
                </p>
              </div>
            </CardContent>
          </Card>

          {/* Status Codes */}
          <Card className="mt-6">
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Code className="w-5 h-5" />
                HTTP Status Codes
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div>
                  <h4 className="font-medium text-green-700 mb-2">Success</h4>
                  <ul className="space-y-1 text-sm text-gray-700">
                    <li><code className="bg-green-100 px-1 rounded">200</code> - OK (successful operation)</li>
                    <li><code className="bg-green-100 px-1 rounded">201</code> - Created (resource created)</li>
                    <li><code className="bg-green-100 px-1 rounded">204</code> - No Content (successfully deleted)</li>
                  </ul>
                </div>
                <div>
                  <h4 className="font-medium text-red-700 mb-2">Error</h4>
                  <ul className="space-y-1 text-sm text-gray-700">
                    <li><code className="bg-red-100 px-1 rounded">400</code> - Bad Request (invalid data)</li>
                    <li><code className="bg-red-100 px-1 rounded">401</code> - Unauthorized (token required/invalid)</li>
                    <li><code className="bg-red-100 px-1 rounded">403</code> - Forbidden (insufficient permissions)</li>
                    <li><code className="bg-red-100 px-1 rounded">404</code> - Not Found (resource not found)</li>
                    <li><code className="bg-red-100 px-1 rounded">500</code> - Internal Server Error</li>
                  </ul>
                </div>
              </div>
            </CardContent>
          </Card>
        </div>
      </div>
    </Layout>
  );
} 