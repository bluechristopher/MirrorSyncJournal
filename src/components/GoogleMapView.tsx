import { useState } from 'react';
import { APIProvider, Map, AdvancedMarker, Pin } from '@vis.gl/react-google-maps';
import { MapPin, Navigation, ExternalLink, Compass, Sparkles } from 'lucide-react';
import type { LocationPin } from '../types';

interface GoogleMapViewProps {
  location: LocationPin;
  locationContext?: string | null;
  className?: string;
  zoom?: number;
}

export function GoogleMapView({
  location,
  locationContext,
  className = 'h-52 w-full rounded-2xl overflow-hidden',
  zoom = 14
}: GoogleMapViewProps) {
  const apiKey = ((import.meta as any).env?.VITE_GOOGLE_MAPS_API_KEY as string) || '';
  const [mapError, setMapError] = useState(false);

  const position = {
    lat: location.lat || 37.7749,
    lng: location.lng || -122.4194
  };

  const googleMapsUrl = `https://www.google.com/maps/search/?api=1&query=${position.lat},${position.lng}`;

  // If no API key provided or error occurred, render sleek Apple-style dark mode fallback
  if (!apiKey || mapError) {
    return (
      <div className={`relative metallic-card rounded-2xl p-4 sm:p-5 space-y-3.5 ${className}`}>
        <div className="flex items-start justify-between gap-3">
          <div className="flex items-center gap-2.5">
            <div className="w-9 h-9 rounded-xl metallic-gold-panel flex items-center justify-center text-[#f6e7b8] shrink-0 shadow-md">
              <MapPin className="w-4 h-4 text-[#f6e7b8]" />
            </div>
            <div>
              <h4 className="text-xs sm:text-sm font-bold text-slate-100">{location.name}</h4>
              {location.address && (
                <p className="text-[11px] text-slate-400 truncate max-w-[280px] sm:max-w-md">{location.address}</p>
              )}
            </div>
          </div>

          <a
            href={googleMapsUrl}
            target="_blank"
            rel="noopener noreferrer"
            className="flex items-center gap-1.5 text-[11px] text-[#f6e7b8] hover:text-white px-3 py-1.5 rounded-xl metallic-gold-panel transition-all font-semibold shrink-0 cursor-pointer shadow-sm"
          >
            <span>Open Maps</span>
            <ExternalLink className="w-3 h-3 text-[#f6e7b8]" />
          </a>
        </div>

        {/* Coords & Visual Grid Canvas */}
        <div className="relative h-28 w-full rounded-xl bg-gradient-to-br from-[#070d1e] via-[#0b152d] to-[#050914] border border-white/15 flex flex-col items-center justify-center text-center p-3 overflow-hidden shadow-inner">
          {/* Subtle Grid Accent */}
          <div 
            className="absolute inset-0 opacity-20"
            style={{
              backgroundImage: 'radial-gradient(circle, #d4af37 1px, transparent 1px)',
              backgroundSize: '20px 20px'
            }}
          />

          <div className="relative z-10 flex flex-col items-center gap-1.5">
            <div className="w-8 h-8 rounded-full metallic-gold-button flex items-center justify-center text-[#070d1e] shadow-lg shadow-amber-500/25 animate-pulse">
              <MapPin className="w-4 h-4 fill-[#070d1e]" />
            </div>
            <div className="text-[11px] font-mono font-bold text-[#f6e7b8] tracking-wide">
              {position.lat.toFixed(4)}° N, {position.lng.toFixed(4)}° W
            </div>
            <span className="text-[10px] text-slate-400">
              Spatial grounding enabled for reflection
            </span>
          </div>
        </div>

        {locationContext && (
          <div className="p-3 rounded-xl metallic-panel text-xs text-slate-300 leading-relaxed italic flex items-start gap-2.5">
            <Compass className="w-3.5 h-3.5 text-[#f6e7b8] shrink-0 mt-0.5" />
            <span>"{locationContext}"</span>
          </div>
        )}
      </div>
    );
  }

  return (
    <div className={`relative border border-white/15 rounded-2xl overflow-hidden shadow-xl ${className}`}>
      <APIProvider
        apiKey={apiKey}
        onError={() => setMapError(true)}
      >
        <Map
          mapId="DEMO_MAP_ID"
          style={{ width: '100%', height: '100%', minHeight: '200px' }}
          defaultCenter={position}
          defaultZoom={zoom}
          gestureHandling="cooperative"
          disableDefaultUI={false}
          colorScheme="DARK"
        >
          <AdvancedMarker position={position}>
            <Pin
              background="#d4af37"
              borderColor="#f3e5ab"
              glyphColor="#070d1e"
              scale={1.15}
            />
          </AdvancedMarker>
        </Map>
      </APIProvider>

      {/* Floating Info Pill on top with Apple Frosted Glass */}
      <div className="absolute top-3 left-3 right-3 flex items-center justify-between gap-2 p-2.5 rounded-xl bg-[#070d1e]/85 backdrop-blur-md border border-white/15 text-xs shadow-lg">
        <div className="flex items-center gap-2 min-w-0">
          <div className="w-5 h-5 rounded-md bg-amber-500/20 border border-amber-400/40 flex items-center justify-center text-amber-300 shrink-0">
            <MapPin className="w-3 h-3 text-[#f3e5ab]" />
          </div>
          <span className="font-semibold text-slate-100 truncate">{location.name}</span>
        </div>
        <a
          href={googleMapsUrl}
          target="_blank"
          rel="noopener noreferrer"
          className="text-[11px] text-amber-200 hover:text-amber-100 shrink-0 flex items-center gap-1 px-2 py-1 rounded-lg bg-amber-500/15 border border-amber-400/30 transition-colors font-medium"
        >
          <span>Directions</span>
          <ExternalLink className="w-3 h-3" />
        </a>
      </div>
    </div>
  );
}
