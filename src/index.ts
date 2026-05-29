#!/usr/bin/env node

import { McpServer } from '@modelcontextprotocol/sdk/server/mcp.js';
import { StdioServerTransport } from '@modelcontextprotocol/sdk/server/stdio.js';
import { registerGeocodingTools } from './tools/geocoding.js';
import { registerSpatialTools } from './tools/spatial.js';
import { registerAdminTools } from './tools/admin.js';
import { registerMapTools } from './tools/maps.js';

const server = new McpServer({
  name: 'gis-maps-mcp',
  version: '0.2.0',
  description: 'GIS and mapping MCP server — 10 tools: geocoding, spatial analysis, Vietnam admin lookup, tile maps, Leaflet export',
});

registerGeocodingTools(server);
registerSpatialTools(server);
registerAdminTools(server);
registerMapTools(server);

async function main(): Promise<void> {
  const transport = new StdioServerTransport();
  await server.connect(transport);
  console.error('GIS Maps MCP server started');
}

main().catch((error) => {
  console.error('Failed to start server:', error);
  process.exit(1);
});
