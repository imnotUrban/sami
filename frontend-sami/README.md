# SAMI v2 Frontend - System Architecture Mapping Interface

![SAMI Logo](public/Sami_full_logo.png)

This is the frontend for **SAMI**, an open source platform to visualize, manage and document software system architectures in an interactive and collaborative way. Built with [Next.js](https://nextjs.org) and TypeScript.

## 🚀 Quick Start

### Prerequisites
- Node.js 18+ 
- npm, yarn, pnpm or bun
- SAMI backend running (see `/backend` directory)

### Installation and Development

```bash
# Install dependencies
npm install
# or
yarn install
# or
pnpm install
# or
bun install

# Configure environment variables
cp .env.local.example .env.local
# Edit .env.local with your backend URL

# Run development server
npm run dev
# or
yarn dev
# or
pnpm dev
# or
bun dev
```

Open [http://localhost:3000](http://localhost:3000) with your browser to see the application.

## ✨ Frontend Features

### 📊 Interactive Visualization
- **Dynamic flow diagrams** with React Flow
- **Multiple visual themes** (Volcanic, Matrix, Electric, Cosmic, etc.)
- **Customizable backgrounds** with advanced visual effects
- **Collapsible legends** to maximize workspace
- **Integrated minimap** for quick navigation

### 🔧 Service Management
- **Create and edit** services with complete details
- **Predefined service types** (API, Database, Cache, Queue, etc.)
- **Service states** (Active/Inactive) with visual indicators
- **Advanced operations**: copy, paste, duplicate, undo/redo

### 🔗 Dependency Management
- **Visual connections** between services
- **Multiple protocols** (HTTP/REST, gRPC, WebSocket, Database, etc.)
- **Direct connection editing** with click
- **Dependency types** with distinctive colors

### 💾 Collaboration
- **Smart auto-save** with status indicators
- **Change history** with undo/redo
- **Comments per project** and service
- **Admin dashboard** for user management

## 🛠️ Technology Stack

- **[Next.js 14](https://nextjs.org)** - React framework with App Router
- **[TypeScript](https://www.typescriptlang.org/)** - Static typing
- **[React Flow](https://reactflow.dev/)** - Diagram visualization
- **[Tailwind CSS](https://tailwindcss.com/)** - Utility-first CSS
- **[shadcn/ui](https://ui.shadcn.com/)** - UI components
- **[Lucide React](https://lucide.dev/)** - Icons
- **[Zustand](https://github.com/pmndrs/zustand)** - State management
- **[React Hook Form](https://react-hook-form.com/)** - Form management
- **[Zod](https://zod.dev/)** - Schema validation

## 📁 Project Structure

```
src/
├── app/                    # Next.js App Router
│   ├── dashboard/         # Admin dashboard
│   ├── login/             # Authentication
│   ├── project-slug/      # Project visualization
│   └── ...
├── components/            # Reusable components
│   ├── ui/               # shadcn/ui base components
│   └── ...
├── lib/                  # Utilities and configuration
│   ├── api.ts           # API client
│   ├── services-store.ts # Zustand store
│   └── utils.ts         # Helper functions
└── types/               # TypeScript types
```

## 🎯 Main Components

### Service Visualization
- `services-store.ts` - Main store for service management
- `use-services-flow.ts` - React Flow hook
- `enhanced-minimap.tsx` - Custom minimap
- `custom-edge.tsx` - Custom connections

### Forms and Dialogs
- `service-dialog.tsx` - Modal for creating/editing services
- `dependency-dialog.tsx` - Modal for managing dependencies
- `comment-form.tsx` - Comment form

### UI and Layout
- `Layout.tsx` - Main layout
- `Header.tsx` - Navigation bar
- `Sidebar.tsx` - Sidebar
- UI components in `/components/ui/`

## ⌨️ Keyboard Shortcuts

- `Ctrl + C` - Copy selected service
- `Ctrl + V` - Paste copied service
- `Ctrl + Z` - Undo last action
- `Ctrl + Shift + Z` - Redo action

## 🔧 Available Scripts

```bash
# Development with Turbopack (faster)
npm run dev

# Build for production
npm run build

# Run production build
npm run start

# Lint code with ESLint
npm run lint
```

## 🌐 Environment Variables

Create a `.env.local` file based on `.env.local.example`:

```env
NEXT_PUBLIC_API_URL=http://localhost:8080/api
```

## 🤝 Development

### Adding New Components

The project uses shadcn/ui. To add new components:

```bash
npx shadcn-ui@latest add [component-name]
```

### Store Structure

Global state is managed with Zustand in `services-store.ts`:

```typescript
interface ServicesStore {
  services: Service[]
  connections: Connection[]
  // ... more state
  addService: (service: Service) => void
  updateService: (id: string, updates: Partial<Service>) => void
  // ... more actions
}
```

### API Integration

All API calls are centralized in `lib/api.ts` and `lib/services-api.ts`.

## 📱 Responsive Design

The application is optimized for:
- **Desktop** - Full experience with all panels
- **Tablet** - Adaptive layout with collapsible navigation
- **Mobile** - Simplified interface maintaining core functionality

## 🎨 Themes and Styling

SAMI includes multiple visual themes:
- Volcanic (red/orange)
- Matrix (green)
- Electric (blue)
- Cosmic (purple)
- And more...

Themes are managed through CSS custom properties and Tailwind CSS.

## 🔗 Useful Links

- [Next.js Documentation](https://nextjs.org/docs) - Learn about Next.js
- [React Flow Docs](https://reactflow.dev/learn) - React Flow documentation
- [shadcn/ui](https://ui.shadcn.com/) - Component system
- [Tailwind CSS](https://tailwindcss.com/docs) - CSS framework

## 🤝 Contributing

To contribute to frontend development:

1. **Fork** the repository
2. **Create a branch** for your feature (`git checkout -b feature/AmazingFeature`)
3. **Commit** your changes (`git commit -m 'Add some AmazingFeature'`)
4. **Push** to the branch (`git push origin feature/AmazingFeature`)
5. **Open a Pull Request**

---

**Need help?** Check the [complete documentation](../README.md) of the project or open an [issue](https://github.com/imnotUrban/sami/issues) on GitHub.
