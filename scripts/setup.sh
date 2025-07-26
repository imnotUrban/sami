#!/bin/bash

# ===========================================
# SAMI v2 - Setup Script
# ===========================================

set -e

# Colors for output
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
BLUE='\033[0;34m'
NC='\033[0m' # No Color

# Script configuration
SCRIPT_DIR="$(cd "$(dirname "${BASH_SOURCE[0]}")" && pwd)"
PROJECT_ROOT="$(dirname "$SCRIPT_DIR")"
LOG_FILE="$PROJECT_ROOT/setup.log"

# Logging function
log() {
    echo "$(date '+%Y-%m-%d %H:%M:%S') - $1" | tee -a "$LOG_FILE"
}

# Print functions
print_header() {
    echo -e "${BLUE}"
    echo "┌─────────────────────────────────────────────────────────────┐"
    echo "│                      SAMI v2 Setup                         │"
    echo "│          System Architecture Mapping Interface             │"
    echo "└─────────────────────────────────────────────────────────────┘"
    echo -e "${NC}"
}

print_success() {
    echo -e "${GREEN}✅ $1${NC}"
    log "SUCCESS: $1"
}

print_error() {
    echo -e "${RED}❌ $1${NC}"
    log "ERROR: $1"
}

print_warning() {
    echo -e "${YELLOW}⚠️  $1${NC}"
    log "WARNING: $1"
}

print_info() {
    echo -e "${BLUE}ℹ️  $1${NC}"
    log "INFO: $1"
}

# Check if command exists
check_command() {
    if command -v "$1" >/dev/null 2>&1; then
        return 0
    else
        return 1
    fi
}

