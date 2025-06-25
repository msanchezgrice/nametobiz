# Phase 4 - Static Delivery Setup

## Prerequisites

1. **Cloudflare Account** with R2 enabled
2. **wrangler CLI** installed globally: `npm install -g wrangler`

## Setup Steps

### 1. Create R2 Bucket
```bash
# Login to Cloudflare
wrangler login

# Create the R2 bucket
wrangler r2 bucket create prototype-bundles
```

### 2. Get Cloudflare Credentials

**Account ID:**
- Go to Cloudflare Dashboard → Right sidebar → Account ID

**R2 API Token:**
- Go to Cloudflare Dashboard → R2 → Manage R2 API tokens
- Create token with:
  - Edit permissions on `prototype-bundles` bucket
  - Copy Access Key ID and Secret Access Key

### 3. Update Environment Variables

Add to `apps/worker/.env`:
```bash
CF_ACCOUNT_ID=your_actual_account_id
CF_R2_ACCESS_KEY_ID=your_actual_access_key_id
CF_R2_SECRET_ACCESS_KEY=your_actual_secret_access_key
```

### 4. Deploy Cloudflare Worker

```bash
cd infra/cf
pnpm install
pnpm run deploy
```

### 5. Test Deployment

```bash
# After worker is deployed, test with:
curl -I https://your-worker.your-subdomain.workers.dev/site/test
# Should return 404 (expected since no bundles yet)
```

## Validation

According to MVP.md Phase 4:
```bash
curl -I https://edge.example.com/site/job123/themeA/index.html
# → 200, cache-control: immutable, TTFB < 200 ms
```

## How It Works

1. **Worker generates bundles** → Uploads to R2 under `/bundles/{jobId}/{domain}/{theme}/`
2. **Cloudflare Worker** serves files from R2 at `/site/` endpoints
3. **Immutable caching** with 1-year cache headers
4. **Global edge delivery** via Cloudflare's network 