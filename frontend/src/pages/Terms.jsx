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

export default function Terms() {
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

        <h1 style={styles.title}>Terms of Service</h1>
        <p style={styles.updated}>Last updated: April 2026</p>

        <div style={styles.section}>
          <h2 style={styles.h2}>1. Acceptance of Terms</h2>
          <p style={styles.p}>
            By registering for or using LifeLink ("the Service"), you agree to be bound by these Terms of Service. If you do not agree, please do not use LifeLink. We may update these terms from time to time; continued use constitutes acceptance of the revised terms.
          </p>
        </div>

        <div style={styles.section}>
          <h2 style={styles.h2}>2. Description of Service</h2>
          <p style={styles.p}>
            LifeLink is an emergency blood donor broadcast network that connects individuals who need blood with voluntary donors in their area. The platform allows users to:
          </p>
          <ul style={styles.ul}>
            <li>Register as a blood donor and appear in donor listings</li>
            <li>Broadcast emergency blood requests to nearby donors</li>
            <li>Respond to blood requests from other users</li>
            <li>Send SOS alerts in critical emergencies</li>
            <li>View and contact donors based on blood group and location</li>
          </ul>
          <p style={styles.p}>
            LifeLink is a community coordination tool. It is not a hospital, blood bank, or medical institution. We do not guarantee availability of any donor or blood supply.
          </p>
        </div>

        <div style={styles.section}>
          <h2 style={styles.h2}>3. User Responsibilities</h2>
          <p style={styles.p}>By using LifeLink, you agree to:</p>
          <ul style={styles.ul}>
            <li>Provide accurate and truthful information including your name, phone number, and blood group</li>
            <li>Keep your account information up to date</li>
            <li>Use donor contact information solely to coordinate blood donation — not for commercial, marketing, or unrelated personal purposes</li>
            <li>Respond honestly when accepting or declining donation requests</li>
            <li>Not impersonate other users, hospitals, or medical professionals</li>
            <li>Notify the platform if you are no longer able to donate by updating your availability status</li>
          </ul>
        </div>

        <div style={styles.section}>
          <h2 style={styles.h2}>4. Prohibited Conduct</h2>
          <p style={styles.p}>The following are strictly prohibited on LifeLink:</p>
          <ul style={styles.ul}>
            <li>Posting fake or fraudulent blood requests or emergency alerts</li>
            <li>Harassing, threatening, or abusing other users</li>
            <li>Spamming donors with unsolicited messages or requests</li>
            <li>Attempting to extract personal information beyond what is needed for donation coordination</li>
            <li>Using the platform for commercial blood trade or compensation-based transactions</li>
            <li>Attempting to access, alter, or disrupt other users' accounts or platform systems</li>
            <li>Uploading malicious code or attempting to compromise platform security</li>
          </ul>
          <p style={styles.p}>
            Violations may result in immediate account suspension or permanent ban without notice.
          </p>
        </div>

        <div style={styles.section}>
          <h2 style={styles.h2}>5. Limitation of Liability</h2>
          <p style={styles.p}>
            LifeLink is a volunteer coordination platform and is provided "as is" without warranties of any kind. We do not guarantee:
          </p>
          <ul style={styles.ul}>
            <li>That a donor will respond to any request</li>
            <li>The accuracy of any user-provided blood group or health information</li>
            <li>Uninterrupted availability of the service</li>
            <li>A positive medical outcome</li>
          </ul>
          <p style={styles.p}>
            LifeLink and its operators shall not be liable for any direct, indirect, incidental, or consequential damages arising from use of the platform, including but not limited to loss of life, injury, or failure to obtain blood in time. Always contact a certified hospital or blood bank for medical emergencies.
          </p>
        </div>

        <div style={styles.section}>
          <h2 style={styles.h2}>6. Account Termination</h2>
          <p style={styles.p}>
            You may delete your account at any time from your Profile page. Upon deletion, all your data will be permanently removed. We reserve the right to suspend or terminate accounts that violate these terms.
          </p>
        </div>

        <div style={styles.section}>
          <h2 style={styles.h2}>7. Governing Law</h2>
          <p style={styles.p}>
            These terms are governed by the laws of India. Any disputes arising from the use of LifeLink shall be subject to the exclusive jurisdiction of the courts of India.
          </p>
        </div>

        <div style={styles.section}>
          <h2 style={styles.h2}>8. Contact</h2>
          <p style={styles.p}>
            For questions, concerns, or legal notices related to these Terms of Service, please contact us at:{' '}
            <a href="mailto:generalworks2k25@gmail.com" style={{ color: RED }}>generalworks2k25@gmail.com</a>
          </p>
        </div>

        <div style={styles.footer}>
          &copy; {new Date().getFullYear()} LifeLink — Emergency Blood Network &middot;{' '}
          <button style={{ background: 'none', border: 'none', color: RED, cursor: 'pointer', padding: 0, fontSize: '0.82rem' }}
            onClick={() => navigate('/privacy')}>Privacy Policy</button>
        </div>
      </div>
    </div>
  );
}
