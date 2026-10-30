import { useLanguage } from "../../context/LanguageContext";
import { translate as tr } from "../../i18n/coordination";
import { lazy, Suspense } from 'react';
const Map = lazy(() => import('./LocationPicker'));
export default function LazyLocationPicker(props) {
  useLanguage();
  return <Suspense fallback={<p role="status">{tr("Loading location picker\u2026")}</p>}><Map {...props} /></Suspense>;
}
