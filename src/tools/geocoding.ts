import { McpServer } from '@modelcontextprotocol/sdk/server/mcp.js';
import { z } from 'zod';
import { httpRequest } from '../utils/http.js';
import type { GeocodeResult, ReverseGeocodeResult } from '../types/index.js';

interface NominatimResult {
  display_name: string;
  lat: string;
  lon: string;
  type: string;
  importance: number;
  boundingbox?: string[];
  address?: Record<string, string>;
}

const NOMINATIM_BASE = 'https://nominatim.openstreetmap.org';

export function registerGeocodingTools(server: McpServer): void {
  server.tool(
    'geocode',
    'Convert an address or place name to geographic coordinates (latitude/longitude) using OpenStreetMap Nominatim. Supports global coverage with no API key required.',
    {
      query: z.string().describe('Address or place name to geocode (e.g., "Hanoi, Vietnam", "Ho Chi Minh City")'),
      country: z.string().optional().describe('Limit search to specific country code (e.g., "vn" for Vietnam)'),
      limit: z.number().int().min(1).max(10).optional().default(3).describe('Maximum number of results (1-10)'),
      language: z.string().optional().describe('Preferred language for results (e.g., "vi" for Vietnamese, "en" for English)'),
    },
    async ({ query, country, limit, language }) => {
      try {
        const params = new URLSearchParams({
          q: query,
          format: 'json',
          limit: String(limit),
          addressdetails: '1',
        });

        if (country) params.set('countrycodes', country);
        if (language) params.set('accept-language', language);

        const url = `${NOMINATIM_BASE}/search?${params}`;
        const results = await httpRequest<NominatimResult[]>(url);

        if (!results || results.length === 0) {
          return {
            content: [{
              type: 'text' as const,
              text: JSON.stringify({ error: `No results found for "${query}"` }, null, 2),
            }],
          };
        }

        const formatted: GeocodeResult[] = results.map((r) => ({
          displayName: r.display_name,
          lat: parseFloat(r.lat),
          lng: parseFloat(r.lon),
          type: r.type,
          importance: r.importance,
          boundingBox: r.boundingbox
            ? [parseFloat(r.boundingbox[0]), parseFloat(r.boundingbox[1]), parseFloat(r.boundingbox[2]), parseFloat(r.boundingbox[3])]
            : undefined,
        }));

        return {
          content: [{
            type: 'text' as const,
            text: JSON.stringify({ query, results: formatted }, null, 2),
          }],
        };
      } catch (error) {
        return {
          content: [{
            type: 'text' as const,
            text: JSON.stringify({ error: `Geocoding failed: ${error instanceof Error ? error.message : String(error)}` }, null, 2),
          }],
          isError: true,
        };
      }
    }
  );

  server.tool(
    'reverse_geocode',
    'Convert geographic coordinates (latitude/longitude) to a human-readable address using OpenStreetMap Nominatim. Returns detailed address components including road, city, state, and country.',
    {
      lat: z.number().min(-90).max(90).describe('Latitude (-90 to 90)'),
      lng: z.number().min(-180).max(180).describe('Longitude (-180 to 180)'),
      language: z.string().optional().describe('Preferred language for results'),
      zoom: z.number().int().min(0).max(18).optional().default(18).describe('Detail level: 3=country, 10=city, 18=building'),
    },
    async ({ lat, lng, language, zoom }) => {
      try {
        const params = new URLSearchParams({
          lat: String(lat),
          lon: String(lng),
          format: 'json',
          addressdetails: '1',
          zoom: String(zoom),
        });

        if (language) params.set('accept-language', language);

        const url = `${NOMINATIM_BASE}/reverse?${params}`;
        const result = await httpRequest<NominatimResult>(url);

        if (!result || !result.display_name) {
          return {
            content: [{
              type: 'text' as const,
              text: JSON.stringify({ error: `No address found for coordinates (${lat}, ${lng})` }, null, 2),
            }],
          };
        }

        const formatted: ReverseGeocodeResult = {
          displayName: result.display_name,
          address: result.address || {},
          lat: parseFloat(result.lat),
          lng: parseFloat(result.lon),
        };

        return {
          content: [{
            type: 'text' as const,
            text: JSON.stringify(formatted, null, 2),
          }],
        };
      } catch (error) {
        return {
          content: [{
            type: 'text' as const,
            text: JSON.stringify({ error: `Reverse geocoding failed: ${error instanceof Error ? error.message : String(error)}` }, null, 2),
          }],
          isError: true,
        };
      }
    }
  );
}
