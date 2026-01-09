const { getDefaultConfig } = require('expo/metro-config')
const path = require('path')

/** @type {import('expo/metro-config').MetroConfig} */
const config = getDefaultConfig(__dirname)

// Project root
const projectRoot = __dirname

// Find the workspace root (monorepo root)
const workspaceRoot = path.resolve(projectRoot, '../..')

// Watch both the project and the monorepo root for pnpm hoisting
config.watchFolders = [workspaceRoot]

// Set the project root
config.projectRoot = projectRoot

// Configure resolver for pnpm compatibility
config.resolver.nodeModulesPaths = [
  path.resolve(projectRoot, 'node_modules'),
  path.resolve(workspaceRoot, 'node_modules'),
]

// Disable symlinks for EAS Build compatibility (pnpm uses symlinks)
config.resolver.unstable_enableSymlinks = false

// Enable package exports for better module resolution
config.resolver.unstable_enablePackageExports = true

// Disable haste for pnpm
config.resolver.disableHierarchicalLookup = true

// Ensure proper hashing
config.transformer = {
  ...config.transformer,
  getTransformOptions: async () => ({
    transform: {
      experimentalImportSupport: false,
      inlineRequires: true,
    },
  }),
}

module.exports = config
