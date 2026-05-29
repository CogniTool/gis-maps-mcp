# 🗺️ GIS Maps MCP Server

**MCP Server cho GIS và bản đồ chuyên sâu** — geocoding, phân tích không gian, tra cứu hành chính Việt Nam, tile maps, xuất Leaflet. Dành cho developer GIS, logistic, và map-exploration apps.

[![MCP](https://img.shields.io/badge/MCP-Protocol-black)](https://modelcontextprotocol.io)
[![TypeScript](https://img.shields.io/badge/TypeScript-5.6-blue)](https://www.typescriptlang.org)
[![License: MIT](https://img.shields.io/badge/License-MIT-yellow.svg)](LICENSE)

---

## 🎯 Vấn đề & Giải pháp

### 🔴 Vấn đề

Làm việc với dữ liệu bản đồ và GIS, bạn gặp:

- **AI không hiểu tọa độ** — không AI agent nào có thể đổi "chợ Bến Thành" thành tọa độ, hay xác định địa chỉ từ lat/lng
- **Phân tích không gian phức tạp** — tính khoảng cách, kiểm tra điểm trong polygon cần QGIS / PostGIS / code thủ công
- **Hành chính Việt Nam 3 cấp** — 63 tỉnh, 700+ huyện, 11,000+ xã — không tra cứu được từ tọa độ
- **Tile maps rối rắm** — mỗi provider (OSM, Mapbox, GeoServer) có URL format khác nhau, phải Google mỗi lần
- **Xuất bản đồ thủ công** — muốn hiển thị GeoJSON lên Leaflet phải viết HTML/JS từ đầu mỗi lần

### 🟢 Giải pháp

GIS Maps MCP Server biến AI assistant thành **chuyên gia GIS cá nhân**:

| Trước | Sau |
|---|---|
| Google "tọa độ chợ Bến Thành" → copy/paste 😫 | `"Geocode chợ Bến Thành, HCM"` → lat/lng chính xác ✅ |
| Mở QGIS, import polygon, check point-in-polygon 😩 | `"Điểm (10.77, 106.69) có nằm trong quận 1 không?"` → yes/no ✅ |
| Mở bảng tra 63 tỉnh, tra tiếp huyện/xã 😤 | `"Tọa độ này thuộc tỉnh/huyện/xã nào?"` → full hierarchy ✅ |
| Google "osm tile url format" lần thứ 100 😮‍💨 | `"Tile URL cho OSM ở zoom 14, tile (12345, 6789)"` → URL ngay ✅ |
| Viết HTML Leaflet từ đầu mỗi khi muốn xem GeoJSON 😵‍💫 | `"Tạo map hiển thị GeoJSON này"` → full HTML page ✅ |

---

## 🧰 Tools (10 công cụ)

### 📍 Geocoding

| Tool | Mô tả |
|---|---|
| `gis_geocode` | Chuyển địa chỉ → tọa độ (forward geocoding). Hỗ trợ Vietnam + toàn cầu. |
| `gis_reverse_geocode` | Chuyển tọa độ → địa chỉ (reverse geocoding). Trả về full address components. |

### 📐 Spatial Analysis

| Tool | Mô tả |
|---|---|
| `calculate_distance` | Tính khoảng cách Haversine giữa 2 điểm — km, miles, meters. Độ chính xác ~0.5%. |
| `point_in_polygon` | Kiểm tra điểm có nằm trong polygon không — geofencing, vùng giao hàng. |
| `bounding_box` | Tính bounding box cho tập tọa độ — min/max lat/lng, tâm điểm. |

### 🇻🇳 Vietnam Admin

| Tool | Mô tả |
|---|---|
| `vietnam_admin_lookup` | Tra cứu tỉnh/huyện/xã từ tọa độ. Reverse geocode → admin hierarchy Việt Nam. |
| `gis_vietnam_provinces` | Danh sách 63 tỉnh thành theo vùng: Bắc, Trung, Nam, Mekong. |

### 🗺️ Map Tiles & Visualization

| Tool | Mô tả |
|---|---|
| `gis_xyz_tile` | Tính tọa độ tile XYZ từ lat/lng/zoom. Trả URL OSM + CartoDB + GeoServer. |
| `gis_map_server_url` | Sinh tile URL template cho OSM, Mapbox, CartoDB, GeoServer. |
| `gis_geojson_to_leaflet` | Tạo full HTML page Leaflet hiển thị GeoJSON — popup, style, fitBounds. |

---

## 📦 Cài đặt

### Cách 1: npx (khuyên dùng)

```bash
npx @cognitool/gis-maps-mcp
```

Thêm vào config MCP client của bạn:

```json
{
  "mcpServers": {
    "gis-maps": {
      "command": "npx",
      "args": ["@cognitool/gis-maps-mcp"]
    }
  }
}
```

### Cách 2: Manual

```bash
git clone git@github.com:CogniTool/gis-maps-mcp.git
cd gis-maps-mcp
npm install
npm run build
npm start
```

---

## ⚙️ Cấu hình

### Claude Desktop / Cursor

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

### Hermes Agent

```bash
hermes mcp add gis-maps --command "node /path/to/gis-maps-mcp/dist/index.js"
```

---

## 🏗️ Architecture

```
src/
├── index.ts              # MCP server entry point — stdio transport
├── tools/
│   ├── geocoding.ts      # gis_geocode + gis_reverse_geocode (Nominatim API)
│   ├── spatial.ts        # calculate_distance, point_in_polygon, bounding_box (Haversine)
│   ├── admin.ts          # vietnam_admin_lookup (VN admin hierarchy)
│   ├── maps.ts           # gis_xyz_tile, gis_geojson_to_leaflet, gis_map_server_url, gis_vietnam_provinces
├── utils/
│   └── http.ts           # Shared HTTP client with descriptive User-Agent
└── types/
    └── index.ts          # TypeScript type definitions
```

---

## 🗺️ Roadmap

- [ ] PostGIS integration — query spatial DB trực tiếp
- [ ] GeoServer WMS/WMTS layer discovery tự động
- [ ] Vietnam GeoJSON boundaries bundle (tỉnh/huyện/xã)
- [ ] Heatmap generation từ tập tọa độ
- [ ] Isochrone / driving distance (OSRM/GraphHopper)
- [ ] MapLibre GL JS output (thay thế Leaflet)
- [ ] MBTiles / PMTiles support cho offline maps

---

## 🛠 Tech Stack

| Layer | Công nghệ |
|---|---|
| Runtime | Node.js 22+ |
| Language | TypeScript 5.6 (strict) |
| Protocol | MCP SDK 1.12+ |
| Validation | Zod 3.23 |
| Geocoding | OpenStreetMap Nominatim (free, no API key) |
| Spatial | Haversine formula, Ray casting algorithm |
| Tiles | OSM, Mapbox, CartoDB, GeoServer compatible |

---

## 📄 License

MIT © 2025 [CogniTool](https://github.com/CogniTool)
