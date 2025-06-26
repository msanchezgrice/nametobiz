#!/bin/bash

# 🎯 NametoBiz Working State Restore Script
# Run this script to restore the system to the fully working state

echo "🔄 Restoring NametoBiz to working state..."

# Check if we're in the right directory
if [ ! -f "package.json" ] || [ ! -d "apps" ]; then
    echo "❌ Please run this script from the NametoBiz root directory"
    exit 1
fi

# 1. Fix turbo.json if needed
echo "📝 Checking turbo.json configuration..."
if grep -q '"pipeline"' turbo.json; then
    echo "🔧 Fixing turbo.json (pipeline → tasks)"
    sed -i.bak 's/"pipeline"/"tasks"/' turbo.json
    echo "✅ turbo.json fixed"
else
    echo "✅ turbo.json already correct"
fi

# 2. Install dependencies
echo "📦 Installing dependencies..."
pnpm install

# 3. Build packages
echo "🏗️ Building packages..."
pnpm --filter @nametobiz/llm build
pnpm --filter @nametobiz/db build

# 4. Deploy Cloudflare worker
echo "☁️ Deploying Cloudflare worker..."
cd infra/cf
wrangler deploy
cd ../..

# 5. Check critical files have correct content
echo "🔍 Verifying critical fixes..."

# Check URL encoding in generateBundles.ts
if grep -q "encodeURIComponent(bundle.themeName)" apps/worker/src/generateBundles.ts; then
    echo "✅ Bundle generation URL encoding is correct"
else
    echo "❌ Bundle generation URL encoding needs fixing"
    echo "   Please ensure line ~238 in apps/worker/src/generateBundles.ts has:"
    echo "   const encodedThemeName = encodeURIComponent(bundle.themeName);"
fi

# Check URL decoding in Cloudflare worker
if grep -q "decodeURIComponent(encodedKey)" infra/cf/worker.ts; then
    echo "✅ Cloudflare worker URL decoding is correct"
else
    echo "❌ Cloudflare worker URL decoding needs fixing"
    echo "   Please ensure line ~27 in infra/cf/worker.ts has:"
    echo "   const key = decodeURIComponent(encodedKey);"
fi

# 6. Start services
echo "🚀 Ready to start services. Run these commands in separate terminals:"
echo ""
echo "Terminal 1 (Web Server):"
echo "cd apps/web && pnpm dev"
echo ""
echo "Terminal 2 (Worker Service):"
echo "cd apps/worker && pnpm dev"
echo ""
echo "Then verify:"
echo "• Web: http://localhost:3000"
echo "• Test: curl http://localhost:3000/api/test-supabase"
echo "• Job: http://localhost:3000/job/835ba834-dafe-47c8-ad6a-c97c3fb1482f"
echo ""
echo "✅ Restore script completed!"
echo "📖 See CHECKPOINT_WORKING_STATE.md for full details" 