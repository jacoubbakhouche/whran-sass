import { useEffect, useRef } from 'react';
import { MapContainer, TileLayer, Marker, Popup, useMap, LayersControl } from 'react-leaflet';
import L from 'leaflet';
import { useI18n } from '../../i18n';
import { INSTITUTION_TYPES } from '../../lib/mockData';
import { Link } from 'react-router-dom';
import { FiStar, FiMapPin } from 'react-icons/fi';
import 'leaflet/dist/leaflet.css';
import './MapView.css';

// Fix default marker icon
delete L.Icon.Default.prototype._getIconUrl;
L.Icon.Default.mergeOptions({
    iconRetinaUrl: 'https://cdnjs.cloudflare.com/ajax/libs/leaflet/1.9.4/images/marker-icon-2x.png',
    iconUrl: 'https://cdnjs.cloudflare.com/ajax/libs/leaflet/1.9.4/images/marker-icon.png',
    shadowUrl: 'https://cdnjs.cloudflare.com/ajax/libs/leaflet/1.9.4/images/marker-shadow.png',
});

function createCustomIcon(typeString, getField) {
    const typeInfo = INSTITUTION_TYPES.find(t => getField(t, 'name') === typeString) || INSTITUTION_TYPES[0];
    return L.divIcon({
        html: `<div class="map-marker" style="--marker-color: ${typeInfo.color}">
      <span class="map-marker__icon">${typeInfo.icon}</span>
    </div>`,
        className: 'custom-marker',
        iconSize: [40, 48],
        iconAnchor: [20, 48],
        popupAnchor: [0, -48],
    });
}

function FitBounds({ institutions }) {
    const map = useMap();
    useEffect(() => {
        if (institutions.length > 0) {
            const bounds = L.latLngBounds(institutions.map(inst => [inst.lat, inst.lng]));
            map.fitBounds(bounds, { padding: [50, 50], maxZoom: 12 });
        }
    }, [institutions, map]);
    return null;
}

function LocateButton() {
    const map = useMap();
    const { t } = useI18n();

    const handleLocate = () => {
        map.locate({ setView: true, maxZoom: 13 });
    };

    return (
        <button className="map-locate-btn" onClick={handleLocate} title={t('myLocation')}>
            <FiMapPin size={18} />
        </button>
    );
}

export default function MapView({ institutions = [], selectedId, onSelect, height = '500px' }) {
    const { getField, dir } = useI18n();

    const center = [36.7538, 3.0588]; // Algiers
    const zoom = 6;

    return (
        <div className="map-container" style={{ height }} dir={dir}>
            <MapContainer
                center={center}
                zoom={zoom}
                style={{ height: '100%', width: '100%', borderRadius: 'var(--radius-xl)' }}
                scrollWheelZoom={true}
            >
                <LayersControl position="topright">
                    <LayersControl.BaseLayer checked name="Streets">
                        <TileLayer
                            attribution='&copy; <a href="https://www.openstreetmap.org">OpenStreetMap</a>'
                            url="https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png"
                        />
                    </LayersControl.BaseLayer>
                    <LayersControl.BaseLayer name="Satellite">
                        <TileLayer
                            attribution='&copy; Google'
                            url="https://mt1.google.com/vt/lyrs=s&x={x}&y={y}&z={z}"
                            maxZoom={20}
                        />
                    </LayersControl.BaseLayer>
                    <LayersControl.BaseLayer name="Hybrid">
                        <TileLayer
                            attribution='&copy; Google'
                            url="https://mt1.google.com/vt/lyrs=y&x={x}&y={y}&z={z}"
                            maxZoom={20}
                        />
                    </LayersControl.BaseLayer>
                </LayersControl>

                {institutions.length > 0 && <FitBounds institutions={institutions} />}

                {institutions.map(inst => (
                    <Marker
                        key={inst.id}
                        position={[inst.lat, inst.lng]}
                        icon={createCustomIcon(inst.type, getField)}
                        eventHandlers={{
                            click: () => onSelect?.(inst.id),
                        }}
                    >
                        <Popup>
                            <div className="map-popup">
                                <h4 className="map-popup__name">{getField(inst, 'name')}</h4>
                                <p className="map-popup__city">
                                    <FiMapPin size={12} /> {inst.commune || ''}
                                </p>
                                <div className="map-popup__rating">
                                    <FiStar size={12} fill="#F59E0B" stroke="#F59E0B" />
                                    <span>{inst.rating_avg || 0}</span>
                                    <span className="map-popup__reviews">({inst.rating_count || 0})</span>
                                </div>
                                <Link to={`/institution/${inst.id}`} className="map-popup__link">
                                    {dir === 'rtl' ? 'عرض الملف ←' : 'Voir le profil →'}
                                </Link>
                            </div>
                        </Popup>
                    </Marker>
                ))}

                <LocateButton />
            </MapContainer>
        </div>
    );
}
