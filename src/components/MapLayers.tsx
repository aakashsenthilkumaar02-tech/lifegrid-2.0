/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import { useMap, useMapsLibrary } from '@vis.gl/react-google-maps';
import { useEffect } from 'react';
import { DependencyLink, HazardPolygon, InfrastructureAsset } from '../types/lifegrid';

interface MapLayersProps {
  assets: InfrastructureAsset[];
  dependencies: DependencyLink[];
  hazardPolygons: HazardPolygon[];
  showDependencies: boolean;
  showHazards: boolean;
  selectedAssetId: string | null;
  onSelectAsset: (assetId: string) => void;
}

export function MapLayers({
  assets,
  dependencies,
  hazardPolygons,
  showDependencies,
  showHazards,
  selectedAssetId,
}: MapLayersProps) {
  const map = useMap();
  const mapsLib = useMapsLibrary('maps');

  // Render Polylines for dependencies
  useEffect(() => {
    if (!map || !mapsLib || !showDependencies) return;

    const assetMap = new Map(assets.map((a) => [a.id, a]));
    const polylineInstances: google.maps.Polyline[] = [];

    dependencies.forEach((dep) => {
      const src = assetMap.get(dep.source);
      const tgt = assetMap.get(dep.target);
      if (!src || !tgt) return;

      const isSrcAffected = src.disruption > 0.05;
      const isTgtAffected = tgt.disruption > 0.05;
      const isCascadeActive = isSrcAffected && isTgtAffected;

      const isSelected = selectedAssetId === dep.source || selectedAssetId === dep.target;

      let strokeColor = '#475569'; // default slate-600
      let strokeOpacity = 0.4;
      let strokeWeight = 2;

      if (isCascadeActive) {
        strokeColor = '#ef4444'; // active failure cascade line
        strokeOpacity = 0.9;
        strokeWeight = 3;
      } else if (tgt.status === 'intervention') {
        strokeColor = '#38bdf8'; // sky blue
        strokeOpacity = 0.8;
        strokeWeight = 2.5;
      } else if (isSelected) {
        strokeColor = '#f59e0b'; // amber
        strokeOpacity = 1.0;
        strokeWeight = 3.5;
      }

      const polyline = new google.maps.Polyline({
        path: [
          { lat: src.lat, lng: src.lon },
          { lat: tgt.lat, lng: tgt.lon },
        ],
        geodesic: true,
        strokeColor,
        strokeOpacity,
        strokeWeight,
        map,
        icons: [
          {
            icon: {
              path: google.maps.SymbolPath.FORWARD_CLOSED_ARROW,
              scale: isCascadeActive || isSelected ? 3 : 2,
              strokeColor,
              fillColor: strokeColor,
              fillOpacity: 1,
            },
            offset: '75%',
          },
        ],
      });

      polylineInstances.push(polyline);
    });

    return () => {
      polylineInstances.forEach((p) => p.setMap(null));
    };
  }, [map, mapsLib, assets, dependencies, showDependencies, selectedAssetId]);

  // Render Hazard Polygons
  useEffect(() => {
    if (!map || !mapsLib || !showHazards) return;

    const polygonInstances: google.maps.Polygon[] = [];

    hazardPolygons.forEach((hazard) => {
      const paths = hazard.coordinates.map(([lat, lng]) => ({ lat, lng }));

      const polygon = new google.maps.Polygon({
        paths,
        strokeColor: hazard.type === 'flood' ? '#06b6d4' : '#3b82f6',
        strokeOpacity: 0.8,
        strokeWeight: 2,
        fillColor: hazard.type === 'flood' ? '#0891b2' : '#2563eb',
        fillOpacity: 0.18,
        map,
      });

      polygonInstances.push(polygon);
    });

    return () => {
      polygonInstances.forEach((p) => p.setMap(null));
    };
  }, [map, mapsLib, hazardPolygons, showHazards]);

  return null;
}
