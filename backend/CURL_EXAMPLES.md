# CURL Examples - API Testing

## Variables de Entorno
Primero, define estas variables para facilitar el testing:

```bash
# URL base del servidor
export API_URL="http://localhost:8080"

# Token JWT (se obtiene después del login)
export JWT_TOKEN="your-jwt-token-here"
```

## 1. Autenticación

### Registrar Usuario
```bash
curl -X POST "$API_URL/auth/register" \
  -H "Content-Type: application/json" \
  -d '{
    "name": "Usuario de Prueba",
    "email": "test@example.com",
    "password": "password123"
  }'
```

### Login (Obtener Token)
```bash
curl -X POST "$API_URL/auth/login" \
  -H "Content-Type: application/json" \
  -d '{
    "email": "test@example.com",
    "password": "password123"
  }'
```

**Respuesta esperada:**
```json
{
  "token": "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9...",
  "user": {
    "id": 1,
    "name": "Usuario de Prueba",
    "email": "test@example.com",
    "role": "user",
    "status": "active",
    "created_at": "2023-01-01T00:00:00Z"
  }
}
```

### Obtener Perfil de Usuario
```bash
curl -X GET "$API_URL/auth/me" \
  -H "Authorization: Bearer $JWT_TOKEN"
```

### Logout
```bash
curl -X POST "$API_URL/auth/logout" \
  -H "Authorization: Bearer $JWT_TOKEN"
```

## 2. Proyectos - CRUD

### Listar Proyectos
```bash
curl -X GET "$API_URL/projects" \
  -H "Authorization: Bearer $JWT_TOKEN"
```

### Crear Proyecto
```bash
curl -X POST "$API_URL/projects" \
  -H "Authorization: Bearer $JWT_TOKEN" \
  -H "Content-Type: application/json" \
  -d '{
    "name": "Mi Primer Proyecto",
    "slug": "mi-primer-proyecto",
    "description": "Descripción del proyecto de prueba",
    "visibility": "private"
  }'
```

### Obtener Proyecto por ID
```bash
# Reemplaza {PROJECT_ID} con el ID real del proyecto
curl -X GET "$API_URL/projects/1" \
  -H "Authorization: Bearer $JWT_TOKEN"
```

### Actualizar Proyecto
```bash
curl -X PUT "$API_URL/projects/1" \
  -H "Authorization: Bearer $JWT_TOKEN" \
  -H "Content-Type: application/json" \
  -d '{
    "name": "Proyecto Actualizado",
    "description": "Nueva descripción del proyecto",
    "visibility": "public"
  }'
```

### Eliminar Proyecto
```bash
curl -X DELETE "$API_URL/projects/1" \
  -H "Authorization: Bearer $JWT_TOKEN"
```

## 3. Colaboradores

### Crear Segundo Usuario (para pruebas de colaboradores)
```bash
curl -X POST "$API_URL/auth/register" \
  -H "Content-Type: application/json" \
  -d '{
    "name": "Colaborador de Prueba",
    "email": "collaborator@example.com",
    "password": "password123"
  }'
```

### Listar Colaboradores del Proyecto
```bash
curl -X GET "$API_URL/projects/1/collaborators" \
  -H "Authorization: Bearer $JWT_TOKEN"
```

### Agregar Colaborador
```bash
curl -X POST "$API_URL/projects/1/collaborators" \
  -H "Authorization: Bearer $JWT_TOKEN" \
  -H "Content-Type: application/json" \
  -d '{
    "user_id": 2,
    "role": "editor"
  }'
```

### Quitar Colaborador
```bash
# Reemplaza {USER_ID} con el ID del usuario a remover
curl -X DELETE "$API_URL/projects/1/collaborators/2" \
  -H "Authorization: Bearer $JWT_TOKEN"
```

## 4. Servicios

### Listar Servicios de un Proyecto
```bash
curl -X GET "$API_URL/projects/1/services" \
  -H "Authorization: Bearer $JWT_TOKEN"
```

### Crear Servicio
```bash
curl -X POST "$API_URL/projects/1/services" \
  -H "Authorization: Bearer $JWT_TOKEN" \
  -H "Content-Type: application/json" \
  -d '{
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
  }'
```

### Obtener Servicio por ID
```bash
curl -X GET "$API_URL/services/1" \
  -H "Authorization: Bearer $JWT_TOKEN"
```

