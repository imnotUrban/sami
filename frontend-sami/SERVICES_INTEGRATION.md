# Services Integration Documentation

## Overview
This document describes the complete integration of the Services and Dependencies architecture diagram functionality into the SAMI v2 project. The system now uses **real APIs** connected to the Go backend.

## Features Implemented

### 1. Interactive Service Architecture Diagram
- **Visual representation** of microservices using React Flow
- **Drag and drop** functionality to create connections between services
- **Custom node components** with different styles for different service types (API, Database, Web, etc.)
- **Real-time updates** with backend synchronization
- **Interactive minimap** with service type legend
- **Pan and zoom** controls for large architectures

### 2. Service Management
- **CRUD operations** for services (Create, Read, Update, Delete)
- **Service types**: API, Database, Web, Microservice, etc.
- **Environment support**: Production, Development, Staging
- **Status tracking**: Active, Inactive
- **Metadata storage**: Version, Language, Deploy URL, Git repository
- **Health metrics** integration ready

### 3. Dependency Management
- **Visual connection creation** by dragging between services
- **Dependency types**: HTTP, gRPC, TCP, Database connections
- **Protocol specification**: REST, GraphQL, WebSocket, etc.
- **Method tracking**: GET, POST, PUT, DELETE, etc.
- **Dependency descriptions** and notes

### 4. Real-time Features
- **Connection notifications** when dependencies are created
- **Visual feedback** during connection creation
- **Error handling** and user feedback
- **Loading states** for better UX

### 5. Side Panel Interface
- **Service details** with comprehensive information
- **Tabbed interface** (Overview, Dependencies, Metrics, Config)
- **Service list** with quick selection
- **Dependency list** with filtering
- **Add/Edit forms** for services and dependencies

## Data Structure

### Service Interface
```typescript
interface Service {
  id: number
  project_id: number
  name: string
  description?: string
  type: string                     // API, DB, Web, etc.
  status: string                   // active, inactive
  version?: string
  language?: string
  environment: string              // production, development, staging
  deploy_url?: string
  domain?: string
  git_repo?: string
  health_metrics?: any
  metadata?: any
  pos_x?: number                   // Position in diagram
  pos_y?: number
  notes?: string
  created_by: number
  updated_by?: number
  created_at: string
  updated_at: string
}
```

### Dependency Interface
```typescript
interface Dependency {
  id: number
  source_id: number                // Service ID that initiates the connection
  target_id: number                // Service ID that receives the connection
  type?: string                    // HTTP, gRPC, TCP, etc.
  description?: string
  protocol?: string                // REST, GraphQL, WebSocket, etc.
  method?: string                  // GET, POST, PUT, DELETE, etc.
  created_by: number
  updated_by?: number
  created_at: string
  updated_at: string
}
```

## API Integration

### Authentication
All API calls use JWT authentication from localStorage:
```typescript
const token = localStorage.getItem('token')
```

### Services API Endpoints
- `GET /projects/{id}/services` - Get all services for a project
- `GET /services/{id}` - Get specific service details
- `POST /projects/{id}/services` - Create new service
- `PUT /services/{id}` - Update service
- `DELETE /services/{id}` - Delete service

### Dependencies API Endpoints
- `GET /projects/{id}/dependencies` - Get all dependencies for a project
- `GET /dependencies/{id}` - Get specific dependency details
- `POST /projects/{id}/dependencies` - Create new dependency
- `PUT /dependencies/{id}` - Update dependency
- `DELETE /dependencies/{id}` - Delete dependency

### Error Handling
- **401 Unauthorized**: Automatic redirect to login page
- **Network errors**: User-friendly error messages
- **Validation errors**: Field-specific error display
- **Loading states**: Spinner and skeleton loaders

## File Structure

