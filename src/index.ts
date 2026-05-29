#!/usr/bin/env node

import { McpServer } from '@modelcontextprotocol/sdk/server/mcp.js';
import { StdioServerTransport } from '@modelcontextprotocol/sdk/server/stdio.js';
import { registerGeocodingTools } from './tools/geocoding.js';
import { registerSpatialTools } from './tools/spatial.js';
import { registerAdminTools } from './tools/admin.js';

const server = new McpServer({
  name: 'gis-maps-mcp',
  version: '0.1.0',
  description: 'GIS and mapping MCP server with geocoding, spatial analysis, and Vietnam admin lookups',
});

registerGeocodingTools(server);
registerSpatialTools(server);
registerAdminTools(server);

async function main(): Promise<void> {
  const transport = new StdioServerTransport();
  await server.connect(transport);
  console.error('GIS Maps MCP server started');
}

main().catch((error) => {
  console.error('Failed to start server:', error);
  process.exit(1);
});
