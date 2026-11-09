import {Link,useLocation,useNavigate} from 'react-router-dom';
import {useLanguage} from '../context/LanguageContext';
export default function BackNavigation(){
 const location=useLocation(),navigate=useNavigate();const {lang}=useLanguage();
 if(location.pathname==='/')return null;
 function back(){
  const q=new URLSearchParams(location.search);
  if(q.has('coordination')){q.delete('coordination');navigate({pathname:location.pathname,search:q.toString()},{replace:true});return;}
  if(window.history.state?.idx>0)navigate(-1);else navigate('/');
 }
 return <nav aria-label={lang==='ta'?'திரும்பிச் செல்ல':'Back navigation'} style={{display:'flex',gap:20,padding:'12px 20px',alignItems:'center',background:'var(--card-bg)',color:'var(--text)'}}>
 <button type="button" onClick={back} style={{font:'inherit',minHeight:44,padding:'8px 16px',border:'1px solid var(--border)',borderRadius:10,background:'var(--card-bg)',color:'var(--text)',cursor:'pointer'}}>← {lang==='ta'?'பின்செல்':'Back'}</button><Link to="/" style={{color:'var(--text)'}}>{lang==='ta'?'முகப்பு':'Home'}</Link></nav>;
}
