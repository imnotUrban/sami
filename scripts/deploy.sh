#!/bin/bash

# ===========================================
# SAMI v2 - Deployment Script
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
DEPLOY_LOG="$PROJECT_ROOT/deploy.log"

# Default configuration
ENVIRONMENT="production"
VERSION=""
DOCKER_REGISTRY="docker.io"
DOCKER_USERNAME=""
BUILD_IMAGES=true
PUSH_IMAGES=true
DEPLOY_LOCAL=false
DRY_RUN=false

# Logging function
log() {
    echo "$(date '+%Y-%m-%d %H:%M:%S') - $1" | tee -a "$DEPLOY_LOG"
}

# Print functions
print_header() {
    echo -e "${BLUE}"
    echo "┌─────────────────────────────────────────────────────────────┐"
    echo "│                  SAMI v2 Deployment                        │"
    echo "│              Production Deployment Script                  │"
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

# Check prerequisites
check_prerequisites() {
    print_info "Checking deployment prerequisites..."
    
    local missing_tools=()
    
    # Check Docker
    if ! command -v docker &> /dev/null; then
        missing_tools+=("docker")
    fi
    
    # Check Docker Compose
    if ! command -v docker-compose &> /dev/null; then
        missing_tools+=("docker-compose")
    fi
    
    # Check Git
    if ! command -v git &> /dev/null; then
        missing_tools+=("git")
    fi
    
    if [ ${#missing_tools[@]} -gt 0 ]; then
        print_error "Missing required tools: ${missing_tools[*]}"
        exit 1
    fi
    
    # Check if we're in a git repository
    if [ ! -d ".git" ]; then
        print_error "Not in a git repository"
        exit 1
    fi
    
    # Check if working directory is clean
    if [ -n "$(git status --porcelain)" ] && [ "$DRY_RUN" = false ]; then
        print_error "Working directory is not clean. Please commit or stash your changes."
        exit 1
    fi
    
    print_success "All prerequisites satisfied"
}

# Generate version
generate_version() {
    if [ -z "$VERSION" ]; then
        # Get the latest git tag
        LATEST_TAG=$(git describe --tags --abbrev=0 2>/dev/null || echo "v0.0.0")
        
        # Get current commit hash
        COMMIT_HASH=$(git rev-parse --short HEAD)
        
        # Get current timestamp
        TIMESTAMP=$(date +%Y%m%d-%H%M%S)
        
        # Generate version
        if [ "$ENVIRONMENT" = "production" ]; then
            VERSION="${LATEST_TAG}-${COMMIT_HASH}"
        else
            VERSION="${LATEST_TAG}-${ENVIRONMENT}-${TIMESTAMP}-${COMMIT_HASH}"
        fi
    fi
    
    print_info "Deployment version: $VERSION"
}

# Run tests before deployment
run_tests() {
    print_info "Running tests before deployment..."
    
    if [ -f "$SCRIPT_DIR/test.sh" ]; then
        if bash "$SCRIPT_DIR/test.sh" --skip-integration; then
            print_success "All tests passed"
        else
            print_error "Tests failed. Deployment aborted."
            exit 1
        fi
    else
        print_warning "Test script not found, skipping tests"
    fi
}

# Build Docker images
build_images() {
    if [ "$BUILD_IMAGES" = false ]; then
        print_info "Skipping image build"
        return 0
    fi
    
    print_info "Building Docker images..."
    
    # Build backend image
    print_info "Building backend image..."
    docker build \
        -t "${DOCKER_REGISTRY}/${DOCKER_USERNAME}/sami-backend:${VERSION}" \
        -t "${DOCKER_REGISTRY}/${DOCKER_USERNAME}/sami-backend:latest" \
        -f backend/Dockerfile \
        backend/
    
    print_success "Backend image built"
    
    # Build frontend image
    print_info "Building frontend image..."
    docker build \
        -t "${DOCKER_REGISTRY}/${DOCKER_USERNAME}/sami-frontend:${VERSION}" \
        -t "${DOCKER_REGISTRY}/${DOCKER_USERNAME}/sami-frontend:latest" \
        -f frontend-sami/Dockerfile \
        frontend-sami/
    
    print_success "Frontend image built"
    
    print_success "All images built successfully"
}

# Push Docker images
push_images() {
    if [ "$PUSH_IMAGES" = false ]; then
        print_info "Skipping image push"
        return 0
    fi
    
    print_info "Pushing Docker images to registry..."
    
    # Login to Docker registry if credentials are provided
    if [ -n "$DOCKER_USERNAME" ] && [ -n "$DOCKER_PASSWORD" ]; then
        echo "$DOCKER_PASSWORD" | docker login "$DOCKER_REGISTRY" -u "$DOCKER_USERNAME" --password-stdin
    fi
    
    # Push backend images
    docker push "${DOCKER_REGISTRY}/${DOCKER_USERNAME}/sami-backend:${VERSION}"
    docker push "${DOCKER_REGISTRY}/${DOCKER_USERNAME}/sami-backend:latest"
    
    # Push frontend images
    docker push "${DOCKER_REGISTRY}/${DOCKER_USERNAME}/sami-frontend:${VERSION}"
    docker push "${DOCKER_REGISTRY}/${DOCKER_USERNAME}/sami-frontend:latest"
    
    print_success "Images pushed successfully"
}

# Deploy to local environment
deploy_local() {
    print_info "Deploying to local environment..."
    
    # Create production environment file
    if [ ! -f ".env.production" ]; then
        print_info "Creating production environment file..."
        cat > .env.production << EOF
# Production Environment Configuration
ENVIRONMENT=production
NODE_ENV=production
GIN_MODE=release

# Database
DB_HOST=postgres
DB_PORT=5432
DB_NAME=sami_prod
DB_USER=sami_user
DB_PASSWORD=${DB_PASSWORD:-$(openssl rand -base64 32)}
DB_SSL_MODE=require

# JWT
JWT_SECRET=${JWT_SECRET:-$(openssl rand -hex 32)}
JWT_EXPIRATION=24h

# URLs
FRONTEND_URL=https://localhost
BACKEND_URL=https://localhost/api

# Docker images
BACKEND_IMAGE=${DOCKER_REGISTRY}/${DOCKER_USERNAME}/sami-backend:${VERSION}
FRONTEND_IMAGE=${DOCKER_REGISTRY}/${DOCKER_USERNAME}/sami-frontend:${VERSION}
EOF
        print_success "Production environment file created"
    fi
    
    # Deploy with Docker Compose
    print_info "Starting services with Docker Compose..."
    docker-compose \
        -f docker-compose.yml \
        -f docker-compose.production.yml \
        --env-file .env.production \
        up -d
    
    # Wait for services to be ready
    print_info "Waiting for services to be ready..."
    sleep 30
    
    # Health check
    if curl -f http://localhost/health > /dev/null 2>&1; then
        print_success "Health check passed"
    else
        print_warning "Health check failed"
    fi
    
    print_success "Local deployment completed"
}

# Deploy to cloud environment
deploy_cloud() {
    print_info "Deploying to cloud environment: $CLOUD_PROVIDER"
    
    case "$CLOUD_PROVIDER" in
        "aws")
            deploy_aws
            ;;
        "gcp")
            deploy_gcp
            ;;
        "azure")
            deploy_azure
            ;;
        "digitalocean")
            deploy_digitalocean
            ;;
        "kubernetes")
            deploy_kubernetes
            ;;
        *)
            print_error "Unsupported cloud provider: $CLOUD_PROVIDER"
            exit 1
            ;;
    esac
}

