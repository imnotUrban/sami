# API Endpoints Documentation

## Project Management API

This API provides endpoints for managing projects and their collaborators. All project endpoints require authentication via JWT token.

### Authentication

All project endpoints require authentication. Include the JWT token in the Authorization header:

```
Authorization: Bearer <your-jwt-token>
```

## Project Endpoints

### 1. List Projects
- **Method**: `GET`
- **URL**: `/projects`
- **Description**: Lists all projects visible to the authenticated user (owned, public, or where user is a collaborator)
- **Authentication**: Required
- **Response**: 
```json
{
  "projects": [
    {
      "id": 1,
      "name": "Project Name",
      "slug": "project-slug",
      "description": "Project description",
      "owner_id": 1,
      "owner": {
        "id": 1,
        "name": "Owner Name",
        "email": "owner@example.com",
        "role": "user",
        "status": "active",
        "created_at": "2023-01-01T00:00:00Z"
      },
      "visibility": "private",
      "status": "active",
      "created_at": "2023-01-01T00:00:00Z",
      "updated_at": "2023-01-01T00:00:00Z"
    }
  ]
}
```

### 2. Create Project
- **Method**: `POST`
- **URL**: `/projects`
- **Description**: Creates a new project
- **Authentication**: Required
- **Request Body**:
```json
{
  "name": "Project Name",
  "slug": "project-slug",
  "description": "Project description",
  "visibility": "private"
}
```
- **Required Fields**: `name`, `slug`
- **Optional Fields**: `description`, `visibility` (defaults to "private")
- **Response**: 
```json
{
  "message": "Project created successfully",
  "project": {
    "id": 1,
    "name": "Project Name",
    "slug": "project-slug",
    "description": "Project description",
    "owner_id": 1,
    "owner": {
      "id": 1,
      "name": "Owner Name",
      "email": "owner@example.com",
      "role": "user",
      "status": "active",
      "created_at": "2023-01-01T00:00:00Z"
    },
    "visibility": "private",
    "status": "active",
    "created_at": "2023-01-01T00:00:00Z",
    "updated_at": "2023-01-01T00:00:00Z"
  }
}
```

### 3. Get Project Details
- **Method**: `GET`
- **URL**: `/projects/:id`
- **Description**: Retrieves details of a specific project
- **Authentication**: Required
- **URL Parameters**: `id` (project ID)
- **Response**: Same as create project response

### 4. Update Project
- **Method**: `PUT`
- **URL**: `/projects/:id`
- **Description**: Updates project details (only project owner or admin can update)
- **Authentication**: Required
- **URL Parameters**: `id` (project ID)
- **Request Body**:
```json
{
  "name": "Updated Project Name",
  "description": "Updated description",
  "visibility": "public",
  "status": "archived"
}
```
- **All Fields Optional**: Only provided fields will be updated
- **Allowed Values**: 
  - `visibility`: "private" or "public"
  - `status`: "active" or "archived"
- **Response**: 
```json
{
  "message": "Project updated successfully",
  "project": {
    // Updated project object
  }
}
```

### 5. Delete Project
- **Method**: `DELETE`
- **URL**: `/projects/:id`
- **Description**: Deletes (archives) a project (only project owner or admin can delete)
- **Authentication**: Required
- **URL Parameters**: `id` (project ID)
- **Response**: 
```json
{
  "message": "Project deleted successfully"
}
```

## Project Collaborator Endpoints

### 6. List Project Collaborators
- **Method**: `GET`
- **URL**: `/projects/:id/collaborators`
- **Description**: Lists all active collaborators of a project
- **Authentication**: Required
- **URL Parameters**: `id` (project ID)
- **Response**: 
```json
{
  "collaborators": [
    {
      "user_id": 2,
      "user": {
        "id": 2,
        "name": "Collaborator Name",
        "email": "collaborator@example.com",
        "role": "user",
        "status": "active",
        "created_at": "2023-01-01T00:00:00Z"
      },
      "role": "editor",
      "joined_at": "2023-01-01T00:00:00Z",
      "state": "active"
    }
  ]
}
```

### 7. Add Project Collaborator
- **Method**: `POST`
- **URL**: `/projects/:id/collaborators`
- **Description**: Adds a collaborator to a project (only project owner or admin can add)
- **Authentication**: Required
- **URL Parameters**: `id` (project ID)
- **Request Body**:
```json
{
  "user_id": 2,
  "role": "editor"
}
```
- **Required Fields**: `user_id`
- **Optional Fields**: `role` (defaults to "editor")
- **Allowed Roles**: "owner", "editor", "viewer"
- **Response**: 
```json
{
  "message": "Collaborator added successfully",
  "collaborator": {
    "user_id": 2,
    "user": {
      "id": 2,
      "name": "Collaborator Name",
      "email": "collaborator@example.com",
      "role": "user",
      "status": "active",
      "created_at": "2023-01-01T00:00:00Z"
    },
    "role": "editor",
    "joined_at": "2023-01-01T00:00:00Z",
    "state": "active"
  }
}
```

