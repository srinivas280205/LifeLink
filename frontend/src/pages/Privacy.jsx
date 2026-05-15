import { useNavigate } from 'react-router-dom';
import { useLanguage } from '../context/LanguageContext';

const RED = '#d32f2f';
const s = {
  page:      { minHeight: '100vh', background: 'var(--bg,#f9fafb)', color: 'var(--text,#111)', fontFamily: 'system-ui,sans-serif' },
  header:    { background: RED, color: '#fff', padding: '1rem 2rem', display: 'flex', alignItems: 'center', justifyContent: 'space-between' },
  logo:      { fontSize: '1.4rem', fontWeight: 800 },
  tagline:   { fontSize: '0.78rem', opacity: 0.85 },
  langBtn:   { background: 'rgba(255,255,255,0.2)', border: '1px solid rgba(255,255,255,0.5)', color: '#fff',
               borderRadius: 8, padding: '0.35rem 0.75rem', cursor: 'pointer', fontSize: '0.85rem', fontWeight: 700 },
  container: { maxWidth: 780, margin: '0 auto', padding: '2rem 1.5rem' },
  backBtn:   { background: 'none', border: `1px solid ${RED}`, color: RED, borderRadius: 6,
               padding: '0.35rem 0.9rem', cursor: 'pointer', fontSize: '0.85rem', fontWeight: 600,
               marginBottom: '1.5rem', display: 'inline-block' },
  title:     { fontSize: '1.7rem', fontWeight: 800, marginBottom: '0.25rem', color: RED },
  updated:   { fontSize: '0.82rem', color: '#888', marginBottom: '2rem' },
  section:   { marginBottom: '1.75rem' },
  h2:        { fontSize: '1.05rem', fontWeight: 700, marginBottom: '0.5rem', color: '#333' },
  p:         { fontSize: '0.9rem', lineHeight: 1.75, color: '#444', margin: '0 0 0.6rem' },
  ul:        { paddingLeft: '1.4rem', margin: '0.4rem 0 0.6rem', fontSize: '0.9rem', lineHeight: 1.75, color: '#444' },
  table:     { width: '100%', borderCollapse: 'collapse', fontSize: '0.88rem', margin: '0.5rem 0 0.8rem' },
  th:        { background: '#fce4ec', color: '#b71c1c', padding: '0.55rem 0.75rem', textAlign: 'left',
               border: '1px solid #f8bbd0', fontWeight: 700 },
  td:        { padding: '0.5rem 0.75rem', border: '1px solid #f8bbd0', color: '#444', verticalAlign: 'top' },
  footer:    { borderTop: '1px solid #e0e0e0', paddingTop: '1.5rem', fontSize: '0.82rem', color: '#888', textAlign: 'center' },
};

