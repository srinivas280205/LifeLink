import {useState} from 'react';
import {Link,useNavigate} from 'react-router-dom';
import {useLanguage} from '../context/LanguageContext';
import {useTheme} from '../context/ThemeContext';
import {authDestination} from '../config/authDestination';
import API from '../config/api';
import BrandLogo from '../components/BrandLogo';
import styles from './Auth.module.css';
export default function Signup(){
 const {lang,toggle:language}=useLanguage();const {theme,toggle}=useTheme();const nav=useNavigate();const text=(en,ta)=>lang==='ta'?ta:en;
 const [form,setForm]=useState({fullName:'',email:'',phone:'',password:'',bloodGroup:''});const [busy,setBusy]=useState(false);const [error,setError]=useState('');
 const field=(key,value)=>setForm(p=>({...p,[key]:value}));
 async function submit(e){e.preventDefault();if(busy)return;setError('');const digits=form.phone.replace(/[^0-9]/g,'');const phone=digits.length===10?'+91'+digits:'+'+digits;
 if(!/^\+[1-9][0-9]{7,14}$/.test(phone)){setError(text('Enter a valid phone number.','சரியான தொலைபேசி எண்ணை உள்ளிடுங்கள்.'));return;}
 setBusy(true);try{const res=await fetch(`${API}/api/auth/signup`,{method:'POST',headers:{'Content-Type':'application/json'},body:JSON.stringify({...form,email:form.email.trim().toLowerCase(),phone})});const data=await res.json();if(!res.ok)throw Error(data.message);localStorage.setItem('token',data.token);localStorage.setItem('user',JSON.stringify(data.user));nav(authDestination(),{replace:true});}catch(err){setError(lang==='ta'?'கணக்கை உருவாக்க முடியவில்லை. விவரங்களைச் சரிபார்த்து மீண்டும் முயலுங்கள்.':err.message||'Unable to create account.');}finally{setBusy(false)}}
 return <div className={styles.page}><div className={styles.card}><div style={{display:'flex',justifyContent:'space-between',gap:12}}><Link to="/" aria-label="LifeLink"><BrandLogo size={42}/></Link><div><button type="button" onClick={language}>{lang==='en'?'தமிழ்':'English'}</button><button type="button" onClick={toggle} aria-label={text('Switch theme','தோற்றத்தை மாற்று')}>{theme==='light'?'🌙':'☀️'}</button></div></div><h1>{text('Join LifeLink','LifeLink-இல் இணையுங்கள்')}</h1><p>{text('One account to request blood or offer help.','இரத்தம் கோரவும் உதவ முன்வரவும் ஒரே கணக்கு.')}</p>
 <form onSubmit={submit}><fieldset disabled={busy} style={{border:0,padding:0}}>
 {[["fullName",text('Full name','முழுப் பெயர்'),'text'],['email',text('Email address','மின்னஞ்சல்'),'email'],['phone',text('Phone number','தொலைபேசி எண்'),'tel'],['password',text('Password (at least 8 characters)','கடவுச்சொல் (குறைந்தது 8 எழுத்துகள்)'),'password']].map(([key,label,type])=><div className={styles.field} key={key}><label htmlFor={key}>{label}</label><input id={key} type={type} required value={form[key]} minLength={key==='password'?8:undefined} maxLength={key==='password'?128:150} autoComplete={key==='password'?'new-password':key==='fullName'?'name':key==='phone'?'tel':'email'} onChange={e=>field(key,e.target.value)} placeholder={key==='phone'?'+91 98765 43210':undefined}/></div>)}
 <div className={styles.field}><label htmlFor="bloodGroup">{text('Blood group (optional for requesters)','இரத்த வகை (கோருபவர்களுக்கு விருப்பமானது)')}</label><select id="bloodGroup" value={form.bloodGroup} onChange={e=>field('bloodGroup',e.target.value)}><option value="">{text('Choose later','பிறகு தேர்வு செய்')}</option>{['A+','A-','B+','B-','AB+','AB-','O+','O-'].map(g=><option key={g}>{g}</option>)}</select></div>
 {error&&<p className={styles.error} role="alert">{error}</p>}<button className={styles.btn} type="submit" disabled={busy}>{busy?text('Creating account…','கணக்கு உருவாகிறது…'):text('Create account','கணக்கை உருவாக்கு')}</button></fieldset></form><p className={styles.switch}>{text('Already have an account?','ஏற்கெனவே கணக்கு உள்ளதா?')} <Link to="/login">{text('Log in','உள்நுழை')}</Link></p></div></div>
}
