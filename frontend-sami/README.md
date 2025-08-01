# SAMI v2 Frontend - System Architecture Mapping Interface

![SAMI Logo](public/Sami_full_logo.png)

Este es el frontend de **SAMI**, una plataforma de código abierto para visualizar, gestionar y documentar arquitecturas de sistemas de software de manera interactiva y colaborativa. Construido con [Next.js](https://nextjs.org) y TypeScript.

## 🚀 Inicio Rápido

### Prerrequisitos
- Node.js 18+ 
- npm, yarn, pnpm o bun
- Backend de SAMI ejecutándose (ver directorio `/backend`)

### Instalación y Desarrollo

```bash
# Instalar dependencias
npm install
# o
yarn install
# o
pnpm install
# o
bun install

# Configurar variables de entorno
cp .env.local.example .env.local
# Editar .env.local con la URL de tu backend

# Ejecutar servidor de desarrollo
npm run dev
# o
yarn dev
# o
pnpm dev
# o
bun dev
```

Abre [http://localhost:3000](http://localhost:3000) en tu navegador para ver la aplicación.

## ✨ Características del Frontend

### 📊 Visualización Interactiva
- **Diagramas de flujo dinámicos** con React Flow
- **Múltiples temas visuales** (Volcánico, Matrix, Eléctrico, Cósmico, etc.)
- **Fondos personalizables** con efectos visuales avanzados
- **Leyendas colapsables** para maximizar el espacio de trabajo
- **Minimapa integrado** para navegación rápida

### 🔧 Gestión de Servicios
- **Crear y editar** servicios con detalles completos
- **Tipos de servicio predefinidos** (API, Base de datos, Cache, Cola, etc.)
- **Estados de servicio** (Activo/Inactivo) con indicadores visuales
- **Operaciones avanzadas**: copiar, pegar, duplicar, deshacer/rehacer

### 🔗 Gestión de Dependencias
- **Conexiones visuales** entre servicios
- **Múltiples protocolos** (HTTP/REST, gRPC, WebSocket, Base de datos, etc.)
- **Edición directa de conexiones** con clic
- **Tipos de dependencia** con colores distintivos

### 💾 Colaboración
- **Auto-guardado inteligente** con indicadores de estado
- **Historial de cambios** con deshacer/rehacer
- **Comentarios por proyecto** y servicio
- **Dashboard de administración** para gestión de usuarios

## 🛠️ Stack Tecnológico

- **[Next.js 14](https://nextjs.org)** - Framework de React con App Router
- **[TypeScript](https://www.typescriptlang.org/)** - Tipado estático
- **[React Flow](https://reactflow.dev/)** - Visualización de diagramas
- **[Tailwind CSS](https://tailwindcss.com/)** - Estilos utility-first
- **[shadcn/ui](https://ui.shadcn.com/)** - Componentes de UI
- **[Lucide React](https://lucide.dev/)** - Iconos
- **[Zustand](https://github.com/pmndrs/zustand)** - Gestión de estado
- **[React Hook Form](https://react-hook-form.com/)** - Gestión de formularios
- **[Zod](https://zod.dev/)** - Validación de esquemas

## 📁 Estructura del Proyecto

```
src/
├── app/                    # App Router de Next.js
│   ├── dashboard/         # Panel de administración
│   ├── login/             # Autenticación
│   ├── project-slug/      # Visualización de proyectos
│   └── ...
├── components/            # Componentes reutilizables
│   ├── ui/               # Componentes base de shadcn/ui
│   └── ...
├── lib/                  # Utilidades y configuración
│   ├── api.ts           # Cliente API
│   ├── services-store.ts # Store de Zustand
│   └── utils.ts         # Funciones auxiliares
└── types/               # Tipos TypeScript
```

## 🎯 Componentes Principales

### Visualización de Servicios
- `services-store.ts` - Store principal para gestión de servicios
- `use-services-flow.ts` - Hook para React Flow
- `enhanced-minimap.tsx` - Minimapa personalizado
- `custom-edge.tsx` - Conexiones personalizadas

### Formularios y Diálogos
- `service-dialog.tsx` - Modal para crear/editar servicios
- `dependency-dialog.tsx` - Modal para gestionar dependencias
- `comment-form.tsx` - Formulario de comentarios

### UI y Layout
- `Layout.tsx` - Layout principal
- `Header.tsx` - Barra de navegación
- `Sidebar.tsx` - Barra lateral
- Componentes UI en `/components/ui/`

## ⌨️ Atajos de Teclado

- `Ctrl + C` - Copiar servicio seleccionado
- `Ctrl + V` - Pegar servicio copiado
- `Ctrl + Z` - Deshacer última acción
- `Ctrl + Shift + Z` - Rehacer acción

## 🔧 Scripts Disponibles

```bash
# Desarrollo con Turbopack (más rápido)
npm run dev

# Compilar para producción
npm run build

# Ejecutar versión de producción
npm run start

# Verificar código con ESLint
npm run lint
```

## 🌐 Variables de Entorno

Crea un archivo `.env.local` basado en `.env.local.example`:

```env
NEXT_PUBLIC_API_URL=http://localhost:8080/api
```

## 🤝 Desarrollo

### Agregar Nuevos Componentes

El proyecto usa shadcn/ui. Para agregar nuevos componentes:

```bash
npx shadcn-ui@latest add [component-name]
```

### Estructura de Store

El estado global se gestiona con Zustand en `services-store.ts`:

```typescript
interface ServicesStore {
  services: Service[]
  connections: Connection[]
  // ... más estado
  addService: (service: Service) => void
  updateService: (id: string, updates: Partial<Service>) => void
  // ... más acciones
}
```

### API Integration

Todas las llamadas a la API están centralizadas en `lib/api.ts` y `lib/services-api.ts`.

## 📱 Responsive Design

La aplicación está optimizada para:
- **Desktop** - Experiencia completa con todos los paneles
- **Tablet** - Layout adaptativo con navegación colapsable
- **Mobile** - Interface simplificada manteniendo funcionalidad core

## 🎨 Temas y Estilos

SAMI incluye múltiples temas visuales:
- Volcánico (rojo/naranja)
- Matrix (verde)
- Eléctrico (azul)
- Cósmico (púrpura)
- Y más...

Los temas se gestionan a través de CSS custom properties y Tailwind CSS.

## 🔗 Enlaces Útiles

- [Documentación de Next.js](https://nextjs.org/docs) - Aprende sobre Next.js
- [React Flow Docs](https://reactflow.dev/learn) - Documentación de React Flow
- [shadcn/ui](https://ui.shadcn.com/) - Sistema de componentes
- [Tailwind CSS](https://tailwindcss.com/docs) - Framework de CSS

## 🤝 Contribuir

Para contribuir al desarrollo del frontend:

1. **Fork** el repositorio
2. **Crea una rama** para tu feature (`git checkout -b feature/AmazingFeature`)
3. **Commitea** tus cambios (`git commit -m 'Add some AmazingFeature'`)
4. **Push** a la rama (`git push origin feature/AmazingFeature`)
5. **Abre un Pull Request**

---

**¿Necesitas ayuda?** Revisa la [documentación completa](../README.md) del proyecto o abre un [issue](https://github.com/imnotUrban/sami/issues) en GitHub.
