# Deployment Issues & Solutions

## Current Issues

### 1. Linera CLI Installation
**Problem:** Linera CLI installation from source fails on Windows due to workspace configuration issues.

**Solution Options:**
- Use WSL (Windows Subsystem for Linux) to run Linera CLI
- Wait for official Windows binary releases
- Use Docker container with Linera pre-installed

### 2. Contract WASM Compilation
**Problem:** Contracts have dependency conflicts when compiling to WASM (mio crate doesn't support WASM).

**Root Cause:** The contract dependencies include networking libraries that don't support WASM target.

**Solution Required:**
- Update `Cargo.toml` files to use feature flags that disable networking for WASM builds
- Remove or conditionally compile incompatible dependencies
- Use `#[cfg(not(target_arch = "wasm32"))]` for platform-specific code

## Workaround: Frontend with Mock Data

The **frontend is fully functional** with mock data and all integration code is complete.

### To Run Frontend:
```powershell
cd frontend
npm run dev
```

Visit: http://localhost:3000

The frontend will:
- ✅ Work with mock data (fully functional UI)
- ✅ Automatically switch to real contract data once deployed
- ✅ Show all features and UI properly

## Next Steps

### Option 1: Fix Contract Dependencies (Recommended)

1. **Update contract Cargo.toml files:**
   - Add feature flags for WASM builds
   - Conditionally exclude networking dependencies
   - Use `default-features = false` where needed

2. **Example fix for Cargo.toml:**
   ```toml
   [dependencies]
   tokio = { version = "1.0", default-features = false, features = ["rt", "sync"] }
   ```

### Option 2: Use WSL for Linera

1. Install WSL2 on Windows
2. Install Rust and Linera CLI in WSL
3. Build contracts in WSL
4. Run Linera network in WSL
5. Frontend can connect to WSL network via localhost

### Option 3: Wait for Official Support

- Linera may release Windows binaries
- Or provide Docker images with everything pre-configured

## Current Status

✅ **Frontend:** Fully functional with mock data
✅ **Integration Code:** Complete and ready
❌ **Contracts:** Need dependency fixes for WASM
❌ **Linera CLI:** Installation issues on Windows

## Recommendation

**For now:** Use the frontend with mock data - it's fully functional!

**For production deployment:** 
1. Fix contract dependencies for WASM compilation
2. Use WSL or wait for official Windows support for Linera CLI




