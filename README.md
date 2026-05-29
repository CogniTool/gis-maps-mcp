# 🗺️ GIS & Maps MCP Server

**MCP Server cho spatial data & bản đồ** — geocoding, PostGIS spatial queries, GeoJSON, tile coordinates, Vietnam provinces. Tối ưu cho GIS developers và map-exploration-app.

[![MCP](https://img.shields.io/badge/MCP-Protocol-black)](https://modelcontextprotocol.io)
[![TypeScript](https://img.shields.io/badge/TypeScript-5.6-blue)](https://www.typescriptlang.org)
[![License: MIT](https://img.shields.io/badge/License-MIT-yellow.svg)](LICENSE)

---

## 🎯 Vấn đề & Giải pháp

### 🔴 Vấn đề

Làm việc với GIS và bản đồ, bạn gặp:

- **Geocoding thủ công** — mở Google Maps, copy-paste tọa độ, mất thời gian
- **Tính distance bằng tay** — Haversine formula mỗi lần check khoảng cách giữa 2 điểm
- **Viết PostGIS SQL nhức đầu** — `ST_DWithin`, `ST_Intersects`, `ST_Buffer` syntax dài dòng
- **Tile system phức tạp** — không ai nhớ nổi công thức XYZ tile từ lat/lng/zoom
- **Không có dữ liệu Vietnam provinces sẵn** — mỗi lần cần lại phải tìm/shapefile/import

### 🟢 Giải pháp

GIS Maps MCP Server biến AI thành **GIS analyst**:

| Trước | Sau |
|---|---|
| Mở Google Maps, click phải, copy lat/lng 😫 | `"Geocode Quận 1, TP HCM"` → tọa độ chính xác ✅ |
| Tính tay Haversine 😩 | `"Khoảng cách Hà Nội → Sài Gòn?"` → km + miles tự động ✅ |
| Viết PostGIS SQL 5 dòng 😤 | `"Tìm tất cả điểm trong 5km từ (21.02, 105.83)"` → SQL chuẩn ✅ |
| Code Leaflet từ đầu 😮‍💨 | `"Tạo Leaflet map từ GeoJSON này"` → code snippet hoàn chỉnh ✅ |
| Copy-paste tile URL từ docs 😵‍💫 | `"Tile URL từ 21.0285, 105.8542 zoom 14"` → URL đầy đủ ✅ |

---

## 🧰 Tools (11 công cụ)

### 📍 Geocoding

| Tool | Mô tả |
|---|---|
| `gis_geocode` | Chuyển địa chỉ → tọa độ (Nominatim). Hỗ trợ tiếng Việt, phường, quận, tỉnh |
| `gis_reverse_geocode` | Chuyển tọa độ → địa chỉ |
| `gis_search_places` | Tìm POI, địa điểm xung quanh (nhà hàng, ATM, bệnh viện...) |

### 📐 Spatial Analysis

| Tool | Mô tả |
|---|---|
| `gis_distance` | Tính khoảng cách Haversine giữa 2 điểm (m/km/miles) |
| `gis_bbox` | Tính bounding box từ center + radius |
| `gis_geojson_validate` | Validate GeoJSON, phân tích geometry (type, vertices, polygons) |
| `gis_postgis_query` | Sinh PostGIS SQL: ST_DWithin, ST_Intersects, ST_Buffer, ST_Distance, KNN |

### 🗺️ Map Tools

| Tool | Mô tả |
|---|---|
| `gis_xyz_tile` | Tính XYZ tile coordinates → tile URLs cho OSM, Mapbox, GeoServer |
| `gis_geojson_to_leaflet` | Sinh Leaflet.js code hiển thị GeoJSON trên bản đồ tương tác |
| `gis_map_server_url` | Generate tile URL cho các provider (OSM, Mapbox, CartoDB, GeoServer) |
| `gis_vietnam_provinces` | Danh sách 63 tỉnh thành VN phân theo vùng, hỗ trợ GeoJSON |

---

## 📦 Cài đặt

### Cách 1: Smithery

```bash
npx -y @smithery/cli@latest install @mcp-marketplace/gis-maps
```

### Cách 2: Manual

```bash
git clone <repo-url>
cd gis-maps
npm install
npm run build
```

---

## ⚙️ Cấu hình

### Claude Desktop / Cursor

```json
{
  "mcpServers": {
    "gis-maps": {
      "command": "node",
      "args": ["/path/to/gis-maps/dist/index.js"]
    }
  }
}
```

### Hermes Agent

```bash
hermes mcp add gis-maps --command "node /path/to/gis-maps/dist/index.js"
```

---

## 🌏 Dùng với map-exploration-app

GIS Maps MCP Server tích hợp trực tiếp với [map-exploration-app](https://github.com/phongnd93/map-exploration-app):

```typescript
// Frontend query: "Tìm tất cả điểm du lịch trong 10km từ Hà Nội"
// → gis_geocode "Hà Nội" → (21.0285, 105.8542)
// → gis_postgis_query st_dwithin, distance=10000
// → SELECT * FROM pois WHERE ST_DWithin(geom::geography, ...)

// Render map tiles:
// → gis_xyz_tile for current viewport
// → gis_map_server_url geoserver + custom layer
```

---

## 🗺️ Roadmap

- [ ] Tích hợp GeoServer REST API (publish layers, edit styles)
- [ ] Tile server integration (mbtiles, pmtiles)
- [ ] Load Vietnam shapefile/geojson trực tiếp từ OSM
- [ ] Cluster analysis (ST_ClusterDBSCAN)
- [ ] Route tìm đường (OSRM)
- [ ] Elevation profile từ DEM data
- [ ] Export ra MapLibre GL JS styles

---

## 🛠 Tech Stack

| Layer | Công nghệ |
|---|---|
| Runtime | Node.js 22+ |
| Language | TypeScript 5.6 (strict) |
| Protocol | MCP SDK 1.12+ |
| Geocoding | Nominatim (OpenStreetMap) |
| Validation | Zod 3.23 |

---

## 📄 License

MIT © 2025 [phongnd93](https://github.com/phongnd93)
