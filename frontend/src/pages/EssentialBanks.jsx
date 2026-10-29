import { useState } from 'react';
import EssentialShell from '../components/EssentialShell';
import { useLanguage } from '../context/LanguageContext';
import { translate as tr } from '../i18n/coordination';
import { BLOOD_BANKS } from '../data/bloodBanks';
import styles from './Essential.module.css';
export default function EssentialBanks(){
  const {lang}=useLanguage();const [query,setQuery]=useState('');
  const banks=BLOOD_BANKS.filter(b=>`${b.name} ${b.district} ${b.state}`.toLowerCase().includes(query.toLowerCase()));
  return <EssentialShell><div className={styles.page}><h1>{tr('Blood banks')}</h1><p>{lang==='ta'?'செல்வதற்கு முன் அழைத்து இரத்தம் இருப்பதை உறுதிசெய்யவும். இவை நேரடி இருப்பு விவரங்கள் அல்ல.':'Call before visiting to check availability. This is not live blood-stock information.'}</p>
    <label>{tr('District')} <input value={query} onChange={e=>setQuery(e.target.value)}/></label>
    {banks.map(b=><article key={b.id} className={styles.card}><h2>{b.name}</h2><p>{b.address}</p><a href={`tel:${b.phone}`}>{tr('Call')} {b.phone}</a></article>)}
  </div></EssentialShell>;
}
