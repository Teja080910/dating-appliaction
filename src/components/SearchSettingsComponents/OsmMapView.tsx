import React, { useCallback, useEffect, useMemo, useRef, useState } from 'react';
import {
  ActivityIndicator,
  Animated,
  Image,
  LayoutChangeEvent,
  PanResponder,
  StyleSheet,
  Text,
  TouchableOpacity,
  View,
} from 'react-native';
import Ionicons from 'react-native-vector-icons/Ionicons';

export interface MapRegion {
  latitude: number;
  longitude: number;
  latitudeDelta: number;
  longitudeDelta: number;
}

interface OsmMapViewProps {
  region: MapRegion;
  onRegionChangeComplete?: (region: MapRegion) => void;
  markerTitle?: string;
  markerColor?: string;
  isDark?: boolean;
}

const TILE_SIZE = 256;
const MIN_ZOOM = 3;
const MAX_ZOOM = 18;
const DEFAULT_ZOOM = 14;
const ATTRIBUTION = '© OpenStreetMap contributors';
// OpenStreetMap raster tiles need no API key, so the location picker works even
// when no Google Maps key has been configured for the native map component.
const tileUrl = (zoom: number, x: number, y: number) =>
  `https://tile.openstreetmap.org/${zoom}/${x}/${y}.png`;

const clamp = (value: number, min: number, max: number) =>
  Math.min(Math.max(value, min), max);

const wrapLongitude = (longitude: number) =>
  ((((longitude + 180) % 360) + 360) % 360) - 180;

const latLngToWorld = (latitude: number, longitude: number, zoom: number) => {
  const scale = TILE_SIZE * Math.pow(2, zoom);
  const sinLat = Math.sin((latitude * Math.PI) / 180);
  const x = ((longitude + 180) / 360) * scale;
  const y =
    (0.5 -
      Math.log((1 + sinLat) / (1 - sinLat)) / (4 * Math.PI)) *
    scale;
  return { x, y };
};

const worldToLatLng = (x: number, y: number, zoom: number) => {
  const scale = TILE_SIZE * Math.pow(2, zoom);
  const longitude = (x / scale) * 360 - 180;
  const n = Math.PI - (2 * Math.PI * y) / scale;
  const latitude =
    (180 / Math.PI) * Math.atan(0.5 * (Math.exp(n) - Math.exp(-n)));
  return { latitude, longitude };
};

