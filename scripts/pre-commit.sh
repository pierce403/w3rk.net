#!/bin/bash

# Pre-commit script to run tests and checks before committing

set -e

echo "🔍 Running pre-commit checks..."

# 1. Lint check
echo "📝 Running linter..."
npm run lint

# 2. Type check and build
echo "🏗️  Building application..."
NEXT_PUBLIC_WALLETCONNECT_PROJECT_ID=${NEXT_PUBLIC_WALLETCONNECT_PROJECT_ID:-"83c5a5f5e1b745cde3ae5be39b6b6f4e"} \
NEXTAUTH_SECRET=${NEXTAUTH_SECRET:-"test-secret-for-ci"} \
NEXTAUTH_URL=${NEXTAUTH_URL:-"http://localhost:3000"} \
npm run build

# 3. Run core tests
echo "🧪 Running critical tests..."
NEXT_PUBLIC_WALLETCONNECT_PROJECT_ID=${NEXT_PUBLIC_WALLETCONNECT_PROJECT_ID:-"83c5a5f5e1b745cde3ae5be39b6b6f4e"} \
NEXTAUTH_SECRET=${NEXTAUTH_SECRET:-"test-secret-for-ci"} \
NEXTAUTH_URL=${NEXTAUTH_URL:-"http://localhost:3000"} \
npx playwright test --project=chromium --grep "API Endpoints|health|nonce"

echo "✅ All pre-commit checks passed!"
echo "🚀 Ready to commit!"
