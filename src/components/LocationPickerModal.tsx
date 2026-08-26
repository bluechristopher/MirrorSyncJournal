import { useState, useEffect, type FormEvent, type MouseEvent } from 'react';
import { 
  MapPin, 
  Navigation, 
  X, 
  Check, 
  Search, 
  Loader2,
  Globe2,
  Star,
  Trash2,
  Plus,
  Bookmark
} from 'lucide-react';
import type { LocationPin, FavoriteLocation } from '../types';

interface LocationPickerModalProps {
  isOpen: boolean;
  onClose: () => void;
  onSelectLocation: (location: LocationPin | null) => void;
  currentLocation: LocationPin | null;
}

const FAVORITES_STORAGE_KEY = 'mirrorsync_favorite_locations';

export function LocationPickerModal({
  isOpen,
  onClose,
  onSelectLocation,
  currentLocation
}: LocationPickerModalProps) {
  const [customName, setCustomName] = useState('');
  const [customAddress, setCustomAddress] = useState('');
  const [isLocating, setIsLocating] = useState(false);
  const [searchQuery, setSearchQuery] = useState('');
  const [searchResults, setSearchResults] = useState<Array<{ name: string; address: string; lat: number; lng: number }>>([]);
  const [isSearching, setIsSearching] = useState(false);
  const [locationStatus, setLocationStatus] = useState<string | null>(null);
  const [favorites, setFavorites] = useState<FavoriteLocation[]>(() => {
    try {
      const saved = localStorage.getItem(FAVORITES_STORAGE_KEY);
      return saved ? JSON.parse(saved) : [];
    } catch {
      return [];
    }
  });

  // Save favorites to localStorage
  useEffect(() => {
    try {
      localStorage.setItem(FAVORITES_STORAGE_KEY, JSON.stringify(favorites));
    } catch (e) {
      console.warn('Failed to save favorite locations', e);
    }
  }, [favorites]);

  // Debounced search query
  useEffect(() => {
    if (!searchQuery.trim() || searchQuery.trim().length < 2) {
      setSearchResults([]);
      return;
    }

    const timer = setTimeout(async () => {
      setIsSearching(true);
      try {
        const res = await fetch(`/api/geocode?q=${encodeURIComponent(searchQuery.trim())}`);
        if (res.ok) {
          const data = await res.json();
          setSearchResults(data.results || []);
        }
      } catch (err) {
        console.warn('Location query error:', err);
      } finally {
        setIsSearching(false);
      }
    }, 350);

    return () => clearTimeout(timer);
  }, [searchQuery]);

  if (!isOpen) return null;

  const handleGetCurrentLocation = () => {
    if (!navigator.geolocation) {
      setLocationStatus('Geolocation is not supported by your browser.');
      return;
    }

    setIsLocating(true);
    setLocationStatus('Acquiring precise GPS coordinates...');
    
    navigator.geolocation.getCurrentPosition(
      async (position) => {
        const lat = position.coords.latitude;
        const lng = position.coords.longitude;
        
        setLocationStatus('Resolving location name...');
        try {
          const res = await fetch(`/api/geocode/reverse?lat=${lat}&lng=${lng}`);
          if (res.ok) {
            const data = await res.json();
            const pin: LocationPin = {
              name: data.name || 'Current GPS Pin',
              address: data.address || `GPS (${lat.toFixed(4)}, ${lng.toFixed(4)})`,
              lat,
              lng
            };
            setIsLocating(false);
            setLocationStatus(null);
            onSelectLocation(pin);
            onClose();
            return;
          }
        } catch (revErr) {
          console.warn('Reverse geocoding failed, using coordinates:', revErr);
        }

        const pin: LocationPin = {
          name: 'Current Coordinates',
          address: `GPS Pin (${lat.toFixed(4)}, ${lng.toFixed(4)})`,
          lat,
          lng
        };
        setIsLocating(false);
        setLocationStatus(null);
        onSelectLocation(pin);
        onClose();
      },
      (error) => {
        console.warn('Geolocation error:', error);
        setIsLocating(false);
        setLocationStatus('GPS access denied or timed out.');
      },
      { timeout: 9000, enableHighAccuracy: true }
    );
  };

  const handleAddFavorite = (pin: LocationPin, label?: string) => {
    if (!pin.name) return;
    const exists = favorites.some(f => f.name.toLowerCase() === pin.name.toLowerCase());
    if (exists) return;

    const newFav: FavoriteLocation = {
      id: `fav-${Date.now()}-${Math.random().toString(36).substring(2, 6)}`,
      name: pin.name,
      address: pin.address,
      lat: pin.lat,
      lng: pin.lng,
      label: label || 'Saved Spot',
      createdAt: Date.now()
    };
    setFavorites(prev => [newFav, ...prev]);
  };

  const handleDeleteFavorite = (id: string, e: MouseEvent) => {
    e.stopPropagation();
    setFavorites(prev => prev.filter(f => f.id !== id));
  };

  const handleApplyCustom = (e: FormEvent) => {
    e.preventDefault();
    if (!customName.trim()) return;

    const pin: LocationPin = {
      name: customName.trim(),
      address: customAddress.trim() || undefined,
      lat: 37.7749 + (Math.random() - 0.5) * 0.05,
      lng: -122.4194 + (Math.random() - 0.5) * 0.05
    };
    onSelectLocation(pin);
    onClose();
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/80 backdrop-blur-md animate-in fade-in-50 duration-200">
      <div className="relative w-full max-w-lg rounded-2xl metallic-card shadow-2xl p-6 sm:p-7 space-y-5 text-slate-100 max-h-[90vh] flex flex-col">
        {/* Header */}
        <div className="flex items-center justify-between pb-4 border-b border-white/10 shrink-0">
          <div className="flex items-center gap-3">
            <div className="w-9 h-9 rounded-xl metallic-gold-panel flex items-center justify-center text-[#f6e7b8] shadow-sm">
              <MapPin className="w-4 h-4 text-[#f6e7b8]" />
            </div>
            <div>
              <h3 className="text-base font-semibold text-[#f6e7b8]">📍 Attach Your Serene Location</h3>
              <p className="text-xs text-slate-400">Add GPS, search a cozy place, or pick from favourites</p>
            </div>
          </div>

          <button
            onClick={onClose}
            className="p-1.5 rounded-lg text-slate-400 hover:text-white hover:bg-white/10 transition-colors cursor-pointer"
          >
            <X className="w-4 h-4" />
          </button>
        </div>

        {/* Modal Scrollable Body */}
        <div className="space-y-5 overflow-y-auto pr-1">
          {/* GPS Action Bar */}
          <div className="flex gap-2">
            <button
              type="button"
              onClick={handleGetCurrentLocation}
              disabled={isLocating}
              className="flex-1 flex items-center justify-center gap-2.5 p-3 rounded-xl metallic-gold-panel text-xs font-semibold text-[#f6e7b8] transition-all cursor-pointer shadow-sm group"
            >
              {isLocating ? (
                <Loader2 className="w-4 h-4 animate-spin text-[#f6e7b8]" />
              ) : (
                <Navigation className="w-4 h-4 text-[#f6e7b8] group-hover:scale-110 transition-transform" />
              )}
              <span>{isLocating ? (locationStatus || 'Acquiring GPS...') : 'Use Current Device GPS'}</span>
            </button>

            {currentLocation && (
              <button
                type="button"
                onClick={() => {
                  onSelectLocation(null);
                  onClose();
                }}
                className="px-3.5 py-2 rounded-xl bg-rose-950/40 border border-rose-500/40 text-rose-300 text-xs hover:bg-rose-900/60 transition-colors cursor-pointer"
              >
                Clear Pin
              </button>
            )}
          </div>

          {locationStatus && !isLocating && (
            <p className="text-[11px] text-[#f6e7b8] metallic-gold-panel px-3 py-1.5 rounded-lg">
              {locationStatus}
            </p>
          )}

          {/* Search Bar for Any Location Name */}
          <div className="space-y-2">
            <div className="text-[11px] font-semibold text-[#f6e7b8] uppercase tracking-wider">
              Search Location Name
            </div>
            <div className="relative">
              <Search className="absolute left-3 top-2.5 w-4 h-4 text-slate-400" />
              <input
                type="text"
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                placeholder="Search any place or address (e.g. Kyoto, Shibuya, London, Starbucks...)"
                className="w-full metallic-panel text-xs text-slate-100 placeholder-slate-500 rounded-xl pl-9 pr-8 py-2.5 border border-white/15 focus:outline-none focus:border-[#f6e7b8] focus:ring-1 focus:ring-[#f6e7b8]/40 shadow-inner"
              />
              {isSearching && (
                <Loader2 className="absolute right-3 top-2.5 w-4 h-4 animate-spin text-[#f6e7b8]" />
              )}
            </div>
          </div>

          {/* Live Search Results */}
          {searchResults.length > 0 && (
            <div className="space-y-2">
              <div className="text-[11px] font-semibold text-[#f6e7b8] flex items-center gap-1.5 uppercase tracking-wider">
                <Globe2 className="w-3.5 h-3.5 text-[#f6e7b8]" />
                <span>Search Results ({searchResults.length})</span>
              </div>
              <div className="space-y-1.5 max-h-48 overflow-y-auto pr-1">
                {searchResults.map((result, idx) => {
                  const isFav = favorites.some(f => f.name.toLowerCase() === result.name.toLowerCase());
                  return (
                    <div
                      key={idx}
                      className="flex items-center gap-2 p-2 rounded-xl metallic-card border border-white/10 hover:border-[#f6e7b8]/60 text-left transition-all group"
                    >
                      <button
                        type="button"
                        onClick={() => {
                          onSelectLocation({
                            name: result.name,
                            address: result.address,
                            lat: result.lat,
                            lng: result.lng
                          });
                          onClose();
                        }}
                        className="flex-1 flex items-start gap-2.5 min-w-0 cursor-pointer"
                      >
                        <MapPin className="w-3.5 h-3.5 text-[#f6e7b8] shrink-0 mt-0.5" />
                        <div className="min-w-0 flex-1">
                          <p className="text-xs font-medium text-slate-200 group-hover:text-[#f6e7b8] truncate">{result.name}</p>
                          <p className="text-[10px] text-slate-400 truncate">{result.address}</p>
                        </div>
                      </button>

                      <button
                        type="button"
                        onClick={(e) => {
                          e.stopPropagation();
                          if (isFav) {
                            const found = favorites.find(f => f.name.toLowerCase() === result.name.toLowerCase());
                            if (found) handleDeleteFavorite(found.id, e);
                          } else {
                            handleAddFavorite({
                              name: result.name,
                              address: result.address,
                              lat: result.lat,
                              lng: result.lng
                            });
                          }
                        }}
                        title={isFav ? 'Remove from favourites' : 'Save to favourites'}
                        className={`p-1.5 rounded-lg border transition-colors cursor-pointer shrink-0 ${
                          isFav 
                            ? 'metallic-gold-panel text-[#f6e7b8]' 
                            : 'metallic-panel text-slate-400 hover:text-[#f6e7b8]'
                        }`}
                      >
                        <Star className={`w-3.5 h-3.5 ${isFav ? 'fill-[#f6e7b8] text-[#f6e7b8]' : ''}`} />
                      </button>
                    </div>
                  );
                })}
              </div>
            </div>
          )}

          {/* Favourite Locations Section */}
          <div className="space-y-2.5">
            <div className="flex items-center justify-between">
              <div className="text-[11px] font-semibold text-[#f6e7b8] uppercase tracking-wider flex items-center gap-1.5">
                <Bookmark className="w-3.5 h-3.5 text-[#f6e7b8]" />
                <span>Favourite Locations ({favorites.length})</span>
              </div>
              {currentLocation && !favorites.some(f => f.name.toLowerCase() === currentLocation.name.toLowerCase()) && (
                <button
                  type="button"
                  onClick={() => handleAddFavorite(currentLocation)}
                  className="text-[10px] text-[#f6e7b8] hover:underline flex items-center gap-1 cursor-pointer"
                >
                  <Plus className="w-3 h-3" />
                  Save current pin
                </button>
              )}
            </div>

            {favorites.length === 0 ? (
              <div className="p-4 rounded-xl metallic-panel border border-dashed border-white/15 text-center">
                <p className="text-xs text-slate-400">No favourite locations saved yet.</p>
                <p className="text-[10px] text-slate-500 mt-0.5">Use GPS, search a place, or type below and click the star to save your favourites.</p>
              </div>
            ) : (
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-2 max-h-48 overflow-y-auto pr-1">
                {favorites.map((fav) => {
                  const isSelected = currentLocation?.name === fav.name;
                  return (
                    <div
                      key={fav.id}
                      className={`flex items-center justify-between gap-2 p-2.5 rounded-xl border text-left transition-all ${
                        isSelected
                          ? 'metallic-gold-panel text-slate-100 shadow-sm'
                          : 'metallic-card border-white/10 hover:border-white/25 text-slate-300'
                      }`}
                    >
                      <button
                        type="button"
                        onClick={() => {
                          onSelectLocation({
                            name: fav.name,
                            address: fav.address,
                            lat: fav.lat,
                            lng: fav.lng
                          });
                          onClose();
                        }}
                        className="flex-1 flex items-start gap-2 min-w-0 cursor-pointer"
                      >
                        <MapPin className={`w-3.5 h-3.5 shrink-0 mt-0.5 ${isSelected ? 'text-[#f6e7b8]' : 'text-slate-400'}`} />
                        <div className="min-w-0 flex-1">
                          <div className="flex items-center gap-1">
                            <span className="text-xs font-semibold text-slate-200 truncate">{fav.name}</span>
                            {isSelected && <Check className="w-3 h-3 text-[#f6e7b8] shrink-0" />}
                          </div>
                          {fav.address && <p className="text-[10px] text-slate-400 truncate">{fav.address}</p>}
                        </div>
                      </button>

                      <button
                        type="button"
                        onClick={(e) => handleDeleteFavorite(fav.id, e)}
                        title="Delete favourite"
                        className="p-1.5 rounded-lg text-slate-500 hover:text-rose-400 hover:bg-rose-950/40 transition-colors cursor-pointer shrink-0"
                      >
                        <Trash2 className="w-3.5 h-3.5" />
                      </button>
                    </div>
                  );
                })}
              </div>
            )}
          </div>

          {/* Custom Location Name Form */}
          <form onSubmit={handleApplyCustom} className="pt-3 border-t border-white/10 space-y-2">
            <div className="text-[11px] font-semibold text-[#f6e7b8] uppercase tracking-wider">
              Or Type Custom Place Name
            </div>
            <div className="flex gap-2">
              <input
                type="text"
                value={customName}
                onChange={(e) => setCustomName(e.target.value)}
                placeholder="e.g. Kyoto Zen Garden, Rooftop Studio, Home Balcony..."
                className="flex-1 metallic-panel text-xs text-slate-100 placeholder-slate-500 rounded-xl px-3.5 py-2.5 border border-white/15 focus:outline-none focus:border-[#f6e7b8] shadow-inner"
              />
              <button
                type="submit"
                disabled={!customName.trim()}
                className="px-4 py-2.5 rounded-xl metallic-gold-button text-[#070d1e] font-semibold text-xs transition-all disabled:opacity-40 cursor-pointer shadow-sm"
              >
                Attach
              </button>
            </div>
          </form>
        </div>
      </div>
    </div>
  );
}
