import { displayError } from './api';
import { useLanguage } from "../../context/LanguageContext";
import { translate as tr } from "../../i18n/coordination";
import { useCallback, useEffect, useRef, useState } from 'react';
import { useSearchParams, useLocation } from 'react-router-dom';
import { io } from 'socket.io-client';
import API_BASE from '../../config/api.js';
import { coordinationApi, labels } from './api';
import RequestForm from './RequestForm';
import RequestProgress from './RequestProgress';
import DonorLocation from './DonorLocation';
import DonorAvailability from './DonorAvailability';
import styles from './Coordination.module.css';
import { LoadingSkeleton } from './ProgressVisuals';
import CoordinationIcon from './CoordinationIcon';
export default function CoordinationPanel() {
  useLanguage();
  const [params, setParams] = useSearchParams();
  const pathname = useLocation().pathname;
  const historyPage = pathname === '/history';
  const donorView = pathname === '/donate' || params.get('view') === 'donor';
  const selectedId = params.get('coordination') || '';
  const [requests, setRequests] = useState([]);
  const [detail, setDetail] = useState(null);
  const [available, setAvailable] = useState(null);
  const [error, setError] = useState('');
  const [actionError, setActionError] = useState('');
  const [notice, setNotice] = useState('');
  const [busy, setBusy] = useState(false);
  const [newRequest, setNewRequest] = useState(pathname === '/request');
  const [tab, setTab] = useState(donorView ? 'alerts' : 'requests');
  useEffect(() => {setTab(donorView ? 'alerts' : 'requests');setNewRequest(pathname === '/request');setDetail(null);},[pathname,donorView]);
  const [connected, setConnected] = useState(false);
  const inFlight = useRef(null);
  useEffect(() => {
    if (!notice) return;
    const timer = setTimeout(() => setNotice(''), 3000);
    return () => clearTimeout(timer);
  }, [notice]);
  const refresh = useCallback(async () => {
    inFlight.current?.abort();
    const controller = new AbortController();
    inFlight.current = controller;
    try {
      const list = await coordinationApi('', {
        signal: controller.signal
      });
      if (controller.signal.aborted) return;
      setRequests(list);
      setAvailable(true);
      setError('');
      if (selectedId) {
        const result = await coordinationApi(`/${encodeURIComponent(selectedId)}`, {
          signal: controller.signal
        });
        if (!controller.signal.aborted) setDetail(result);
      }
    } catch (err) {
      if (err.name === 'AbortError') return;
      if ([404, 503].includes(err.status) && !selectedId) setAvailable(false);
      setError(err.status === 503 ? tr('Donor coordination is not available right now.') : err.message);
    }
  }, [selectedId]);
  useEffect(() => {
    const socket = io(API_BASE || undefined, {
      auth: callback => callback({
        token: localStorage.getItem('token')
      })
    });
    let debounce;
    const reload = () => {
      clearTimeout(debounce);
      debounce = setTimeout(refresh, 200);
    };
    socket.on('connect', () => {
      setConnected(true);
      reload();
    });
    socket.on('disconnect', () => setConnected(false));
    socket.on('coordination_updated', reload);
    const visible = () => {
      if (!document.hidden) reload();
    };
    document.addEventListener('visibilitychange', visible);
    refresh();
    const timer = setInterval(visible, 30000);
    return () => {
      inFlight.current?.abort();
      socket.disconnect();
      clearInterval(timer);
      clearTimeout(debounce);
      document.removeEventListener('visibilitychange', visible);
    };
  }, [refresh]);
  function choose(id) {
    setActionError('');
    setNotice('');
    setParams(previous => {
      const next = new URLSearchParams(previous);
      if (id) next.set('coordination', id);else next.delete('coordination');
      return next;
    }, {
      replace: true
    });
  }
  async function act(action, data = {}) {
    if (busy) return;
    setBusy(true);
    setActionError('');
    setNotice('');
    inFlight.current?.abort();
    try {
      const result = await coordinationApi(`/${selectedId}/actions`, {
        method: 'POST',
        body: JSON.stringify({
          action,
          ...data
        })
      });
      setDetail(result);
      setNotice('Update saved.');
    } catch (err) {
      setActionError(err.message);
    } finally {
      setBusy(false);
      refresh();
    }
  }
  function created(result) {
    setDetail(result);
    setNewRequest(false);
    choose(result._id);
    setTab('requests');
    setNotice('Request created. The search will start automatically.');
  }
  const activeTab = selectedId && detail?._id === selectedId ? detail.owner ? 'requests' : 'alerts' : tab;
  const displayed = requests.filter(request => activeTab === 'requests' ? request.owner : !request.owner);
  return <section className={styles.panel} aria-label={tr("Donor coordination")}>
    <header className={styles.header}>
      <div><h2>{tr(donorView ? 'Help someone nearby' : historyPage ? 'My requests' : 'Need blood')}</h2><p className={styles.hint}>{tr(donorView ? 'Choose a request below to help.' : 'No reply? We search farther. A donor withdraws? We search again.')}</p></div>
      {available && !donorView && <button className={styles.primary} disabled={busy || newRequest} onClick={() => setNewRequest(true)}>{tr("New blood request")}</button>}
    </header>
    {available === null && !error && <LoadingSkeleton />}
    {error && <div className={styles.error} role="alert"><p>{displayError(error)}</p><button onClick={refresh} disabled={busy}>{tr("Retry")}</button></div>}
    {available && <>
      <p className={styles.connection} data-connected={connected}>{connected ? tr('Live updates connected') : tr('Live connection unavailable · checking every 30 seconds')}</p>
      {donorView && <><DonorAvailability /><DonorLocation /></>}
      {newRequest && <RequestForm onCreated={created} onClose={() => setNewRequest(false)} />}
      {historyPage && <div className={styles.tabs} aria-label={tr("Request lists")}>
        <button disabled={busy} aria-pressed={activeTab === 'requests'} onClick={() => {
          setTab('requests');
          choose('');
        }}>{tr("My requests (")}{requests.filter(r => r.owner).length})</button>
        <button disabled={busy} aria-pressed={activeTab === 'alerts'} onClick={() => {
          setTab('alerts');
          choose('');
        }}>{tr("Donor alerts (")}{requests.filter(r => !r.owner).length})</button>
      </div>}
      <div className={styles.workspace} style={!displayed.length && !selectedId ? {gridTemplateColumns: '1fr'} : undefined}>
        <div className={styles.requestList}>
          {!displayed.length && <div className={styles.emptyState}><CoordinationIcon name={activeTab === 'requests' ? 'drop' : 'send'} /><p>{activeTab === 'requests' ? tr('No requests yet. Create one when blood is needed.') : tr('No donor alerts yet. Keep your donor location and availability up to date.')}</p></div>}
          {displayed.map(request => <button key={request._id} disabled={busy} className={styles.requestItem} aria-pressed={selectedId === request._id} onClick={() => choose(request._id)}>
            <strong>{request.bloodGroup} · {request.hospital}</strong><span>{request.district} · {tr(request.urgency)}</span><span>{request.status === 'active' ? tr(labels[request.searchStatus]) : tr(labels[request.status])}</span>{request.donorState && <span>{tr(labels[request.donorState])}</span>}
          </button>)}
        </div>
        {(displayed.length > 0 || selectedId) && <div className={styles.detail}>
          {actionError && <p role="alert" className={styles.error}>{displayError(actionError)}</p>}
          {notice && <p role="status" className={`${styles.notice} ${styles.toast}`}>{tr(notice)}</p>}
          {selectedId && detail?._id === selectedId ? <RequestProgress key={selectedId} request={detail} busy={busy || !!error} onAction={act} /> : selectedId ? <LoadingSkeleton /> : <div className={styles.emptyState}><CoordinationIcon name="radar" /><p>{tr("Choose a request to see its progress and actions.")}</p></div>}
        </div>}
      </div>

    </>}
  </section>;
}
