import { useState } from 'react';
import { useLanguage } from '../../context/LanguageContext';
import { translate as tr } from '../../i18n/coordination';
import API from '../../config/api';
import styles from './Coordination.module.css';
export default function DonorAvailability(){
  useLanguage();
  const [available,setAvailable]=useState(JSON.parse(localStorage.getItem('user')||'{}').isAvailable !== false);
  const [busy,setBusy]=useState(false),[error,setError]=useState(false);
  async function change(value){setBusy(true);setError(false);try{
    const r=await fetch(`${API}/api/users/profile`,{method:'PATCH',headers:{Authorization:`Bearer ${localStorage.getItem('token')}`,'Content-Type':'application/json'},body:JSON.stringify({isAvailable:value})});
    if(!r.ok)throw Error();const data=await r.json();localStorage.setItem('user',JSON.stringify({...JSON.parse(localStorage.getItem('user')||'{}'),...data.user}));setAvailable(value);
  }catch{setError(true);}finally{setBusy(false);}}
  return <div className={styles.card}><label className={styles.check}><input type="checkbox" checked={available} disabled={busy} onChange={e=>change(e.target.checked)}/>{tr('Available to donate')}</label>{error&&<p role="alert">{tr('Something went wrong. Please refresh and try again.')}</p>}</div>;
}