### 8. Remove Project Collaborator
- **Method**: `DELETE`
- **URL**: `/projects/:id/collaborators/:user_id`
- **Description**: Removes a collaborator from a project (only project owner or admin can remove)
- **Authentication**: Required
- **URL Parameters**: 
  - `id` (project ID)
  - `user_id` (user ID to remove)
- **Response**: 
```json
{
  "message": "Collaborator removed successfully"
}
```

## Dependency Endpoints

### 15. List Project Dependencies
- **Method**: `GET`
- **URL**: `/projects/:id/dependencies`
- **Description**: Lists all dependencies (connections) between services in a project
- **Authentication**: Required
- **URL Parameters**: `id` (project ID)
- **Response**: 
```json
{
  "dependencies": [
    {
      "id": 1,
      "source_id": 1,
      "target_id": 2,
      "type": "HTTP",
      "description": "API Gateway calls User Service",
      "protocol": "REST",
      "method": "GET",
      "created_by": 1,
      "updated_by": null,
      "created_at": "2023-01-01T00:00:00Z",
      "updated_at": "2023-01-01T00:00:00Z",
      "source_service": {
        "id": 1,
        "name": "API Gateway",
        "type": "API",
        // ... other service fields
      },
      "target_service": {
        "id": 2,
        "name": "User Service",
        "type": "API",
        // ... other service fields
      },
      "creator": {
        "id": 1,
        "name": "Creator Name",
        "email": "creator@example.com"
      }
    }
  ]
}
```

### 16. Create Project Dependency
- **Method**: `POST`
- **URL**: `/projects/:id/dependencies`
- **Description**: Creates a new dependency between two services in a project
- **Authentication**: Required
- **URL Parameters**: `id` (project ID)
- **Request Body**:
```json
{
  "source_id": 1,
  "target_id": 2,
  "type": "HTTP",
  "description": "API Gateway calls User Service",
  "protocol": "REST",
  "method": "GET"
}
```
- **Required Fields**: `source_id`, `target_id`
- **Optional Fields**: `type`, `description`, `protocol`, `method`
- **Response**: 
```json
{
  "message": "Dependency created successfully",
  "dependency": {
    // Complete dependency object with relations
  }
}
```

### 17. Update Dependency
- **Method**: `PUT`
- **URL**: `/dependencies/:id`
- **Description**: Updates an existing dependency
- **Authentication**: Required
- **URL Parameters**: `id` (dependency ID)
- **Request Body**:
```json
{
  "type": "gRPC",
  "description": "Updated: API Gateway calls User Service via gRPC",
  "protocol": "gRPC",
  "method": "GetUser"
}
```
- **All Fields Optional**: Only provided fields will be updated
- **Response**: 
```json
{
  "message": "Dependency updated successfully",
  "dependency": {
    // Updated dependency object with relations
  }
}
```

### 18. Delete Dependency
- **Method**: `DELETE`
- **URL**: `/dependencies/:id`
- **Description**: Deletes a dependency between services
- **Authentication**: Required
- **URL Parameters**: `id` (dependency ID)
- **Response**: 
```json
{
  "message": "Dependency deleted successfully"
}
```

## Error Responses

All endpoints can return the following error responses:

### 400 Bad Request
```json
{
  "error": "Invalid data",
  "details": "Validation error details"
}
```

### 401 Unauthorized
```json
{
  "error": "User not authenticated"
}
```

### 403 Forbidden
```json
{
  "error": "Access denied"
}
```

### 404 Not Found
```json
{
  "error": "Project not found"
}
```

### 409 Conflict
```json
{
  "error": "Project with this slug already exists"
}
```

### 500 Internal Server Error
```json
{
  "error": "Internal server error"
}
```

## Authentication Endpoints

### Register
- **Method**: `POST`
- **URL**: `/auth/register`
- **Description**: Registers a new user

### Login
- **Method**: `POST`
- **URL**: `/auth/login`
- **Description**: Authenticates a user and returns JWT token

### Profile
- **Method**: `GET`
- **URL**: `/auth/me`
- **Description**: Returns authenticated user profile
- **Authentication**: Required

### Logout
- **Method**: `POST`
- **URL**: `/auth/logout`
- **Description**: Logs out the user
- **Authentication**: Required

## Health Check

### Health Check
- **Method**: `GET`
- **URL**: `/health`
- **Description**: Server health check endpoint
- **Response**: 
```json
{
  "status": "ok",
  "message": "Server running correctly"
}
``` 