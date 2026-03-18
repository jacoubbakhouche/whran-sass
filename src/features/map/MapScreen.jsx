import { useState, useEffect, useRef, useCallback } from 'react';
import { MapContainer, TileLayer, Marker, Popup, useMap, Polyline } from 'react-leaflet';
import L from 'leaflet';
import 'leaflet/dist/leaflet.css';
import { supabase } from '../../lib/supabase';
import { useNavigate, useLocation } from 'react-router-dom';
import { INSTITUTION_TYPES as MASTER_TYPES } from '../../lib/mockData';
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
  'kindergarten': '#FF9F7F',
  'primary': '#2D6A4F',
  'middle': '#2D6A4F',
  'high': '#2D6A4F',
  'university': '#1A5276',
  'training': '#E07A3A',
  'vocational': '#B7950B',
  'private': '#EC4899',
  'private_primary': '#8B5CF6',
  'private_high': '#6366F1',
  'private_institute': '#0EA5E9',
  'quranic': '#14B8A6',
  'متجر':        '#6366F1',
  'مكتبة':       '#8B4513',
};

function getTypeColor(type) {
  if (type && TYPE_COLORS[type]) return TYPE_COLORS[type];
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

const FILTER_TYPES = [
  { label: 'الكل', value: '' },
  { label: 'حضانة / روضة', value: 'nursery' },
  { label: 'مدارس', value: 'school' },
  { label: 'جامعات', value: 'university' },
  { label: 'تدريب / لغات', value: 'training' },
  { label: 'تكوين مهني', value: 'vocational' },
  { label: 'متاجر / مكتبات', value: 'store' },
];

function typeMatches(instType, filterValue) {
  if (!filterValue) return true;
  const value = instType || '';
  const m = {
    nursery:   ['حضانة', 'روضة', 'kindergarten'],
    school:    ['ابتدائية', 'إكمالية', 'ثانوية', 'مدرسة خاصة', 'مدرسة قرآنية', 'primary', 'middle', 'high', 'private', 'private_primary', 'quranic'],
    university:['جامعة', 'جامعة خاصة', 'مدرسة عالية خاصة', 'معهد خاص', 'university', 'private_high', 'private_institute'],
    training:  ['مركز تدريب', 'مركز لغات', 'معهد خاص', 'training', 'private_institute'],
    vocational:['تكوين مهني', 'vocational', 'training'],
    store:     ['متجر', 'مكتبة'],
  };
  return (m[filterValue] || []).some(k => value.includes(k));
}

function getTypeLabel(type) {
  const match = MASTER_TYPES.find(t => t.value === type || t.name_ar === type || t.name_fr === type);
  return match ? match.name_ar : type;
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
  const location = useLocation();
  const [institutions, setInstitutions] = useState([]);
  const [searchText, setSearchText] = useState('');
  const [typeFilter, setTypeFilter] = useState('');
  const [selected, setSelected]   = useState(null);
  const [userCoords, setUserCoords] = useState(null);
  const [focusCoords, setFocusCoords] = useState(null);
  const [sheetVisible, setSheetVisible] = useState(false);
  const [route, setRoute] = useState(null);

  useEffect(() => {
    const fetchData = async () => {
      // 1. Fetch institutions
      const { data: insts } = await supabase
        .from('institutions')
        .select('id, name_ar, type, lat, lng, rating_avg, rating_count, logo_url, wilaya, commune')
        .eq('status', 'active');

      // 2. Fetch stores (vendors from profiles)
      const { data: stores } = await supabase
        .from('profiles')
        .select('id, store_name, full_name, avatar_url, lat, lng, rating_avg, rating_count, wilaya, commune')
        .eq('role', 'vendor');

      const normalizedInsts = (insts || []).map(i => ({
        ...i,
        name: i.name_ar,
        lat: typeof i.lat === 'string' ? parseFloat(i.lat) : i.lat,
        lng: typeof i.lng === 'string' ? parseFloat(i.lng) : i.lng,
        type: i.type,
        logo: i.logo_url,
        bucket: 'profiles',
        category: 'institution'
      })).filter(i => i.lat && i.lng);

      const normalizedStores = (stores || []).map(s => {
        const name = s.store_name || s.full_name;
        const isLibrary = name?.includes('مكتبة') || name?.toLowerCase().includes('library') || name?.toLowerCase().includes('librairie');
        return {
          ...s,
          name: name,
          name_ar: name,
          lat: typeof s.lat === 'string' ? parseFloat(s.lat) : s.lat,
          lng: typeof s.lng === 'string' ? parseFloat(s.lng) : s.lng,
          type: isLibrary ? 'مكتبة' : 'متجر',
          logo: s.avatar_url,
          bucket: 'profiles',
          category: 'vendor'
        };
      }).filter(s => s.lat && s.lng);

      setInstitutions([...normalizedInsts, ...normalizedStores]);
    };

    fetchData();
  }, []);

  // Handle incoming focus request from navigation state
  useEffect(() => {
    if (location.state?.focusCoords && institutions.length > 0) {
      const { focusCoords, selectedId } = location.state;
      setFocusCoords(focusCoords);
      
      if (selectedId) {
        const store = institutions.find(i => i.id === selectedId);
        if (store) {
          setSelected(store);
          setSheetVisible(true);
        }
      }
    }
  }, [location.state, institutions]);

  const filtered = institutions.filter(inst => {
    const matchSearch = !searchText || 
                       (inst.name_ar?.toLowerCase().includes(searchText.toLowerCase())) ||
                       (inst.name?.toLowerCase().includes(searchText.toLowerCase()));
    const matchType   = typeMatches(inst.type, typeFilter);
    return matchSearch && matchType;
  });

  const handleMarkerClick = useCallback((inst) => {
    setSelected(inst);
    setSheetVisible(true);
    setRoute(null); // Clear previous route
  }, []);

  const handleShowRoute = (dest) => {
    if (!userCoords) {
      alert('الرجاء تفعيل موقعك أولاً لرؤية المسار');
      handleMyLocation();
      return;
    }
    setRoute([userCoords, [dest.lat, dest.lng]]);
  };

  const handleMyLocation = () => {
    navigator.geolocation?.getCurrentPosition(pos => {
      setUserCoords([pos.coords.latitude, pos.coords.longitude]);
    });
  };

  const logoUrl = selected?.logo
    ? (selected.logo.startsWith('http') 
        ? selected.logo 
        : supabase.storage.from(selected.bucket || 'profiles').getPublicUrl(selected.logo).data.publicUrl)
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
        {focusCoords && <FlyToLocation coords={focusCoords} zoom={16} />}
        {route && (
          <L.Polyline 
            positions={route} 
            color="var(--primary)" 
            weight={4} 
            opacity={0.6} 
            dashArray="10, 10" 
            animate={true} 
          />
        )}
        {filtered.map(inst => {
          if (!inst.lat || !inst.lng) return null;
          const color = getTypeColor(inst.type);
          return (
            <Marker
              key={inst.id}
              position={[inst.lat, inst.lng]}
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
          {FILTER_TYPES.map(t => (
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
        {filtered.length} نتيجة متوفرة
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
                    {getTypeLabel(selected.type)}
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
                  onClick={() => navigate(selected.category === 'vendor' ? `/store/profile/${selected.id}` : `/institution/${selected.id}`)}
                >
                  عرض التفاصيل
                </button>
                <button
                  className="btn-outline btn-primary"
                  style={{ flex: 1 }}
                  onClick={() => handleShowRoute(selected)}
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
