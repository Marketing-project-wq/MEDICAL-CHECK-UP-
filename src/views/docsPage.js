// GET /api/docs — interactive OpenAPI documentation (Swagger UI).
// Pure renderer, dependency-free ESM, same nonce/CSP pattern as every other
// HTML response in this app (see server.js securityHeaders). Swagger UI's own
// JS/CSS load from cdn.jsdelivr.net, already allowlisted in script-src for
// pdf.js/supabase-js; only the small bootstrap call below needs the nonce.
// Pinned to a version verified against the real npm registry (registry.npmjs.org),
// not guessed — see swagger-ui-dist@5.33.0 on npm for the exact file names used here.
const SWAGGER_UI_VERSION = "5.33.0";
const SWAGGER_UI_BASE = `https://cdn.jsdelivr.net/npm/swagger-ui-dist@${SWAGGER_UI_VERSION}`;

export function renderApiDocsPage(nonce) {
  return `<!doctype html>
<html lang="en">
<head>
<meta charset="utf-8">
<title>medicalcheckup.20fit.id API docs</title>
<meta name="robots" content="noindex">
<link rel="stylesheet" href="${SWAGGER_UI_BASE}/swagger-ui.css">
<style>body{margin:0}</style>
</head>
<body>
<div id="swagger-ui"></div>
<script nonce="${nonce}" src="${SWAGGER_UI_BASE}/swagger-ui-bundle.js"></script>
<script nonce="${nonce}" src="${SWAGGER_UI_BASE}/swagger-ui-standalone-preset.js"></script>
<script nonce="${nonce}">
  window.ui = SwaggerUIBundle({
    url: "/api/openapi.json",
    dom_id: "#swagger-ui",
    presets: [SwaggerUIBundle.presets.apis, SwaggerUIStandalonePreset],
    layout: "StandaloneLayout",
  });
</script>
</body>
</html>`;
}
