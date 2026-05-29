# GIS/Maps MCP Server

An MCP (Model Context Protocol) server providing GIS and mapping tools with a focus on Vietnam. Enables AI assistants to perform geocoding, spatial analysis, and administrative boundary lookups.

## Problems This Solves

### Problem 1: AI Assistants Can't Work with Geographic Data
Most AI models cannot natively convert addresses to coordinates, calculate distances between locations, or determine if a point falls within a boundary. This makes it impossible to build location-aware applications with AI assistance.

**Solution:** This MCP server provides `geocode` and `reverse_geocode` tools that use the free OpenStreetMap Nominatim API. Any MCP-compatible AI can now convert "Ben Thanh Market, Ho Chi Minh City" to precise coordinates, or identify what address exists at any lat/lng pair.

### Problem 2: Spatial Calculations Require Specialized GIS Software
Determining if a delivery address is within a service zone, calculating distances between locations, or finding the bounding box of a set of points typically requires QGIS, PostGIS, or complex libraries.

**Solution:** The `calculate_distance`, `point_in_polygon`, and `bounding_box` tools provide these calculations directly. An AI can determine if coordinates (10.7769, 106.7009) are inside Ho Chi Minh City's boundaries, or calculate that Hanoi is 1,167 km from Da Nang.

### Problem 3: Vietnam Administrative Hierarchy Lookup Is Complex
Vietnam has a 3-level administrative structure (province → district → ward/commune) with 63 provinces, 700+ districts, and 11,000+ wards. Mapping coordinates to this hierarchy requires specialized data.

**Solution:** The `vietnam_admin_lookup` tool reverse-geocodes coordinates and returns the full Vietnamese administrative hierarchy. Useful for logistics, address verification, and regional analysis.

## Tools

### 1. `geocode` — Forward Geocoding
Convert an address or place name to coordinates.

```
Input:  { "query": "Ho Chi Minh City, Vietnam", "country": "vn" }
Output: { "lat": 10.8231, "lng": 106.6297, "displayName": "..." }
```

### 2. `reverse_geocode` — Reverse Geocoding
Convert coordinates to a human-readable address.

```
Input:  { "lat": 21.0285, "lng": 105.8542 }
Output: { "displayName": "Hanoi, Vietnam", "address": { "city": "Hanoi", ... } }
```

### 3. `calculate_distance` — Distance Calculation
Calculate the great-circle distance between two points (Haversine formula).

```
Input:  { "lat1": 21.0285, "lng1": 105.8542, "lat2": 16.0544, "lng2": 108.2022 }
Output: { "distanceKm": 627.5, "distanceMiles": 389.9, "distanceMeters": 627500 }
```

### 4. `point_in_polygon` — Geofencing
Check if a point lies inside a polygon. Useful for delivery zones, district boundaries.

```
Input:  { "lat": 10.77, "lng": 106.69, "polygon": [...] }
Output: { "isInside": true }
```

### 5. `bounding_box` — Bounding Box Calculator
Calculate the bounding rectangle for a set of coordinates.

```
Input:  { "coordinates": [{ "lat": 21.0, "lng": 105.8 }, ...] }
Output: { "minLat": 8.5, "maxLat": 23.4, "center": { "lat": 15.95, "lng": 106.2 } }
```

### 6. `vietnam_admin_lookup` — Vietnam Admin Lookup
Identify Vietnam province/district/ward from coordinates.

```
Input:  { "lat": 10.7769, "lng": 106.7009 }
Output: { "province": "Hồ Chí Minh", "district": "Quận 1", "ward": "Bến Nghé" }
```

## Installation

```bash
npm install
npm run build
```

## Usage

### As an MCP Server (stdio)

```bash
npm start
```

### With Claude Desktop

Add to your `claude_desktop_config.json`:

```json
{
  "mcpServers": {
    "gis-maps": {
      "command": "node",
      "args": ["/path/to/gis-maps-mcp/dist/index.js"]
    }
  }
}
```

### With Smithery

This server is compatible with [Smithery](https://smithery.ai/). See `smithery.yaml` for configuration.

## Architecture

```
src/
├── index.ts              # MCP server entry point
├── tools/
│   ├── geocoding.ts      # geocode + reverse_geocode
│   ├── spatial.ts        # calculate_distance, point_in_polygon, bounding_box
│   └── admin.ts          # vietnam_admin_lookup
├── utils/
│   └── http.ts           # Shared HTTP client with User-Agent
└── types/
    └── index.ts          # TypeScript type definitions
```

## API Notes

- **Nominatim Usage Policy**: This server respects [Nominatim's usage policy](https://operations.osmfoundation.org/policies/nominatim/). It sends a descriptive User-Agent and limits concurrent requests. For heavy usage, consider hosting your own Nominatim instance.
- **No API Keys Required**: All tools use free, public APIs (OpenStreetMap Nominatim).
- **Haversine Accuracy**: The distance calculation uses the Haversine formula which assumes a spherical Earth. Accuracy is within ~0.5% for most use cases.

## License

MIT
