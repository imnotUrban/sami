# API de Autenticación - Sami Auth API

API de autenticación desarrollada en Go con Gin framework para el proyecto MicroDocs.

## Características

- ✅ Registro de usuarios
- ✅ Autenticación con JWT
- ✅ Middleware de autenticación
- ✅ Validación de datos
- ✅ Encriptación de contraseñas con bcrypt
- ✅ Base de datos PostgreSQL

## Estructura del Proyecto

```
.
├── main.go                    # Archivo principal
├── go.mod                     # Dependencias del proyecto
├── db.sql                     # Schema de la base de datos
├── controller/
│   └── auth_controller.go     # Controladores de autenticación
├── models/
│   └── auth_model.go          # Modelos de datos
└── routes/
    └── auth_router.go         # Definición de rutas
```

## Endpoints Disponibles

| Método | Endpoint         | Descripción                                                 | Autenticación |
| ------ | ---------------- | ----------------------------------------------------------- | ------------- |
| `POST` | `/auth/register` | Registra un nuevo usuario (`name`, `email`, `password`)     | No            |
| `POST` | `/auth/login`    | Autentica un usuario con email y contraseña, devuelve token | No            |
| `GET`  | `/auth/me`       | Devuelve los datos del usuario autenticado (requiere token) | Sí            |
| `POST` | `/auth/logout`   | Cierra sesión del usuario                                   | Sí            |
| `GET`  | `/health`        | Estado del servidor                                         | No            |

## Instalación y Configuración

### 1. Prerrequisitos

- Go 1.21 o superior
- PostgreSQL 12 o superior

### 2. Clonar el repositorio

```bash
git clone <tu-repositorio>
cd sami-auth-api
```

### 3. Instalar dependencias

```bash
go mod tidy
```

### 4. Configurar base de datos

Ejecuta el script SQL en tu base de datos PostgreSQL:

```bash
psql -U postgres -d microdocs -f db.sql
```

### 5. Configurar variables de entorno

Crea un archivo `.env` en la raíz del proyecto:

```env
# Configuración de la base de datos
DATABASE_URL=postgres://username:password@localhost:5432/microdocs?sslmode=disable

# Configuración del servidor
PORT=8080

# Configuración JWT
JWT_SECRET=your-super-secret-jwt-key-change-this-in-production

# Entorno
ENV=development
```

### 6. Ejecutar el servidor

```bash
go run main.go
```

El servidor estará disponible en `http://localhost:8080`

## Ejemplos de Uso

### Registro de Usuario

```bash
curl -X POST http://localhost:8080/auth/register \
  -H "Content-Type: application/json" \
  -d '{
    "name": "Juan Pérez",
    "email": "juan@example.com",
    "password": "123456"
  }'
```

**Respuesta:**
```json
{
  "message": "Usuario registrado exitosamente",
  "user": {
    "id": 1,
    "name": "Juan Pérez",
    "email": "juan@example.com",
    "role": "user",
    "status": "active",
    "created_at": "2024-01-15T10:30:00Z",
    "last_login": null
  }
}
```

### Login

```bash
curl -X POST http://localhost:8080/auth/login \
  -H "Content-Type: application/json" \
  -d '{
    "email": "juan@example.com",
    "password": "123456"
  }'
```

**Respuesta:**
```json
{
  "token": "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9...",
  "user": {
    "id": 1,
    "name": "Juan Pérez",
    "email": "juan@example.com",
    "role": "user",
    "status": "active",
    "created_at": "2024-01-15T10:30:00Z",
    "last_login": "2024-01-15T10:35:00Z"
  }
}
```

### Obtener datos del usuario autenticado

```bash
curl -X GET http://localhost:8080/auth/me \
  -H "Authorization: Bearer eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9..."
```

**Respuesta:**
```json
{
  "user": {
    "id": 1,
    "name": "Juan Pérez",
    "email": "juan@example.com",
    "role": "user",
    "status": "active",
    "created_at": "2024-01-15T10:30:00Z",
    "last_login": "2024-01-15T10:35:00Z"
  }
}
```

### Logout

```bash
curl -X POST http://localhost:8080/auth/logout \
  -H "Authorization: Bearer eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9..."
```

**Respuesta:**
```json
{
  "message": "Sesión cerrada exitosamente"
}
```

## Estructura de Respuestas de Error

```json
{
  "error": "Descripción del error",
  "details": "Detalles específicos (opcional)"
}
```

### Códigos de Estado HTTP

- `200` - Éxito
- `201` - Creado
- `400` - Solicitud incorrecta
- `401` - No autorizado
- `409` - Conflicto (usuario ya existe)
- `500` - Error interno del servidor

## Desarrollo

### Ejecutar en modo desarrollo

```bash
go run main.go
```

### Compilar para producción

```bash
go build -o sami-auth-api main.go
```

### Ejecutar tests (cuando los agregues)

```bash
go test ./...
```

## Seguridad

- Las contraseñas se almacenan hasheadas usando bcrypt
- Los tokens JWT tienen una expiración de 24 horas
- Se incluye middleware CORS para APIs web
- Validación de entrada en todos los endpoints

## Contribuir

1. Fork el proyecto
2. Crea una rama para tu feature (`git checkout -b feature/AmazingFeature`)
3. Commit tus cambios (`git commit -m 'Add some AmazingFeature'`)
4. Push a la rama (`git push origin feature/AmazingFeature`)
5. Abre un Pull Request

## Licencia

Este proyecto está bajo la Licencia MIT. 