# SAMI v2 - System Architecture Mapping Interface

![SAMI Logo](frontend-sami/public/Sami_full_logo.png)

**SAMI** is an open source platform to visualize, manage and document software system architectures in an interactive and collaborative way.

## 🚀 Quick Start with Docker

### Prerequisites
- Docker 20.0+
- Docker Compose 2.0+

### One-Command Setup

```bash
# Clone repository
git clone https://github.com/imnotUrban/sami.git
cd sami

# Start all services
docker-compose up -d

# Access the application
open http://localhost:3000
```

**Default credentials:**

- **Mail**: admin@sami.local
- **Password**: admin123
- **Role**: admin

### Manual Installation

#### Prerequisites
- Node.js 18+ 
- Go 1.21+
- PostgreSQL 13+
- Git

#### Backend Setup

```bash
# Clone repository
git clone https://github.com/imnotUrban/sami.git
cd sami

# Configure PostgreSQL database
createdb sami_db

# Configure environment variables
cp backend/.env.example backend/.env
# Edit backend/.env with your configurations

# Install dependencies and run
cd backend
go mod tidy
go run main.go
```

#### Frontend Setup

```bash
# Navigate to frontend directory
cd frontend-sami

# Install dependencies
npm install

# Configure environment variables
cp .env.local.example .env.local
# Edit .env.local with your backend URL

# Run in development mode
npm run dev
```

## ✨ Key Features

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
- **Extensible metadata** for each service
- **Advanced operations**: copy, paste, duplicate, undo/redo

### 🔗 Dependency Management
- **Visual connections** between services
- **Multiple protocols** (HTTP/REST, gRPC, WebSocket, Database, etc.)
- **Direct connection editing** with click
- **Dependency types** with distinctive colors
- **Automatic connection validation**

### 💾 Persistence and Collaboration
- **Smart auto-save** with status indicators
- **Change history** with undo/redo
- **Comments per project** and service
- **User management** with roles and permissions
- **Complete REST API** for integration

### 🎨 User Experience
- **Modern interface** with Tailwind CSS
- **Reusable components** with shadcn/ui
- **Responsive design** for all devices
- **Keyboard shortcuts** for improved productivity
- **Persistent states** in localStorage

## 🛠️ Technology Stack

### Frontend
- **Next.js 14** - React framework with App Router
- **TypeScript** - Static typing
- **React Flow** - Diagram visualization
- **Tailwind CSS** - Utility styles
- **shadcn/ui** - UI components
- **Lucide React** - Icons

### Backend
- **Go** - Programming language
- **Gin** - Web framework
- **PostgreSQL** - Relational database
- **JWT** - Authentication
- **CORS** - Security configuration

## 🎯 Usage

1. **Access the application** at `http://localhost:3000`
2. **Create an account** or sign in
3. **Create a new project** from the dashboard
4. **Add services** using the "Add Service" button
5. **Connect services** by dragging from connection points
6. **Customize the view** with different backgrounds and themes
7. **Collaborate** by adding comments and sharing projects

### Keyboard Shortcuts
- `Ctrl + C` - Copy selected service
- `Ctrl + V` - Paste copied service
- `Ctrl + Z` - Undo last action
- `Ctrl + Shift + Z` - Redo action

## 🤝 Contributing

Contributions are welcome! This is an open source project and we value community participation.

### How to Contribute

1. **Fork the repository**
2. **Create a branch** for your feature (`git checkout -b feature/AmazingFeature`)
3. **Commit your changes** (`git commit -m 'Add some AmazingFeature'`)
4. **Push to the branch** (`git push origin feature/AmazingFeature`)
5. **Open a Pull Request**

### Report Bugs