const CONTENT = {
  en: {
    title:   'Privacy Policy',
    updated: 'Last updated: May 2026',
    back:    '← Back',
    switchLang: 'தமிழ்',
    footerLink: 'Terms of Service',
    sections: [
      {
        heading: '1. Who We Are',
        body: 'LifeLink ("we", "our", "the platform") is an emergency blood donor coordination network operating in India. We connect blood donors with people in need of blood during emergencies. Our contact email is generalworks2k25@gmail.com.',
      },
      {
        heading: '2. What Information We Collect',
        table: {
          headers: ['Data', 'Why we collect it', 'Required?'],
          rows: [
            ['Full Name', 'Identify you to other users and donors', 'Yes'],
            ['Phone Number', 'Login, OTP verification, donor contact', 'Yes'],
            ['Blood Group', 'Match you with compatible donation requests', 'Strongly recommended'],
            ['State & District', 'Show nearby requests and donors', 'Strongly recommended'],
            ['Date of Birth', 'Age eligibility check (18–65)', 'Optional'],
            ['Email Address', 'Email verification, trust score', 'Optional'],
            ['GPS Location', 'SOS radius matching, donor map', 'Optional'],
            ['Blood Group Document', 'Verify your blood group for trust score', 'Optional'],
            ['Gender', 'Profile display only', 'Optional'],
          ],
        },
      },
      {
        heading: '3. How We Use Your Data',
        body: 'We use your information to:',
        list: [
          'Display your profile to people who need blood of your type',
          'Send you emergency blood request notifications for your blood group',
          'Verify your identity via OTP when you sign up',
          'Allow requesters to contact you directly in emergencies',
          'Show your location on the donor map (only if you share GPS)',
          'Run the admin panel for platform management and safety',
        ],
        body2: 'We do not use your data for advertising, selling products, or any purpose not listed above.',
      },
      {
        heading: '4. Who Can See Your Data',
        body: 'Other LifeLink users can see:',
        list: [
          'Your name, blood group, district, and state (in donor listings)',
          'Your phone number (only when they respond to your blood request or you respond to theirs)',
          'Your availability status and donation count',
        ],
        body2: 'Your exact GPS coordinates, email address, date of birth, and documents are NEVER shown to other users. Only platform admins can access these for verification and safety purposes.',
      },
      {
        heading: '5. Data Storage & Security',
        list: [
          'All data is stored on MongoDB Atlas (cloud database) with encryption at rest',
          'Passwords are hashed using bcrypt — we cannot see your password',
          'API access is secured with JWT tokens (7-day expiry)',
          'All connections use HTTPS/TLS encryption',
          'Rate limiting protects against brute-force attacks',
          'Login is locked after 5 failed attempts for 15 minutes',
        ],
      },
      {
        heading: '6. Document Uploads',
        body: 'If you choose to upload a blood group document for verification, it is stored securely and reviewed only by LifeLink administrators. Documents are used solely to verify your blood group. You can request deletion of your document by deleting your account.',
      },
      {
        heading: '7. Push Notifications',
        body: 'If you subscribe to push notifications, your browser push subscription token is stored on our servers. You can unsubscribe at any time from your browser settings or notification preferences in the app.',
      },
      {
        heading: '8. Your Rights',
        body: 'Under the Digital Personal Data Protection Act, 2023 (India) and applicable laws, you have the right to:',
        list: [
          'Access the personal data we hold about you',
          'Correct inaccurate data in your profile',
          'Delete your account and all associated data (Profile → Delete Account)',
          'Opt out of specific notification types (Profile → Notification Preferences)',
          'Withdraw consent at any time by deleting your account',
        ],
      },
      {
        heading: '9. Data Retention',
        body: 'We retain your data as long as your account is active. When you delete your account, all personal data — name, phone, blood group, location, documents, notifications, and broadcasts — is permanently deleted from our database.',
      },
      {
        heading: '10. Third-Party Services',
        body: 'LifeLink uses the following third-party services:',
        list: [
          'MongoDB Atlas — database hosting (MongoDB Inc.)',
          'Render.com — backend server hosting',
          'Vercel — frontend hosting',
          'Fast2SMS — OTP SMS delivery in India',
          'Gmail SMTP — email verification',
          'OpenStreetMap / Leaflet.js — map display (no tracking)',
          'Web Push API — browser push notifications',
        ],
        body2: 'We do not share your personal data with these providers beyond what is necessary to operate the service.',
      },
      {
        heading: '11. Children\'s Privacy',
        body: 'LifeLink is not intended for users under 18 years of age. We do not knowingly collect data from minors. If you believe a minor has registered, contact us and we will remove the account.',
      },
      {
        heading: '12. Changes to This Policy',
        body: 'We may update this Privacy Policy from time to time. We will notify users of significant changes via an in-app announcement. The date at the top of this page shows when it was last revised.',
      },
      {
        heading: '13. Contact Us',
        email: true,
        body: 'For privacy-related questions, data requests, or concerns, contact us at:',
      },
    ],
  },
  ta: {
    title:   'தனியுரிமைக் கொள்கை',
    updated: 'கடைசியாக புதுப்பிக்கப்பட்டது: மே 2026',
    back:    '← திரும்பு',
    switchLang: 'English',
    footerLink: 'சேவை விதிமுறைகள்',
    sections: [
      {
        heading: '1. நாங்கள் யார்',
        body: 'LifeLink இந்தியாவில் இயங்கும் அவசர இரத்த தானி ஒருங்கிணைப்பு நெட்வொர்க். அவசர நேரங்களில் இரத்தம் தேவைப்படுபவர்களை தானிகளுடன் இணைக்கிறோம். எங்கள் தொடர்பு மின்னஞ்சல்: generalworks2k25@gmail.com.',
      },
      {
        heading: '2. நாங்கள் சேகரிக்கும் தகவல்கள்',
        table: {
          headers: ['தரவு', 'ஏன் சேகரிக்கிறோம்', 'கட்டாயமா?'],
          rows: [
            ['முழு பெயர்', 'மற்ற பயனர்களுக்கும் தானிகளுக்கும் அடையாளம் காட்ட', 'ஆம்'],
            ['தொலைபேசி எண்', 'உள்நுழைவு, OTP சரிபார்ப்பு, தானி தொடர்பு', 'ஆம்'],
            ['இரத்த வகை', 'பொருந்தும் கோரிக்கைகளை பொருத்த', 'மிகவும் பரிந்துரை'],
            ['மாநிலம் & மாவட்டம்', 'அருகில் உள்ள கோரிக்கைகள் மற்றும் தானிகளை காட்ட', 'மிகவும் பரிந்துரை'],
            ['பிறந்த தேதி', 'வயது தகுதி சரிபார்ப்பு (18–65)', 'விருப்பத்திற்கு உட்பட்டது'],
            ['மின்னஞ்சல் முகவரி', 'மின்னஞ்சல் சரிபார்ப்பு, நம்பக நிலை', 'விருப்பத்திற்கு உட்பட்டது'],
            ['GPS இருப்பிடம்', 'SOS ஆரம்ப பொருத்தம், தானி வரைபடம்', 'விருப்பத்திற்கு உட்பட்டது'],
            ['இரத்த வகை ஆவணம்', 'நம்பக நிலைக்கு இரத்த வகையை சரிபார்க்க', 'விருப்பத்திற்கு உட்பட்டது'],
            ['பாலினம்', 'சுயவிவர காட்சி மட்டும்', 'விருப்பத்திற்கு உட்பட்டது'],
          ],
        },
      },
      {
        heading: '3. தரவை எவ்வாறு பயன்படுத்துகிறோம்',
        body: 'உங்கள் தகவலை இதற்கு பயன்படுத்துகிறோம்:',
        list: [
          'உங்கள் இரத்த வகை தேவைப்படுபவர்களுக்கு உங்கள் சுயவிவரத்தை காட்ட',
          'உங்கள் இரத்த வகைக்கான அவசர கோரிக்கை அறிவிப்புகளை அனுப்ப',
          'பதிவின்போது OTP மூலம் உங்கள் அடையாளத்தை சரிபார்க்க',
          'அவசர நேரங்களில் கோருபவர்கள் உங்களை நேரடியாக தொடர்பு கொள்ள',
          'GPS பகிர்ந்தால் தானி வரைபடத்தில் காட்ட',
        ],
        body2: 'உங்கள் தரவை விளம்பரம், விற்பனை, அல்லது மேலே பட்டியலிடப்படாத எந்த நோக்கத்திற்கும் பயன்படுத்த மாட்டோம்.',
      },
      {
        heading: '4. உங்கள் தரவை யார் பார்க்கலாம்',
        body: 'மற்ற LifeLink பயனர்கள் பார்க்கலாம்:',
        list: [
          'உங்கள் பெயர், இரத்த வகை, மாவட்டம் மற்றும் மாநிலம்',
          'அவர்கள் உங்கள் கோரிக்கைக்கு பதிலளிக்கும்போது மட்டும் உங்கள் தொலைபேசி எண்',
          'உங்கள் கிடைக்கும் தன்மை நிலை மற்றும் தான எண்ணிக்கை',
        ],
        body2: 'உங்கள் GPS ஆயங்கள், மின்னஞ்சல், பிறந்த தேதி மற்றும் ஆவணங்கள் மற்ற பயனர்களுக்கு ஒருபோதும் காட்டப்படாது. நிர்வாகிகள் மட்டுமே சரிபார்ப்பு மற்றும் பாதுகாப்பு நோக்கங்களுக்கு இவற்றை அணுகலாம்.',
      },
      {
        heading: '5. தரவு சேமிப்பு & பாதுகாப்பு',
        list: [
          'அனைத்து தரவும் மறைகுறியாக்கத்துடன் MongoDB Atlas-ல் சேமிக்கப்படுகிறது',
          'கடவுச்சொற்கள் bcrypt மூலம் hash செய்யப்படுகின்றன',
          'API அணுகல் JWT tokens மூலம் பாதுகாக்கப்படுகிறது',
          'அனைத்து இணைப்புகளும் HTTPS மூலம் குறியாக்கப்படுகின்றன',
          '5 தவறான முயற்சிகளுக்குப் பிறகு உள்நுழைவு 15 நிமிடங்கள் தடுக்கப்படும்',
        ],
      },
      {
        heading: '6. ஆவண பதிவேற்றங்கள்',
        body: 'இரத்த வகை ஆவணத்தை பதிவேற்றினால், அது பாதுகாப்பாக சேமிக்கப்பட்டு LifeLink நிர்வாகிகளால் மட்டுமே மதிப்பாய்வு செய்யப்படும். கணக்கை நீக்கும்போது ஆவணமும் நீக்கப்படும்.',
      },
      {
        heading: '7. உங்கள் உரிமைகள்',
        body: 'டிஜிட்டல் தனிப்பட்ட தரவு பாதுகாப்பு சட்டம் 2023 (இந்தியா) மற்றும் பொருந்தும் சட்டங்களின்படி உங்களுக்கு உரிமை உண்டு:',
        list: [
          'உங்களைப் பற்றி வைத்திருக்கும் தனிப்பட்ட தரவை அணுக',
          'சுயவிவரத்தில் தவறான தரவை திருத்த',
          'கணக்கை நீக்கி அனைத்து தரவையும் அழிக்க (சுயவிவரம் → கணக்கை நீக்கு)',
          'குறிப்பிட்ட அறிவிப்பு வகைகளிலிருந்து விலக',
          'கணக்கை நீக்குவதன் மூலம் எந்த நேரத்திலும் சம்மதத்தை திரும்ப பெற',
        ],
      },
      {
        heading: '8. மூன்றாம் தரப்பு சேவைகள்',
        body: 'LifeLink பின்வரும் மூன்றாம் தரப்பு சேவைகளை பயன்படுத்துகிறது:',
        list: [
          'MongoDB Atlas — தரவுத்தள சேவை',
          'Render.com — பின்தள சேவையக தொகுப்பு',
          'Vercel — முன்தள தொகுப்பு',
          'Fast2SMS — OTP SMS வழங்கல்',
          'Gmail SMTP — மின்னஞ்சல் சரிபார்ப்பு',
          'OpenStreetMap / Leaflet.js — வரைபட காட்சி',
        ],
      },
      {
        heading: '9. தொடர்பு கொள்ளுங்கள்',
        email: true,
        body: 'தனியுரிமை சம்பந்தமான கேள்விகள் அல்லது தரவு கோரிக்கைகளுக்கு:',
      },
    ],
  },
};

