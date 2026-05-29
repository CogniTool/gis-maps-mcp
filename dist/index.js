import { Server } from "@modelcontextprotocol/sdk/server/index.js";
import { StdioServerTransport } from "@modelcontextprotocol/sdk/server/stdio.js";
import { CallToolRequestSchema, ListToolsRequestSchema, } from "@modelcontextprotocol/sdk/types.js";
import { geocodingTools } from "./tools/geocoding.js";
import { spatialTools } from "./tools/spatial.js";
import { mapTools } from "./tools/maps.js";
const server = new Server({ name: "gis-maps", version: "0.1.0" }, { capabilities: { tools: {} } });
const allTools = [...geocodingTools, ...spatialTools, ...mapTools];
server.setRequestHandler(ListToolsRequestSchema, async () => ({
    tools: allTools.map((t) => ({
        name: t.name,
        description: t.description,
        inputSchema: t.inputSchema,
    })),
}));
server.setRequestHandler(CallToolRequestSchema, async (request) => {
    const tool = allTools.find((t) => t.name === request.params.name);
    if (!tool)
        throw new Error(`Unknown tool: ${request.params.name}`);
    return await tool.handler(request.params.arguments ?? {});
});
const transport = new StdioServerTransport();
await server.connect(transport);
console.error("GIS Maps MCP Server running on stdio");
//# sourceMappingURL=index.js.map