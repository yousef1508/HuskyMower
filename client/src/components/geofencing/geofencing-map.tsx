import React, { useState, useEffect } from 'react';
import { MapContainer, TileLayer, Polygon, Marker, Popup, useMap } from 'react-leaflet';
import L from 'leaflet';
import 'leaflet/dist/leaflet.css';
import type { Geofence, Zone, GeoPosition, AutomowerStatus } from '@shared/schema';

// Fix Leaflet icon issues
// This is necessary because Leaflet's default marker uses image files that need to be manually imported in React
import iconUrl from 'leaflet/dist/images/marker-icon.png';
import iconRetinaUrl from 'leaflet/dist/images/marker-icon-2x.png';
import shadowUrl from 'leaflet/dist/images/marker-shadow.png';

// Define a custom marker icon
const DefaultIcon = L.icon({
  iconUrl,
  iconRetinaUrl,
  shadowUrl,
  iconSize: [25, 41],
  iconAnchor: [12, 41],
  popupAnchor: [1, -34],
  shadowSize: [41, 41]
});

L.Marker.prototype.options.icon = DefaultIcon;

// Component to recenter the map to a particular position
function RecenterAutomatically({ position }: { position: [number, number] }) {
  const map = useMap();
  useEffect(() => {
    map.setView(position, map.getZoom());
  }, [position, map]);
  return null;
}

interface GeofencingMapProps {
  geofences?: Geofence[];
  zones?: Zone[];
  mowers?: AutomowerStatus[];
  center?: [number, number];
  zoom?: number;
  onGeofenceClick?: (geofence: Geofence) => void;
  onZoneClick?: (zone: Zone) => void;
  onMowerClick?: (mower: AutomowerStatus) => void;
  drawing?: boolean;
  onDrawComplete?: (positions: GeoPosition[]) => void;
}

const GeofencingMap: React.FC<GeofencingMapProps> = ({
  geofences = [],
  zones = [],
  mowers = [],
  center = [59.7907, 10.7686], // Default to Gjersjøen Golf Club
  zoom = 15,
  onGeofenceClick,
  onZoneClick,
  onMowerClick,
  drawing = false,
  onDrawComplete
}) => {
  const [drawPositions, setDrawPositions] = useState<GeoPosition[]>([]);
  const [mapInstance, setMapInstance] = useState<L.Map | null>(null);

  // Setup drawing mode
  useEffect(() => {
    if (!mapInstance || !drawing) return;

    const handleClick = (e: L.LeafletMouseEvent) => {
      const { lat, lng } = e.latlng;
      setDrawPositions(prev => [...prev, { latitude: lat, longitude: lng }]);
    };

    mapInstance.on('click', handleClick);

    return () => {
      mapInstance.off('click', handleClick);
    };
  }, [mapInstance, drawing]);

  // Call onDrawComplete when drawing is completed
  const handleFinishDrawing = () => {
    if (drawPositions.length > 2 && onDrawComplete) {
      onDrawComplete(drawPositions);
      setDrawPositions([]);
    }
  };

  return (
    <div className="relative h-[70vh] w-full">
      <MapContainer 
        center={center} 
        zoom={zoom} 
        style={{ height: '100%', width: '100%' }}
        ref={setMapInstance}
      >
        <TileLayer
          attribution='&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a> contributors'
          url="https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png"
        />
        
        {/* Display geofences */}
        {geofences.map((geofence) => {
          const boundaries = geofence.boundaries as unknown as { coordinates: GeoPosition[] };
          if (!boundaries?.coordinates?.length) return null;
          
          return (
            <Polygon 
              key={`geofence-${geofence.id}`}
              positions={boundaries.coordinates.map(p => [p.latitude, p.longitude] as [number, number])}
              pathOptions={{ 
                color: geofence.color || '#4CAF50',
                fillOpacity: 0.2,
                weight: 2
              }}
              eventHandlers={{
                click: () => onGeofenceClick && onGeofenceClick(geofence)
              }}
            />
          );
        })}
        
        {/* Display zones */}
        {zones.map((zone) => {
          const boundaries = zone.boundaries as unknown as { coordinates: GeoPosition[] };
          if (!boundaries?.coordinates?.length) return null;
          
          return (
            <Polygon 
              key={`zone-${zone.id}`}
              positions={boundaries.coordinates.map(p => [p.latitude, p.longitude] as [number, number])}
              pathOptions={{ 
                color: zone.color || '#2196F3',
                fillOpacity: 0.2,
                weight: 2
              }}
              eventHandlers={{
                click: () => onZoneClick && onZoneClick(zone)
              }}
            >
              <Popup>
                <div className="p-2">
                  <h3 className="font-bold">{zone.name}</h3>
                  <p className="text-sm">{zone.description}</p>
                  <p className="text-xs mt-1">Type: {zone.zoneType}</p>
                </div>
              </Popup>
            </Polygon>
          );
        })}
        
        {/* Display mowers */}
        {mowers.map((mower) => {
          if (!mower.latitude || !mower.longitude) return null;
          
          return (
            <Marker 
              key={`mower-${mower.id}`}
              position={[mower.latitude, mower.longitude]}
              eventHandlers={{
                click: () => onMowerClick && onMowerClick(mower)
              }}
            >
              <Popup>
                <div className="p-2">
                  <h3 className="font-bold">{mower.model} {mower.serialNumber.slice(-4)}</h3>
                  <p className="text-sm">Status: {mower.status}</p>
                  <p className="text-sm">Battery: {mower.batteryLevel}%</p>
                  <p className="text-xs mt-1">
                    <span className={mower.connectionStatus === 'connected' ? 'text-green-500' : 'text-red-500'}>
                      {mower.connectionStatus === 'connected' ? 'Online' : 'Offline'}
                    </span>
                  </p>
                </div>
              </Popup>
            </Marker>
          );
        })}
        
        {/* Current drawing polygon */}
        {drawing && drawPositions.length > 0 && (
          <Polygon 
            positions={drawPositions.map(p => [p.latitude, p.longitude] as [number, number])}
            pathOptions={{ 
              color: '#FF9800',
              fillOpacity: 0.2,
              weight: 2
            }}
          />
        )}
        
        {/* Recenter based on the first mower position or default center */}
        {mowers.length > 0 && mowers[0].latitude && mowers[0].longitude ? (
          <RecenterAutomatically position={[mowers[0].latitude, mowers[0].longitude]} />
        ) : (
          <RecenterAutomatically position={center} />
        )}
      </MapContainer>
      
      {/* Drawing controls */}
      {drawing && (
        <div className="absolute bottom-4 right-4 z-[1000] bg-white p-2 rounded-md shadow-md">
          <button
            onClick={handleFinishDrawing}
            disabled={drawPositions.length < 3}
            className="px-3 py-1 bg-blue-500 text-white rounded disabled:bg-gray-300"
          >
            Finish Drawing
          </button>
          <button
            onClick={() => setDrawPositions([])}
            className="px-3 py-1 ml-2 bg-red-500 text-white rounded"
          >
            Clear
          </button>
        </div>
      )}
    </div>
  );
};

export default GeofencingMap;