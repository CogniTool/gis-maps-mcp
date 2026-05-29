import { McpServer } from '@modelcontextprotocol/sdk/server/mcp.js';
import { z } from 'zod';
import type { Coordinate, DistanceResult, BoundingBoxResult, PointInPolygonResult } from '../types/index.js';

const EARTH_RADIUS_KM = 6371;

function toRadians(degrees: number): number {
  return (degrees * Math.PI) / 180;
}

function haversineDistance(from: Coordinate, to: Coordinate): number {
  const dLat = toRadians(to.lat - from.lat);
  const dLng = toRadians(to.lng - from.lng);
  const a =
    Math.sin(dLat / 2) * Math.sin(dLat / 2) +
    Math.cos(toRadians(from.lat)) *
      Math.cos(toRadians(to.lat)) *
      Math.sin(dLng / 2) *
      Math.sin(dLng / 2);
  const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));
  return EARTH_RADIUS_KM * c;
}

function pointInPolygon(point: Coordinate, polygon: Coordinate[]): boolean {
  let inside = false;
  for (let i = 0, j = polygon.length - 1; i < polygon.length; j = i++) {
    const xi = polygon[i].lng;
    const yi = polygon[i].lat;
    const xj = polygon[j].lng;
    const yj = polygon[j].lat;

    const intersect =
      yi > point.lat !== yj > point.lat &&
      point.lng < ((xj - xi) * (point.lat - yi)) / (yj - yi) + xi;

    if (intersect) inside = !inside;
  }
  return inside;
}

export function registerSpatialTools(server: McpServer): void {
  server.tool(
    'calculate_distance',
    'Calculate the great-circle distance between two geographic coordinates using the Haversine formula. Returns distance in kilometers, miles, and meters.',
    {
      lat1: z.number().min(-90).max(90).describe('Latitude of first point'),
      lng1: z.number().min(-180).max(180).describe('Longitude of first point'),
      lat2: z.number().min(-90).max(90).describe('Latitude of second point'),
      lng2: z.number().min(-180).max(180).describe('Longitude of second point'),
    },
    async ({ lat1, lng1, lat2, lng2 }) => {
      const from: Coordinate = { lat: lat1, lng: lng1 };
      const to: Coordinate = { lat: lat2, lng: lng2 };
      const distanceKm = haversineDistance(from, to);

      const result: DistanceResult = {
        distanceKm: Math.round(distanceKm * 1000) / 1000,
        distanceMiles: Math.round(distanceKm * 0.621371 * 1000) / 1000,
        distanceMeters: Math.round(distanceKm * 1000),
        from,
        to,
      };

      return {
        content: [{
          type: 'text' as const,
          text: JSON.stringify(result, null, 2),
        }],
      };
    }
  );

  server.tool(
    'point_in_polygon',
    'Check if a geographic point lies inside a polygon defined by an array of coordinates. Uses the ray casting algorithm. Useful for geofencing, district boundary checks, etc.',
    {
      lat: z.number().min(-90).max(90).describe('Latitude of the point to test'),
      lng: z.number().min(-180).max(180).describe('Longitude of the point to test'),
      polygon: z.array(z.object({
        lat: z.number(),
        lng: z.number(),
      })).min(3).describe('Array of polygon vertices (minimum 3 points, in order). Does not need to be closed.'),
    },
    async ({ lat, lng, polygon }) => {
      const point: Coordinate = { lat, lng };
      const isInside = pointInPolygon(point, polygon);

      const result: PointInPolygonResult = {
        isInside,
        point,
      };

      return {
        content: [{
          type: 'text' as const,
          text: JSON.stringify(result, null, 2),
        }],
      };
    }
  );

  server.tool(
    'bounding_box',
    'Calculate the bounding box (minimum and maximum latitude/longitude) for a set of geographic coordinates. Returns the bounding box extent, center point, and width/height.',
    {
      coordinates: z.array(z.object({
        lat: z.number(),
        lng: z.number(),
      })).min(1).describe('Array of coordinates to calculate bounding box for'),
    },
    async ({ coordinates }) => {
      let minLat = Infinity;
      let maxLat = -Infinity;
      let minLng = Infinity;
      let maxLng = -Infinity;

      for (const coord of coordinates) {
        minLat = Math.min(minLat, coord.lat);
        maxLat = Math.max(maxLat, coord.lat);
        minLng = Math.min(minLng, coord.lng);
        maxLng = Math.max(maxLng, coord.lng);
      }

      const center: Coordinate = {
        lat: (minLat + maxLat) / 2,
        lng: (minLng + maxLng) / 2,
      };

      const result: BoundingBoxResult = {
        minLat,
        maxLat,
        minLng,
        maxLng,
        center,
        width: haversineDistance({ lat: center.lat, lng: minLng }, { lat: center.lat, lng: maxLng }),
        height: haversineDistance({ lat: minLat, lng: center.lng }, { lat: maxLat, lng: center.lng }),
      };

      return {
        content: [{
          type: 'text' as const,
          text: JSON.stringify(result, null, 2),
        }],
      };
    }
  );
}
