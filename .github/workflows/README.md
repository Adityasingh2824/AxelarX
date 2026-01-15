# GitHub Actions Workflows

This directory contains CI/CD workflows for the AxelarX project.

## Workflows

### 1. `ci.yml` - Continuous Integration
**Triggers:** Push and Pull Requests to `main` and `develop` branches

**Jobs:**
- **test-contracts**: Tests Rust smart contracts
  - Format checking (cargo fmt)
  - Linting (cargo clippy)
  - Building WASM files
  - Running unit tests
  - Uploading build artifacts

- **test-frontend**: Tests Next.js frontend
  - Format checking
  - ESLint
  - TypeScript type checking
  - Unit tests with coverage
  - Code coverage upload

- **build-frontend**: Builds frontend for production
  - Installs dependencies
  - Builds Next.js application
  - Uploads build artifacts

- **security-scan**: Security vulnerability scanning
  - Trivy vulnerability scanner
  - Uploads results to GitHub Security

- **test-evm-contracts**: Tests Solidity contracts
  - Compiles contracts
  - Runs tests
  - Code coverage

### 2. `deploy.yml` - Deployment
**Triggers:** 
- Push to `main` branch
- Tags starting with `v*`
- Manual workflow dispatch

**Jobs:**
- **deploy-frontend**: Deploys to Vercel
  - Builds and deploys frontend
  - Supports staging and production environments

- **deploy-contracts**: Contract deployment (manual)
  - Builds WASM files
  - Uploads artifacts for manual deployment

- **deploy-evm-contracts**: EVM contract deployment
  - Compiles and deploys to networks
  - Verifies contracts on Etherscan

- **create-release**: Creates GitHub release
  - Generates changelog
  - Creates release with tag

### 3. `lint.yml` - Linting & Formatting
**Triggers:** Push and Pull Requests

**Jobs:**
- **rust-lint**: Rust code quality
  - Format checking
  - Clippy linting

- **frontend-lint**: Frontend code quality
  - ESLint
  - TypeScript checking
  - Prettier formatting

- **evm-lint**: Solidity code quality
  - Solhint
  - Format checking

### 4. `nightly.yml` - Nightly Tasks
**Triggers:** Daily at 2 AM UTC, Manual dispatch

**Jobs:**
- **full-test**: Comprehensive testing
  - Tests on multiple Rust versions
  - Full test suite

- **benchmarks**: Performance benchmarks
  - Runs benchmarks
  - Uploads results

- **check-dependencies**: Dependency updates
  - Checks for outdated dependencies

- **security-audit**: Security scanning
  - Cargo audit
  - npm audit
  - Trivy scan

## Required Secrets

### Vercel Deployment
- `VERCEL_TOKEN`: Vercel authentication token
- `VERCEL_ORG_ID`: Vercel organization ID
- `VERCEL_PROJECT_ID`: Vercel project ID

### Contract Deployment
- `DEPLOYER_PRIVATE_KEY`: Private key for contract deployment
- `INFURA_API_KEY`: Infura API key for RPC access
- `ETHERSCAN_API_KEY`: Etherscan API key for contract verification

### Environment Variables
- `NEXT_PUBLIC_LINERA_GRAPHQL_URL`: Linera GraphQL endpoint

## Usage

### Running CI Locally

```bash
# Install act (GitHub Actions locally)
brew install act  # macOS
# or
curl https://raw.githubusercontent.com/nektos/act/master/install.sh | sudo bash

# Run CI workflow
act -j test-contracts
act -j test-frontend
```

### Manual Deployment

1. Go to Actions tab in GitHub
2. Select "Deploy" workflow
3. Click "Run workflow"
4. Select environment (staging/production)
5. Click "Run workflow"

## Workflow Status Badges

Add these badges to your README:

```markdown
![CI](https://github.com/your-org/axelarx/workflows/CI%20Pipeline/badge.svg)
![Deploy](https://github.com/your-org/axelarx/workflows/Deploy/badge.svg)
![Lint](https://github.com/your-org/axelarx/workflows/Lint%20%26%20Format%20Check/badge.svg)
```

## Troubleshooting

### Build Failures
- Check Rust version compatibility
- Verify all dependencies are available
- Check for breaking changes in dependencies

### Deployment Failures
- Verify secrets are set correctly
- Check Vercel project configuration
- Verify network access for contract deployment

### Test Failures
- Review test output in Actions tab
- Check for flaky tests
- Verify test environment setup






