import { useState, useEffect, useRef, useCallback } from 'react';
import { MapContainer, TileLayer, Marker, Popup, useMap } from 'react-leaflet';
import L from 'leaflet';
import 'leaflet/dist/leaflet.css';
import { supabase } from '../../lib/supabase';
import { useNavigate } from 'react-router-dom';
import './MapScreen.css';

// Fix default marker icons
delete L.Icon.Default.prototype._getIconUrl;
L.Icon.Default.mergeOptions({
  iconRetinaUrl: 'https://unpkg.com/leaflet@1.9.4/dist/images/marker-icon-2x.png',
  iconUrl: 'https://unpkg.com/leaflet@1.9.4/dist/images/marker-icon.png',
  shadowUrl: 'https://unpkg.com/leaflet@1.9.4/dist/images/marker-shadow.png',
});

const TYPE_COLORS = {
  'حضانة':        '#FF9F7F',
  'روضة':         '#FF9F7F',
  'ابتدائية':     '#2D6A4F',
  'إكمالية':      '#2D6A4F',
  'ثانوية':       '#2D6A4F',
  'جامعة':        '#1A5276',
  'جامعة خاصة':  '#1A5276',
  'مركز تدريب':  '#E07A3A',
  'مركز لغات':   '#E07A3A',
  'تكوين مهني':  '#B7950B',
};

function getTypeColor(type) {
  for (const key of Object.keys(TYPE_COLORS)) {
    if (type?.includes(key)) return TYPE_COLORS[key];
  }
  return '#2D6A4F';
}

function createColoredMarker(color) {
  return L.divIcon({
    className: '',
    html: `<div style="
      width:32px;height:32px;border-radius:50% 50% 50% 0;
      background:${color};border:2.5px solid #fff;
      box-shadow:0 2px 8px rgba(0,0,0,.25);
      transform:rotate(-45deg);
    "></div>`,
    iconSize: [32, 32],
    iconAnchor: [16, 32],
    popupAnchor: [0, -34],
  });
}

const INSTITUTION_TYPES = [
  { label: 'الكل', value: '' },
  { label: 'حضانة / روضة', value: 'nursery' },
  { label: 'مدارس', value: 'school' },
  { label: 'جامعات', value: 'university' },
  { label: 'تدريب / لغات', value: 'training' },
  { label: 'تكوين مهني', value: 'vocational' },
];

function typeMatches(instType, filterValue) {
  if (!filterValue) return true;
  const m = {
    nursery:   ['حضانة', 'روضة'],
    school:    ['ابتدائية', 'إكمالية', 'ثانوية'],
    university:['جامعة', 'جامعة خاصة'],
    training:  ['مركز تدريب', 'مركز لغات'],
    vocational:['تكوين مهني'],
  };
  return (m[filterValue] || []).some(k => instType?.includes(k));
}

function FlyToLocation({ coords }) {
  const map = useMap();
  useEffect(() => {
    if (coords) map.flyTo(coords, 14, { duration: 1.2 });
  }, [coords, map]);
  return null;
}

