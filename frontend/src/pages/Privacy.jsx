import { useNavigate } from 'react-router-dom';

const RED = '#d32f2f';
const styles = {
  page: { minHeight: '100vh', background: 'var(--bg, #f9fafb)', color: 'var(--text, #111)', fontFamily: 'system-ui, sans-serif' },
  header: { background: RED, color: '#fff', padding: '1rem 2rem', display: 'flex', alignItems: 'center', gap: '0.75rem' },
  logo: { fontSize: '1.4rem', fontWeight: 800, letterSpacing: '-0.5px' },
  tagline: { fontSize: '0.8rem', opacity: 0.85 },
  container: { maxWidth: 760, margin: '0 auto', padding: '2rem 1.5rem' },
  backBtn: { background: 'none', border: `1px solid ${RED}`, color: RED, borderRadius: 6, padding: '0.35rem 0.9rem',
    cursor: 'pointer', fontSize: '0.85rem', fontWeight: 600, marginBottom: '1.5rem', display: 'inline-block' },
  title: { fontSize: '1.7rem', fontWeight: 800, marginBottom: '0.25rem', color: RED },
  updated: { fontSize: '0.82rem', color: '#888', marginBottom: '2rem' },
  section: { marginBottom: '1.75rem' },
  h2: { fontSize: '1.05rem', fontWeight: 700, marginBottom: '0.5rem', color: '#333' },
  p: { fontSize: '0.9rem', lineHeight: 1.7, color: '#444', margin: '0 0 0.6rem' },
  ul: { paddingLeft: '1.4rem', margin: '0.4rem 0 0.6rem', fontSize: '0.9rem', lineHeight: 1.7, color: '#444' },
  footer: { borderTop: '1px solid #e0e0e0', paddingTop: '1.5rem', fontSize: '0.82rem', color: '#888', textAlign: 'center' },
};

export default function Privacy() {
  const navigate = useNavigate();

  return (
    <div style={styles.page}>
      <header style={styles.header}>
        <div>
          <div style={styles.logo}>❤️ LifeLink</div>
          <div style={styles.tagline}>Dynamic Real-Time Emergency Network</div>
        </div>
      </header>

      <div style={styles.container}>
        <button style={styles.backBtn} onClick={() => navigate(-1)}>← Back</button>

        <h1 style={styles.title}>Privacy Policy</h1>
        <p style={styles.updated}>Last updated: April 2026</p>

        <div style={styles.section}>
          <h2 style={styles.h2}>1. Introduction</h2>
          <p style={styles.p}>
            LifeLink ("we", "our", or "the platform") is committed to protecting your privacy. This Privacy Policy explains what personal data we collect, how we use it, and your rights regarding your data. By using LifeLink, you consent to the practices described in this policy.
          </p>
        </div>

        <div style={styles.section}>
          <h2 style={styles.h2}>2. Data We Collect</h2>
          <p style={styles.p}>When you register and use LifeLink, we collect the following information:</p>
          <ul style={styles.ul}>
            <li><strong>Name:</strong> Your full name, used to identify you to other users</li>
            <li><strong>Phone number:</strong> Used for OTP verification and donor contact. Partially masked in public-facing donor listings (e.g., 93XXXX3919)</li>
            <li><strong>Blood group:</strong> Used to match you with relevant emergency requests</li>
            <li><strong>Location:</strong> State, district, and optional GPS coordinates, used to connect you with nearby donors or recipients</li>
            <li><strong>Gender:</strong> Optional, used for demographic context only</li>
            <li><strong>Activity data:</strong> Broadcasts you post, responses you give, and SOS events you trigger</li>
            <li><strong>Device / session data:</strong> Standard server logs including IP address and browser type, used for security and debugging</li>
          </ul>
        </div>

        <div style={styles.section}>
          <h2 style={styles.h2}>3. How We Use Your Data</h2>
          <p style={styles.p}>Your data is used exclusively to operate the LifeLink platform:</p>
          <ul style={styles.ul}>
            <li>To match blood recipients with compatible donors in their area</li>
            <li>To send emergency blood request broadcasts to eligible donors</li>
            <li>To allow donors to respond to requests and provide contact information for coordination</li>
            <li>To send push notifications and in-app alerts for relevant requests</li>
            <li>To display donor statistics and achievements on your profile</li>
            <li>To detect and prevent abuse, fraud, or platform misuse</li>
          </ul>
        </div>

        <div style={styles.section}>
          <h2 style={styles.h2}>4. Data Sharing</h2>
          <p style={styles.p}>
            We do not sell, rent, or trade your personal data to third parties. Your information may be shared only in the following limited circumstances:
          </p>
          <ul style={styles.ul}>
            <li>With other LifeLink users, strictly for the purpose of blood donation coordination (e.g., your name, blood group, and masked phone number may appear on donor listings)</li>
            <li>With infrastructure providers (cloud hosting, SMS gateway) who process data solely to operate the service</li>
            <li>When required by law or in response to a valid legal process</li>
          </ul>
        </div>

        <div style={styles.section}>
          <h2 style={styles.h2}>5. Phone Number Privacy</h2>
          <p style={styles.p}>
            Your full phone number is never displayed publicly. In donor cards and search results, your phone number is partially masked (e.g., a number ending in 3919 is shown as 93XXXX3919) to protect your privacy while enabling emergency coordination.
          </p>
          <p style={styles.p}>
            Your phone number may be visible to the person who directly contacts you for a blood donation once you accept their request.
          </p>
        </div>

        <div style={styles.section}>
          <h2 style={styles.h2}>6. Data Retention</h2>
          <p style={styles.p}>
            We retain your data for as long as your account is active. If you delete your account, all your personal data including your profile, activity history, and notifications will be permanently deleted within a reasonable time.
          </p>
        </div>

        <div style={styles.section}>
          <h2 style={styles.h2}>7. Your Rights</h2>
          <p style={styles.p}>You have the right to:</p>
          <ul style={styles.ul}>
            <li>Access the personal data we hold about you (visible in your Profile page)</li>
            <li>Correct inaccurate information at any time from your Profile</li>
            <li>Delete your account and all associated data via Profile → Delete Account</li>
            <li>Opt out of donor listings by setting your availability to Offline</li>
            <li>Request a copy of your data by contacting us directly</li>
          </ul>
        </div>

        <div style={styles.section}>
          <h2 style={styles.h2}>8. Security</h2>
          <p style={styles.p}>
            We take reasonable technical and organizational measures to protect your personal data from unauthorized access, disclosure, or loss. Passwords are stored using strong one-way hashing. However, no internet-based service can guarantee absolute security.
          </p>
        </div>

        <div style={styles.section}>
          <h2 style={styles.h2}>9. Contact for Data Requests</h2>
          <p style={styles.p}>
            For any privacy-related questions, data access requests, or deletion requests, contact us at:{' '}
            <a href="mailto:generalworks2k25@gmail.com" style={{ color: RED }}>generalworks2k25@gmail.com</a>
          </p>
        </div>

        <div style={styles.footer}>
          &copy; {new Date().getFullYear()} LifeLink — Emergency Blood Network &middot;{' '}
          <button style={{ background: 'none', border: 'none', color: RED, cursor: 'pointer', padding: 0, fontSize: '0.82rem' }}
            onClick={() => navigate('/terms')}>Terms of Service</button>
        </div>
      </div>
    </div>
  );
}
