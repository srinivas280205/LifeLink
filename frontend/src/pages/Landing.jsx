import { Link } from 'react-router-dom';
import { useState, useEffect } from 'react';
import { useTheme } from '../context/ThemeContext';
import styles from './Landing.module.css';
import BrandLogo from '../components/BrandLogo';
import API_BASE from '../config/api.js';
const API = API_BASE;

const features = [
  {
    icon: '📡',
    title: 'Real-Time Broadcasts',
    desc: 'Emergency blood requests are instantly broadcast to matching donors nearby — no delays, no middlemen.',
  },
  {
    icon: '🩸',
    title: 'Smart Donor Matching',
    desc: 'Our system matches blood groups and location automatically, connecting the right donor in seconds.',
  },
  {
    icon: '🔔',
    title: 'Instant Alerts',
    desc: 'Donors receive push notifications the moment a matching request is raised in their area.',
  },
  {
    icon: '📍',
    title: 'Location-Based Network',
    desc: 'Hyper-local targeting ensures requests reach the nearest available donors first.',
  },
  {
    icon: '🛡️',
    title: 'Verified Donors',
    desc: 'All donors go through phone verification to ensure trust and reliability across the network.',
  },
  {
    icon: '⚡',
    title: 'Zero Delay Response',
    desc: 'Built on WebSockets for sub-second delivery — because in emergencies, every second counts.',
  },
];

const steps = [
  { num: '01', title: 'Sign Up', desc: 'Register as a donor or requester with your phone number and blood group.' },
  { num: '02', title: 'Get Verified', desc: 'Verify your phone via OTP to activate your profile on the network.' },
  { num: '03', title: 'Stay Connected', desc: 'Donors get alerts. Requesters get matched. Lives get saved.' },
];

export default function Landing() {
  const { theme, toggle } = useTheme();
  const [stats, setStats] = useState([
    { value: '—', label: 'Registered Donors' },
    { value: '—', label: 'Lives Saved' },
    { value: '—', label: 'States Covered' },
    { value: '—', label: 'Avg Response Time' },
  ]);

  useEffect(() => {
    fetch(`${API}/api/stats`)
      .then(r => r.json())
      .then(d => {
        setStats([
          { value: d.totalDonors  > 0 ? d.totalDonors.toLocaleString('en-IN')  : '0', label: 'Registered Donors' },
          { value: d.livesSaved   > 0 ? d.livesSaved.toLocaleString('en-IN')   : '0', label: 'Lives Saved' },
          { value: d.statesCovered > 0 ? String(d.statesCovered)               : '0', label: 'States Covered' },
          { value: d.avgResponseTime,                                                   label: 'Avg Response Time' },
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
            <button className={styles.themeBtn} onClick={toggle} title="Toggle theme">
              {theme === 'light' ? '🌙' : '☀️'}
            </button>
            <Link to="/login" className={styles.loginBtn}>Log In</Link>
            <Link to="/signup" className={styles.signupBtn}>Sign Up Free</Link>
          </div>
        </div>
      </nav>

      {/* Hero */}
      <section className={styles.hero}>
        <div className={styles.heroInner}>
          <div className={styles.heroBadge}>🇮🇳 India's Emergency Blood Network</div>
          <h1 className={styles.heroTitle}>
            Donate Blood.<br />
            <span className={styles.heroAccent}>Save Lives.</span><br />
            In Real-Time.
          </h1>
          <p className={styles.heroSub}>
            LifeLink connects blood donors with patients in emergencies — instantly,
            locally, and reliably. Join thousands of donors across India making a difference.
          </p>
          <div className={styles.heroCtas}>
            <Link to="/signup" className={styles.ctaPrimary}>Join as Donor</Link>
            <Link to="/signup?role=requester" className={styles.ctaSecondary}>Request Blood</Link>
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
            {/* Live badge */}
            <div className={styles.heroCardLive}>
              <span className={styles.liveDot} />
              <span>LIVE</span>
            </div>

            {/* Blood type + urgency row */}
            <div className={styles.heroCardTop}>
              <div className={styles.heroBloodBadge}>O+</div>
              <span className={styles.heroUrgency}>🚨 CRITICAL</span>
            </div>

            <p className={styles.heroCardTitle}>Emergency Request</p>
            <p className={styles.heroCardHospital}>🏥 Apollo Hospital, Chennai</p>
            <p className={styles.heroCardSub}>📍 2.3 km away · 2 units needed</p>

            {/* Animated scanning bar */}
            <div className={styles.heroCardBarLabel}>Notifying donors…</div>
            <div className={styles.heroCardBarTrack}>
              <div className={styles.heroCardBar} />
            </div>

            {/* Donor response count */}
            <p className={styles.heroCardResponders}>
              <span className={styles.responderDot} />
              3 donors responding
            </p>
          </div>

          <div className={styles.heroCardFloat}>
            <span>✅</span> Donor matched in <strong>47s</strong>
          </div>
        </div>
      </section>

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

      {/* Features */}
      <section className={styles.features}>
        <div className={styles.sectionInner}>
          <p className={styles.sectionEye}>Why LifeLink</p>
          <h2 className={styles.sectionTitle}>Built for emergencies.<br />Designed for speed.</h2>
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
          <p className={styles.sectionEye}>How It Works</p>
          <h2 className={styles.sectionTitle}>Up and running in 3 steps</h2>
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
          <h2 className={styles.ctaBannerTitle}>Ready to save a life today?</h2>
          <p className={styles.ctaBannerSub}>Join LifeLink — it takes less than 2 minutes to sign up.</p>
          <Link to="/signup" className={styles.ctaBannerBtn}>Get Started Free →</Link>
        </div>
      </section>

      {/* Footer */}
      <footer className={styles.footer}>
        <div className={styles.footerInner}>
          <div className={styles.footerBrand}>
            <span className={styles.life}>Life</span><span className={styles.link}>Link</span>
          </div>
          <p className={styles.footerSub}>Dynamic Real-Time Emergency Network · India</p>
          <div className={styles.footerLinks}>
            <Link to="/terms" className={styles.footerLink}>Terms of Service</Link>
            <span className={styles.footerDot}>·</span>
            <Link to="/privacy" className={styles.footerLink}>Privacy Policy</Link>
            <span className={styles.footerDot}>·</span>
            <a href="mailto:generalworks2k25@gmail.com" className={styles.footerLink}>Contact Us</a>
          </div>
          <p className={styles.footerCopy}>© 2026 LifeLink. Built to save lives.</p>
        </div>
      </footer>
    </div>
  );
}
