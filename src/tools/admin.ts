import { McpServer } from '@modelcontextprotocol/sdk/server/mcp.js';
import { z } from 'zod';
import { httpRequest } from '../utils/http.js';
import type { AdminLookupResult, Coordinate } from '../types/index.js';

const NOMINATIM_BASE = 'https://nominatim.openstreetmap.org';

interface NominatimReverseResult {
  display_name: string;
  lat: string;
  lon: string;
  address?: {
    state?: string;
    county?: string;
    city?: string;
    town?: string;
    village?: string;
    suburb?: string;
    quarter?: string;
    neighbourhood?: string;
    country_code?: string;
  };
}

export function registerAdminTools(server: McpServer): void {
  server.tool(
    'vietnam_admin_lookup',
    'Look up Vietnam administrative divisions (province/city, district, ward/commune) for a given coordinate. Uses reverse geocoding to identify the administrative hierarchy. Returns Vietnamese and English names when available.',
    {
      lat: z.number().min(8).max(24).describe('Latitude of the point in Vietnam (approximately 8-24°N)'),
      lng: z.number().min(102).max(110).describe('Longitude of the point in Vietnam (approximately 102-110°E)'),
    },
    async ({ lat, lng }) => {
      try {
        const coordinate: Coordinate = { lat, lng };

        const params = new URLSearchParams({
          lat: String(lat),
          lon: String(lng),
          format: 'json',
          addressdetails: '1',
          zoom: '18',
          'accept-language': 'vi,en',
        });

        const url = `${NOMINATIM_BASE}/reverse?${params}`;
        const result = await httpRequest<NominatimReverseResult>(url);

        if (!result || !result.address) {
          return {
            content: [{
              type: 'text' as const,
              text: JSON.stringify({ error: `No administrative data found for coordinates (${lat}, ${lng})` }, null, 2),
            }],
          };
        }

        const addr = result.address;

        const adminResult: AdminLookupResult = {
          province: addr.state || addr.city || null,
          district: addr.county || addr.town || null,
          ward: addr.village || addr.suburb || addr.quarter || addr.neighbourhood || null,
          provinceCode: null,
          districtCode: null,
          wardCode: null,
          coordinate,
        };

        return {
          content: [{
            type: 'text' as const,
            text: JSON.stringify({
              ...adminResult,
              displayName: result.display_name,
              note: 'Codes are null because Nominatim does not provide official Vietnam admin codes. Names are provided as-is from OpenStreetMap data.',
            }, null, 2),
          }],
        };
      } catch (error) {
        return {
          content: [{
            type: 'text' as const,
            text: JSON.stringify({ error: `Admin lookup failed: ${error instanceof Error ? error.message : String(error)}` }, null, 2),
          }],
          isError: true,
        };
      }
    }
  );
}
