import {useEffect, useState} from 'react';
import {Link, Navigate, useLocation} from 'react-router-dom';
import {useLanguage} from '../context/LanguageContext';
import {rememberDestination} from '../config/authDestination';
import API from '../config/api';

export default function PrivateRoute({children}) {
  const location = useLocation();
  const {lang} = useLanguage();
  const token = localStorage.getItem('token');
  const [state, setState] = useState('checking');
  const [attempt, setAttempt] = useState(0);
  const text = (en, ta) => lang === 'ta' ? ta : en;
  useEffect(() => {
    if (!token) { setState('invalid'); return; }
    const controller = new AbortController();
    let active = true;
    setState('checking');
    const timeout = setTimeout(() => controller.abort(), 15000);
    fetch(`${API}/api/users/me`, {headers: {Authorization: `Bearer ${token}`}, signal: controller.signal})
      .then(async response => {
        if (!active) return;
        if ([401,403,404].includes(response.status)) {
          if (localStorage.getItem('token') === token) {
            localStorage.removeItem('token'); localStorage.removeItem('user');
          }
          setState('invalid'); return;
        }
        if (!response.ok) throw new Error('Server unavailable');
        const user = await response.json();
        if (!user?._id) throw new Error('Invalid session response');
        if (active) setState('valid');
      })
      .catch(() => { if (active) setState('offline'); })
      .finally(() => clearTimeout(timeout));
    return () => {active = false; clearTimeout(timeout); controller.abort();};
  }, [token, attempt]);
  if (!token || state === 'invalid') {
    rememberDestination(location.pathname + location.search);
    return <Navigate to="/login" replace />;
  }
  if (state === 'checking') return <p role="status" style={{padding:32}}>{text('Checking your sign-in…','உங்கள் உள்நுழைவைச் சரிபார்க்கிறது…')}</p>;
  if (state === 'offline') return <section role="alert" style={{padding:32, maxWidth:640, margin:'32px auto'}}>
    <h2>{text('Unable to connect to LifeLink','LifeLink உடன் இணைக்க முடியவில்லை')}</h2>
    <p>{text('We could not check your sign-in. Please retry when the server is available.','உங்கள் உள்நுழைவைச் சரிபார்க்க முடியவில்லை. சேவையகம் கிடைக்கும்போது மீண்டும் முயலவும்.')}</p>
    <button onClick={() => setAttempt(n => n + 1)}>{text('Retry','மீண்டும் முயல்')}</button>{' · '}
    <Link to="/login">{text('Log In','உள்நுழை')}</Link>{' · '}<Link to="/signup">{text('Sign Up','பதிவு செய்')}</Link>
  </section>;
  return children;
}
