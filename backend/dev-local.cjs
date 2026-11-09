const path=require('path');const fs=require('fs');
require('dotenv').config({path:path.join(__dirname,'.env')});
if(process.env.NODE_ENV==='production')throw new Error('Local launcher cannot run in production');
const demo=process.argv.includes('--demo');
if(demo){process.env.LOCAL_EXAM_DEMO='true';process.env.COORDINATION_NORMAL_WAIT_SECONDS='15';process.env.COORDINATION_URGENT_WAIT_SECONDS='10';process.env.COORDINATION_CRITICAL_WAIT_SECONDS='5';process.env.COORDINATION_REQUEST_COOLDOWN_SECONDS='5';}
(async()=>{
 if(!process.env.MONGO_URI){
  const {MongoMemoryServer}=require('mongodb-memory-server');
  const {MongoClient}=require('mongoose').mongo;
  const dbPath=path.join(__dirname,'.local-db');fs.mkdirSync(dbPath,{recursive:true});
  const port=58366;
  // Keep this replica-set address stable across restarts.
  await new Promise((resolve,reject)=>{const probe=require('net').createServer();probe.once('error',()=>reject(new Error('Local database port 58366 is busy. Stop the previous local demo first.')));probe.listen(port,'127.0.0.1',()=>probe.close(resolve));});
  const db=await MongoMemoryServer.create({binary:{downloadDir:path.join(__dirname,'node_modules/.cache/mongodb-memory-server')},instance:{dbPath,port,ip:'127.0.0.1',replSet:'lifelink-local',storageEngine:'wiredTiger',launchTimeout:60000}});
  const uri=db.getUri(demo?'lifelink_exam_demo':'lifelink_final_year');
  const client=await MongoClient.connect(uri,{directConnection:true});
  const admin=client.db('admin');
  try{await admin.command({replSetInitiate:{_id:'lifelink-local',members:[{_id:0,host:`127.0.0.1:${port}`}]}})}
  catch(error){if(error.code!==23&&error.codeName!=='AlreadyInitialized')throw error;
   const {config}=await admin.command({replSetGetConfig:1});
   if(config.members[0].host!==`127.0.0.1:${port}`){config.members=[{_id:0,host:`127.0.0.1:${port}`}];config.version+=1;await admin.command({replSetReconfig:config,force:true});}
  }
  let primary=false;
  for(let i=0;i<60;i++){try{if((await admin.command({hello:1})).isWritablePrimary){primary=true;break}}catch{}await new Promise(resolve=>setTimeout(resolve,500));}
  await client.close();if(!primary)throw new Error('Local database did not become ready');
  process.env.MONGO_URI=uri+'?replicaSet=lifelink-local';
  console.log('Local demo database: persistent files in backend/.local-db');
  const stop=async()=>{await db.stop({doCleanup:false,force:false});process.exit(0)};process.on('SIGINT',stop);process.on('SIGTERM',stop);
 }
 if(demo)await require('./demo-seed.cjs')(process.env.MONGO_URI);
 require('./server');
})().catch(error=>{console.error(error.message);process.exit(1)});
