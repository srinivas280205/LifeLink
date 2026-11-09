import { displayError } from './api';
import { useLanguage } from "../../context/LanguageContext";
import { translate as tr } from "../../i18n/coordination";
import { useEffect, useRef, useState } from 'react';
import L from 'leaflet';
import 'leaflet/dist/leaflet.css';
import styles from './Coordination.module.css';
export default function LocationPicker({
  value,
  onChange,
  label
}) {
  useLanguage();
  const container = useRef(null);
  const map = useRef(null);
  const marker = useRef(null);
  const change = useRef(onChange);
  const [lat, setLat] = useState('');
  const [lng, setLng] = useState('');
  const [error, setError] = useState('');
  useEffect(() => {
    change.current = onChange;
  }, [onChange]);
  useEffect(() => {
    const instance = L.map(container.current, {
      scrollWheelZoom: false
    }).setView([20.5937, 78.9629], 4);
    map.current = instance;
    L.tileLayer('https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png', {
      attribution: '&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a> contributors',
      maxZoom: 19
    }).addTo(instance);
    instance.on('click', event => change.current({
      lat: event.latlng.lat,
      lng: event.latlng.lng
    }));
    const resize = new ResizeObserver(() => instance.invalidateSize());
    resize.observe(container.current);
    return () => {
      resize.disconnect();
      instance.remove();
      map.current = null;
      marker.current = null;
    };
  }, []);
  useEffect(() => {
    if (!map.current || !value) return;
    const point = [value.lat, value.lng];
    if (!marker.current) marker.current = L.circleMarker(point, {
      radius: 9,
      color: '#b71c1c',
      fillOpacity: 0.8
    }).addTo(map.current);else marker.current.setLatLng(point);
    map.current.setView(point, Math.max(14, map.current.getZoom()));
  }, [value]);
  function useCoordinates() {
    if (lat.trim() === '' || lng.trim() === '' || !Number.isFinite(Number(lat)) || !Number.isFinite(Number(lng)) || Math.abs(Number(lat)) > 90 || Math.abs(Number(lng)) > 180) {
      setError('Enter a valid latitude (−90 to 90) and longitude (−180 to 180).');
      return;
    }
    setError('');
    onChange({
      lat: Number(lat),
      lng: Number(lng)
    });
  }
  return <div>
    <p className={styles.hint}>{tr("Zoom in and tap the map to choose")}{label} {' '} {tr(". You can also enter coordinates below.")}</p>
    <div ref={container} className={styles.map} role="region" aria-label={tr(`Choose ${label} on map`)} />
    <p className={styles.hint} role="status">{value ? tr(`Chosen point: ${value.lat.toFixed(5)}, ${value.lng.toFixed(5)}`) : tr('No location chosen yet.')}</p>
    <details className={styles.coordinates}><summary>{tr("Enter coordinates instead")}</summary>
      <div className={styles.row}>
        <label>{tr("Latitude")}<input aria-label={tr(`${label} latitude`)} type="number" step="any" min="-90" max="90" value={lat} onChange={e => setLat(e.target.value)} /></label>
        <label>{tr("Longitude")}<input aria-label={tr(`${label} longitude`)} type="number" step="any" min="-180" max="180" value={lng} onChange={e => setLng(e.target.value)} /></label>
        <button type="button" onClick={useCoordinates}>{tr("Use coordinates")}</button>
      </div>
      {error && <p role="alert" className={styles.error}>{displayError(error)}</p>}
    </details>
  </div>;
}
