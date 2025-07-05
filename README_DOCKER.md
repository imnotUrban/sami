# SAMI - Docker Setup

## Requisitos

- Docker
- Docker Compose

## Configuración y Ejecución

### 1. Construir y ejecutar los servicios

```bash
# Construir e iniciar todos los servicios
docker-compose up --build

# Ejecutar en segundo plano
docker-compose up -d --build
```

### 2. Servicios disponibles

- **Frontend (Next.js)**: http://localhost:3000
- **Backend (Go/Gin)**: http://localhost:8080
- **Base de datos (PostgreSQL)**: localhost:5432

### 3. Usuario Administrador

Se crea automáticamente un usuario administrador con las siguientes credenciales:

- **Email**: admin@sami.local
- **Contraseña**: admin123
- **Rol**: admin

### 4. Comandos útiles

```bash
# Ver logs de todos los servicios
docker-compose logs -f

# Ver logs de un servicio específico
docker-compose logs -f backend
docker-compose logs -f frontend
docker-compose logs -f db

# Detener todos los servicios
docker-compose down

# Detener y eliminar volúmenes (¡CUIDADO: elimina datos!)
docker-compose down -v

# Reconstruir un servicio específico
docker-compose build backend
docker-compose build frontend

# Ejecutar comandos en un contenedor
docker-compose exec backend sh
docker-compose exec frontend sh
docker-compose exec db psql -U postgres -d microdocs
```

### 5. Verificar el estado

```bash
# Verificar que todos los servicios estén ejecutándose
docker-compose ps

# Verificar los logs de salud
docker-compose logs -f | grep -i health
```

### 6. Acceder a la base de datos

```bash
# Conectar a PostgreSQL
docker-compose exec db psql -U postgres -d microdocs

# Verificar el usuario administrador
SELECT * FROM users WHERE email = 'admin@sami.local';
```

### 7. Configuración de desarrollo

Para desarrollo local, puedes modificar el archivo `.env` con tus configuraciones personalizadas.

### 8. Solución de problemas

#### Si el backend no puede conectarse a la base de datos:
```bash
# Verificar que la base de datos esté ejecutándose
docker-compose exec db pg_isready -U postgres

# Reiniciar el backend
docker-compose restart backend
```

#### Si el frontend no puede conectarse al backend:
```bash
# Verificar que el backend esté ejecutándose
curl http://localhost:8080/health

# Reiniciar el frontend
docker-compose restart frontend
```

#### Para limpiar todo y empezar de nuevo:
```bash
# Detener y eliminar contenedores, redes y volúmenes
docker-compose down -v

# Eliminar imágenes (opcional)
docker rmi sami_backend sami_frontend

# Reconstruir desde cero
docker-compose up --build
```

## Estructura del proyecto

```
.
├── docker-compose.yml          # Configuración de Docker Compose
├── .env                        # Variables de entorno
├── init-admin.sql             # Script de inicialización del admin
├── backend/
│   ├── Dockerfile             # Dockerfile para Go backend
│   ├── main.go
│   ├── go.mod
│   └── db.sql                 # Schema de la base de datos
├── frontend-sami/
│   ├── Dockerfile             # Dockerfile para Next.js frontend
│   ├── package.json
│   └── next.config.ts         # Configuración de Next.js
└── README_DOCKER.md           # Este archivo
```

## Notas importantes

- Los datos de PostgreSQL se persisten en un volumen Docker (`postgres_data`)
- El backend está configurado para usar PostgreSQL con GORM
- El frontend está optimizado para producción con Next.js standalone
- Todos los servicios tienen health checks configurados
- Las contraseñas por defecto son solo para desarrollo. **¡Cámbialas en producción!** 