### Components
```
src/components/
├── enhanced-minimap.tsx        # Minimap with service type legend
├── dependency-form.tsx         # Form for creating/editing dependencies
├── dependency-dialog.tsx       # Modal wrapper for dependency form
├── custom-edge.tsx            # Custom edge component for React Flow
├── connection-styles.tsx       # CSS styles for connections
├── connection-notification.tsx # Toast notifications for connections
└── service-form.tsx           # Form for creating/editing services
```

### Pages
```
src/app/dashboard/projects/[id]/services/page.tsx  # Main services page
```

### API & Utilities
```
src/lib/
├── services-api.ts            # API functions for services and dependencies
└── use-services.ts           # Custom hook for state management
```

### UI Components
```
src/components/ui/
├── textarea.tsx              # Multi-line text input
├── select.tsx               # Dropdown selection
├── tabs.tsx                 # Tabbed interface
├── scroll-area.tsx          # Scrollable container
└── dialog.tsx               # Modal dialogs
```

## Usage

### Accessing the Services Page
Navigate to: `/dashboard/projects/{project_id}/services`

The page is integrated into the project detail view with a "Services" button.

### Creating Services
1. Use the service form to add new services
2. Specify service type, environment, and other metadata
3. Services appear as nodes in the diagram

### Creating Dependencies
1. **Drag method**: Drag from one service node to another
2. **Form method**: Use the "Add Dependency" button
3. Specify connection type, protocol, and method
4. Dependencies appear as edges in the diagram

### Real-time Updates
- All changes are immediately saved to the backend
- Other users see updates in real-time (when implemented)
- Connection notifications appear for new dependencies

## Dependencies

### Installed Packages
```json
{
  "reactflow": "^11.11.0",
  "@radix-ui/react-scroll-area": "^1.0.5",
  "@radix-ui/react-tabs": "^1.0.4",
  "@radix-ui/react-dialog": "^1.0.5",
  "@radix-ui/react-select": "^2.0.0"
}
```

## Configuration

### Environment Variables
```
NEXT_PUBLIC_API_URL=http://localhost:8080  # Backend API URL
```

## Security

### Authentication
- JWT tokens stored in localStorage
- Automatic token validation
- Redirect to login on 401 errors
- Token refresh handling (to be implemented)

### Authorization
- Project-based access control
- User role validation
- Service creation permissions

## Performance

### Optimizations
- **Memoized components** for React Flow nodes
- **Lazy loading** for large diagrams
- **Debounced API calls** for frequent updates
- **Virtual scrolling** for service lists

### Caching
- Service data cached in React state
- Background refresh capabilities
- Optimistic updates for better UX

## Future Enhancements

### Planned Features
1. **Real-time collaboration** using WebSockets
2. **Service health monitoring** integration
3. **Automated dependency discovery**
4. **Export/Import** functionality (JSON, YAML)
5. **Version control** for architecture diagrams
6. **Service templates** for common patterns
7. **Deployment integration** with CI/CD pipelines
8. **Performance metrics** visualization
9. **Alert system** for service issues
10. **Mobile responsive** design

### Technical Improvements
1. **GraphQL** integration for more efficient queries
2. **State management** with Redux or Zustand
3. **Offline support** with service workers
4. **Advanced filtering** and search capabilities
5. **Bulk operations** for services and dependencies
6. **Undo/Redo** functionality
7. **Keyboard shortcuts** for power users
8. **Advanced layouts** (automatic positioning)

## Integration Status

✅ **Completed**
- Basic CRUD operations for services and dependencies
- Interactive React Flow diagram
- JWT authentication integration
- Real API connections
- Error handling and loading states
- Responsive UI components

🚧 **In Progress**
- Backend API endpoints implementation
- Real-time updates
- Advanced filtering

📋 **Planned**
- Health metrics integration
- Automated discovery
- Export/Import functionality

## Support

For questions or issues regarding the services integration, please refer to:
- Backend API documentation in `backend/API_ENDPOINTS.md`
- Component documentation in individual files
- React Flow documentation: https://reactflow.dev/
- Project README for general setup instructions 