### Actualizar Servicio
```bash
curl -X PUT "$API_URL/services/1" \
  -H "Authorization: Bearer $JWT_TOKEN" \
  -H "Content-Type: application/json" \
  -d '{
    "name": "Updated API Gateway",
    "version": "1.1.0",
    "status": "active",
    "pos_x": 150,
    "pos_y": 250
  }'
```

### Eliminar Servicio
```bash
curl -X DELETE "$API_URL/services/1" \
  -H "Authorization: Bearer $JWT_TOKEN"
```

## 5. Dependencies between Services

### Listar Dependencias de un Proyecto
```bash
curl -X GET "$API_URL/projects/1/dependencies" \
  -H "Authorization: Bearer $JWT_TOKEN"
```

### Crear Dependencia entre Servicios
```bash
curl -X POST "$API_URL/projects/1/dependencies" \
  -H "Authorization: Bearer $JWT_TOKEN" \
  -H "Content-Type: application/json" \
  -d '{
    "source_id": 1,
    "target_id": 2,
    "type": "HTTP",
    "description": "API Gateway calls User Service",
    "protocol": "REST",
    "method": "GET"
  }'
```

### Actualizar Dependencia
```bash
curl -X PUT "$API_URL/dependencies/1" \
  -H "Authorization: Bearer $JWT_TOKEN" \
  -H "Content-Type: application/json" \
  -d '{
    "type": "gRPC",
    "description": "Updated: API Gateway calls User Service via gRPC",
    "protocol": "gRPC",
    "method": "GetUser"
  }'
```

### Eliminar Dependencia
```bash
curl -X DELETE "$API_URL/dependencies/1" \
  -H "Authorization: Bearer $JWT_TOKEN"
```

## 6. Comments

### List Project Comments
```bash
# List all comments for a project
curl -X GET "$API_URL/projects/1/comments" \
  -H "Authorization: Bearer $JWT_TOKEN"

# List comments filtered by service
curl -X GET "$API_URL/projects/1/comments?service_id=1" \
  -H "Authorization: Bearer $JWT_TOKEN"

# List comments filtered by type
curl -X GET "$API_URL/projects/1/comments?type=issue" \
  -H "Authorization: Bearer $JWT_TOKEN"
```

### Create Project Comment
```bash
# Create a general project comment
curl -X POST "$API_URL/projects/1/comments" \
  -H "Authorization: Bearer $JWT_TOKEN" \
  -H "Content-Type: application/json" \
  -d '{
    "content": "This is a general comment about the project",
    "type": "general"
  }'

# Create a comment on a specific service
curl -X POST "$API_URL/projects/1/comments" \
  -H "Authorization: Bearer $JWT_TOKEN" \
  -H "Content-Type: application/json" \
  -d '{
    "service_id": 1,
    "content": "This service needs optimization",
    "type": "improvement"
  }'

# Create a reply to another comment
curl -X POST "$API_URL/projects/1/comments" \
  -H "Authorization: Bearer $JWT_TOKEN" \
  -H "Content-Type: application/json" \
  -d '{
    "parent_id": 1,
    "content": "I agree with this suggestion",
    "type": "general"
  }'

# Create an issue comment
curl -X POST "$API_URL/projects/1/comments" \
  -H "Authorization: Bearer $JWT_TOKEN" \
  -H "Content-Type: application/json" \
  -d '{
    "service_id": 2,
    "content": "This service is experiencing downtime",
    "type": "issue"
  }'
```

### Get Specific Comment
```bash
curl -X GET "$API_URL/comments/1" \
  -H "Authorization: Bearer $JWT_TOKEN"
```

### Update Comment
```bash
curl -X PUT "$API_URL/comments/1" \
  -H "Authorization: Bearer $JWT_TOKEN" \
  -H "Content-Type: application/json" \
  -d '{
    "content": "Updated comment content with new information"
  }'
```

### Delete Comment (Logical Deletion)
```bash
curl -X DELETE "$API_URL/comments/1" \
  -H "Authorization: Bearer $JWT_TOKEN"
```

## 7. Project History

### List Project History
```bash
# List all history events for a project
curl -X GET "$API_URL/projects/1/history" \
  -H "Authorization: Bearer $JWT_TOKEN"

# List history with pagination
curl -X GET "$API_URL/projects/1/history?limit=20&offset=0" \
  -H "Authorization: Bearer $JWT_TOKEN"

# Filter history by action type
curl -X GET "$API_URL/projects/1/history?action=create_service" \
  -H "Authorization: Bearer $JWT_TOKEN"
```