const OsmMapView: React.FC<OsmMapViewProps> = ({
  region,
  onRegionChangeComplete,
  markerTitle,
  markerColor = '#7C3AED',
  isDark = false,
}) => {
  const [layout, setLayout] = useState({ width: 0, height: 0 });
  const [center, setCenter] = useState({
    latitude: region.latitude,
    longitude: region.longitude,
  });
  const [zoom, setZoom] = useState(DEFAULT_ZOOM);
  const [loadedTiles, setLoadedTiles] = useState(0);
  const [failedTiles, setFailedTiles] = useState(0);
  const [showLoading, setShowLoading] = useState(true);

  const pan = useRef(new Animated.ValueXY({ x: 0, y: 0 })).current;
  const panStartWorldRef = useRef({ x: 0, y: 0 });
  const stateRef = useRef({ center, zoom });
  const layoutRef = useRef(layout);
  const onRegionChangeRef = useRef(onRegionChangeComplete);

  useEffect(() => {
    stateRef.current = { center, zoom };
  }, [center, zoom]);

  useEffect(() => {
    layoutRef.current = layout;
  }, [layout]);

  useEffect(() => {
    onRegionChangeRef.current = onRegionChangeComplete;
  }, [onRegionChangeComplete]);

  // Keep the map in sync when the parent asks it to jump to a location
  // (for example when the user taps the "re-center" button).
  useEffect(() => {
    setCenter((previous) => {
      const unchanged =
        Math.abs(previous.latitude - region.latitude) < 1e-6 &&
        Math.abs(previous.longitude - region.longitude) < 1e-6;
      return unchanged
        ? previous
        : { latitude: region.latitude, longitude: region.longitude };
    });
  }, [region.latitude, region.longitude]);

  const buildRegion = useCallback(
    (latitude: number, longitude: number, nextZoom: number): MapRegion => {
      const { width, height } = layoutRef.current;
      const degreesPerTile = 360 / Math.pow(2, nextZoom);
      return {
        latitude,
        longitude,
        latitudeDelta:
          width > 0 && height > 0
            ? Math.max((height / TILE_SIZE) * degreesPerTile, 0.0001)
            : 0.05,
        longitudeDelta:
          width > 0 && height > 0
            ? Math.max((width / TILE_SIZE) * degreesPerTile, 0.0001)
            : 0.05,
      };
    },
    [],
  );

  const commitCenter = useCallback(
    (latitude: number, longitude: number, nextZoom: number) => {
      const nextLatitude = clamp(latitude, -85, 85);
      const nextLongitude = wrapLongitude(longitude);
      setCenter({ latitude: nextLatitude, longitude: nextLongitude });
      onRegionChangeRef.current?.(
        buildRegion(nextLatitude, nextLongitude, nextZoom),
      );
    },
    [buildRegion],
  );

  const commitCenterRef = useRef(commitCenter);
  useEffect(() => {
    commitCenterRef.current = commitCenter;
  }, [commitCenter]);

  const panResponder = useRef(
    PanResponder.create({
      onStartShouldSetPanResponder: () => true,
      onMoveShouldSetPanResponder: () => true,
      onPanResponderGrant: () => {
        const { center: currentCenter, zoom: currentZoom } = stateRef.current;
        panStartWorldRef.current = latLngToWorld(
          currentCenter.latitude,
          currentCenter.longitude,
          currentZoom,
        );
        pan.stopAnimation();
      },
      onPanResponderMove: (_event, gesture) => {
        pan.setValue({ x: gesture.dx, y: gesture.dy });
      },
      onPanResponderRelease: (_event, gesture) => {
        const { zoom: currentZoom } = stateRef.current;
        const start = panStartWorldRef.current;
        const next = worldToLatLng(
          start.x - gesture.dx,
          start.y - gesture.dy,
          currentZoom,
        );
        pan.setValue({ x: 0, y: 0 });
        commitCenterRef.current(next.latitude, next.longitude, currentZoom);
      },
      onPanResponderTerminate: () => {
        pan.setValue({ x: 0, y: 0 });
      },
      onPanResponderTerminationRequest: () => true,
    }),
  ).current;

  const handleLayout = useCallback((event: LayoutChangeEvent) => {
    const { width, height } = event.nativeEvent.layout;
    setLayout((previous) =>
      previous.width === width && previous.height === height
        ? previous
        : { width, height },
    );
  }, []);

  const tiles = useMemo(() => {
    if (layout.width === 0 || layout.height === 0) {
      return [];
    }

    const centerWorld = latLngToWorld(
      center.latitude,
      center.longitude,
      zoom,
    );
    const topLeft = {
      x: centerWorld.x - layout.width / 2,
      y: centerWorld.y - layout.height / 2,
    };
    const tileCount = Math.pow(2, zoom);

    const minX = Math.floor((topLeft.x - TILE_SIZE) / TILE_SIZE);
    const maxX = Math.floor(
      (topLeft.x + layout.width + TILE_SIZE) / TILE_SIZE,
    );
    const minY = Math.floor((topLeft.y - TILE_SIZE) / TILE_SIZE);
    const maxY = Math.floor(
      (topLeft.y + layout.height + TILE_SIZE) / TILE_SIZE,
    );

    const result: {
      key: string;
      uri: string;
      left: number;
      top: number;
    }[] = [];

    for (let x = minX; x <= maxX; x += 1) {
      for (let y = minY; y <= maxY; y += 1) {
        if (y < 0 || y >= tileCount) {
          continue;
        }
        const wrappedX = ((x % tileCount) + tileCount) % tileCount;
        result.push({
          key: `${zoom}/${x}/${y}`,
          uri: tileUrl(zoom, wrappedX, y),
          left: x * TILE_SIZE - topLeft.x,
          top: y * TILE_SIZE - topLeft.y,
        });
      }
    }

    return result;
  }, [center.latitude, center.longitude, layout.width, layout.height, zoom]);

  useEffect(() => {
    setLoadedTiles(0);
    setFailedTiles(0);
    setShowLoading(true);
    const timer = setTimeout(() => setShowLoading(false), 1500);
    return () => clearTimeout(timer);
  }, [tiles]);

  const handleTileLoad = useCallback(() => {
    setLoadedTiles((count) => count + 1);
    setShowLoading(false);
  }, []);

  const handleTileError = useCallback(() => {
    setFailedTiles((count) => count + 1);
  }, []);

  const zoomBy = useCallback(
    (delta: number) => {
      const nextZoom = clamp(zoom + delta, MIN_ZOOM, MAX_ZOOM);
      if (nextZoom === zoom) {
        return;
      }
      setZoom(nextZoom);
      commitCenter(center.latitude, center.longitude, nextZoom);
    },
    [center.latitude, center.longitude, commitCenter, zoom],
  );

  const mapFailed = !showLoading && loadedTiles === 0 && failedTiles > 0;

  return (
    <View
      style={[
        styles.container,
        { backgroundColor: isDark ? '#12101F' : '#E8E6DF' },
      ]}
      onLayout={handleLayout}
      {...panResponder.panHandlers}
    >
      <Animated.View
        style={[
          StyleSheet.absoluteFillObject,
          { transform: pan.getTranslateTransform() },
        ]}
      >
        {tiles.map((tile) => (
          <Image
            key={tile.key}
            source={{
              uri: tile.uri,
              headers: { 'User-Agent': 'AmaraApp/1.0 (location picker)' },
            }}
            style={[styles.tile, { left: tile.left, top: tile.top }]}
            onLoad={handleTileLoad}
            onError={handleTileError}
            fadeDuration={0}
          />
        ))}
      </Animated.View>

      {showLoading && (
        <View pointerEvents="none" style={styles.statusOverlay}>
          <ActivityIndicator size="small" color={markerColor} />
          <Text style={styles.statusText}>Loading map…</Text>
        </View>
      )}

      {mapFailed && (
        <View pointerEvents="none" style={styles.statusOverlay}>
          <Ionicons name="cloud-offline-outline" size={30} color="#8E8E93" />
          <Text style={styles.statusText}>
            Map tiles unavailable. Your selected location is shown below.
          </Text>
        </View>
      )}

      {!!markerTitle && (
        <View pointerEvents="none" style={styles.markerLabelWrap}>
          <View style={[styles.markerLabel, { borderColor: markerColor }]}>
            <Text style={styles.markerLabelText} numberOfLines={1}>
              {markerTitle}
            </Text>
          </View>
        </View>
      )}

      <View pointerEvents="none" style={styles.pinWrap}>
        <Ionicons name="location-sharp" size={44} color={markerColor} />
      </View>

      <View style={styles.zoomControls}>
        <TouchableOpacity
          style={styles.zoomButton}
          onPress={() => zoomBy(1)}
          activeOpacity={0.75}
          accessibilityLabel="Zoom in"
        >
          <Ionicons name="add" size={22} color="#1F2937" />
        </TouchableOpacity>
        <View style={styles.zoomDivider} />
        <TouchableOpacity
          style={styles.zoomButton}
          onPress={() => zoomBy(-1)}
          activeOpacity={0.75}
          accessibilityLabel="Zoom out"
        >
          <Ionicons name="remove" size={22} color="#1F2937" />
        </TouchableOpacity>
      </View>

      <View pointerEvents="none" style={styles.attribution}>
        <Text style={styles.attributionText}>{ATTRIBUTION}</Text>
      </View>
    </View>
  );
};

