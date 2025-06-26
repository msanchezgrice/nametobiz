# 🚀 QUICK RESTORE GUIDE

## If Something Breaks - Restore to Working State:

### Option 1: Git Reset (Recommended)
```bash
git reset --hard b679294
./restore-working-state.sh
```

### Option 2: Manual Restore
```bash
# 1. Check turbo.json has "tasks" not "pipeline"
# 2. Ensure URL encoding in apps/worker/src/generateBundles.ts:
#    const encodedThemeName = encodeURIComponent(bundle.themeName);
# 3. Ensure URL decoding in infra/cf/worker.ts:
#    const key = decodeURIComponent(encodedKey);
# 4. Deploy worker: cd infra/cf && wrangler deploy
# 5. Start services:
#    Terminal 1: cd apps/web && pnpm dev
#    Terminal 2: cd apps/worker && pnpm dev
```

### Quick Test
```bash
curl http://localhost:3000/api/test-supabase
# Should return: {"success":true,...}
```

## Working Commit Hash: `b679294`
## Cloudflare Worker Version: `1d51dd90-aee6-4842-9c55-8ce92dbb1ae0`

---
💡 **See `CHECKPOINT_WORKING_STATE.md` for complete details** 