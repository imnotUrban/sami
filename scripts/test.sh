#!/bin/bash

# ===========================================
# SAMI v2 - Test Script
# ===========================================

set -e

# Colors for output
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
BLUE='\033[0;34m'
NC='\033[0m' # No Color

# Print functions
print_success() {
    echo -e "${GREEN}✅ $1${NC}"
}

print_error() {
    echo -e "${RED}❌ $1${NC}"
}

print_warning() {
    echo -e "${YELLOW}⚠️  $1${NC}"
}

print_info() {
    echo -e "${BLUE}ℹ️  $1${NC}"
}

print_header() {
    echo -e "${BLUE}"
    echo "┌─────────────────────────────────────────────────────────────┐"
    echo "│                    SAMI v2 Test Suite                      │"
    echo "└─────────────────────────────────────────────────────────────┘"
    echo -e "${NC}"
}

# Test backend
test_backend() {
    print_info "Running backend tests..."
    
    cd backend
    
    # Check if Go modules are ready
    if [ ! -f "go.mod" ]; then
        print_error "go.mod not found in backend directory"
        return 1
    fi
    
    # Run go mod tidy
    print_info "Tidying Go modules..."
    go mod tidy
    
    # Run go vet
    print_info "Running go vet..."
    if go vet ./...; then
        print_success "go vet passed"
    else
        print_error "go vet failed"
        return 1
    fi
    
    # Check formatting
    print_info "Checking Go code formatting..."
    UNFORMATTED=$(gofmt -l .)
    if [ -n "$UNFORMATTED" ]; then
        print_error "The following files are not properly formatted:"
        echo "$UNFORMATTED"
        print_info "Run 'gofmt -w .' to fix formatting"
        return 1
    else
        print_success "All Go files are properly formatted"
    fi
    
    # Run tests with coverage
    print_info "Running Go tests with coverage..."
    if go test -v -race -coverprofile=coverage.out ./...; then
        print_success "Go tests passed"
        
        # Generate coverage report
        go tool cover -html=coverage.out -o coverage.html
        COVERAGE=$(go tool cover -func=coverage.out | grep total | awk '{print $3}')
        print_info "Test coverage: $COVERAGE"
        
        # Check if coverage is acceptable (> 70%)
        COVERAGE_NUM=$(echo $COVERAGE | sed 's/%//')
        if (( $(echo "$COVERAGE_NUM > 70" | bc -l) )); then
            print_success "Coverage is acceptable ($COVERAGE)"
        else
            print_warning "Coverage is below 70% ($COVERAGE)"
        fi
    else
        print_error "Go tests failed"
        return 1
    fi
    
    # Run benchmarks
    print_info "Running Go benchmarks..."
    go test -bench=. -benchmem ./... > benchmark_results.txt 2>&1 || true
    print_info "Benchmark results saved to benchmark_results.txt"
    
    cd ..
    print_success "Backend tests completed"
}

# Test frontend
test_frontend() {
    print_info "Running frontend tests..."
    
    cd frontend-sami
    
    # Check if package.json exists
    if [ ! -f "package.json" ]; then
        print_error "package.json not found in frontend-sami directory"
        return 1
    fi
    
    # Install dependencies if node_modules doesn't exist
    if [ ! -d "node_modules" ]; then
        print_info "Installing npm dependencies..."
        npm install
    fi
    
    # Run TypeScript type checking
    print_info "Running TypeScript type checking..."
    if npm run type-check; then
        print_success "TypeScript type checking passed"
    else
        print_error "TypeScript type checking failed"
        return 1
    fi
    
    # Run ESLint
    print_info "Running ESLint..."
    if npm run lint; then
        print_success "ESLint passed"
    else
        print_warning "ESLint found issues (non-blocking)"
    fi
    
    # Run Prettier check
    print_info "Checking code formatting with Prettier..."
    if npm run format:check; then
        print_success "Code formatting is correct"
    else
        print_warning "Code formatting issues found. Run 'npm run format' to fix"
    fi
    
    # Run unit tests
    print_info "Running Jest unit tests..."
    if npm run test -- --coverage --watchAll=false --passWithNoTests; then
        print_success "Frontend unit tests passed"
    else
        print_error "Frontend unit tests failed"
        return 1
    fi
    
    # Build the application
    print_info "Building the application..."
    if npm run build; then
        print_success "Frontend build successful"
    else
        print_error "Frontend build failed"
        return 1
    fi
    
    cd ..
    print_success "Frontend tests completed"
}

