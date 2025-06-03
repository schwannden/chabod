#!/bin/bash

# RLS Test Runner Script
# This script sets up the environment and runs the RLS tests

set -e

# Colors for output
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
NC='\033[0m' # No Color

echo -e "${GREEN}🔒 Starting RLS (Row Level Security) Tests${NC}"
echo ""

# Check if Supabase CLI is installed
if ! command -v supabase &> /dev/null; then
    echo -e "${RED}❌ Supabase CLI is not installed${NC}"
    echo "Please install it with: npm install -g supabase"
    exit 1
fi

# Check if .env.test exists
if [ ! -f ".env.test" ]; then
    echo -e "${YELLOW}⚠️  .env.test file not found${NC}"
    echo "Creating .env.test from example..."
    
    if [ -f ".env.test.example" ]; then
        cp .env.test.example .env.test
        echo -e "${YELLOW}📝 Please edit .env.test with your test environment values${NC}"
        exit 1
    else
        echo -e "${RED}❌ .env.test.example not found. Creating basic template...${NC}"
        cat > .env.test << EOF
# Test Environment Configuration
VITE_SUPABASE_URL=http://localhost:54321
VITE_SUPABASE_ANON_KEY=your_anon_key_here
SUPABASE_SERVICE_ROLE_KEY=your_service_role_key_here
TEST_DATABASE_URL=postgresql://postgres:postgres@localhost:54322/postgres
EOF
        echo -e "${YELLOW}📝 Please edit .env.test with your test environment values${NC}"
        exit 1
    fi
fi

# Check if Supabase is running
echo -e "${YELLOW}🔍 Checking Supabase status...${NC}"
if ! supabase status &> /dev/null; then
    echo -e "${YELLOW}🚀 Starting Supabase...${NC}"
    supabase start
    echo -e "${GREEN}✅ Supabase started${NC}"
else
    echo -e "${GREEN}✅ Supabase is running${NC}"
fi

# Display Supabase status
echo ""
echo -e "${YELLOW}📊 Supabase Status:${NC}"
supabase status

# Extract API keys for verification
echo ""
echo -e "${YELLOW}🔑 API Keys:${NC}"
ANON_KEY=$(supabase status | grep "anon key" | awk '{print $3}')
SERVICE_KEY=$(supabase status | grep "service_role key" | awk '{print $3}')

echo "Anon Key: ${ANON_KEY:0:20}..."
echo "Service Key: ${SERVICE_KEY:0:20}..."

# Check if .env.test has the correct keys
if grep -q "your_anon_key_here" .env.test || grep -q "your_service_role_key_here" .env.test; then
    echo -e "${RED}❌ Please update .env.test with the actual API keys shown above${NC}"
    exit 1
fi

echo ""
echo -e "${GREEN}🧪 Running RLS Tests...${NC}"
echo ""

# Run the tests
if [ "$1" = "--coverage" ]; then
    npm run test:coverage -- --testPathPattern=rls
elif [ "$1" = "--watch" ]; then
    npm run test:watch -- --testPathPattern=rls
elif [ -n "$1" ]; then
    # Run specific test file
    npx jest "tests/rls/$1"
else
    npm run test:rls
fi

echo ""
echo -e "${GREEN}✅ RLS Tests completed!${NC}" 