export default function Privacy() {
  const navigate = useNavigate();
  const { lang, toggle: toggleLang } = useLanguage();
  const c = CONTENT[lang] || CONTENT.en;

  return (
    <div style={s.page}>
      <header style={s.header}>
        <div>
          <div style={s.logo}>❤️ LifeLink</div>
          <div style={s.tagline}>Dynamic Real-Time Emergency Network · India</div>
        </div>
        <button style={s.langBtn} onClick={toggleLang}>{c.switchLang}</button>
      </header>

      <div style={s.container}>
        <button style={s.backBtn} onClick={() => navigate(-1)}>{c.back}</button>

        <h1 style={s.title}>{c.title}</h1>
        <p style={s.updated}>{c.updated}</p>

        {c.sections.map((sec, i) => (
          <div key={i} style={s.section}>
            <h2 style={s.h2}>{sec.heading}</h2>
            {sec.body && <p style={s.p}>{sec.body}</p>}
            {sec.table && (
              <table style={s.table}>
                <thead>
                  <tr>{sec.table.headers.map((h, j) => <th key={j} style={s.th}>{h}</th>)}</tr>
                </thead>
                <tbody>
                  {sec.table.rows.map((row, j) => (
                    <tr key={j} style={{ background: j % 2 === 0 ? '#fff' : '#fdf6f6' }}>
                      {row.map((cell, k) => <td key={k} style={s.td}>{cell}</td>)}
                    </tr>
                  ))}
                </tbody>
              </table>
            )}
            {sec.list && (
              <ul style={s.ul}>
                {sec.list.map((item, j) => <li key={j}>{item}</li>)}
              </ul>
            )}
            {sec.body2 && <p style={s.p}>{sec.body2}</p>}
            {sec.email && (
              <p style={s.p}>
                <a href="mailto:generalworks2k25@gmail.com" style={{ color: RED, fontWeight: 600 }}>
                  generalworks2k25@gmail.com
                </a>
              </p>
            )}
          </div>
        ))}

        <div style={s.footer}>
          &copy; {new Date().getFullYear()} LifeLink — Emergency Blood Network &nbsp;&middot;&nbsp;
          <button style={{ background: 'none', border: 'none', color: RED, cursor: 'pointer', padding: 0, fontSize: '0.82rem' }}
            onClick={() => navigate('/terms')}>{c.footerLink}</button>
        </div>
      </div>
    </div>
  );
}
