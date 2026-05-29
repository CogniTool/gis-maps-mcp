import type { ToolDefinition } from "../types.js";
import { McpServer } from "@modelcontextprotocol/sdk/server/mcp.js";
import { z } from "zod";

export function registerMapTools(server: McpServer): void {
  server.tool(
    "gis_xyz_tile",
    "Calculate XYZ tile coordinates from lat/lng/zoom (for OSM, Mapbox, GeoServer tile URLs)",
    {
      lat: z.number().min(-90).max(90).describe("Latitude"),
      lng: z.number().min(-180).max(180).describe("Longitude"),
      zoom: z.number().min(0).max(20).describe("Zoom level (0-20)"),
    },
    async ({ lat, lng, zoom }) => {
      const n = Math.pow(2, zoom);
      const x = Math.floor((lng + 180) / 360 * n);
      const latRad = lat * Math.PI / 180;
      const y = Math.floor((1 - Math.log(Math.tan(latRad) + 1 / Math.cos(latRad)) / Math.PI) / 2 * n);

      return {
        content: [{ type: "text", text: JSON.stringify({
          x, y, zoom,
          tile_urls: {
            osm: `https://tile.openstreetmap.org/${zoom}/${x}/${y}.png`,
            cartodb: `https://basemaps.cartocdn.com/light_all/${zoom}/${x}/${y}.png`,
            geoserver: `http://localhost:8080/geoserver/gwc/service/wmts?layer=your:layer&tilematrixset=EPSG:900913&Service=WMTS&Request=GetTile&Version=1.0.0&Format=image/png&TileMatrix=EPSG:900913:${zoom}&TileCol=${x}&TileRow=${y}`,
          },
        }, null, 2) }],
      };
    },
  );

  server.tool(
    "gis_geojson_to_leaflet",
    "Generate Leaflet/MapLibre HTML code to display GeoJSON data on an interactive map",
    {
      geojson: z.string().describe("GeoJSON object as JSON string"),
      center: z.string().optional().describe("Map center as 'lat,lng' (auto-calculated if omitted)"),
      zoom: z.number().min(0).max(20).optional().describe("Initial zoom (default: 13)"),
      popup_field: z.string().optional().describe("Property name to show in popups"),
    },
    async ({ geojson, center, zoom, popup_field }) => {
      const z = zoom || 13;
      const c = center ? `[${center.split(",").map(Number)}]` : undefined;

      return {
        content: [{ type: "text", text: `<!DOCTYPE html>
<html>
<head>
  <link rel="stylesheet" href="https://unpkg.com/leaflet@1.9/dist/leaflet.css" />
  <script src="https://unpkg.com/leaflet@1.9/dist/leaflet.js"></script>
  <style>#map { height: 100vh; }</style>
</head>
<body>
  <div id="map"></div>
  <script>
    const map = L.map('map').setView(${c || "geoJSON.getBounds().getCenter()"}, ${z});
    L.tileLayer('https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png', {
      attribution: '&copy; OpenStreetMap contributors'
    }).addTo(map);
    const geoJSON = ${geojson};
    L.geoJSON(geoJSON, {
      style: { color: '#3388ff', weight: 2, opacity: 0.7 },
      ${popup_field ? `onEachFeature: (f, l) => l.bindPopup(f.properties.${popup_field}),` : ""}
    }).addTo(map);
    map.fitBounds(L.geoJSON(geoJSON).getBounds());
  </script>
</body>
</html>` }],
      };
    },
  );

  server.tool(
    "gis_map_server_url",
    "Generate map server tile URLs for different providers (OSM, Mapbox, CartoDB, GeoServer)",
    {
      provider: z.enum(["osm", "mapbox", "cartodb", "geoserver"]).describe("Tile provider"),
      style: z.string().optional().describe("Mapbox style name or GeoServer layer name"),
      token: z.string().optional().describe("Access token for Mapbox"),
      geoserver_url: z.string().optional().describe("GeoServer base URL"),
    },
    async ({ provider, style, token, geoserver_url }) => {
      const urls: Record<string, string> = {
        osm: "https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png",
        cartodb: "https://{s}.basemaps.cartocdn.com/light_all/{z}/{x}/{y}{r}.png",
        mapbox: `https://api.mapbox.com/styles/v1/${style || "mapbox/streets-v11"}/tiles/{z}/{x}/{y}?access_token=${token || "YOUR_TOKEN"}`,
        geoserver: `${geoserver_url || "http://localhost:8080/geoserver"}/gwc/service/wmts?layer=${style || "your:layer"}&tilematrixset=EPSG:900913&Service=WMTS&Request=GetTile&Version=1.0.0&Format=image/png&TileMatrix=EPSG:900913:{z}&TileCol={x}&TileRow={y}`,
      };
      return { content: [{ type: "text", text: urls[provider] }] };
    },
  );

  server.tool(
    "gis_vietnam_provinces",
    "List Vietnam provinces by region. Useful for map-exploration-app administrative lookups.",
    {
      format: z.enum(["list", "geojson"]).optional().describe("Output format (default: list)"),
      region: z.enum(["north", "central", "south", "mekong"]).optional().describe("Filter by region"),
    },
    async ({ format, region }) => {
      const provinces: Record<string, string[]> = {
        north: ["Hà Nội", "Hải Phòng", "Quảng Ninh", "Lạng Sơn", "Cao Bằng", "Bắc Giang", "Bắc Ninh", "Thái Nguyên", "Phú Thọ", "Vĩnh Phúc", "Hà Nam", "Nam Định", "Thái Bình", "Hưng Yên", "Hải Dương", "Ninh Bình", "Hà Giang", "Tuyên Quang", "Lào Cai", "Yên Bái", "Điện Biên", "Lai Châu", "Sơn La", "Hòa Bình"],
        central: ["Thanh Hóa", "Nghệ An", "Hà Tĩnh", "Quảng Bình", "Quảng Trị", "Thừa Thiên Huế", "Đà Nẵng", "Quảng Nam", "Quảng Ngãi", "Bình Định", "Phú Yên", "Khánh Hòa", "Ninh Thuận", "Bình Thuận", "Kon Tum", "Gia Lai", "Đắk Lắk", "Đắk Nông", "Lâm Đồng"],
        south: ["TP Hồ Chí Minh", "Đồng Nai", "Bình Dương", "Bà Rịa - Vũng Tàu", "Tây Ninh", "Bình Phước"],
        mekong: ["Cần Thơ", "Long An", "Tiền Giang", "Bến Tre", "Vĩnh Long", "Trà Vinh", "Đồng Tháp", "An Giang", "Kiên Giang", "Hậu Giang", "Sóc Trăng", "Bạc Liêu", "Cà Mau"],
      };

      const filtered = region ? provinces[region] : Object.values(provinces).flat();

      if (format === "geojson") {
        return { content: [{ type: "text", text: `GeoJSON generation for ${filtered.length} provinces — each province needs coordinates via gis_geocode.` }] };
      }
      return { content: [{ type: "text", text: JSON.stringify(filtered, null, 2) }] };
    },
  );
}
