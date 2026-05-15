import { useState } from 'react';
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
  footer:    { borderTop: '1px solid #e0e0e0', paddingTop: '1.5rem', fontSize: '0.82rem', color: '#888', textAlign: 'center' },
};

const CONTENT = {
  en: {
    title:   'Terms of Service',
    updated: 'Last updated: May 2026',
    back:    '← Back',
    sections: [
      {
        heading: '1. Acceptance of Terms',
        body: 'By registering for or using LifeLink ("the Service"), you agree to be bound by these Terms of Service. If you do not agree, please do not use LifeLink. We may update these terms from time to time; continued use constitutes acceptance of the revised terms.',
      },
      {
        heading: '2. Description of Service',
        body: 'LifeLink is an emergency blood donor broadcast network that connects individuals who need blood with voluntary donors in their area. The platform allows users to:',
        list: [
          'Register as a blood donor and appear in donor listings',
          'Broadcast emergency blood requests to nearby donors',
          'Respond to blood requests from other users',
          'Send SOS alerts in critical emergencies',
          'View and contact donors based on blood group and location',
        ],
        body2: 'LifeLink is a community coordination tool — not a hospital, blood bank, or medical institution. We do not guarantee availability of any donor or blood supply.',
      },
      {
        heading: '3. Eligibility',
        body: 'You must be at least 18 years old and not more than 65 years old to register as a blood donor on LifeLink. By registering, you confirm you meet these age requirements.',
      },
      {
        heading: '4. User Responsibilities',
        body: 'By using LifeLink, you agree to:',
        list: [
          'Provide accurate and truthful information — name, phone, and blood group',
          'Keep your profile information up to date',
          'Use donor contact information only for blood donation coordination',
          'Not use the platform for commercial, marketing, or unrelated personal purposes',
          'Respond honestly when accepting or declining donation requests',
          'Update your availability status if you are unable to donate',
          'Not impersonate other users, hospitals, or medical professionals',
        ],
      },
      {
        heading: '5. Document Verification',
        body: 'Users who upload blood group documents certify that the submitted documents are genuine. Uploading false or altered documents is a violation of these Terms and may constitute fraud under the Information Technology Act, 2000 (India). LifeLink performs manual review of submitted documents and will reject documents that appear fake or unclear. Users who submit fraudulent documents may be permanently banned.',
      },
      {
        heading: '6. Prohibited Conduct',
        body: 'The following are strictly prohibited on LifeLink:',
        list: [
          'Posting fake or fraudulent blood requests or emergency alerts',
          'Harassing, threatening, or abusing other users',
          'Spamming donors with unsolicited messages',
          'Using the platform for commercial blood trade or compensation',
          'Attempting to access or alter other users\' accounts',
          'Uploading malicious files or attempting to compromise security',
        ],
        body2: 'Violations may result in immediate account suspension or permanent ban without notice.',
      },
      {
        heading: '7. Limitation of Liability',
        body: 'LifeLink is a volunteer coordination platform provided "as is." We do not guarantee:',
        list: [
          'That a donor will respond to any request',
          'The accuracy of any user-provided blood group information',
          'Uninterrupted availability of the service',
          'A positive medical outcome',
        ],
        body2: 'LifeLink and its operators shall not be liable for any damages arising from use of the platform. Always contact a certified hospital or blood bank for medical emergencies.',
      },
      {
        heading: '8. Account Termination',
        body: 'You may delete your account at any time from your Profile page. All your data will be permanently removed. We reserve the right to suspend or terminate accounts that violate these terms.',
      },
      {
        heading: '9. Governing Law',
        body: 'These terms are governed by the laws of India. Any disputes shall be subject to the exclusive jurisdiction of the courts of India.',
      },
      {
        heading: '10. Contact',
        email: true,
        body: 'For questions or legal notices related to these Terms, contact us at:',
      },
    ],
    footerLink: 'Privacy Policy',
    switchLang: 'தமிழ்',
  },
  ta: {
    title:   'சேவை விதிமுறைகள்',
    updated: 'கடைசியாக புதுப்பிக்கப்பட்டது: மே 2026',
    back:    '← திரும்பு',
    sections: [
      {
        heading: '1. விதிமுறைகளை ஏற்றுக்கொள்ளல்',
        body: 'LifeLink-ஐ பதிவு செய்து பயன்படுத்துவதன் மூலம், இந்த சேவை விதிமுறைகளை ஏற்றுக்கொள்கிறீர்கள். நீங்கள் ஏற்கவில்லை என்றால், LifeLink-ஐ பயன்படுத்த வேண்டாம். நாங்கள் இந்த விதிமுறைகளை அவ்வப்போது புதுப்பிக்கலாம்; தொடர்ந்து பயன்படுத்துவது திருத்தப்பட்ட விதிமுறைகளை ஏற்றுக்கொள்வதாகும்.',
      },
      {
        heading: '2. சேவையின் விளக்கம்',
        body: 'LifeLink என்பது அவசர இரத்த தானி நெட்வொர்க் — இரத்தம் தேவைப்படுபவர்களை அருகில் உள்ள தன்னார்வ தானிகளுடன் இணைக்கிறது. பயனர்கள் இதை செய்யலாம்:',
        list: [
          'இரத்த தானியாக பதிவு செய்து தானி பட்டியலில் தோன்றலாம்',
          'அவசர இரத்த கோரிக்கைகளை அருகில் உள்ள தானிகளுக்கு அனுப்பலாம்',
          'மற்ற பயனர்களின் இரத்த கோரிக்கைகளுக்கு பதிலளிக்கலாம்',
          'மிகவும் அவசர நேரங்களில் SOS எச்சரிக்கை அனுப்பலாம்',
          'இரத்த வகை மற்றும் இடத்தின் அடிப்படையில் தானிகளை தொடர்பு கொள்ளலாம்',
        ],
        body2: 'LifeLink ஒரு சமூக ஒருங்கிணைப்பு கருவி — மருத்துவமனை, இரத்த வங்கி அல்லது மருத்துவ நிறுவனம் அல்ல.',
      },
      {
        heading: '3. தகுதி',
        body: 'LifeLink-ல் இரத்த தானியாக பதிவு செய்ய குறைந்தது 18 வயதும் அதிகபட்சம் 65 வயதும் இருக்க வேண்டும். பதிவு செய்வதன் மூலம் இந்த வயது தேவைகளை பூர்த்தி செய்கிறீர்கள் என்று உறுதிப்படுத்துகிறீர்கள்.',
      },
      {
        heading: '4. பயனர் பொறுப்புகள்',
        body: 'LifeLink-ஐ பயன்படுத்துவதன் மூலம் நீங்கள் உடன்படுகிறீர்கள்:',
        list: [
          'உண்மையான தகவல்களை வழங்க — பெயர், தொலைபேசி மற்றும் இரத்த வகை',
          'உங்கள் சுயவிவரத் தகவலை புதுப்பித்து வைக்க',
          'தானி தொடர்பு தகவலை இரத்த தானம் ஒருங்கிணைப்புக்கு மட்டுமே பயன்படுத்த',
          'தேவை இல்லாத நோக்கங்களுக்கு தளத்தை பயன்படுத்தாமல் இருக்க',
          'தான வேண்டுகோள்களை ஏற்கும்போது அல்லது மறுக்கும்போது நேர்மையாக இருக்க',
        ],
      },
      {
        heading: '5. ஆவண சரிபார்ப்பு',
        body: 'இரத்த வகை ஆவணங்களை பதிவேற்றும் பயனர்கள் சமர்ப்பிக்கப்பட்ட ஆவணங்கள் உண்மையானவை என்று சான்றளிக்கிறார்கள். தவறான ஆவணங்களை பதிவேற்றுவது இந்த விதிமுறைகளை மீறுவதாகும். நிர்வாகிகள் ஆவணங்களை மதிப்பாய்வு செய்வார்கள். போலியான ஆவணங்களை சமர்ப்பிக்கும் பயனர்கள் நிரந்தரமாக தடை செய்யப்படலாம்.',
      },
      {
        heading: '6. தடைசெய்யப்பட்ட செயல்கள்',
        body: 'பின்வருவன LifeLink-ல் கடுமையாக தடை செய்யப்பட்டுள்ளன:',
        list: [
          'போலியான இரத்த கோரிக்கைகள் அல்லது அவசர எச்சரிக்கைகளை வெளியிடுவது',
          'மற்ற பயனர்களை துன்புறுத்துவது அல்லது மிரட்டுவது',
          'விளம்பர அல்லது வணிக நோக்கங்களுக்கு தளத்தை பயன்படுத்துவது',
          'மற்ற பயனர்களின் கணக்குகளை அணுக முயற்சிப்பது',
          'தீங்கிழைக்கும் கோப்புகளை பதிவேற்றுவது',
        ],
        body2: 'மீறல்கள் உடனடி கணக்கு இடைநிறுத்தம் அல்லது நிரந்தர தடையில் விளையும்.',
      },
      {
        heading: '7. பொறுப்பு வரம்பு',
        body: 'LifeLink "அப்படியே" வழங்கப்படும் தன்னார்வ ஒருங்கிணைப்பு தளம். நாங்கள் உறுதி அளிக்கவில்லை:',
        list: [
          'எந்த கோரிக்கைக்கும் தானி வருவார்கள் என்று',
          'பயனர் வழங்கும் இரத்த வகை தகவல் துல்லியமானது என்று',
          'சேவை தடைகள் இல்லாமல் இயங்கும் என்று',
          'சாதகமான மருத்துவ விளைவு கிடைக்கும் என்று',
        ],
        body2: 'மருத்துவ அவசர நேரங்களில் எப்போதும் சான்றளிக்கப்பட்ட மருத்துவமனை அல்லது இரத்த வங்கியை தொடர்பு கொள்ளவும்.',
      },
      {
        heading: '8. கணக்கு நிறுத்தம்',
        body: 'உங்கள் சுயவிவரப் பக்கத்திலிருந்து எப்போது வேண்டுமானாலும் கணக்கை நீக்கலாம். உங்கள் அனைத்து தரவும் நிரந்தரமாக அழிக்கப்படும்.',
      },
      {
        heading: '9. ஆளும் சட்டம்',
        body: 'இந்த விதிமுறைகள் இந்திய சட்டங்களால் நிர்வகிக்கப்படுகின்றன. எந்தவொரு தகராறும் இந்திய நீதிமன்றங்களுக்கு உட்பட்டது.',
      },
      {
        heading: '10. தொடர்பு',
        email: true,
        body: 'இந்த விதிமுறைகள் தொடர்பான கேள்விகள் அல்லது சட்ட அறிவிப்புகளுக்கு எங்களை தொடர்பு கொள்ளவும்:',
      },
    ],
    footerLink: 'தனியுரிமைக் கொள்கை',
    switchLang: 'English',
  },
};

export default function Terms() {
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
            <p style={s.p}>{sec.body}</p>
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
            onClick={() => navigate('/privacy')}>{c.footerLink}</button>
        </div>
      </div>
    </div>
  );
}
