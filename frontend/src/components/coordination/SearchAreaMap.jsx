import { useLanguage } from "../../context/LanguageContext";
import { translate as tr } from "../../i18n/coordination";
import { useEffect, useRef } from 'react';
import L from 'leaflet';
import 'leaflet/dist/leaflet.css';
import styles from './Coordination.module.css';
export default function SearchAreaMap({
  lat,
  lng,
  radiusKm
}) {
  useLanguage();
  const container = useRef(null);
  const map = useRef(null);
  const circle = useRef(null);
  const pin = useRef(null);
  useEffect(() => {
    const instance = L.map(container.current, {
      scrollWheelZoom: false,
      zoomAnimation: false
    });
    map.current = instance;
    L.tileLayer('https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png', {
      attribution: '&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a> contributors',
      maxZoom: 19
    }).addTo(instance);
    const observer = new ResizeObserver(() => instance.invalidateSize());
    observer.observe(container.current);
    return () => {
      observer.disconnect();
      instance.remove();
      map.current = null;
      circle.current = null;
      pin.current = null;
    };
  }, []);
  useEffect(() => {
    if (!map.current) return;
    const point = [lat, lng];
    const previousRadius = circle.current?.getRadius();
    if (!pin.current) pin.current = L.circleMarker(point, {
      radius: 6,
      color: '#fff',
      fillColor: '#a81f35',
      fillOpacity: 1
    }).addTo(map.current).bindTooltip(tr('Hospital'));else pin.current.setLatLng(point);
    if (!circle.current) circle.current = L.circle(point, {
      radius: radiusKm * 1000,
      color: '#c62840',
      weight: 2,
      fillOpacity: 0.09,
      className: styles.mapCircle
    }).addTo(map.current);else circle.current.setLatLng(point).setRadius(radiusKm * 1000);
    // Set the genuine geographic radius directly; CSS fades the updated boundary.
    // No fabricated donor dots or simulated transport-time estimates.
    map.current.fitBounds(circle.current.getBounds(), {
      padding: [18, 18],
      animate: false
    });
    const boundary = circle.current.getElement();
    if (boundary && previousRadius && previousRadius !== radiusKm * 1000) {
      boundary.style.setProperty('--from-scale', previousRadius / (radiusKm * 1000));
      boundary.classList.remove(styles.mapCircle);
      boundary.getBoundingClientRect();
      boundary.classList.add(styles.mapCircle);
    }
  }, [lat, lng, radiusKm]);
  return <div className={styles.map} ref={container} role="region" aria-label={tr(`Hospital search area: ${radiusKm} kilometres`)} />;
}