## 8. Admin Endpoints

### List All Users (Admin Only)
```bash
# List all users
curl -X GET "$API_URL/admin/users" \
  -H "Authorization: Bearer $JWT_TOKEN"

# List users with pagination
curl -X GET "$API_URL/admin/users?limit=20&offset=0" \
  -H "Authorization: Bearer $JWT_TOKEN"

# Filter users by status
curl -X GET "$API_URL/admin/users?status=active" \
  -H "Authorization: Bearer $JWT_TOKEN"

# Filter users by role
curl -X GET "$API_URL/admin/users?role=admin" \
  -H "Authorization: Bearer $JWT_TOKEN"

# Search users by name or email
curl -X GET "$API_URL/admin/users?search=john" \
  -H "Authorization: Bearer $JWT_TOKEN"
```

### Invite New User (Admin Only)
```bash
# Invite a regular user
curl -X POST "$API_URL/admin/users/invite" \
  -H "Authorization: Bearer $JWT_TOKEN" \
  -H "Content-Type: application/json" \
  -d '{
    "name": "Juan Pérez",
    "email": "juan@ejemplo.com",
    "role": "user"
  }'

# Invite an admin user
curl -X POST "$API_URL/admin/users/invite" \
  -H "Authorization: Bearer $JWT_TOKEN" \
  -H "Content-Type: application/json" \
  -d '{
    "name": "María González",
    "email": "maria@ejemplo.com",
    "role": "admin"
  }'

# Response includes generated password:
# {
#   "message": "User invited successfully",
#   "user": {
#     "id": 10,
#     "name": "Juan Pérez",
#     "email": "juan@ejemplo.com",
#     "role": "user",
#     "status": "active",
#     "created_at": "2023-01-01T00:00:00Z"
#   },
#   "password": "randomPassword123"
# }
```

### Get User Statistics (Admin Only)
```bash
curl -X GET "$API_URL/admin/users/stats" \
  -H "Authorization: Bearer $JWT_TOKEN"
```

### Update User (Admin Only)
```bash
# Update user status
curl -X PUT "$API_URL/admin/users/1" \
  -H "Authorization: Bearer $JWT_TOKEN" \
  -H "Content-Type: application/json" \
  -d '{
    "status": "suspended"
  }'

# Update user role
curl -X PUT "$API_URL/admin/users/1" \
  -H "Authorization: Bearer $JWT_TOKEN" \
  -H "Content-Type: application/json" \
  -d '{
    "role": "admin"
  }'

# Update both status and role
curl -X PUT "$API_URL/admin/users/1" \
  -H "Authorization: Bearer $JWT_TOKEN" \
  -H "Content-Type: application/json" \
  -d '{
    "status": "active",
    "role": "user"
  }'
```

### Delete User (Admin Only)
```bash
# Soft delete a user
curl -X DELETE "$API_URL/admin/users/1" \
  -H "Authorization: Bearer $JWT_TOKEN"
```

## 9. Health Check

### Verificar Estado del Servidor
```bash
curl -X GET "$API_URL/health"
```

## 10. Ejemplos de Pruebas Completas

