import { rememberDestination } from '../config/authDestination';
import { Link } from 'react-router-dom';
import { useState, useEffect } from 'react';
import { useTheme } from '../context/ThemeContext';
import { useLanguage } from '../context/LanguageContext';
import styles from './Landing.module.css';
import homeContent from './homeContent';
import BrandLogo from '../components/BrandLogo';
import API_BASE from '../config/api.js';
const API = API_BASE;

export default function Landing() {
  const { theme, toggle } = useTheme();
  const signedIn = Boolean(localStorage.getItem('token'));
  const donorDestination = '/donate';
  const requestDestination = '/request';
  const { t, lang, toggle: toggleLang } = useLanguage();

  const features = [
    { icon: '📡', title: t('feat1Title'), desc: t('feat1Desc') },
    { icon: '🩸', title: t('feat2Title'), desc: t('feat2Desc') },
    { icon: '🔔', title: t('feat3Title'), desc: t('feat3Desc') },
    { icon: '📍', title: t('feat4Title'), desc: t('feat4Desc') },
    { icon: '🛡️', title: t('feat5Title'), desc: t('feat5Desc') },
    { icon: '⚡', title: t('feat6Title'), desc: t('feat6Desc') },
  ];

  const steps = [
    { num: '01', title: t('step1Title'), desc: t('step1Desc') },
    { num: '02', title: t('step2Title'), desc: t('step2Desc') },
    { num: '03', title: t('step3Title'), desc: t('step3Desc') },
  ];

  const [activity,setActivity]=useState(null);
  useEffect(()=>{const controller=new AbortController();fetch(`${API}/api/stats/activity`,{signal:controller.signal}).then(r=>{if(!r.ok)throw Error();return r.json()}).then(setActivity).catch(()=>{});return()=>controller.abort();},[]);
  const stats=['availableDonors','activeRequests','completedRequests','completedDonations'].map((key,i)=>({label:homeContent[lang].counts[i],value:Number.isFinite(activity?.[key])?activity[key].toLocaleString(lang==='ta'?'ta-IN':'en-IN'):'—'}));

  return (
    <div className={styles.page}>
      {/* Navbar */}
      <nav className={styles.nav}>
        <div className={styles.navInner}>
          <div className={styles.brand}>
            <BrandLogo size={36} />
            <span className={styles.brandName}>
              <span className={styles.life}>Life</span>
              <span className={styles.link}>Link</span>
            </span>
          </div>
          <div className={styles.navActions}>
            <button
              onClick={toggleLang}
              title={lang === 'en' ? t('switchToTamil') : t('switchToEnglish')}
              style={{
                background: 'none', border: '1px solid var(--border)', borderRadius: 6,
                padding: '0.25rem 0.55rem', cursor: 'pointer', fontSize: '0.78rem',
                fontWeight: 700, color: 'var(--text)',
              }}
            >
              {lang === 'en' ? 'தமிழ்' : 'EN'}
            </button>
            <button className={styles.themeBtn} onClick={toggle} title={lang === 'ta' ? 'ஒளி / இருள் தோற்றம்' : 'Light / dark mode'}>
              {theme === 'light' ? '🌙' : '☀️'}
            </button>
            <Link to="/login" className={styles.loginBtn}>{t('logIn')}</Link>
            <Link to="/signup" className={styles.signupBtn}>{lang === 'ta' ? 'பதிவு செய்' : 'Sign Up'}</Link>
          </div>
        </div>
      </nav>

      {/* Hero */}
      <section className={styles.hero}>
        <div className={styles.heroInner}>
          <div className={styles.heroBadge}>{t('landingHeroBadge')}</div>
          <h1 className={styles.heroTitle}>
            {t('landingHeroTitle1')}<br />
            <span className={styles.heroAccent}>{t('landingHeroTitle2')}</span><br />
            {t('landingHeroTitle3')}
          </h1>
          <p className={styles.heroSub}>{t('landingHeroSub')}</p>
          <div className={styles.heroCtas}>
            <Link to={signedIn ? donorDestination : "/signup"} onClick={() => rememberDestination(donorDestination)} className={styles.ctaPrimary}>{t('joinAsDonor')}</Link>
            <Link to={signedIn ? requestDestination : "/login"} onClick={() => rememberDestination(requestDestination)} className={styles.ctaSecondary}>{t('requestBloodBtn')}</Link>
          </div>
          {/* Blood group pills */}
          <div className={styles.bloodPills}>
            {['A+', 'A-', 'B+', 'B-', 'AB+', 'AB-', 'O+', 'O-'].map((bg) => (
              <span key={bg} className={styles.pill}>{bg}</span>
            ))}
          </div>
        </div>

        {/* Hero visual */}
        <div className={styles.heroVisual}>
          <div className={styles.pulseRing} />
          <div className={styles.pulseRing2} />
          <div className={styles.heroCard}>
            <div className={styles.heroCardLive}>
              <span className={styles.liveDot} />
              <span>{lang === 'ta' ? 'செயல்முறை எடுத்துக்காட்டு' : 'WORKFLOW EXAMPLE'}</span>
            </div>
            <div className={styles.heroCardTop}>
              <div className={styles.heroBloodBadge}>O+</div>
              <span className={styles.heroUrgency}>{lang === 'ta' ? '🚨 மிக அவசரம்' : '🚨 CRITICAL'}</span>
            </div>
            <p className={styles.heroCardTitle}>{t('emergencyRequest')}</p>
            <p className={styles.heroCardHospital}>🏥 {lang === 'ta' ? 'மருத்துவமனை, சென்னை' : 'Hospital, Chennai'}</p>
            <p className={styles.heroCardSub}>📍 {lang === 'ta' ? 'மருத்துவமனையைச் சுற்றி தேடல்' : 'Search around the hospital'}</p>
            <div className={styles.heroCardBarLabel}>{t('notifyingDonors')}</div>
            <div className={styles.heroCardBarTrack}>
              <div className={styles.heroCardBar} />
            </div>
            <p className={styles.heroCardResponders}>
              <span className={styles.responderDot} />
              3 {t('donorsResponding')}
            </p>
          </div>

          <div className={styles.heroCardFloat}>
            <span>✅</span> <strong>{lang === 'ta' ? 'பதில்களுக்கு ஏற்ப தேடல் விரிவடையும்' : 'Search expands when more help is needed'}</strong>
          </div>
        </div>
      </section>

      {import.meta.env.DEV && <p style={{textAlign:'center',padding:'8px 16px',color:'var(--muted)'}}>{lang==='ta'?'உள்ளூர் செயல்விளக்கம் · கீழுள்ள எண்ணிக்கைகளில் சோதனைப் பதிவுகளும் அடங்கும்.':'Local demonstration · counts below include synthetic test records.'}</p>}
      {/* Stats */}
      <section className={styles.statsSection}>
        <div className={styles.statsGrid}>
          {stats.map((s) => (
            <div key={s.label} className={styles.statItem}>
              <p className={styles.statValue}>{s.value}</p>
              <p className={styles.statLabel}>{s.label}</p>
            </div>
          ))}
        </div>
      </section>

      <section className={styles.features}>
        <div className={styles.sectionInner}>
          <h2 className={styles.sectionTitle}>{homeContent[lang].who}</h2>
          <div className={styles.audienceGrid}>{homeContent[lang].roles.map(([title,desc])=><article key={title} className={styles.featureCard}><h3 className={styles.featureTitle}>{title}</h3><p className={styles.featureDesc}>{desc}</p></article>)}</div>
          <p style={{textAlign:'center',marginTop:20,color:'var(--muted)'}}>{homeContent[lang].sameAccount}</p>
        </div>
      </section>
      {/* Features */}
      <section className={styles.features}>
        <div className={styles.sectionInner}>
          <p className={styles.sectionEye}>{t('whyLifeLink')}</p>
          <h2 className={styles.sectionTitle}>{t('builtForSpeed')}</h2>
          <div className={styles.featuresGrid}>
            {features.map((f) => (
              <div key={f.title} className={styles.featureCard}>
                <span className={styles.featureIcon}>{f.icon}</span>
                <h3 className={styles.featureTitle}>{f.title}</h3>
                <p className={styles.featureDesc}>{f.desc}</p>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* How it works */}
      <section className={styles.howItWorks}>
        <div className={styles.sectionInner}>
          <p className={styles.sectionEye}>{t('howItWorksLabel')}</p>
          <h2 className={styles.sectionTitle}>{t('upIn3Steps')}</h2>
          <div className={styles.stepsRow}>
            {steps.map((s, i) => (
              <div key={s.num} className={styles.step}>
                <div className={styles.stepNum}>{s.num}</div>
                {i < steps.length - 1 && <div className={styles.stepLine} />}
                <h3 className={styles.stepTitle}>{s.title}</h3>
                <p className={styles.stepDesc}>{s.desc}</p>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* CTA Banner */}
      <section className={styles.ctaBanner}>
        <div className={styles.sectionInner}>
          <h2 className={styles.ctaBannerTitle}>{t('readyToSave')}</h2>
          <p className={styles.ctaBannerSub}>{t('joinTakes2Min')}</p>
          <Link to="/signup" className={styles.ctaBannerBtn}>{t('getStartedFree')}</Link>
        </div>
      </section>

      {/* Footer */}
      <footer className={styles.footer}>
        <div className={styles.footerInner}>
          <div className={styles.footerBrand}>
            <span className={styles.life}>Life</span><span className={styles.link}>Link</span>
          </div>
          <p className={styles.footerSub}>{t('footerTagline')}</p>
          <div className={styles.footerLinks}>
            <Link to="/terms" className={styles.footerLink}>{t('termsOfService')}</Link>
            <span className={styles.footerDot}>·</span>
            <Link to="/privacy" className={styles.footerLink}>{t('privacyPolicy')}</Link>
            <span className={styles.footerDot}>·</span>
            <a href="mailto:generalworks2k25@gmail.com" className={styles.footerLink}>{t('contactUs')}</a>
          </div>
          <p className={styles.footerCopy}>{t('copyright')}</p>
        </div>
      </footer>
    </div>
  );
}
