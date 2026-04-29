import { Link } from 'react-router-dom';
import { useState, useEffect } from 'react';
import { useTheme } from '../context/ThemeContext';
import { useLanguage } from '../context/LanguageContext';
import styles from './Landing.module.css';
import BrandLogo from '../components/BrandLogo';
import API_BASE from '../config/api.js';
const API = API_BASE;

export default function Landing() {
  const { theme, toggle } = useTheme();
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

  const [stats, setStats] = useState([
    { value: '—', labelKey: 'registeredDonors' },
    { value: '—', labelKey: 'livesSaved' },
    { value: '—', labelKey: 'statesCoveredStat' },
    { value: '—', labelKey: 'avgResponseTime' },
  ]);

  useEffect(() => {
    fetch(`${API}/api/stats`)
      .then(r => r.json())
      .then(d => {
        setStats([
          { value: d.totalDonors   > 0 ? d.totalDonors.toLocaleString('en-IN')  : '0', labelKey: 'registeredDonors' },
          { value: d.livesSaved    > 0 ? d.livesSaved.toLocaleString('en-IN')   : '0', labelKey: 'livesSaved' },
          { value: d.statesCovered > 0 ? String(d.statesCovered)                : '0', labelKey: 'statesCoveredStat' },
          { value: d.avgResponseTime,                                                    labelKey: 'avgResponseTime' },
        ]);
      })
      .catch(() => {/* keep dashes on error */});
  }, []);

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
            <button className={styles.themeBtn} onClick={toggle} title="Toggle theme">
              {theme === 'light' ? '🌙' : '☀️'}
            </button>
            <Link to="/login" className={styles.loginBtn}>{t('logIn')}</Link>
            <Link to="/signup" className={styles.signupBtn}>{t('signUpFree')}</Link>
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
            <Link to="/signup" className={styles.ctaPrimary}>{t('joinAsDonor')}</Link>
            <Link to="/signup?role=requester" className={styles.ctaSecondary}>{t('requestBloodBtn')}</Link>
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
              <span>LIVE</span>
            </div>
            <div className={styles.heroCardTop}>
              <div className={styles.heroBloodBadge}>O+</div>
              <span className={styles.heroUrgency}>🚨 CRITICAL</span>
            </div>
            <p className={styles.heroCardTitle}>{t('emergencyRequest')}</p>
            <p className={styles.heroCardHospital}>🏥 Apollo Hospital, Chennai</p>
            <p className={styles.heroCardSub}>📍 2.3 km away · 2 units needed</p>
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
            <span>✅</span> {t('donorMatchedIn')} <strong>47s</strong>
          </div>
        </div>
      </section>

      {/* Stats */}
      <section className={styles.statsSection}>
        <div className={styles.statsGrid}>
          {stats.map((s) => (
            <div key={s.labelKey} className={styles.statItem}>
              <p className={styles.statValue}>{s.value}</p>
              <p className={styles.statLabel}>{t(s.labelKey)}</p>
            </div>
          ))}
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
