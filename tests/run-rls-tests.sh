#!/bin/bash

# RLS Test Runner Script
# Works in both local development and CI environments

set -e

# Colors for output
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
NC='\033[0m' # No Color

# Detect if running in CI environment
IS_CI=false
if [ "$CI" = "true" ] || [ "$GITHUB_ACTIONS" = "true" ] || [ -n "$GITHUB_WORKFLOW" ]; then
    IS_CI=true
fi

if [ "$IS_CI" = true ]; then
    echo -e "${GREEN}🔒 Running RLS (Row Level Security) Tests in CI${NC}"
else
    echo -e "${GREEN}🔒 Starting RLS (Row Level Security) Tests${NC}"
fi
echo ""

# Detect Supabase CLI installation method
SUPABASE_CMD=""
if command -v supabase &> /dev/null; then
    SUPABASE_CMD="supabase"
    echo -e "${GREEN}✅ Using globally installed Supabase CLI${NC}"
elif command -v npx &> /dev/null && npm list supabase &> /dev/null; then
    SUPABASE_CMD="npx supabase"
    echo -e "${GREEN}✅ Using npm-installed Supabase CLI (via npx)${NC}"
else
    echo -e "${RED}❌ Supabase CLI not found${NC}"
    echo "Please install Supabase CLI using one of these methods:"
    echo "  - npm install supabase --save-dev"
    echo "  - npm install -g supabase"
    echo "  - curl -fsSL https://packages.supabase.com/api/v1/download | bash"
    exit 1
fi

# Handle .env.test setup (only for local development)
if [ "$IS_CI" = false ]; then
    if [ ! -f ".env.test" ]; then
        echo -e "${YELLOW}⚠️  .env.test file not found${NC}"
        echo "Creating .env.test from example..."
        
        if [ -f ".env.test.example" ]; then
            cp .env.test.example .env.test
            echo -e "${GREEN}✅ Created .env.test from example${NC}"
        else
            echo -e "${YELLOW}📝 Creating basic .env.test template...${NC}"
            cat > .env.test << EOF
# Test Environment Configuration
VITE_SUPABASE_URL=http://localhost:54321
VITE_SUPABASE_ANON_KEY=your_anon_key_here
SUPABASE_SERVICE_ROLE_KEY=your_service_role_key_here
TEST_DATABASE_URL=postgresql://postgres:postgres@localhost:54322/postgres
EOF
            echo -e "${GREEN}✅ Created basic .env.test template${NC}"
        fi
    fi
fi

# Verify environment variables are set (important for CI)
if [ "$IS_CI" = true ]; then
    if [ -z "$VITE_SUPABASE_URL" ] || [ -z "$VITE_SUPABASE_ANON_KEY" ] || [ -z "$SUPABASE_SERVICE_ROLE_KEY" ]; then
        echo -e "${RED}❌ Required environment variables are not set${NC}"
        echo "Make sure .env.test contains all required variables"
        exit 1
    fi
    echo -e "${GREEN}✅ Environment variables verified${NC}"
fi

# Check if Supabase is running
echo -e "${YELLOW}🔍 Checking Supabase status...${NC}"
if ! $SUPABASE_CMD status &> /dev/null; then
    if [ "$IS_CI" = true ]; then
        echo -e "${RED}❌ Supabase is not running${NC}"
        echo "Please start Supabase first with: $SUPABASE_CMD start"
        exit 1
    else
        echo -e "${YELLOW}🚀 Starting Supabase...${NC}"
        $SUPABASE_CMD start
        echo -e "${GREEN}✅ Supabase started${NC}"
    fi
else
    echo -e "${GREEN}✅ Supabase is running${NC}"
fi

# Display Supabase status
echo ""
echo -e "${YELLOW}📊 Supabase Status:${NC}"
if [ "$IS_CI" = true ]; then
    # Abbreviated status for CI logs
    $SUPABASE_CMD status | head -10
else
    # Full status for local development
    $SUPABASE_CMD status
fi

# Handle API key extraction and .env.test updates (only for local)
if [ "$IS_CI" = false ]; then
    echo ""
    echo -e "${YELLOW}🔑 API Keys:${NC}"
    ANON_KEY=$($SUPABASE_CMD status | grep "anon key" | awk '{print $3}')
    SERVICE_KEY=$($SUPABASE_CMD status | grep "service_role key" | awk '{print $3}')

    echo "Anon Key: ${ANON_KEY:0:20}..."
    echo "Service Key: ${SERVICE_KEY:0:20}..."

    # Check if .env.test has placeholder values and update them
    if grep -q "your_anon_key_here" .env.test || grep -q "your_service_role_key_here" .env.test; then
        echo -e "${YELLOW}🔧 Updating .env.test with actual API keys...${NC}"
        
        # Create a backup
        cp .env.test .env.test.backup
        
        # Update the keys using sed
        if [[ "$OSTYPE" == "darwin"* ]]; then
            # macOS
            sed -i '' "s/your_anon_key_here/$ANON_KEY/g" .env.test
            sed -i '' "s/your_service_role_key_here/$SERVICE_KEY/g" .env.test
        else
            # Linux
            sed -i "s/your_anon_key_here/$ANON_KEY/g" .env.test
            sed -i "s/your_service_role_key_here/$SERVICE_KEY/g" .env.test
        fi
        
        echo -e "${GREEN}✅ Updated .env.test with actual API keys${NC}"
        echo -e "${YELLOW}📝 Backup saved as .env.test.backup${NC}"
    fi
fi

echo ""
echo -e "${GREEN}🧪 Running RLS Tests...${NC}"
echo ""

# Set test parameters based on environment
TEST_PARAMS=""
if [ "$IS_CI" = true ]; then
    # Use single worker for CI stability
    TEST_PARAMS="--maxWorkers=1"
fi

# Run the tests based on parameters
if [ "$1" = "--coverage" ]; then
    npm run test:coverage -- --testPathPattern=rls $TEST_PARAMS
elif [ "$1" = "--watch" ]; then
    if [ "$IS_CI" = true ]; then
        echo -e "${YELLOW}⚠️  Watch mode is not supported in CI${NC}"
        npm run test:rls -- $TEST_PARAMS
    else
        npm run test:watch -- --testPathPattern=rls
    fi
elif [ -n "$1" ]; then
    # Run specific test file
    npx jest "tests/rls/$1" $TEST_PARAMS
else
    npm run test:rls -- $TEST_PARAMS
fi

echo ""
echo -e "${GREEN}✅ RLS Tests completed successfully!${NC}" 