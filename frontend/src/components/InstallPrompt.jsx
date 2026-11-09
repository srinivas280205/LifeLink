import { useEffect, useState } from 'react';
import { useLanguage } from '../context/LanguageContext';
export default function InstallPrompt(){
 const {lang}=useLanguage();const ta=lang==='ta';
 const [prompt,setPrompt]=useState(null),[installed,setInstalled]=useState(false),[help,setHelp]=useState(false);
 useEffect(()=>{
  setInstalled(window.matchMedia('(display-mode: standalone)').matches || navigator.standalone === true);
  const ready=e=>{e.preventDefault();setPrompt(e);};const done=()=>{setInstalled(true);setPrompt(null);};
  window.addEventListener('beforeinstallprompt',ready);window.addEventListener('appinstalled',done);
  return ()=>{window.removeEventListener('beforeinstallprompt',ready);window.removeEventListener('appinstalled',done);};
 },[]);
 async function install(){if(!prompt){setHelp(!help);return;}try{await prompt.prompt();await prompt.userChoice;}finally{setPrompt(null);}}
 if(installed)return null;
 return <aside style={{maxWidth:1000,margin:'24px auto',padding:16,lineHeight:1.7}}>
  <button onClick={install} style={{padding:'12px 20px',font:'inherit',borderRadius:10,cursor:'pointer'}}>{ta?'LifeLink செயலியைச் சேர்க்கவும்':'Install LifeLink'}</button>
  <p>{ta?'நிறுவாமலும் இந்த இணையதளத்தைப் பயன்படுத்தலாம்.':'Installation is optional. You can use this website directly.'}</p>
  {help&&<p role="status">{ta?'iPhone: Safari பகிர்வு பொத்தானில் முகப்புத் திரையில் சேர்க்கும் விருப்பத்தைத் தேர்ந்தெடுக்கவும். Android: உலாவியின் பட்டியலில் செயலியை நிறுவும் அல்லது முகப்புத் திரையில் சேர்க்கும் விருப்பத்தைத் தேர்ந்தெடுக்கவும். விருப்பம் தெரியாவிட்டால் உலாவியிலேயே பயன்படுத்தலாம்.':'iPhone: in Safari, use Share → Add to Home Screen. Android: open your browser menu and choose Install app or Add to Home screen. If unavailable, continue in the browser.'}</p>}
 </aside>;
}
