// Metro-Konfiguration. Nur für die Browser-Vorschau (Entwicklung) nötig:
// expo-sqlite braucht im Browser WebAssembly und diese Sicherheits-Header. Auf dem Handy ohne Wirkung.
const { getDefaultConfig } = require('expo/metro-config');

const config = getDefaultConfig(__dirname);
config.resolver.assetExts.push('wasm');
config.server.enhanceMiddleware = (middleware) => (req, res, next) => {
  res.setHeader('Cross-Origin-Embedder-Policy', 'credentialless');
  res.setHeader('Cross-Origin-Opener-Policy', 'same-origin');
  middleware(req, res, next);
};

module.exports = config;
