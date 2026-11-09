import {Link} from 'react-router-dom';
import {useLanguage} from '../context/LanguageContext';
import styles from './Auth.module.css';
export default function ForgotPassword(){const {lang}=useLanguage();return <div className={styles.page}><div className={styles.card}><h1>{lang==='ta'?'கடவுச்சொல் உதவி':'Password help'}</h1><p>{lang==='ta'?'மின்னஞ்சல் மூலம் கடவுச்சொல்லை மாற்றும் வசதி இன்னும் தயாராகவில்லை. குறியீடு அனுப்பப்படாது.':'Email password recovery is not available yet. No code will be sent.'}</p><Link to="/login">{lang==='ta'?'உள்நுழைவுக்குத் திரும்பு':'Back to login'}</Link></div></div>;}