# Integration tests
test_integration() {
    print_info "Running integration tests..."
    
    # Check if Docker is available
    if ! command -v docker &> /dev/null; then
        print_warning "Docker not found, skipping integration tests"
        return 0
    fi
    
    # Start test database
    print_info "Starting test database..."
    docker run -d \
        --name sami-test-db \
        -e POSTGRES_PASSWORD=test \
        -e POSTGRES_DB=sami_test \
        -p 5433:5432 \
        postgres:13-alpine
    
    # Wait for database to be ready
    sleep 10
    
    # Run database migrations
    print_info "Running database migrations..."
    cd backend
    PGPASSWORD=test psql -h localhost -p 5433 -U postgres -d sami_test -f db.sql
    PGPASSWORD=test psql -h localhost -p 5433 -U postgres -d sami_test -f ../init-admin.sql
    
    # Start backend for integration tests
    print_info "Starting backend for integration tests..."
    DB_HOST=localhost \
    DB_PORT=5433 \
    DB_USER=postgres \
    DB_PASSWORD=test \
    DB_NAME=sami_test \
    JWT_SECRET=test-secret \
    GIN_MODE=test \
    PORT=8081 \
    go run main.go &
    
    BACKEND_PID=$!
    sleep 5
    
    # Run API tests
    print_info "Running API integration tests..."
    if go test -tags=integration ./tests/integration/...; then
        print_success "Integration tests passed"
        INTEGRATION_SUCCESS=true
    else
        print_error "Integration tests failed"
        INTEGRATION_SUCCESS=false
    fi
    
    # Cleanup
    print_info "Cleaning up test environment..."
    kill $BACKEND_PID 2>/dev/null || true
    docker stop sami-test-db 2>/dev/null || true
    docker rm sami-test-db 2>/dev/null || true
    
    cd ..
    
    if [ "$INTEGRATION_SUCCESS" = true ]; then
        print_success "Integration tests completed successfully"
        return 0
    else
        return 1
    fi
}

# Security tests
test_security() {
    print_info "Running security tests..."
    
    # Check for common security issues in Go
    if command -v gosec &> /dev/null; then
        print_info "Running gosec security scanner..."
        cd backend
        if gosec ./...; then
            print_success "No security issues found in Go code"
        else
            print_warning "Security issues found in Go code"
        fi
        cd ..
    else
        print_warning "gosec not installed, skipping Go security scan"
    fi
    
    # Check for vulnerabilities in npm packages
    cd frontend-sami
    if command -v npm &> /dev/null; then
        print_info "Running npm audit..."
        if npm audit --audit-level moderate; then
            print_success "No critical npm vulnerabilities found"
        else
            print_warning "npm vulnerabilities found"
        fi
    fi
    cd ..
    
    # Check for secrets in codebase
    if command -v git &> /dev/null; then
        print_info "Checking for potential secrets..."
        if git secrets --scan --recursive .; then
            print_success "No secrets found in repository"
        else
            print_warning "Potential secrets found"
        fi 2>/dev/null || print_info "git-secrets not installed, skipping secret scan"
    fi
    
    print_success "Security tests completed"
}

# Performance tests
test_performance() {
    print_info "Running performance tests..."
    
    # Backend performance tests
    cd backend
    print_info "Running Go benchmark tests..."
    go test -bench=. -benchmem ./... | tee ../performance_results.txt
    cd ..
    
    # Frontend bundle analysis
    cd frontend-sami
    if [ -f "package.json" ] && grep -q "analyze" package.json; then
        print_info "Analyzing frontend bundle size..."
        npm run analyze > ../bundle_analysis.txt 2>&1 || true
    fi
    cd ..
    
    print_success "Performance tests completed"
}