If you find a bug, please [open an issue](https://github.com/imnotUrban/sami/issues) with:
- Detailed problem description
- Steps to reproduce
- Screenshots if relevant
- Environment information (OS, browser, versions)

### Request Features

To request new features:
1. [Open an issue](https://github.com/imnotUrban/sami/issues) with "enhancement" label
2. Describe the desired functionality
3. Explain the use case
4. Provide mockups if possible

## 📄 License

This project is licensed under the **GPL-3.0 License** - see the [LICENSE](LICENSE) file for details.

### What does GPL-3.0 mean?

- ✅ **Commercial use** - You can use SAMI in commercial projects
- ✅ **Modification** - You can modify the source code
- ✅ **Distribution** - You can distribute the software
- ✅ **Private use** - You can use SAMI privately
- ⚠️ **Copyleft** - Modifications must maintain the same license
- ⚠️ **Source disclosure** - You must provide the source code

## 👥 Team

- **[@imnotUrban](https://github.com/imnotUrban)** - Lead Developer

## 🙏 Acknowledgments

- [React Flow](https://reactflow.dev/) - For the excellent diagram library
- [shadcn/ui](https://ui.shadcn.com/) - For the UI components
- [Tailwind CSS](https://tailwindcss.com/) - For the styling system
- [Lucide](https://lucide.dev/) - For the icons
- The open source community for inspiration and support

## 📞 Contact

- **GitHub**: [imnotUrban](https://github.com/imnotUrban)
- **Issues**: [GitHub Issues](https://github.com/imnotUrban/sami/issues)

## 🗺️ Roadmap

### v1.1 (Next)
- [ ] Export to different formats (PNG, SVG, PDF)
- [ ] Predefined architecture templates
- [ ] Git integration for automatic versioning
- [ ] Architecture metrics and analytics

### v1.2 (Future)
- [ ] Real-time collaboration
- [ ] CI/CD tools integration
- [ ] Public API for integrations
- [ ] Offline mode with synchronization

---

**⭐ If SAMI is useful to you, consider giving the repository a star to support the project!**

## 📊 Project Statistics

[![GitHub stars](https://img.shields.io/github/stars/imnotUrban/sami?style=for-the-badge&logo=github)](https://github.com/imnotUrban/sami/stargazers)
[![GitHub forks](https://img.shields.io/github/forks/imnotUrban/sami?style=for-the-badge&logo=github)](https://github.com/imnotUrban/sami/network)
[![GitHub issues](https://img.shields.io/github/issues/imnotUrban/sami?style=for-the-badge&logo=github)](https://github.com/imnotUrban/sami/issues)
[![GitHub license](https://img.shields.io/github/license/imnotUrban/sami?style=for-the-badge)](LICENSE)
[![GitHub last commit](https://img.shields.io/github/last-commit/imnotUrban/sami?style=for-the-badge&logo=github)](https://github.com/imnotUrban/sami/commits/main)

[![CI/CD Pipeline](https://img.shields.io/github/actions/workflow/status/imnotUrban/sami/ci.yml?branch=main&style=for-the-badge&logo=github-actions&label=CI%2FCD)](https://github.com/imnotUrban/sami/actions)
[![Docker Pulls](https://img.shields.io/docker/pulls/imnoturban/sami-backend?style=for-the-badge&logo=docker)](https://hub.docker.com/r/imnoturban/sami-backend)
[![Code Coverage](https://img.shields.io/codecov/c/github/imnotUrban/sami?style=for-the-badge&logo=codecov)](https://codecov.io/gh/imnotUrban/sami)
[![Security Rating](https://img.shields.io/snyk/vulnerabilities/github/imnotUrban/sami?style=for-the-badge&logo=snyk)](https://snyk.io/test/github/imnotUrban/sami)

[![Go Report Card](https://goreportcard.com/badge/github.com/imnotUrban/sami?style=for-the-badge)](https://goreportcard.com/report/github.com/imnotUrban/sami)
[![TypeScript](https://img.shields.io/badge/TypeScript-5.0+-blue?style=for-the-badge&logo=typescript)](https://www.typescriptlang.org/)
[![Next.js](https://img.shields.io/badge/Next.js-14.0+-black?style=for-the-badge&logo=next.js)](https://nextjs.org/)
[![Go Version](https://img.shields.io/github/go-mod/go-version/imnotUrban/sami?style=for-the-badge&logo=go)](https://golang.org/) 