export default OsmMapView;

const styles = StyleSheet.create({
  container: {
    flex: 1,
    overflow: 'hidden',
  },
  tile: {
    position: 'absolute',
    width: TILE_SIZE,
    height: TILE_SIZE,
  },
  statusOverlay: {
    ...StyleSheet.absoluteFillObject,
    alignItems: 'center',
    justifyContent: 'center',
    paddingHorizontal: 36,
  },
  statusText: {
    marginTop: 8,
    fontSize: 12,
    lineHeight: 17,
    color: '#6B7280',
    textAlign: 'center',
  },
  markerLabelWrap: {
    position: 'absolute',
    top: '50%',
    left: '50%',
    width: 240,
    marginLeft: -120,
    marginTop: -88,
    alignItems: 'center',
  },
  markerLabel: {
    maxWidth: 240,
    paddingHorizontal: 12,
    paddingVertical: 7,
    borderRadius: 12,
    borderWidth: 1,
    backgroundColor: '#FFFFFF',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.18,
    shadowRadius: 4,
    elevation: 4,
  },
  markerLabelText: {
    fontSize: 13,
    fontWeight: '700',
    color: '#1F2937',
    textAlign: 'center',
  },
  pinWrap: {
    position: 'absolute',
    top: '50%',
    left: '50%',
    width: 44,
    height: 44,
    marginLeft: -22,
    marginTop: -43,
    alignItems: 'center',
    justifyContent: 'center',
  },
  zoomControls: {
    position: 'absolute',
    top: 76,
    right: 16,
    borderRadius: 12,
    backgroundColor: '#FFFFFF',
    overflow: 'hidden',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.18,
    shadowRadius: 4,
    elevation: 4,
  },
  zoomButton: {
    width: 40,
    height: 40,
    alignItems: 'center',
    justifyContent: 'center',
  },
  zoomDivider: {
    height: StyleSheet.hairlineWidth,
    backgroundColor: '#D1D5DB',
  },
  attribution: {
    position: 'absolute',
    bottom: 8,
    left: 8,
    paddingHorizontal: 6,
    paddingVertical: 2,
    borderRadius: 4,
    backgroundColor: 'rgba(255, 255, 255, 0.85)',
  },
  attributionText: {
    fontSize: 9,
    color: '#4B5563',
  },
});