export default function MapScreen() {
  const navigate = useNavigate();
  const [institutions, setInstitutions] = useState([]);
  const [searchText, setSearchText] = useState('');
  const [typeFilter, setTypeFilter] = useState('');
  const [selected, setSelected]   = useState(null);
  const [userCoords, setUserCoords] = useState(null);
  const [sheetVisible, setSheetVisible] = useState(false);

  useEffect(() => {
    supabase
      .from('institutions')
      .select('id, name_ar, type, location, rating_avg, rating_count, logo_url, wilaya, commune')
      .eq('status', 'active')
      .then(({ data }) => { if (data) setInstitutions(data); });
  }, []);

  const filtered = institutions.filter(inst => {
    const matchSearch = !searchText || inst.name_ar?.toLowerCase().includes(searchText.toLowerCase());
    const matchType   = typeMatches(inst.type, typeFilter);
    return matchSearch && matchType;
  });

  const handleMarkerClick = useCallback((inst) => {
    setSelected(inst);
    setSheetVisible(true);
  }, []);

  const handleMyLocation = () => {
    navigator.geolocation?.getCurrentPosition(pos => {
      setUserCoords([pos.coords.latitude, pos.coords.longitude]);
    });
  };

  const logoUrl = selected?.logo_url
    ? supabase.storage.from('institution-logos').getPublicUrl(selected.logo_url).data.publicUrl
    : null;

  return (
    <div className="map-screen" dir="rtl">
      {/* ─── Map ─── */}
      <MapContainer
        center={[36.737, 3.086]}
        zoom={6}
        className="map-screen__map"
        zoomControl={false}
      >
        <TileLayer
          url="https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png"
          attribution='&copy; OpenStreetMap'
        />
        {userCoords && <FlyToLocation coords={userCoords} />}
        {filtered.map(inst => {
          let coords = null;
          try {
            if (inst.location?.coordinates) {
              coords = [inst.location.coordinates[1], inst.location.coordinates[0]];
            }
          } catch (_) {}
          if (!coords) return null;
          const color = getTypeColor(inst.type);
          return (
            <Marker
              key={inst.id}
              position={coords}
              icon={createColoredMarker(color)}
              eventHandlers={{ click: () => handleMarkerClick(inst) }}
            />
          );
        })}
      </MapContainer>

      {/* ─── Floating Search ─── */}
      <div className="map-search-bar">
        <span>🔍</span>
        <input
          type="text"
          placeholder="ابحث في الخريطة..."
          value={searchText}
          onChange={e => setSearchText(e.target.value)}
        />
        {searchText && (
          <button className="map-search-bar__clear" onClick={() => setSearchText('')}>✕</button>
        )}
      </div>

      {/* ─── Type Filter Chips ─── */}
      <div className="map-type-filters">
        <div className="h-scroll" style={{ padding: '0 var(--space-4)' }}>
          {INSTITUTION_TYPES.map(t => (
            <button
              key={t.value}
              className={`chip ${typeFilter === t.value ? 'active' : ''}`}
              onClick={() => setTypeFilter(t.value)}
            >
              {t.label}
            </button>
          ))}
        </div>
      </div>

      {/* ─── My Location Button ─── */}
      <button className="map-my-location" onClick={handleMyLocation} title="موقعي الحالي">
        📍
      </button>

      {/* ─── Count Badge ─── */}
      <div className="map-count-badge">
        {filtered.length} مؤسسة
      </div>

      {/* ─── Bottom Sheet ─── */}
      {sheetVisible && selected && (
        <>
          <div className="map-sheet-overlay" onClick={() => setSheetVisible(false)} />
          <div className="map-bottom-sheet animate-up">
            <div className="map-bottom-sheet__handle" />
            <div className="map-bottom-sheet__content">
              <div className="map-bottom-sheet__header">
                <div className="map-bottom-sheet__logo">
                  {logoUrl
                    ? <img src={logoUrl} alt="" />
                    : <span>🏛️</span>
                  }
                </div>
                <div className="map-bottom-sheet__info">
                  <h3>{selected.name_ar}</h3>
                  <span className="badge" style={{
                    background: getTypeColor(selected.type) + '22',
                    color: getTypeColor(selected.type)
                  }}>
                    {selected.type}
                  </span>
                </div>
                <button className="map-bottom-sheet__close" onClick={() => setSheetVisible(false)}>✕</button>
              </div>

              <div className="map-bottom-sheet__meta">
                <span className="stars">
                  <span className="star-icon">⭐</span>
                  <span style={{ fontFamily: 'var(--font-latin)' }}>
                    {(selected.rating_avg || 0).toFixed(1)}
                  </span>
                  <span style={{ color: 'var(--text-muted)', fontSize: '0.75rem', fontFamily: 'var(--font-latin)' }}>
                    ({selected.rating_count || 0})
                  </span>
                </span>
                <span className="map-bottom-sheet__location">
                  📍 {[selected.commune, selected.wilaya].filter(Boolean).join('، ')}
                </span>
              </div>

              <div className="map-bottom-sheet__actions">
                <button
                  className="btn-primary"
                  style={{ flex: 1 }}
                  onClick={() => navigate(`/institution/${selected.id}`)}
                >
                  عرض التفاصيل
                </button>
                <button
                  className="btn-outline btn-primary"
                  style={{ flex: 1 }}
                  onClick={() => {
                    try {
                      const [lng, lat] = selected.location.coordinates;
                      window.open(`https://maps.google.com?q=${lat},${lng}`, '_blank');
                    } catch (_) {}
                  }}
                >
                  🧭 المسار
                </button>
              </div>
            </div>
          </div>
        </>
      )}
    </div>
  );
}
