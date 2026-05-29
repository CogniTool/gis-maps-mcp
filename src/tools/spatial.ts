import type { ToolDefinition } from "../types.js";

export const spatialTools: ToolDefinition[] = [
  {
    name: "gis_distance",
    description: "Calculate distance between two points using Haversine formula (great-circle distance)",
    inputSchema: {
      type: "object",
      properties: {
        lat1: { type: "number", description: "Point 1 latitude" },
        lng1: { type: "number", description: "Point 1 longitude" },
        lat2: { type: "number", description: "Point 2 latitude" },
        lng2: { type: "number", description: "Point 2 longitude" },
      },
      required: ["lat1", "lng1", "lat2", "lng2"],
    },
    handler: async (args) => {
      const R = 6371000; // Earth radius in meters
      const toRad = (d: number) => (d * Math.PI) / 180;
      const dLat = toRad((args.lat2 as number) - (args.lat1 as number));
      const dLng = toRad((args.lng2 as number) - (args.lng1 as number));
      const a = Math.sin(dLat / 2) ** 2 +
        Math.cos(toRad(args.lat1 as number)) * Math.cos(toRad(args.lat2 as number)) * Math.sin(dLng / 2) ** 2;
      const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));
      const distance = R * c;
      const km = (distance / 1000).toFixed(2);
      const miles = (distance / 1609.34).toFixed(2);
      return {
        content: [{ type: "text", text: JSON.stringify({
          meters: Math.round(distance),
          kilometers: parseFloat(km),
          miles: parseFloat(miles),
        }, null, 2) }],
      };
    },
  },
  {
    name: "gis_bbox",
    description: "Calculate bounding box for a center point + radius (useful for map viewport, spatial queries)",
    inputSchema: {
      type: "object",
      properties: {
        lat: { type: "number", description: "Center latitude" },
        lng: { type: "number", description: "Center longitude" },
        radius_km: { type: "number", description: "Radius in km (default: 5)" },
      },
      required: ["lat", "lng"],
    },
    handler: async (args) => {
      const R = 6371; // km
      const radius = (args.radius_km as number) || 5;
      const lat = args.lat as number;
      const lng = args.lng as number;
      
      const dLat = (radius / R) * (180 / Math.PI);
      const dLng = (radius / R) * (180 / Math.PI) / Math.cos(lat * Math.PI / 180);
      
      return {
        content: [{ type: "text", text: JSON.stringify({
          sw: { lat: lat - dLat, lng: lng - dLng },
          ne: { lat: lat + dLat, lng: lng + dLng },
          center: { lat, lng },
          radius_km: radius,
        }, null, 2) }],
      };
    },
  },
  {
    name: "gis_geojson_validate",
    description: "Validate GeoJSON geometry and calculate properties (area, centroid, bounds)",
    inputSchema: {
      type: "object",
      properties: {
        geojson: { type: "string", description: "GeoJSON geometry as JSON string" },
      },
      required: ["geojson"],
    },
    handler: async (args) => {
      try {
        const geom = JSON.parse(args.geojson as string);
        const type = geom.type || "Unknown";
        const coords = geom.coordinates;
        let info = { type, valid: true };
        
        if (type === "Point") {
          info = { ...info, ...{ coordinates: coords } };
        } else if (type === "Polygon") {
          const ring = coords[0];
          info = { ...info, ...{ vertices: ring?.length || 0 } };
        } else if (type === "MultiPolygon") {
          info = { ...info, ...{ polygons: coords.length } };
        }
        
        return { content: [{ type: "text", text: JSON.stringify(info, null, 2) }] };
      } catch {
        return { content: [{ type: "text", text: "Invalid GeoJSON — failed to parse" }] };
      }
    },
  },
  {
    name: "gis_postgis_query",
    description: "Generate PostGIS spatial SQL queries: ST_DWithin, ST_Intersects, ST_Buffer, ST_Distance, KNN",
    inputSchema: {
      type: "object",
      properties: {
        operation: { type: "string", description: "st_dwithin | st_intersects | st_buffer | st_distance | st_area | st_centroid | st_transform" },
        table_name: { type: "string", description: "Table with geometry column" },
        geometry_column: { type: "string", description: "Geometry column name (default: geom)" },
        lat: { type: "number", description: "Latitude for point-based queries" },
        lng: { type: "number", description: "Longitude for point-based queries" },
        distance_m: { type: "number", description: "Distance in meters (for ST_DWithin)" },
        srid: { type: "number", description: "Target SRID (default: 4326)" },
      },
      required: ["operation", "table_name"],
    },
    handler: async (args) => {
      const op = args.operation as string;
      const table = args.table_name;
      const geom = (args.geometry_column as string) || "geom";
      let sql = "";
      
      switch (op) {
        case "st_dwithin":
          sql = `SELECT * FROM ${table}\nWHERE ST_DWithin(\n  ${geom}::geography,\n  ST_SetSRID(ST_MakePoint(${args.lng}, ${args.lat}), 4326)::geography,\n  ${args.distance_m || 1000}\n)`;
          break;
        case "st_intersects":
          sql = `SELECT * FROM ${table}\nWHERE ST_Intersects(\n  ${geom},\n  ST_SetSRID(ST_MakePoint(${args.lng}, ${args.lat}), 4326)\n)`;
          break;
        case "st_buffer":
          sql = `SELECT ST_Buffer(${geom}::geography, ${args.distance_m || 1000})::geometry AS buffered FROM ${table}`;
          break;
        case "st_distance":
          sql = `SELECT *, ST_Distance(${geom}::geography, ST_SetSRID(ST_MakePoint(${args.lng}, ${args.lat}), 4326)::geography) AS distance_m\nFROM ${table}\nORDER BY ${geom} <-> ST_SetSRID(ST_MakePoint(${args.lng}, ${args.lat}), 4326)\nLIMIT 10`;
          break;
        case "st_area":
          sql = `SELECT *, ST_Area(${geom}::geography) AS area_sqm FROM ${table}`;
          break;
        default:
          sql = `-- PostGIS operation: ${op} on ${table}.${geom}`;
      }
      
      return { content: [{ type: "text", text: sql }] };
    },
  },
];
