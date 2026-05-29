const NOMINATIM_BASE = "https://nominatim.openstreetmap.org";
export const geocodingTools = [
    {
        name: "gis_geocode",
        description: "Convert address/place name to coordinates (forward geocoding via Nominatim). For Vietnam, supports Vietnamese addresses, wards, districts, provinces.",
        inputSchema: {
            type: "object",
            properties: {
                address: { type: "string", description: "Address or place name (e.g. 'Ho Chi Minh City', 'Quận 1, TP HCM')" },
                country: { type: "string", description: "Country code filter (e.g. 'vn' for Vietnam)" },
                limit: { type: "number", description: "Max results (default: 5)" },
            },
            required: ["address"],
        },
        handler: async (args) => {
            const addr = encodeURIComponent(args.address);
            const country = args.country ? `&countrycodes=${args.country}` : "";
            const limit = `&limit=${args.limit || 5}`;
            const url = `${NOMINATIM_BASE}/search?q=${addr}${country}${limit}&format=json`;
            try {
                const resp = await fetch(url, { headers: { "User-Agent": "MCP-GIS-Maps/0.1.0" } });
                const data = await resp.json();
                const results = data.map((r) => ({
                    display_name: r.display_name,
                    lat: parseFloat(r.lat),
                    lon: parseFloat(r.lon),
                    type: r.type,
                    importance: r.importance,
                }));
                return { content: [{ type: "text", text: JSON.stringify(results, null, 2) }] };
            }
            catch {
                return { content: [{ type: "text", text: `Geocoding failed. URL: ${url}` }] };
            }
        },
    },
    {
        name: "gis_reverse_geocode",
        description: "Convert coordinates to address (reverse geocoding via Nominatim)",
        inputSchema: {
            type: "object",
            properties: {
                lat: { type: "number", description: "Latitude" },
                lng: { type: "number", description: "Longitude" },
                zoom: { type: "number", description: "Detail level 1-18 (default: 14)" },
            },
            required: ["lat", "lng"],
        },
        handler: async (args) => {
            const url = `${NOMINATIM_BASE}/reverse?lat=${args.lat}&lon=${args.lng}&format=json&zoom=${args.zoom || 14}`;
            try {
                const resp = await fetch(url, { headers: { "User-Agent": "MCP-GIS-Maps/0.1.0" } });
                const data = await resp.json();
                return { content: [{ type: "text", text: data.display_name || JSON.stringify(data) }] };
            }
            catch {
                return { content: [{ type: "text", text: "Reverse geocoding failed" }] };
            }
        },
    },
    {
        name: "gis_search_places",
        description: "Search for POIs, landmarks, businesses near a location",
        inputSchema: {
            type: "object",
            properties: {
                query: { type: "string", description: "Search term (e.g. 'restaurant', 'hospital', 'ATM')" },
                lat: { type: "number", description: "Center latitude" },
                lng: { type: "number", description: "Center longitude" },
                radius_m: { type: "number", description: "Search radius in meters (default: 1000)" },
                limit: { type: "number", description: "Max results (default: 10)" },
            },
            required: ["query"],
        },
        handler: async (args) => {
            const q = encodeURIComponent(args.query);
            const lat = args.lat ? `&lat=${args.lat}&lon=${args.lng}` : "";
            const limit = args.limit || 10;
            const url = `${NOMINATIM_BASE}/search?q=${q}${lat}&limit=${limit}&format=json`;
            try {
                const resp = await fetch(url, { headers: { "User-Agent": "MCP-GIS-Maps/0.1.0" } });
                const data = await resp.json();
                return { content: [{ type: "text", text: JSON.stringify(data.slice(0, limit).map((r) => r.display_name), null, 2) }] };
            }
            catch {
                return { content: [{ type: "text", text: "Search failed" }] };
            }
        },
    },
];
//# sourceMappingURL=geocoding.js.map