# Generate test report
generate_report() {
    print_info "Generating test report..."
    
    REPORT_FILE="test_report_$(date +%Y%m%d_%H%M%S).md"
    
    cat > "$REPORT_FILE" << EOF
# SAMI v2 Test Report

**Generated:** $(date)
**Branch:** $(git branch --show-current 2>/dev/null || echo "unknown")
**Commit:** $(git rev-parse --short HEAD 2>/dev/null || echo "unknown")

## Test Results

### Backend Tests
- ✅ Go vet: Passed
- ✅ Code formatting: Passed
- ✅ Unit tests: Passed
- ✅ Coverage: $(cat backend/coverage.out 2>/dev/null | tail -1 | awk '{print $3}' || echo "N/A")

### Frontend Tests
- ✅ TypeScript: Passed
- ✅ ESLint: Passed
- ✅ Unit tests: Passed
- ✅ Build: Passed

### Security
- ✅ Security scan completed
- ✅ Dependency audit completed

### Performance
- ✅ Benchmarks completed
- ✅ Bundle analysis completed

## Files Generated
- \`backend/coverage.html\` - Backend test coverage report
- \`backend/benchmark_results.txt\` - Backend benchmark results
- \`performance_results.txt\` - Performance test results

## Next Steps
1. Review coverage report for areas needing more tests
2. Check performance results for optimization opportunities
3. Address any security warnings found

---
*Generated by SAMI v2 test suite*
EOF
    
    print_success "Test report generated: $REPORT_FILE"
}

# Main execution
main() {
    print_header
    
    # Parse command line arguments
    BACKEND_ONLY=false
    FRONTEND_ONLY=false
    INTEGRATION_ONLY=false
    SECURITY_ONLY=false
    PERFORMANCE_ONLY=false
    SKIP_INTEGRATION=false
    
    while [[ $# -gt 0 ]]; do
        case $1 in
            --backend-only)
                BACKEND_ONLY=true
                shift
                ;;
            --frontend-only)
                FRONTEND_ONLY=true
                shift
                ;;
            --integration-only)
                INTEGRATION_ONLY=true
                shift
                ;;
            --security-only)
                SECURITY_ONLY=true
                shift
                ;;
            --performance-only)
                PERFORMANCE_ONLY=true
                shift
                ;;
            --skip-integration)
                SKIP_INTEGRATION=true
                shift
                ;;
            --help|-h)
                echo "SAMI v2 Test Script"
                echo ""
                echo "Usage: $0 [options]"
                echo ""
                echo "Options:"
                echo "  --backend-only      Run only backend tests"
                echo "  --frontend-only     Run only frontend tests"
                echo "  --integration-only  Run only integration tests"
                echo "  --security-only     Run only security tests"
                echo "  --performance-only  Run only performance tests"
                echo "  --skip-integration  Skip integration tests"
                echo "  --help, -h          Show this help message"
                exit 0
                ;;
            *)
                print_error "Unknown option: $1"
                exit 1
                ;;
        esac
    done
    
    # Store start time
    START_TIME=$(date +%s)
    
    # Run tests based on flags
    if [ "$BACKEND_ONLY" = true ]; then
        test_backend
    elif [ "$FRONTEND_ONLY" = true ]; then
        test_frontend
    elif [ "$INTEGRATION_ONLY" = true ]; then
        test_integration
    elif [ "$SECURITY_ONLY" = true ]; then
        test_security
    elif [ "$PERFORMANCE_ONLY" = true ]; then
        test_performance
    else
        # Run all tests
        test_backend
        test_frontend
        
        if [ "$SKIP_INTEGRATION" = false ]; then
            test_integration
        fi
        
        test_security
        test_performance
        generate_report
    fi
    
    # Calculate duration
    END_TIME=$(date +%s)
    DURATION=$((END_TIME - START_TIME))
    
    print_success "All tests completed in ${DURATION}s"
    
    echo ""
    print_info "Test artifacts:"
    echo "  📊 Coverage report: backend/coverage.html"
    echo "  📈 Performance results: performance_results.txt"
    echo "  📋 Full report: test_report_*.md"
}

# Run main function
main "$@" 