# Deploy to AWS
deploy_aws() {
    print_info "Deploying to AWS..."
    
    # Check AWS CLI
    if ! command -v aws &> /dev/null; then
        print_error "AWS CLI not found"
        exit 1
    fi
    
    # Deploy using AWS ECS or EKS
    if [ "$AWS_SERVICE" = "ecs" ]; then
        # Update ECS service
        aws ecs update-service \
            --cluster "$AWS_CLUSTER" \
            --service sami-backend \
            --force-new-deployment
        
        aws ecs update-service \
            --cluster "$AWS_CLUSTER" \
            --service sami-frontend \
            --force-new-deployment
    elif [ "$AWS_SERVICE" = "eks" ]; then
        # Deploy to EKS using kubectl
        kubectl set image deployment/sami-backend \
            sami-backend="${DOCKER_REGISTRY}/${DOCKER_USERNAME}/sami-backend:${VERSION}"
        
        kubectl set image deployment/sami-frontend \
            sami-frontend="${DOCKER_REGISTRY}/${DOCKER_USERNAME}/sami-frontend:${VERSION}"
    fi
    
    print_success "AWS deployment completed"
}

# Deploy to Kubernetes
deploy_kubernetes() {
    print_info "Deploying to Kubernetes..."
    
    # Check kubectl
    if ! command -v kubectl &> /dev/null; then
        print_error "kubectl not found"
        exit 1
    fi
    
    # Apply Kubernetes manifests
    if [ -d "k8s" ]; then
        # Update image tags in manifests
        sed -i "s|image: .*sami-backend:.*|image: ${DOCKER_REGISTRY}/${DOCKER_USERNAME}/sami-backend:${VERSION}|g" k8s/*.yaml
        sed -i "s|image: .*sami-frontend:.*|image: ${DOCKER_REGISTRY}/${DOCKER_USERNAME}/sami-frontend:${VERSION}|g" k8s/*.yaml
        
        # Apply manifests
        kubectl apply -f k8s/
        
        # Wait for rollout
        kubectl rollout status deployment/sami-backend
        kubectl rollout status deployment/sami-frontend
    else
        print_error "Kubernetes manifests not found in k8s/ directory"
        exit 1
    fi
    
    print_success "Kubernetes deployment completed"
}

# Create deployment backup
create_backup() {
    print_info "Creating deployment backup..."
    
    BACKUP_DIR="backups/deployment_$(date +%Y%m%d_%H%M%S)"
    mkdir -p "$BACKUP_DIR"
    
    # Backup database
    if [ "$DEPLOY_LOCAL" = true ]; then
        docker exec sami-postgres pg_dump -U sami_user sami_prod > "$BACKUP_DIR/database_backup.sql"
    fi
    
    # Backup configuration files
    cp .env.production "$BACKUP_DIR/"
    cp docker-compose.yml "$BACKUP_DIR/"
    
    # Create backup info
    cat > "$BACKUP_DIR/backup_info.txt" << EOF
Backup created: $(date)
Version: $VERSION
Environment: $ENVIRONMENT
Git commit: $(git rev-parse HEAD)
Git branch: $(git branch --show-current)
EOF
    
    print_success "Backup created: $BACKUP_DIR"
}

# Rollback deployment
rollback() {
    print_info "Rolling back deployment..."
    
    if [ -z "$ROLLBACK_VERSION" ]; then
        print_error "Rollback version not specified"
        exit 1
    fi
    
    print_info "Rolling back to version: $ROLLBACK_VERSION"
    
    if [ "$DEPLOY_LOCAL" = true ]; then
        # Rollback local deployment
        BACKEND_IMAGE="${DOCKER_REGISTRY}/${DOCKER_USERNAME}/sami-backend:${ROLLBACK_VERSION}"
        FRONTEND_IMAGE="${DOCKER_REGISTRY}/${DOCKER_USERNAME}/sami-frontend:${ROLLBACK_VERSION}"
        
        # Update environment file
        sed -i "s|BACKEND_IMAGE=.*|BACKEND_IMAGE=$BACKEND_IMAGE|g" .env.production
        sed -i "s|FRONTEND_IMAGE=.*|FRONTEND_IMAGE=$FRONTEND_IMAGE|g" .env.production
        
        # Restart services
        docker-compose \
            -f docker-compose.yml \
            -f docker-compose.production.yml \
            --env-file .env.production \
            up -d
    else
        # Rollback cloud deployment
        deploy_cloud
    fi
    
    print_success "Rollback completed"
}

# Print deployment info
print_deployment_info() {
    echo ""
    print_success "Deployment completed successfully!"
    echo ""
    print_info "Deployment Details:"
    echo "  🏷️  Version: $VERSION"
    echo "  🌍 Environment: $ENVIRONMENT"
    echo "  📅 Deployed: $(date)"
    echo "  📋 Git commit: $(git rev-parse --short HEAD)"
    echo ""
    
    if [ "$DEPLOY_LOCAL" = true ]; then
        print_info "Local Access URLs:"
        echo "  🌐 Frontend: http://localhost"
        echo "  🔌 Backend API: http://localhost/api"
        echo "  📊 Health check: http://localhost/health"
    fi
    
    echo ""
    print_info "Docker Images:"
    echo "  📦 Backend: ${DOCKER_REGISTRY}/${DOCKER_USERNAME}/sami-backend:${VERSION}"
    echo "  📦 Frontend: ${DOCKER_REGISTRY}/${DOCKER_USERNAME}/sami-frontend:${VERSION}"
    echo ""
    
    print_info "Logs and monitoring:"
    echo "  📄 Deployment log: $DEPLOY_LOG"
    echo "  📊 Container logs: docker-compose logs -f"
    echo "  📈 Monitoring: docker stats"
}

# Main execution
main() {
    # Clear log file
    > "$DEPLOY_LOG"
    
    print_header
    
    # Parse command line arguments
    while [[ $# -gt 0 ]]; do
        case $1 in
            --environment|-e)
                ENVIRONMENT="$2"
                shift 2
                ;;
            --version|-v)
                VERSION="$2"
                shift 2
                ;;
            --docker-username|-u)
                DOCKER_USERNAME="$2"
                shift 2
                ;;
            --docker-registry|-r)
                DOCKER_REGISTRY="$2"
                shift 2
                ;;
            --cloud-provider|-c)
                CLOUD_PROVIDER="$2"
                shift 2
                ;;
            --local)
                DEPLOY_LOCAL=true
                shift
                ;;
            --no-build)
                BUILD_IMAGES=false
                shift
                ;;
            --no-push)
                PUSH_IMAGES=false
                shift
                ;;
            --dry-run)
                DRY_RUN=true
                shift
                ;;
            --rollback)
                ROLLBACK_VERSION="$2"
                shift 2
                ;;
            --help|-h)
                echo "SAMI v2 Deployment Script"
                echo ""
                echo "Usage: $0 [options]"
                echo ""
                echo "Options:"
                echo "  -e, --environment ENV      Target environment (default: production)"
                echo "  -v, --version VERSION      Deployment version (auto-generated if not provided)"
                echo "  -u, --docker-username USER Docker registry username"
                echo "  -r, --docker-registry REG  Docker registry URL (default: docker.io)"
                echo "  -c, --cloud-provider CLOUD Cloud provider (aws, gcp, azure, digitalocean, kubernetes)"
                echo "      --local                Deploy locally with Docker Compose"
                echo "      --no-build             Skip building Docker images"
                echo "      --no-push              Skip pushing Docker images"
                echo "      --dry-run              Show what would be done without executing"
                echo "      --rollback VERSION     Rollback to specified version"
                echo "  -h, --help                 Show this help message"
                exit 0
                ;;
            *)
                print_error "Unknown option: $1"
                exit 1
                ;;
        esac
    done
    
    # Set default Docker username if not provided
    if [ -z "$DOCKER_USERNAME" ]; then
        DOCKER_USERNAME="imnoturban"
        print_warning "Using default Docker username: $DOCKER_USERNAME"
    fi
    
    if [ -n "$ROLLBACK_VERSION" ]; then
        rollback
        exit 0
    fi
    
    if [ "$DRY_RUN" = true ]; then
        print_info "DRY RUN MODE - No changes will be made"
    fi
    
    # Run deployment steps
    check_prerequisites
    generate_version
    
    if [ "$DRY_RUN" = false ]; then
        run_tests
        create_backup
        build_images
        push_images
        
        if [ "$DEPLOY_LOCAL" = true ]; then
            deploy_local
        elif [ -n "$CLOUD_PROVIDER" ]; then
            deploy_cloud
        else
            print_warning "No deployment target specified. Use --local or --cloud-provider"
        fi
        
        print_deployment_info
    else
        print_info "DRY RUN: Would deploy version $VERSION to $ENVIRONMENT"
    fi
    
    print_success "Deployment script completed!"
}

# Run main function
main "$@" 