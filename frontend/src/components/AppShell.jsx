import { Link, useLocation, useNavigate } from 'react-router-dom';
import {useLanguage} from '../context/LanguageContext';
import {useTheme} from '../context/ThemeContext';
import BrandLogo from './BrandLogo';
import styles from './AppShell.module.css';
export default function AppShell({children}) {
 const {lang,toggle:language}=useLanguage(); const {theme,toggle}=useTheme(); const location=useLocation(); const navigate=useNavigate();
 const text=(en,ta)=>lang==='ta'?ta:en;
 const links=[['/','Home','முகப்பு'],['/request','Request blood','இரத்தம் தேவை'],['/donate','Donate blood','இரத்தம் கொடுக்க'],['/history','My requests','எனது கோரிக்கைகள்'],['/profile','Profile','சுயவிவரம்']];
 return <><header className="simple-app-header"><div className="simple-top"><Link to="/" className="simple-brand"><BrandLogo size={32}/>LifeLink</Link><div className="simple-tools"><button onClick={language}>{lang==='en'?'தமிழ்':'English'}</button><button onClick={toggle} aria-label={text('Switch theme','தோற்றத்தை மாற்று')}>{theme==='light'?'🌙':'☀️'}</button><button onClick={()=>{localStorage.removeItem('token');localStorage.removeItem('user');navigate('/');}}>{text('Log out','வெளியேறு')}</button></div></div><nav className="simple-tabs" aria-label={text('Main navigation','முதன்மை வழிசெலுத்தல்')}>{links.map(([path,en,ta])=><Link key={path} to={path} aria-current={location.pathname===path?'page':undefined}>{text(en,ta)}</Link>)}</nav></header><main>{children}</main><footer className="simple-footer"><Link to="/search?tab=banks">{text('Blood-bank directory','இரத்த வங்கி பட்டியல்')}</Link></footer></>;
}
