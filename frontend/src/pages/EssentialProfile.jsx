import {BLOOD_GROUPS} from '../config/bloodGroups';
import { useEffect, useState } from 'react';
import EssentialShell from '../components/EssentialShell';
import { useLanguage } from '../context/LanguageContext';
import { translate as tr } from '../i18n/coordination';
import API from '../config/api';
import styles from './Essential.module.css';
export default function EssentialProfile() {
  useLanguage();
  const [profile,setProfile]=useState(null), [busy,setBusy]=useState(false), [message,setMessage]=useState('');
  const headers=()=>({Authorization:`Bearer ${localStorage.getItem('token')}`,'Content-Type':'application/json'});
  useEffect(()=>{fetch(`${API}/api/users/me`,{headers:headers()}).then(r=>{if(!r.ok)throw Error();return r.json();}).then(setProfile).catch(()=>setMessage('Something went wrong. Please refresh and try again.'));},[]);
  async function save(e){e.preventDefault();setBusy(true);setMessage('');try{
    const r=await fetch(`${API}/api/users/profile`,{method:'PATCH',headers:headers(),body:JSON.stringify({fullName:profile.fullName,bloodGroup:profile.bloodGroup,district:profile.district,isAvailable:profile.isAvailable})});
    if(!r.ok)throw Error();const data=await r.json();const old=JSON.parse(localStorage.getItem('user')||'{}');localStorage.setItem('user',JSON.stringify({...old,...data.user}));setMessage('Saved');
  }catch{setMessage('Something went wrong. Please refresh and try again.');}finally{setBusy(false);}}
  const field=(key,value)=>setProfile(p=>({...p,[key]:value}));
  return <EssentialShell><div className={styles.page}><h1>{tr('Profile details')}</h1>{message&&<p role="status" className={styles.status}>{tr(message)}</p>}
    {profile&&<form onSubmit={save} className={styles.card}><fieldset disabled={busy} style={{border:0,padding:0}}><div className={styles.fields}>
      <label>{tr('Name')}<input required maxLength={100} value={profile.fullName||''} onChange={e=>field('fullName',e.target.value)}/></label>
      <label>{tr('Phone')}<input readOnly value={profile.phone||''}/></label>
      <label>{tr('Blood group')}<select required value={profile.bloodGroup||''} onChange={e=>field('bloodGroup',e.target.value)}><option value="">{tr('Choose group')}</option>{BLOOD_GROUPS.map(g=><option key={g}>{g}</option>)}</select></label>
      <label>{tr('District')}<input required maxLength={100} value={profile.district||''} onChange={e=>field('district',e.target.value)}/></label></div>
      <label className={styles.check}><input type="checkbox" checked={!!profile.isAvailable} onChange={e=>field('isAvailable',e.target.checked)}/>{tr('Available to donate')}</label>
      <p>{tr('Your phone number is shown only after selection.')}</p><button type="submit">{tr('Save')}</button></fieldset></form>}
    <div className={styles.secondary}><button onClick={()=>{localStorage.removeItem('token');localStorage.removeItem('user');window.location.assign('/login');}}>{tr('Sign out')}</button></div>
  </div></EssentialShell>;
}
