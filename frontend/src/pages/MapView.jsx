import { useEffect, useRef, useState } from 'react';
import { io } from 'socket.io-client';
import AppShell from '../components/AppShell';
import styles from './MapView.module.css';
import { BLOOD_BANKS } from '../data/bloodBanks';

import API_BASE from '../config/api.js';
const API = API_BASE;
const token = () => localStorage.getItem('token');

// Indian city coordinates lookup
const CITY_COORDS = {
  // Tamil Nadu
  'chennai':        [13.0827, 80.2707], 'coimbatore':    [11.0168, 76.9558],
  'madurai':        [9.9252,  78.1198], 'tiruchirappalli':[10.7905,78.7047],
  'trichy':         [10.7905, 78.7047], 'salem':         [11.6643, 78.1460],
  'tirunelveli':    [8.7139,  77.7567], 'vellore':       [12.9165, 79.1325],
  'erode':          [11.3410, 77.7172], 'tiruppur':      [11.1085, 77.3411],
  'thoothukudi':    [8.7642,  78.1348], 'dindigul':      [10.3624, 77.9695],
  'thanjavur':      [10.7870, 79.1378], 'kanchipuram':   [12.8342, 79.7036],
  'nagercoil':      [8.1833,  77.4119], 'kumbakonam':    [10.9602, 79.3845],
  'hosur':          [12.7409, 77.8253], 'cuddalore':     [11.7480, 79.7714],
  'karur':          [10.9601, 78.0766],
  // Other major cities
  'mumbai':         [19.0760, 72.8777], 'delhi':         [28.6139, 77.2090],
  'bangalore':      [12.9716, 77.5946], 'bengaluru':     [12.9716, 77.5946],
  'hyderabad':      [17.3850, 78.4867], 'kolkata':       [22.5726, 88.3639],
  'pune':           [18.5204, 73.8567], 'ahmedabad':     [23.0225, 72.5714],
  'jaipur':         [26.9124, 75.7873], 'lucknow':       [26.8467, 80.9462],
  'surat':          [21.1702, 72.8311], 'kochi':         [9.9312,  76.2673],
  'nagpur':         [21.1458, 79.0882], 'visakhapatnam': [17.6868, 83.2185],
  'bhopal':         [23.2599, 77.4126], 'indore':        [22.7196, 75.8577],
  'patna':          [25.5941, 85.1376], 'chandigarh':    [30.7333, 76.7794],
};

function getCityCoords(district, state) {
  if (!district && !state) return null;
  return (
    CITY_COORDS[(district || '').toLowerCase().trim()] ||
    CITY_COORDS[(state || '').toLowerCase().trim()] ||
    null
  );
}