### Script de Prueba Completo
```bash
#!/bin/bash

# Variables
API_URL="http://localhost:8080"

echo "=== 1. Health Check ==="
curl -X GET "$API_URL/health"
echo -e "\n"

echo "=== 2. Registrar Usuario ==="
REGISTER_RESPONSE=$(curl -s -X POST "$API_URL/auth/register" \
  -H "Content-Type: application/json" \
  -d '{
    "name": "Test User",
    "email": "test@example.com",
    "password": "password123"
  }')
echo $REGISTER_RESPONSE
echo -e "\n"

echo "=== 3. Login ==="
LOGIN_RESPONSE=$(curl -s -X POST "$API_URL/auth/login" \
  -H "Content-Type: application/json" \
  -d '{
    "email": "test@example.com",
    "password": "password123"
  }')
echo $LOGIN_RESPONSE

# Extraer token (requiere jq)
JWT_TOKEN=$(echo $LOGIN_RESPONSE | jq -r '.token')
echo "Token: $JWT_TOKEN"
echo -e "\n"

echo "=== 4. Crear Proyecto ==="
PROJECT_RESPONSE=$(curl -s -X POST "$API_URL/projects" \
  -H "Authorization: Bearer $JWT_TOKEN" \
  -H "Content-Type: application/json" \
  -d '{
    "name": "Test Project",
    "slug": "test-project",
    "description": "A test project"
  }')
echo $PROJECT_RESPONSE

# Extraer project_id
PROJECT_ID=$(echo $PROJECT_RESPONSE | jq -r '.project.id')
echo "Project ID: $PROJECT_ID"
echo -e "\n"

echo "=== 5. Listar Proyectos ==="
curl -s -X GET "$API_URL/projects" \
  -H "Authorization: Bearer $JWT_TOKEN" | jq
echo -e "\n"

echo "=== 6. Obtener Proyecto ==="
curl -s -X GET "$API_URL/projects/$PROJECT_ID" \
  -H "Authorization: Bearer $JWT_TOKEN" | jq
echo -e "\n"

echo "=== 7. Actualizar Proyecto ==="
curl -s -X PUT "$API_URL/projects/$PROJECT_ID" \
  -H "Authorization: Bearer $JWT_TOKEN" \
  -H "Content-Type: application/json" \
  -d '{
    "name": "Updated Test Project",
    "visibility": "public"
  }' | jq
echo -e "\n"

echo "=== 8. Listar Colaboradores ==="
curl -s -X GET "$API_URL/projects/$PROJECT_ID/collaborators" \
  -H "Authorization: Bearer $JWT_TOKEN" | jq
echo -e "\n"

echo "=== 9. Ver Historial del Proyecto ==="
curl -s -X GET "$API_URL/projects/$PROJECT_ID/history?limit=10" \
  -H "Authorization: Bearer $JWT_TOKEN" | jq
echo -e "\n"
```

## 11. Casos de Error

### Acceso sin Token
```bash
curl -X GET "$API_URL/projects"
# Respuesta: {"error":"Authorization token required"}
```

### Token Inválido
```bash
curl -X GET "$API_URL/projects" \
  -H "Authorization: Bearer invalid-token"
# Respuesta: {"error":"Invalid token"}
```

### Proyecto No Encontrado
```bash
curl -X GET "$API_URL/projects/999" \
  -H "Authorization: Bearer $JWT_TOKEN"
# Respuesta: {"error":"Project not found"}
```

### Slug Duplicado
```bash
# Crear proyecto con slug existente
curl -X POST "$API_URL/projects" \
  -H "Authorization: Bearer $JWT_TOKEN" \
  -H "Content-Type: application/json" \
  -d '{
    "name": "Otro Proyecto",
    "slug": "test-project"
  }'
# Respuesta: {"error":"Project with this slug already exists"}
```

### Datos Inválidos
```bash
curl -X POST "$API_URL/projects" \
  -H "Authorization: Bearer $JWT_TOKEN" \
  -H "Content-Type: application/json" \
  -d '{
    "name": "",
    "slug": "a"
  }'
# Respuesta: {"error":"Invalid data","details":"..."}
```

### Acceso Admin sin Permisos
```bash
curl -X GET "$API_URL/admin/users" \
  -H "Authorization: Bearer $JWT_TOKEN"
# Respuesta: {"error":"Admin access required"}
```

### Historial de Proyecto sin Acceso
```bash
curl -X GET "$API_URL/projects/999/history" \
  -H "Authorization: Bearer $JWT_TOKEN"
# Respuesta: {"error":"Project not found"}
```

## 12. Tips para Testing

### Usar jq para Formatear JSON
```bash
curl -s -X GET "$API_URL/projects" \
  -H "Authorization: Bearer $JWT_TOKEN" | jq '.'
```

### Guardar Token en Variable
```bash
JWT_TOKEN=$(curl -s -X POST "$API_URL/auth/login" \
  -H "Content-Type: application/json" \
  -d '{"email":"test@example.com","password":"password123"}' | jq -r '.token')
```

### Verificar Código de Estado HTTP
```bash
curl -w "%{http_code}" -s -o /dev/null -X GET "$API_URL/projects" \
  -H "Authorization: Bearer $JWT_TOKEN"
```

### Mostrar Headers de Respuesta
```bash
curl -i -X GET "$API_URL/projects" \
  -H "Authorization: Bearer $JWT_TOKEN"
``` 