'use client';

import { useEffect, useState, useRef } from 'react';
import { MapContainer, TileLayer, Marker, Popup } from 'react-leaflet';
import L from 'leaflet';
import 'leaflet/dist/leaflet.css';

// Fix default icon issues
delete (L.Icon.Default.prototype as any)._getIconUrl;

L.Icon.Default.mergeOptions({
  iconRetinaUrl: '/leaflet/marker-icon-2x.png',
  iconUrl: '/leaflet/marker-icon.png',
  shadowUrl: '/leaflet/marker-shadow.png',
});

interface MapProps {
  lat: number | undefined;
  lng: number | undefined;
}

const MapView = ({ lat, lng }: MapProps) => {
  const [isClient, setIsClient] = useState(false);
  const mapRef = useRef<HTMLDivElement>(null);
  const [deviceLocation, setDeviceLocation] = useState<{lat: number, lng: number} | null>(null);

  // Make sure it's running client-side and get device location
  useEffect(() => {
    setIsClient(true);
    
    if ("geolocation" in navigator) {
      navigator.geolocation.getCurrentPosition(
        (position) => {
          setDeviceLocation({
            lat: position.coords.latitude,
            lng: position.coords.longitude,
          });
        },
        (error) => {
          console.error("Error getting device location:", error);
        }
      );
    }
  }, []);

  // Check if we have valid coordinates from props or device
  const coordinates = 
    (lat !== undefined && lng !== undefined && lat !== 0 && lng !== 0)
      ? { lat, lng }
      : deviceLocation;

  // Avoid rendering until we're on the client
  if (!isClient) {
    return (
      <div className="h-full flex items-center justify-center bg-slate-900/30">
        <div className="text-slate-400 text-center">
          <p>Loading map components...</p>
        </div>
      </div>
    );
  }

  // If no coordinates available yet, show loading
  if (!coordinates) {
    return (
      <div className="h-full flex items-center justify-center bg-slate-900/30">
        <div className="text-slate-400 text-center">
          <p>Loading location data...</p>
        </div>
      </div>
    );
  }

  // Render map with available coordinates
  return (
    <div ref={mapRef} style={{ height: '100%', width: '100%' }}>
      <MapContainer
        center={[coordinates.lat, coordinates.lng]}
        zoom={13}
        scrollWheelZoom={false}
        style={{ height: '100%', width: '100%' }}
      >
        <TileLayer
          attribution='&copy; <a href="https://www.openstreetmap.org/">OpenStreetMap</a> contributors'
          url='https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png'
        />
        <Marker position={[coordinates.lat, coordinates.lng]}>
          <Popup>{coordinates === deviceLocation ? 'Device Location' : 'Current Location'}</Popup>
        </Marker>
      </MapContainer>
    </div>
  );
};

export default MapView;