export default function MapView() {
  const mapRef = useRef(null);
  const mapInstanceRef = useRef(null);
  const markersRef = useRef({});
  const broadcastMarkersRef = useRef({});
  const bankMarkersRef = useRef([]);
  const [donors, setDonors] = useState([]);
  const [broadcasts, setBroadcasts] = useState([]);
  const [mapReady, setMapReady] = useState(false);
  const [layer, setLayer] = useState('all'); // 'all' | 'donors' | 'requests' | 'banks'

  // Load Leaflet CSS
  useEffect(() => {
    if (!document.getElementById('leaflet-css')) {
      const link = document.createElement('link');
      link.id = 'leaflet-css';
      link.rel = 'stylesheet';
      link.href = 'https://unpkg.com/leaflet@1.9.4/dist/leaflet.css';
      document.head.appendChild(link);
    }
  }, []);

  // Init map
  useEffect(() => {
    if (mapInstanceRef.current) return;
    import('leaflet').then((L) => {
      const map = L.map(mapRef.current, {
        center: [20.5937, 78.9629],
        zoom: 5,
        zoomControl: true,
      });

      L.tileLayer('https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png', {
        attribution: '© OpenStreetMap',
        maxZoom: 18,
      }).addTo(map);

      mapInstanceRef.current = map;
      setMapReady(true);
    });

    return () => {
      if (mapInstanceRef.current) {
        mapInstanceRef.current.remove();
        mapInstanceRef.current = null;
      }
    };
  }, []);

  // Fetch donors + broadcasts
  useEffect(() => {
    const fetchData = async () => {
      try {
        const [dRes, bRes] = await Promise.all([
          fetch(`${API}/api/users/donors`, { headers: { Authorization: `Bearer ${token()}` } }),
          fetch(`${API}/api/broadcasts`, { headers: { Authorization: `Bearer ${token()}` } }),
        ]);
        if (dRes.ok) setDonors(await dRes.json());
        if (bRes.ok) setBroadcasts((await bRes.json()).filter(b => b.status === 'active'));
      } catch { /* ignore */ }
    };
    fetchData();

    // Real-time updates
    const socket = io({ transports: ['websocket'] });
    socket.on('donor_updated', () => fetchData());
    socket.on('new_broadcast', (b) => setBroadcasts(prev => [b, ...prev]));
    socket.on('broadcast_updated', ({ broadcastId, status }) => {
      setBroadcasts(prev => prev.filter(b => b._id !== broadcastId || status === 'active'));
    });
    return () => socket.disconnect();
  }, []);

  // Render donor markers
  useEffect(() => {
    if (!mapReady || !mapInstanceRef.current) return;
    import('leaflet').then((L) => {
      const map = mapInstanceRef.current;

      // Remove old donor markers
      Object.values(markersRef.current).forEach(m => m.remove());
      markersRef.current = {};

      donors.forEach((donor) => {
        const coords = donor.location?.lat
          ? [donor.location.lat, donor.location.lng]
          : getCityCoords(donor.district, donor.state);
        if (!coords) return;

        const icon = L.divIcon({
          className: '',
          html: `<div style="
            background:linear-gradient(135deg,#d32f2f,#1a237e);
            color:#fff;font-size:11px;font-weight:800;
            border-radius:50%;width:36px;height:36px;
            display:flex;align-items:center;justify-content:center;
            border:2px solid #fff;box-shadow:0 2px 8px rgba(211,47,47,0.5);
            cursor:pointer;
          ">${donor.bloodGroup}</div>`,
          iconSize: [36, 36],
          iconAnchor: [18, 18],
        });

        const marker = L.marker(coords, { icon })
          .addTo(map)
          .bindPopup(`
            <div style="font-family:sans-serif;min-width:140px">
              <strong style="color:#d32f2f">${donor.bloodGroup}</strong> Donor<br/>
              <span style="font-size:13px">${donor.fullName}</span><br/>
              <span style="font-size:12px;color:#666">📍 ${[donor.district, donor.state].filter(Boolean).join(', ') || 'Unknown'}</span><br/>
              <span style="font-size:11px;color:#4caf50">● Available</span>
            </div>
          `);

        markersRef.current[donor._id] = marker;
      });
    });
  }, [mapReady, donors]);

  // Render broadcast markers
  useEffect(() => {
    if (!mapReady || !mapInstanceRef.current) return;
    import('leaflet').then((L) => {
      const map = mapInstanceRef.current;

      Object.values(broadcastMarkersRef.current).forEach(m => m.remove());
      broadcastMarkersRef.current = {};

      broadcasts.forEach((b) => {
        const coords = b.sosLocation?.lat
          ? [b.sosLocation.lat, b.sosLocation.lng]
          : getCityCoords(b.district, b.state);
        if (!coords) return;

        const urgencyColor = b.urgency === 'critical' ? '#d32f2f' : b.urgency === 'urgent' ? '#e65100' : '#f57f17';
        const icon = L.divIcon({
          className: '',
          html: `<div style="
            background:${urgencyColor};color:#fff;
            font-size:10px;font-weight:700;
            border-radius:4px 4px 0 4px;
            padding:4px 7px;
            box-shadow:0 2px 8px rgba(0,0,0,0.3);
            white-space:nowrap;
            border:1.5px solid #fff;
            animation: pulse 1.5s infinite;
          ">🩸 ${b.bloodGroup}</div>`,
          iconSize: [52, 28],
          iconAnchor: [26, 28],
        });

        const marker = L.marker(coords, { icon })
          .addTo(map)
          .bindPopup(`
            <div style="font-family:sans-serif;min-width:160px">
              <strong style="color:${urgencyColor}">🚨 ${b.urgency.toUpperCase()}</strong><br/>
              <strong>${b.bloodGroup}</strong> needed · ${b.units} unit${b.units > 1 ? 's' : ''}<br/>
              <span style="font-size:12px">📍 ${[b.district, b.state].filter(Boolean).join(', ')}${b.hospital ? ' · ' + b.hospital : ''}</span><br/>
              <span style="font-size:12px;color:#666">👤 ${b.requesterName} · ${b.requesterPhone}</span>
              ${b.message ? `<br/><em style="font-size:11px;color:#888">"${b.message}"</em>` : ''}
            </div>
          `);

        broadcastMarkersRef.current[b._id] = marker;
      });
    });
  }, [mapReady, broadcasts]);

  // Render blood bank markers
  useEffect(() => {
    if (!mapReady || !mapInstanceRef.current) return;
    import('leaflet').then((L) => {
      const map = mapInstanceRef.current;
      bankMarkersRef.current.forEach(m => m.remove());
      bankMarkersRef.current = [];

      BLOOD_BANKS.forEach((bank) => {
        const coords = getCityCoords(bank.district, bank.state);
        if (!coords) return;
        const typeColor = bank.type === 'Red Cross' ? '#c62828' : bank.type === 'Government' ? '#1565c0' : '#2e7d32';
        const icon = L.divIcon({
          className: '',
          html: `<div style="
            background:${typeColor};color:#fff;
            font-size:13px;border-radius:50%;width:28px;height:28px;
            display:flex;align-items:center;justify-content:center;
            border:2px solid #fff;box-shadow:0 2px 6px rgba(0,0,0,0.35);
          ">🏥</div>`,
          iconSize: [28, 28], iconAnchor: [14, 14],
        });
        const m = L.marker(coords, { icon })
          .addTo(map)
          .bindPopup(`
            <div style="font-family:sans-serif;min-width:170px">
              <strong style="color:${typeColor}">${bank.name}</strong><br/>
              <span style="font-size:12px">📍 ${bank.address}</span><br/>
              <span style="font-size:12px">📞 ${bank.phone}</span><br/>
              <span style="font-size:11px;color:#666">⏰ ${bank.hours} · ${bank.type}</span>
            </div>
          `);
        bankMarkersRef.current.push(m);
      });
    });
  }, [mapReady]);

  // Layer visibility
  useEffect(() => {
    Object.values(markersRef.current).forEach(m => {
      const el = m.getElement?.();
      if (el) el.style.display = (layer === 'all' || layer === 'donors') ? '' : 'none';
    });
    Object.values(broadcastMarkersRef.current).forEach(m => {
      const el = m.getElement?.();
      if (el) el.style.display = (layer === 'all' || layer === 'requests') ? '' : 'none';
    });
    bankMarkersRef.current.forEach(m => {
      const el = m.getElement?.();
      if (el) el.style.display = (layer === 'all' || layer === 'banks') ? '' : 'none';
    });
  }, [layer, mapReady]);

  const donorCount = donors.length;
  const broadcastCount = broadcasts.length;

  return (
    <AppShell connected={true}>
    <div className={styles.wrap}>
      {/* Layer toggle */}
      <div className={styles.layerBar}>
        {[
          { key: 'all',      label: '🗺️ All' },
          { key: 'donors',   label: `🩸 Donors (${donorCount})` },
          { key: 'requests', label: `🚨 Requests (${broadcastCount})` },
          { key: 'banks',    label: `🏥 Blood Banks (${BLOOD_BANKS.length})` },
        ].map(({ key, label }) => (
          <button
            key={key}
            className={`${styles.layerBtn} ${layer === key ? styles.layerBtnActive : ''}`}
            onClick={() => setLayer(key)}
          >{label}</button>
        ))}
      </div>

      <div ref={mapRef} className={styles.map} />
    </div>
    </AppShell>
  );
}