# Check system requirements
check_requirements() {
    print_info "Checking system requirements..."
    
    local missing_deps=()
    
    # Check Node.js
    if check_command node; then
        NODE_VERSION=$(node --version | sed 's/v//')
        REQUIRED_NODE="18.0.0"
        if [ "$(printf '%s\n' "$REQUIRED_NODE" "$NODE_VERSION" | sort -V | head -n1)" = "$REQUIRED_NODE" ]; then
            print_success "Node.js $NODE_VERSION (required: >= $REQUIRED_NODE)"
        else
            print_error "Node.js version $NODE_VERSION is too old (required: >= $REQUIRED_NODE)"
            missing_deps+=("nodejs")
        fi
    else
        print_error "Node.js not found"
        missing_deps+=("nodejs")
    fi
    
    # Check Go
    if check_command go; then
        GO_VERSION=$(go version | grep -o 'go[0-9.]*' | sed 's/go//')
        REQUIRED_GO="1.21.0"
        if [ "$(printf '%s\n' "$REQUIRED_GO" "$GO_VERSION" | sort -V | head -n1)" = "$REQUIRED_GO" ]; then
            print_success "Go $GO_VERSION (required: >= $REQUIRED_GO)"
        else
            print_error "Go version $GO_VERSION is too old (required: >= $REQUIRED_GO)"
            missing_deps+=("golang")
        fi
    else
        print_error "Go not found"
        missing_deps+=("golang")
    fi
    
    # Check PostgreSQL
    if check_command psql; then
        PSQL_VERSION=$(psql --version | grep -o '[0-9]*\.[0-9]*' | head -1)
        print_success "PostgreSQL $PSQL_VERSION"
    else
        print_warning "PostgreSQL client not found - you may need to install it"
        missing_deps+=("postgresql-client")
    fi
    
    # Check Docker (optional)
    if check_command docker; then
        DOCKER_VERSION=$(docker --version | grep -o '[0-9]*\.[0-9]*\.[0-9]*' | head -1)
        print_success "Docker $DOCKER_VERSION"
    else
        print_warning "Docker not found - required for containerized deployment"
    fi
    
    # Check Git
    if check_command git; then
        GIT_VERSION=$(git --version | grep -o '[0-9]*\.[0-9]*\.[0-9]*')
        print_success "Git $GIT_VERSION"
    else
        print_error "Git not found"
        missing_deps+=("git")
    fi
    
    if [ ${#missing_deps[@]} -gt 0 ]; then
        print_error "Missing dependencies: ${missing_deps[*]}"
        print_info "Please install missing dependencies and run setup again"
        exit 1
    fi
    
    print_success "All requirements satisfied!"
}

# Setup database
setup_database() {
    print_info "Setting up database..."
    
    read -p "PostgreSQL host (default: localhost): " DB_HOST
    DB_HOST=${DB_HOST:-localhost}
    
    read -p "PostgreSQL port (default: 5432): " DB_PORT
    DB_PORT=${DB_PORT:-5432}
    
    read -p "Database name (default: sami_db): " DB_NAME
    DB_NAME=${DB_NAME:-sami_db}
    
    read -p "Database user (default: sami_user): " DB_USER
    DB_USER=${DB_USER:-sami_user}
    
    read -s -p "Database password: " DB_PASSWORD
    echo
    
    # Test connection
    export PGPASSWORD="$DB_PASSWORD"
    if psql -h "$DB_HOST" -p "$DB_PORT" -U "$DB_USER" -d postgres -c '\q' 2>/dev/null; then
        print_success "Database connection successful"
    else
        print_error "Cannot connect to database"
        print_info "Please check your database configuration and try again"
        exit 1
    fi
    
    # Create database if it doesn't exist
    if psql -h "$DB_HOST" -p "$DB_PORT" -U "$DB_USER" -lqt | cut -d \| -f 1 | grep -qw "$DB_NAME"; then
        print_warning "Database $DB_NAME already exists"
    else
        print_info "Creating database $DB_NAME..."
        createdb -h "$DB_HOST" -p "$DB_PORT" -U "$DB_USER" "$DB_NAME"
        print_success "Database $DB_NAME created"
    fi
    
    # Run migrations
    print_info "Running database migrations..."
    psql -h "$DB_HOST" -p "$DB_PORT" -U "$DB_USER" -d "$DB_NAME" -f "$PROJECT_ROOT/backend/db.sql"
    psql -h "$DB_HOST" -p "$DB_PORT" -U "$DB_USER" -d "$DB_NAME" -f "$PROJECT_ROOT/init-admin.sql"
    print_success "Database migrations completed"
    
    # Store database config for later use
    cat > "$PROJECT_ROOT/.db_config" << EOF
DB_HOST=$DB_HOST
DB_PORT=$DB_PORT
DB_USER=$DB_USER
DB_NAME=$DB_NAME
DB_PASSWORD=$DB_PASSWORD
EOF
}

# Setup backend environment
setup_backend() {
    print_info "Setting up backend environment..."
    
    cd "$PROJECT_ROOT/backend"
    
    # Create .env file if it doesn't exist
    if [ ! -f ".env" ]; then
        if [ -f ".env.example" ]; then
            cp .env.example .env
            print_success "Created .env from .env.example"
        else
            print_info "Creating basic .env file..."
            cat > .env << EOF
# Server Configuration
PORT=8080
HOST=0.0.0.0
GIN_MODE=debug

# Database Configuration
DB_HOST=${DB_HOST:-localhost}
DB_PORT=${DB_PORT:-5432}
DB_USER=${DB_USER:-sami_user}
DB_PASSWORD=${DB_PASSWORD:-changeme}
DB_NAME=${DB_NAME:-sami_db}
DB_SSL_MODE=disable

# JWT Configuration
JWT_SECRET=$(openssl rand -hex 32)
JWT_EXPIRATION=24h

# CORS Configuration
CORS_ORIGINS=http://localhost:3000,http://127.0.0.1:3000

# Environment
ENVIRONMENT=development
EOF
            print_success "Created basic .env file"
        fi
    else
        print_warning ".env file already exists, skipping creation"
    fi
    
    # Update .env with database configuration
    if [ -f "$PROJECT_ROOT/.db_config" ]; then
        source "$PROJECT_ROOT/.db_config"
        sed -i "s/DB_HOST=.*/DB_HOST=$DB_HOST/" .env
        sed -i "s/DB_PORT=.*/DB_PORT=$DB_PORT/" .env
        sed -i "s/DB_USER=.*/DB_USER=$DB_USER/" .env
        sed -i "s/DB_NAME=.*/DB_NAME=$DB_NAME/" .env
        sed -i "s/DB_PASSWORD=.*/DB_PASSWORD=$DB_PASSWORD/" .env
        print_success "Updated .env with database configuration"
    fi
    
    # Download Go dependencies
    print_info "Downloading Go dependencies..."
    go mod tidy
    go mod download
    print_success "Go dependencies installed"
    
    # Verify Go modules
    go mod verify
    print_success "Go modules verified"
    
    cd "$PROJECT_ROOT"
}

# Setup frontend environment
setup_frontend() {
    print_info "Setting up frontend environment..."
    
    cd "$PROJECT_ROOT/frontend-sami"
    
    # Create .env.local file if it doesn't exist
    if [ ! -f ".env.local" ]; then
        if [ -f ".env.local.example" ]; then
            cp .env.local.example .env.local
            print_success "Created .env.local from .env.local.example"
        else
            print_info "Creating basic .env.local file..."
            cat > .env.local << EOF
# API Configuration
NEXT_PUBLIC_API_URL=http://localhost:8080/api
NEXT_PUBLIC_API_VERSION=v2

# App Configuration
NEXT_PUBLIC_APP_NAME=SAMI v2
NEXT_PUBLIC_APP_VERSION=2.0.0

# Environment
NODE_ENV=development
NEXT_PUBLIC_ENVIRONMENT=development

# Features
NEXT_PUBLIC_ENABLE_COMMENTS=true
NEXT_PUBLIC_ENABLE_COLLABORATION=true
NEXT_PUBLIC_ENABLE_DARK_MODE=true
EOF
            print_success "Created basic .env.local file"
        fi
    else
        print_warning ".env.local file already exists, skipping creation"
    fi
    
    # Install Node.js dependencies
    print_info "Installing Node.js dependencies..."
    npm install
    print_success "Node.js dependencies installed"
    
    cd "$PROJECT_ROOT"
}

# Create necessary directories
create_directories() {
    print_info "Creating necessary directories..."
    
    local dirs=(
        "logs"
        "data/postgres"
        "data/redis"
        "data/uploads"
        "backups"
        "scripts"
    )
    
    for dir in "${dirs[@]}"; do
        if [ ! -d "$PROJECT_ROOT/$dir" ]; then
            mkdir -p "$PROJECT_ROOT/$dir"
            print_success "Created directory: $dir"
        fi
    done
}

# Setup Git hooks (optional)
setup_git_hooks() {
    if [ -d "$PROJECT_ROOT/.git" ]; then
        print_info "Setting up Git hooks..."
        
        # Pre-commit hook
        cat > "$PROJECT_ROOT/.git/hooks/pre-commit" << 'EOF'
#!/bin/bash
# SAMI v2 pre-commit hook

# Check if Go files are properly formatted
if [ -n "$(find backend -name '*.go' -exec gofmt -l {} \;)" ]; then
    echo "❌ Go files are not properly formatted. Please run 'gofmt -w backend/'"
    exit 1
fi

# Run Go tests
cd backend && go test ./... -short
if [ $? -ne 0 ]; then
    echo "❌ Go tests failed"
    exit 1
fi

# Check TypeScript compilation
cd ../frontend-sami && npm run type-check
if [ $? -ne 0 ]; then
    echo "❌ TypeScript compilation failed"
    exit 1
fi

echo "✅ Pre-commit checks passed"
EOF
        chmod +x "$PROJECT_ROOT/.git/hooks/pre-commit"
        print_success "Git pre-commit hook installed"
    fi
}

# Test setup
test_setup() {
    print_info "Testing setup..."
    
    # Test backend
    print_info "Testing backend..."
    cd "$PROJECT_ROOT/backend"
    if go build -o /tmp/sami-test .; then
        print_success "Backend builds successfully"
        rm -f /tmp/sami-test
    else
        print_error "Backend build failed"
        return 1
    fi
    
    # Test frontend
    print_info "Testing frontend..."
    cd "$PROJECT_ROOT/frontend-sami"
    if npm run type-check; then
        print_success "Frontend TypeScript compilation successful"
    else
        print_error "Frontend TypeScript compilation failed"
        return 1
    fi
    
    cd "$PROJECT_ROOT"
    print_success "All tests passed!"
}

# Generate startup scripts
generate_scripts() {
    print_info "Generating startup scripts..."
    
    # Development startup script
    cat > "$PROJECT_ROOT/start-dev.sh" << 'EOF'
#!/bin/bash

# SAMI v2 Development Startup Script

echo "🚀 Starting SAMI v2 in development mode..."

# Start backend
echo "📡 Starting backend..."
cd backend
go run main.go &
BACKEND_PID=$!

# Wait for backend to start
sleep 3

# Start frontend
echo "🎨 Starting frontend..."
cd ../frontend-sami
npm run dev &
FRONTEND_PID=$!

echo "✅ SAMI v2 is running!"
echo "📱 Frontend: http://localhost:3000"
echo "🔌 Backend API: http://localhost:8080/api"
echo ""
echo "Press Ctrl+C to stop all services..."

# Cleanup function
cleanup() {
    echo "🛑 Stopping services..."
    kill $BACKEND_PID 2>/dev/null
    kill $FRONTEND_PID 2>/dev/null
    echo "✅ All services stopped"
    exit 0
}

# Trap Ctrl+C
trap cleanup INT

# Wait for processes
wait
EOF
    chmod +x "$PROJECT_ROOT/start-dev.sh"
    print_success "Created start-dev.sh"
    
    # Production startup script
    cat > "$PROJECT_ROOT/start-prod.sh" << 'EOF'
#!/bin/bash

# SAMI v2 Production Startup Script

echo "🚀 Starting SAMI v2 in production mode..."

# Check if Docker is available
if command -v docker-compose >/dev/null 2>&1; then
    echo "🐳 Starting with Docker Compose..."
    docker-compose up -d
    echo "✅ SAMI v2 is running in production mode!"
    echo "🌐 Access: http://localhost"
else
    echo "❌ Docker Compose not found"
    echo "Please install Docker and Docker Compose for production deployment"
    exit 1
fi
EOF
    chmod +x "$PROJECT_ROOT/start-prod.sh"
    print_success "Created start-prod.sh"
}

# Print final instructions
print_instructions() {
    echo -e "\n${GREEN}"
    echo "┌─────────────────────────────────────────────────────────────┐"
    echo "│                    🎉 Setup Complete!                      │"
    echo "└─────────────────────────────────────────────────────────────┘"
    echo -e "${NC}"
    
    echo -e "${BLUE}📋 Next steps:${NC}"
    echo ""
    echo -e "${YELLOW}1. Start development servers:${NC}"
    echo "   ./start-dev.sh"
    echo ""
    echo -e "${YELLOW}2. Or start manually:${NC}"
    echo "   # Terminal 1 - Backend"
    echo "   cd backend && go run main.go"
    echo ""
    echo "   # Terminal 2 - Frontend"
    echo "   cd frontend-sami && npm run dev"
    echo ""
    echo -e "${YELLOW}3. Access the application:${NC}"
    echo "   Frontend: http://localhost:3000"
    echo "   Backend API: http://localhost:8080/api"
    echo ""
    echo -e "${YELLOW}4. Default admin credentials:${NC}"
    echo "   Username: admin"
    echo "   Password: admin (change this immediately!)"
    echo ""
    echo -e "${YELLOW}5. For production deployment:${NC}"
    echo "   ./start-prod.sh"
    echo ""
    echo -e "${BLUE}📚 Documentation:${NC}"
    echo "   - Installation: docs/INSTALLATION.md"
    echo "   - API Documentation: docs/API.md"
    echo "   - Contributing: CONTRIBUTING.md"
    echo ""
    echo -e "${GREEN}🎯 Happy coding with SAMI v2!${NC}"
}

# Main execution
main() {
    # Clear log file
    > "$LOG_FILE"
    
    print_header
    
    # Check if running as root
    if [ "$EUID" -eq 0 ]; then
        print_warning "Running as root is not recommended"
        read -p "Continue anyway? (y/N): " continue_as_root
        if [[ ! $continue_as_root =~ ^[Yy]$ ]]; then
            print_info "Exiting..."
            exit 1
        fi
    fi
    
    # Parse command line arguments
    case "${1:-}" in
        --skip-db)
            SKIP_DATABASE=true
            ;;
        --help|-h)
            echo "SAMI v2 Setup Script"
            echo ""
            echo "Usage: $0 [options]"
            echo ""
            echo "Options:"
            echo "  --skip-db    Skip database setup"
            echo "  --help, -h   Show this help message"
            exit 0
            ;;
    esac
    
    # Run setup steps
    check_requirements
    
    if [ "${SKIP_DATABASE:-false}" != "true" ]; then
        setup_database
    fi
    
    create_directories
    setup_backend
    setup_frontend
    setup_git_hooks
    test_setup
    generate_scripts
    
    # Cleanup temporary files
    rm -f "$PROJECT_ROOT/.db_config"
    
    print_instructions
    
    print_success "Setup completed successfully! Check $LOG_FILE for detailed logs."
}

# Run main function
main "$@" 