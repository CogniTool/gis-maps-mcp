import type { ToolDefinition } from "../types.js";

export const mapTools: ToolDefinition[] = [
  {
    name: "gis_xyz_tile",
    description: "Calculate XYZ tile coordinates from lat/lng/zoom (for OSM, Mapbox, GeoServer tile URLs)",
    inputSchema: {
      type: "object",
      properties: {
        lat: { type: "number", description: "Latitude" },
        lng: { type: "number", description: "Longitude" },
        zoom: { type: "number", description: "Zoom level" },
      },
      required: ["lat", "lng", "zoom"],
    },
    handler: async (args) => {
      const lat = args.lat as number;
      const lng = args.lng as number;
      const zoom = args.zoom as number;
      
      const n = Math.pow(2, zoom);
      const x = Math.floor((lng + 180) / 360 * n);
      const latRad = lat * Math.PI / 180;
      const y = Math.floor((1 - Math.log(Math.tan(latRad) + 1 / Math.cos(latRad)) / Math.PI) / 2 * n);
      
      return {
        content: [{ type: "text", text: JSON.stringify({
          x, y, zoom,
          tile_urls: {
            osm: `https://tile.openstreetmap.org/${zoom}/${x}/${y}.png`,
            mapbox: `https://api.mapbox.com/styles/v1/mapbox/streets-v11/tiles/${zoom}/${x}/${y}?access_token=YOUR_TOKEN`,
            geoserver: `http://localhost:8080/geoserver/gwc/service/wmts?layer=your:layer&tilematrixset=EPSG:900913&Service=WMTS&Request=GetTile&Version=1.0.0&Format=image/png&TileMatrix=EPSG:900913:${zoom}&TileCol=${x}&TileRow=${y}`,
          },
        }, null, 2) }],
      };
    },
  },
  {
    name: "gis_geojson_to_leaflet",
    description: "Generate Leaflet/MapLibre code to display GeoJSON data on an interactive map",
    inputSchema: {
      type: "object",
      properties: {
        geojson: { type: "string", description: "GeoJSON object as JSON string" },
        center: { type: "string", description: "Map center as 'lat,lng' (optional, auto-calculated)" },
        zoom: { type: "number", description: "Initial zoom (default: 13)" },
        popup_field: { type: "string", description: "Property to show in popups" },
      },
      required: ["geojson"],
    },
    handler: async (args) => {
      const geojson = args.geojson as string;
      const center = args.center ? `center: [${(args.center as string).split(",").map(Number)}]` : "// auto-detect from GeoJSON";
      const zoom = args.zoom || 13;
      
      return {
        content: [{ type: "text", text: `// Leaflet.js code snippet
// Include: <link rel="stylesheet" href="https://unpkg.com/leaflet@1.9/dist/leaflet.css" />
// <script src="https://unpkg.com/leaflet@1.9/dist/leaflet.js"></script>

const map = L.map('map').setView(${center}, ${zoom});

L.tileLayer('https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png', {
  attribution: '&copy; OpenStreetMap contributors'
}).addTo(map);

const data = ${geojson};

L.geoJSON(data, {
  style: { color: '#3388ff', weight: 2, opacity: 0.7 },
  ${args.popup_field ? `onEachFeature: (f, l) => l.bindPopup(f.properties.${args.popup_field}),` : ""}
}).addTo(map);

map.fitBounds(L.geoJSON(data).getBounds());`,
        }],
      };
    },
  },
  {
    name: "gis_map_server_url",
    description: "Generate map server tile URLs for different providers (OSM, Mapbox, GeoServer, Google Maps, CartoDB)",
    inputSchema: {
      type: "object",
      properties: {
        provider: { type: "string", description: "osm | mapbox | cartodb | geoserver" },
        style: { type: "string", description: "Mapbox style or GeoServer layer name" },
        token: { type: "string", description: "Mapbox/Google access token" },
        geoserver_url: { type: "string", description: "GeoServer base URL (default: http://localhost:8080/geoserver)" },
      },
      required: ["provider"],
    },
    handler: async (args) => {
      const provider = args.provider as string;
      const urls: Record<string, string> = {
        osm: "https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png",
        cartodb: "https://{s}.basemaps.cartocdn.com/light_all/{z}/{x}/{y}{r}.png",
        mapbox: `https://api.mapbox.com/styles/v1/${args.style || "mapbox/streets-v11"}/tiles/{z}/{x}/{y}?access_token=${args.token || "YOUR_TOKEN"}`,
        geoserver: `${args.geoserver_url || "http://localhost:8080/geoserver"}/gwc/service/wmts?layer=${args.style || "your:layer"}&tilematrixset=EPSG:900913&Service=WMTS&Request=GetTile&Version=1.0.0&Format=image/png&TileMatrix=EPSG:900913:{z}&TileCol={x}&TileRow={y}`,
      };
      return { content: [{ type: "text", text: urls[provider] || `Unknown provider: ${provider}` }] };
    },
  },
  {
    name: "gis_vietnam_provinces",
    description: "Generate GeoJSON for Vietnam provinces/administrative boundaries. Useful for map-exploration-app.",
    inputSchema: {
      type: "object",
      properties: {
        format: { type: "string", description: "Output format: geojson | topojson | list (default: list)" },
        region: { type: "string", description: "Filter by region: north | central | south | mekong" },
      },
    },
    handler: async (args) => {
      const format = (args.format as string) || "list";
      const region = args.region as string;
      
      const provinces: Record<string, string[]> = {
        north: ["Hà Nội", "Hải Phòng", "Quảng Ninh", "Lạng Sơn", "Cao Bằng", "Bắc Giang", "Bắc Ninh", "Thái Nguyên", "Phú Thọ", "Vĩnh Phúc", "Hà Nam", "Nam Định", "Thái Bình", "Hưng Yên", "Hải Dương", "Ninh Bình", "Hà Giang", "Tuyên Quang", "Lào Cai", "Yên Bái", "Điện Biên", "Lai Châu", "Sơn La", "Hòa Bình"],
        central: ["Thanh Hóa", "Nghệ An", "Hà Tĩnh", "Quảng Bình", "Quảng Trị", "Thừa Thiên Huế", "Đà Nẵng", "Quảng Nam", "Quảng Ngãi", "Bình Định", "Phú Yên", "Khánh Hòa", "Ninh Thuận", "Bình Thuận", "Kon Tum", "Gia Lai", "Đắk Lắk", "Đắk Nông", "Lâm Đồng"],
        south: ["TP Hồ Chí Minh", "Đồng Nai", "Bình Dương", "Bà Rịa - Vũng Tàu", "Tây Ninh", "Bình Phước"],
        mekong: ["Cần Thơ", "Long An", "Tiền Giang", "Bến Tre", "Vĩnh Long", "Trà Vinh", "Đồng Tháp", "An Giang", "Kiên Giang", "Hậu Giang", "Sóc Trăng", "Bạc Liêu", "Cà Mau"],
      };
      
      const filtered = region ? provinces[region] || Object.values(provinces).flat() : Object.values(provinces).flat();
      
      if (format === "list") {
        return { content: [{ type: "text", text: JSON.stringify(filtered, null, 2) }] };
      }
      return { content: [{ type: "text", text: `GeoJSON generation for ${filtered.length} provinces — use gis_geocode for individual coordinates.` }] };
    },
  },
];
