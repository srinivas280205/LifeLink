const mongoose=require('mongoose');const bcrypt=require('bcryptjs');
module.exports=async function seed(uri){
 if(!uri.includes('/lifelink_exam_demo'))throw new Error('Demo seeding requires the separate exam database');
 await mongoose.connect(uri);const User=require('./models/User');
 const password=await bcrypt.hash('LifeLinkDemo!2026',12);
 const people=[['requester','Demo Requester',null],['near','Demo Nearby Donor',13.1007],['next','Demo Next Donor',13.1457],['backup','Demo Backup Donor',13.1907]];
 for(let i=0;i<people.length;i++){const [role,fullName,lat]=people[i];const fields={fullName,email:role+'@lifelink.example.test',phone:'+9190000001'+String(i).padStart(2,'0'),password,bloodGroup:lat?'O+':'',district:'Chennai',isAvailable:true,isBanned:false,loginAttempts:0,lockUntil:null};if(lat)fields.location={lat,lng:80.2707,source:'manual',updatedAt:new Date()};await User.findOneAndUpdate({email:fields.email},{$set:fields},{upsert:true,new:true,runValidators:true,setDefaultsOnInsert:true});}
 await mongoose.disconnect();console.log('Exam simulation accounts ready in separate demo database');
};
