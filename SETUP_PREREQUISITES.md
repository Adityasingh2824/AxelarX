# Prerequisites Installation Guide

## Required Tools

### 1. Rust Toolchain

**Windows Installation:**

Option A: Using rustup-init (Recommended)
1. Download rustup-init.exe from: https://rustup.rs/
2. Run the installer
3. Follow the installation prompts
4. Restart your terminal/PowerShell

Option B: Using Winget
```powershell
winget install Rustlang.Rustup
```

After installation, verify:
```powershell
rustc --version
rustup --version
```

Add WASM target:
```powershell
rustup target add wasm32-unknown-unknown
```

### 2. Linera CLI

**Installation Steps:**

1. Visit: https://linera.dev/getting_started/installation.html
2. Follow the installation instructions for Windows
3. Or use cargo to install (if Rust is installed):
   ```powershell
   cargo install linera-service --locked
   ```

Verify installation:
```powershell
linera --version
```

## Quick Install Script

After Rust is installed, you can run this PowerShell script:

```powershell
# Install WASM target
rustup target add wasm32-unknown-unknown

# Verify installation
rustc --version
rustup target list --installed | Select-String "wasm32-unknown-unknown"
```

## Next Steps

Once both are installed, return to the deployment process.

