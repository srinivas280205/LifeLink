// Major blood banks across India (government + hospital + Red Cross)
export const BLOOD_BANKS = [
  // Tamil Nadu
  { id: 1,  name: 'Government Royapettah Hospital Blood Bank',         state: 'Tamil Nadu',        district: 'Chennai',      address: 'Royapettah, Chennai - 600014',                phone: '044-28194048',  hours: '24×7',  type: 'Government' },
  { id: 2,  name: 'Govt. Stanley Medical College Blood Bank',          state: 'Tamil Nadu',        district: 'Chennai',      address: 'Old Jail Road, Chennai - 600001',             phone: '044-25281349',  hours: '24×7',  type: 'Government' },
  { id: 3,  name: 'Indian Red Cross Society – Chennai',                state: 'Tamil Nadu',        district: 'Chennai',      address: 'Red Cross Road, Chennai - 600002',            phone: '044-28523243',  hours: '8am–8pm', type: 'Red Cross' },
  { id: 4,  name: 'Apollo Hospitals Blood Bank',                       state: 'Tamil Nadu',        district: 'Chennai',      address: '21 Greams Lane, Chennai - 600006',            phone: '044-28293333',  hours: '24×7',  type: 'Hospital' },
  { id: 5,  name: 'JIPMER Blood Bank',                                 state: 'Tamil Nadu',        district: 'Puducherry',   address: 'Dhanvantri Nagar, Puducherry - 605006',       phone: '0413-2272380',  hours: '24×7',  type: 'Government' },
  { id: 6,  name: 'Govt. Coimbatore Medical College Blood Bank',       state: 'Tamil Nadu',        district: 'Coimbatore',   address: 'Coimbatore Medical College, Coimbatore',      phone: '0422-2301945',  hours: '24×7',  type: 'Government' },
  { id: 7,  name: 'Indian Red Cross – Coimbatore',                     state: 'Tamil Nadu',        district: 'Coimbatore',   address: 'Red Cross Bhavan, Coimbatore - 641018',       phone: '0422-2395566',  hours: '9am–6pm', type: 'Red Cross' },
  { id: 8,  name: 'Madurai Medical College Blood Bank',                state: 'Tamil Nadu',        district: 'Madurai',      address: 'EVN Road, Madurai - 625020',                  phone: '0452-2532535',  hours: '24×7',  type: 'Government' },
  { id: 9,  name: 'Tirunelveli Medical College Blood Bank',            state: 'Tamil Nadu',        district: 'Tirunelveli',  address: 'Tirunelveli Medical College, Tirunelveli',    phone: '0462-2572566',  hours: '24×7',  type: 'Government' },
  { id: 10, name: 'Salem Govt. Medical College Blood Bank',            state: 'Tamil Nadu',        district: 'Salem',        address: 'Govt. Medical College, Salem - 636002',       phone: '0427-2452010',  hours: '24×7',  type: 'Government' },

  // Karnataka
  { id: 11, name: 'Victoria Hospital Blood Bank (BMC)',                state: 'Karnataka',         district: 'Bengaluru',    address: 'K.R. Road, Bengaluru - 560002',               phone: '080-26703333',  hours: '24×7',  type: 'Government' },
  { id: 12, name: 'Indian Red Cross Society – Bengaluru',              state: 'Karnataka',         district: 'Bengaluru',    address: 'N.S. Road, Bengaluru - 560001',               phone: '080-22868660',  hours: '8am–8pm', type: 'Red Cross' },
  { id: 13, name: 'Narayana Health Blood Bank',                        state: 'Karnataka',         district: 'Bengaluru',    address: '258/A, Hosur Road, Bengaluru - 560099',       phone: '080-71222222',  hours: '24×7',  type: 'Hospital' },
  { id: 14, name: 'St. John\'s Medical College Blood Bank',            state: 'Karnataka',         district: 'Bengaluru',    address: 'Sarjapur Road, Bengaluru - 560034',           phone: '080-22065000',  hours: '24×7',  type: 'Hospital' },
  { id: 15, name: 'Manipal Hospital Blood Bank',                       state: 'Karnataka',         district: 'Bengaluru',    address: '98 HAL Airport Road, Bengaluru - 560017',     phone: '080-22225184',  hours: '24×7',  type: 'Hospital' },
  { id: 16, name: 'Mysuru Medical College Blood Bank',                 state: 'Karnataka',         district: 'Mysuru',       address: 'Irwin Road, Mysuru - 570021',                 phone: '0821-2423201',  hours: '24×7',  type: 'Government' },
  { id: 17, name: 'KIMS Hubli Blood Bank',                             state: 'Karnataka',         district: 'Dharwad',      address: 'KIMS Campus, Hubli - 580022',                 phone: '0836-2209000',  hours: '24×7',  type: 'Hospital' },

  // Maharashtra
  { id: 18, name: 'KEM Hospital Blood Bank',                           state: 'Maharashtra',       district: 'Mumbai',       address: 'Acharya Donde Marg, Parel, Mumbai - 400012',  phone: '022-24136051',  hours: '24×7',  type: 'Government' },
  { id: 19, name: 'Nair Hospital Blood Bank',                          state: 'Maharashtra',       district: 'Mumbai',       address: 'Dr. A.L. Nair Road, Mumbai - 400008',         phone: '022-23027600',  hours: '24×7',  type: 'Government' },
  { id: 20, name: 'Indian Red Cross Society – Mumbai',                 state: 'Maharashtra',       district: 'Mumbai',       address: 'Shahid Bhagat Singh Road, Mumbai - 400001',   phone: '022-22620331',  hours: '8am–8pm', type: 'Red Cross' },
  { id: 21, name: 'Tata Memorial Hospital Blood Bank',                 state: 'Maharashtra',       district: 'Mumbai',       address: 'Dr. Ernest Borges Road, Parel, Mumbai',       phone: '022-24177000',  hours: '24×7',  type: 'Hospital' },
  { id: 22, name: 'Sassoon General Hospital Blood Bank',               state: 'Maharashtra',       district: 'Pune',         address: 'Near Pune Railway Station, Pune - 411001',    phone: '020-26128000',  hours: '24×7',  type: 'Government' },
  { id: 23, name: 'Ruby Hall Clinic Blood Bank',                       state: 'Maharashtra',       district: 'Pune',         address: '40 Sassoon Road, Pune - 411001',              phone: '020-66455100',  hours: '24×7',  type: 'Hospital' },
  { id: 24, name: 'Govt. Medical College Blood Bank – Nagpur',         state: 'Maharashtra',       district: 'Nagpur',       address: 'Hanuman Nagar, Nagpur - 440009',              phone: '0712-2748000',  hours: '24×7',  type: 'Government' },
  { id: 25, name: 'Aurangabad Govt. Medical College Blood Bank',       state: 'Maharashtra',       district: 'Aurangabad',   address: 'Panchakki Road, Aurangabad - 431001',         phone: '0240-2334411',  hours: '24×7',  type: 'Government' },

  // Delhi / NCR
  { id: 26, name: 'AIIMS Blood Bank',                                  state: 'Delhi',             district: 'New Delhi',    address: 'Sri Aurobindo Marg, New Delhi - 110029',      phone: '011-26588500',  hours: '24×7',  type: 'Government' },
  { id: 27, name: 'Safdarjung Hospital Blood Bank',                    state: 'Delhi',             district: 'New Delhi',    address: 'Sri Aurobindo Marg, New Delhi - 110029',      phone: '011-26707444',  hours: '24×7',  type: 'Government' },
  { id: 28, name: 'LNJP Hospital Blood Bank',                          state: 'Delhi',             district: 'New Delhi',    address: 'Jawaharlal Nehru Marg, New Delhi - 110002',   phone: '011-23232400',  hours: '24×7',  type: 'Government' },
  { id: 29, name: 'Indian Red Cross Society – New Delhi',              state: 'Delhi',             district: 'New Delhi',    address: '1 Red Cross Road, New Delhi - 110001',        phone: '011-23711551',  hours: '8am–8pm', type: 'Red Cross' },
  { id: 30, name: 'GTB Hospital Blood Bank',                           state: 'Delhi',             district: 'East Delhi',   address: 'Dilshad Garden, Delhi - 110095',              phone: '011-22583112',  hours: '24×7',  type: 'Government' },
  { id: 31, name: 'Sir Ganga Ram Hospital Blood Bank',                 state: 'Delhi',             district: 'New Delhi',    address: 'Rajinder Nagar, New Delhi - 110060',          phone: '011-25750000',  hours: '24×7',  type: 'Hospital' },

  // Telangana
  { id: 32, name: 'Osmania General Hospital Blood Bank',               state: 'Telangana',         district: 'Hyderabad',    address: 'Afzalgunj, Hyderabad - 500012',               phone: '040-24600303',  hours: '24×7',  type: 'Government' },
  { id: 33, name: 'Indian Red Cross Society – Hyderabad',              state: 'Telangana',         district: 'Hyderabad',    address: 'Red Cross Road, Hyderabad - 500004',          phone: '040-27654801',  hours: '8am–8pm', type: 'Red Cross' },
  { id: 34, name: 'NIMS Blood Bank',                                   state: 'Telangana',         district: 'Hyderabad',    address: 'Punjagutta, Hyderabad - 500082',              phone: '040-23489000',  hours: '24×7',  type: 'Government' },
  { id: 35, name: 'Apollo Hospitals Blood Bank – Jubilee Hills',       state: 'Telangana',         district: 'Hyderabad',    address: 'Film Nagar, Jubilee Hills, Hyderabad',        phone: '040-23607777',  hours: '24×7',  type: 'Hospital' },
  { id: 36, name: 'Gandhi Hospital Blood Bank',                        state: 'Telangana',         district: 'Hyderabad',    address: 'Musheerabad, Hyderabad - 500003',             phone: '040-27505566',  hours: '24×7',  type: 'Government' },

  // Andhra Pradesh
  { id: 37, name: 'Govt. General Hospital Blood Bank – Vijayawada',    state: 'Andhra Pradesh',    district: 'Krishna',      address: 'Machavaram, Vijayawada - 520004',             phone: '0866-2471080',  hours: '24×7',  type: 'Government' },
  { id: 38, name: 'SVIMS Blood Bank – Tirupati',                       state: 'Andhra Pradesh',    district: 'Tirupati',     address: 'Alipiri Road, Tirupati - 517507',             phone: '0877-2287777',  hours: '24×7',  type: 'Government' },
  { id: 39, name: 'Govt. General Hospital Blood Bank – Visakhapatnam', state: 'Andhra Pradesh',    district: 'Visakhapatnam',address: 'King George Hospital, Visakhapatnam',         phone: '0891-2564891',  hours: '24×7',  type: 'Government' },
  { id: 40, name: 'Indian Red Cross – Vijayawada',                     state: 'Andhra Pradesh',    district: 'Krishna',      address: 'M.G. Road, Vijayawada - 520010',             phone: '0866-2577055',  hours: '9am–6pm', type: 'Red Cross' },

  // Kerala
  { id: 41, name: 'Medical College Hospital Blood Bank – Thiruvananthapuram', state: 'Kerala', district: 'Thiruvananthapuram', address: 'Medical College Road, Thiruvananthapuram',  phone: '0471-2528386',  hours: '24×7',  type: 'Government' },
  { id: 42, name: 'Indian Red Cross Society – Thiruvananthapuram',     state: 'Kerala',            district: 'Thiruvananthapuram', address: 'Museum Road, Thiruvananthapuram - 695014', phone: '0471-2318882',  hours: '8am–8pm', type: 'Red Cross' },
  { id: 43, name: 'Govt. Medical College Blood Bank – Kozhikode',      state: 'Kerala',            district: 'Kozhikode',    address: 'Medical College Road, Kozhikode - 673008',   phone: '0495-2350216',  hours: '24×7',  type: 'Government' },
  { id: 44, name: 'Amrita Institute of Medical Sciences Blood Bank',   state: 'Kerala',            district: 'Ernakulam',    address: 'AIMS Ponekkara, Kochi - 682041',              phone: '0484-2801234',  hours: '24×7',  type: 'Hospital' },
  { id: 45, name: 'Govt. Medical College Blood Bank – Thrissur',       state: 'Kerala',            district: 'Thrissur',     address: 'Medical College Campus, Thrissur - 680596',  phone: '0487-2361100',  hours: '24×7',  type: 'Government' },

  // West Bengal
  { id: 46, name: 'SSKM (PG Hospital) Blood Bank',                     state: 'West Bengal',       district: 'Kolkata',      address: '244 AJC Bose Road, Kolkata - 700020',        phone: '033-22041568',  hours: '24×7',  type: 'Government' },
  { id: 47, name: 'Medical College Kolkata Blood Bank',                state: 'West Bengal',       district: 'Kolkata',      address: '88 College Street, Kolkata - 700073',         phone: '033-22121461',  hours: '24×7',  type: 'Government' },
  { id: 48, name: 'Indian Red Cross Society – Kolkata',                state: 'West Bengal',       district: 'Kolkata',      address: '32 Rafi Ahmed Kidwai Road, Kolkata - 700016', phone: '033-22436348',  hours: '8am–8pm', type: 'Red Cross' },
  { id: 49, name: 'Nil Ratan Sircar Medical College Blood Bank',       state: 'West Bengal',       district: 'Kolkata',      address: '138 AJC Bose Road, Kolkata - 700014',        phone: '033-22253010',  hours: '24×7',  type: 'Government' },

  // Rajasthan
  { id: 50, name: 'SMS Medical College Blood Bank',                    state: 'Rajasthan',         district: 'Jaipur',       address: 'JLN Marg, Jaipur - 302004',                  phone: '0141-2518367',  hours: '24×7',  type: 'Government' },
  { id: 51, name: 'Indian Red Cross Society – Jaipur',                 state: 'Rajasthan',         district: 'Jaipur',       address: 'Mirza Ismail Road, Jaipur - 302001',          phone: '0141-2362777',  hours: '8am–8pm', type: 'Red Cross' },
  { id: 52, name: 'Umaid Hospital Blood Bank – Jodhpur',               state: 'Rajasthan',         district: 'Jodhpur',      address: 'Residency Road, Jodhpur - 342003',            phone: '0291-2434374',  hours: '24×7',  type: 'Government' },
  { id: 53, name: 'RNT Medical College Blood Bank – Udaipur',          state: 'Rajasthan',         district: 'Udaipur',      address: 'Chetak Circle, Udaipur - 313001',             phone: '0294-2528811',  hours: '24×7',  type: 'Government' },

  // Gujarat
  { id: 54, name: 'Civil Hospital Blood Bank – Ahmedabad',             state: 'Gujarat',           district: 'Ahmedabad',    address: 'Asarwa, Ahmedabad - 380016',                  phone: '079-22681122',  hours: '24×7',  type: 'Government' },
  { id: 55, name: 'Indian Red Cross Society – Ahmedabad',              state: 'Gujarat',           district: 'Ahmedabad',    address: 'Red Cross Bhavan, Ahmedabad - 380001',        phone: '079-25502330',  hours: '8am–8pm', type: 'Red Cross' },
  { id: 56, name: 'Surat Municipal Institute Blood Bank',              state: 'Gujarat',           district: 'Surat',        address: 'Umarwada, Surat - 395010',                    phone: '0261-2411714',  hours: '24×7',  type: 'Government' },
  { id: 57, name: 'Rajkot Civil Hospital Blood Bank',                  state: 'Gujarat',           district: 'Rajkot',       address: 'Kalawad Road, Rajkot - 360001',               phone: '0281-2444222',  hours: '24×7',  type: 'Government' },

  // Uttar Pradesh
  { id: 58, name: 'KGMU Blood Bank',                                   state: 'Uttar Pradesh',     district: 'Lucknow',      address: 'Shah Mina Road, Lucknow - 226003',            phone: '0522-2257540',  hours: '24×7',  type: 'Government' },
  { id: 59, name: 'Indian Red Cross Society – Lucknow',                state: 'Uttar Pradesh',     district: 'Lucknow',      address: '5 Mall Avenue, Lucknow - 226001',             phone: '0522-2239060',  hours: '8am–8pm', type: 'Red Cross' },
  { id: 60, name: 'SN Medical College Blood Bank – Agra',              state: 'Uttar Pradesh',     district: 'Agra',         address: 'MG Road, Agra - 282002',                      phone: '0562-2526451',  hours: '24×7',  type: 'Government' },
  { id: 61, name: 'BHU Sir Sunderlal Hospital Blood Bank',             state: 'Uttar Pradesh',     district: 'Varanasi',     address: 'BHU Campus, Varanasi - 221005',               phone: '0542-2367568',  hours: '24×7',  type: 'Government' },
  { id: 62, name: 'LLR Hospital Blood Bank – Kanpur',                  state: 'Uttar Pradesh',     district: 'Kanpur Nagar', address: 'Swaroop Nagar, Kanpur - 208002',              phone: '0512-2558680',  hours: '24×7',  type: 'Government' },

  // Madhya Pradesh
  { id: 63, name: 'Hamidia Hospital Blood Bank',                       state: 'Madhya Pradesh',    district: 'Bhopal',       address: 'Royal Market, Bhopal - 462001',               phone: '0755-2540222',  hours: '24×7',  type: 'Government' },
  { id: 64, name: 'Indian Red Cross Society – Bhopal',                 state: 'Madhya Pradesh',    district: 'Bhopal',       address: 'Shamla Hills, Bhopal - 462013',               phone: '0755-2661161',  hours: '8am–8pm', type: 'Red Cross' },
  { id: 65, name: 'MY Hospital Blood Bank – Indore',                   state: 'Madhya Pradesh',    district: 'Indore',       address: 'MG Road, Indore - 452001',                    phone: '0731-2527290',  hours: '24×7',  type: 'Government' },

  // Punjab
  { id: 66, name: 'Govt. Medical College Blood Bank – Amritsar',       state: 'Punjab',            district: 'Amritsar',     address: 'Majitha Road, Amritsar - 143001',             phone: '0183-2424771',  hours: '24×7',  type: 'Government' },
  { id: 67, name: 'PGI Blood Bank – Chandigarh',                       state: 'Punjab',            district: 'SAS Nagar',    address: 'Sector 12, Chandigarh - 160012',              phone: '0172-2756565',  hours: '24×7',  type: 'Government' },
  { id: 68, name: 'Indian Red Cross Society – Chandigarh',             state: 'Punjab',            district: 'SAS Nagar',    address: 'Sector 35-B, Chandigarh - 160022',            phone: '0172-2609010',  hours: '8am–8pm', type: 'Red Cross' },

  // Bihar
  { id: 69, name: 'PMCH Blood Bank – Patna',                           state: 'Bihar',             district: 'Patna',        address: 'Ashok Rajpath, Patna - 800004',               phone: '0612-2300290',  hours: '24×7',  type: 'Government' },
  { id: 70, name: 'Indian Red Cross Society – Patna',                  state: 'Bihar',             district: 'Patna',        address: 'Gandhi Maidan, Patna - 800001',               phone: '0612-2222879',  hours: '8am–8pm', type: 'Red Cross' },

  // Odisha
  { id: 71, name: 'SCB Medical College Blood Bank',                    state: 'Odisha',            district: 'Cuttack',      address: 'SCB Medical College, Cuttack - 753007',       phone: '0671-2304660',  hours: '24×7',  type: 'Government' },
  { id: 72, name: 'Capital Hospital Blood Bank',                       state: 'Odisha',            district: 'Khordha',      address: 'Unit 6, Bhubaneswar - 751001',                phone: '0674-2392314',  hours: '24×7',  type: 'Government' },
  { id: 73, name: 'Indian Red Cross Society – Bhubaneswar',            state: 'Odisha',            district: 'Khordha',      address: 'Saheed Nagar, Bhubaneswar - 751007',          phone: '0674-2540152',  hours: '8am–8pm', type: 'Red Cross' },

  // Assam
  { id: 74, name: 'GMCH Blood Bank',                                   state: 'Assam',             district: 'Kamrup Metro', address: 'Bhangagarh, Guwahati - 781032',               phone: '0361-2529457',  hours: '24×7',  type: 'Government' },
  { id: 75, name: 'Indian Red Cross Society – Guwahati',               state: 'Assam',             district: 'Kamrup Metro', address: 'Mahatma Gandhi Road, Guwahati - 781001',      phone: '0361-2635291',  hours: '8am–8pm', type: 'Red Cross' },

  // Haryana
  { id: 76, name: 'PGIMS Blood Bank – Rohtak',                         state: 'Haryana',           district: 'Rohtak',       address: 'PGIMS Campus, Rohtak - 124001',               phone: '01262-213070',  hours: '24×7',  type: 'Government' },
  { id: 77, name: 'General Hospital Blood Bank – Faridabad',           state: 'Haryana',           district: 'Faridabad',    address: 'NIT Faridabad - 121001',                      phone: '0129-2414800',  hours: '24×7',  type: 'Government' },

  // Jharkhand
  { id: 78, name: 'RIMS Blood Bank – Ranchi',                          state: 'Jharkhand',         district: 'Ranchi',       address: 'Bariatu Road, Ranchi - 834009',               phone: '0651-2542972',  hours: '24×7',  type: 'Government' },
  { id: 79, name: 'Indian Red Cross Society – Ranchi',                 state: 'Jharkhand',         district: 'Ranchi',       address: 'Harmu Road, Ranchi - 834001',                 phone: '0651-2330330',  hours: '8am–8pm', type: 'Red Cross' },

  // Chhattisgarh
  { id: 80, name: 'DKS Postgraduate Institute Blood Bank',             state: 'Chhattisgarh',      district: 'Raipur',       address: 'Near Airport, Raipur - 492001',               phone: '0771-4010401',  hours: '24×7',  type: 'Government' },
  { id: 81, name: 'Indian Red Cross Society – Raipur',                 state: 'Chhattisgarh',      district: 'Raipur',       address: 'Civil Lines, Raipur - 492001',                phone: '0771-2232600',  hours: '8am–8pm', type: 'Red Cross' },

  // Himachal Pradesh
  { id: 82, name: 'IGMC Blood Bank – Shimla',                          state: 'Himachal Pradesh',  district: 'Shimla',       address: 'Snowdon, Shimla - 171001',                    phone: '0177-2804251',  hours: '24×7',  type: 'Government' },

  // Uttarakhand
  { id: 83, name: 'AIIMS Rishikesh Blood Bank',                        state: 'Uttarakhand',       district: 'Dehradun',     address: 'Virbhadra Road, Rishikesh - 249203',          phone: '0135-2462900',  hours: '24×7',  type: 'Government' },
  { id: 84, name: 'Doon Medical College Blood Bank',                   state: 'Uttarakhand',       district: 'Dehradun',     address: 'Patel Nagar, Dehradun - 248001',              phone: '0135-2714891',  hours: '24×7',  type: 'Government' },

  // Goa
  { id: 85, name: 'Goa Medical College Blood Bank',                    state: 'Goa',               district: 'North Goa',    address: 'Bambolim, Goa - 403202',                      phone: '0832-2458727',  hours: '24×7',  type: 'Government' },
  { id: 86, name: 'Indian Red Cross Society – Panaji',                 state: 'Goa',               district: 'North Goa',    address: 'Swami Vivekanand Road, Panaji - 403001',      phone: '0832-2222424',  hours: '8am–8pm', type: 'Red Cross' },

  // Manipur
  { id: 87, name: 'RIMS Blood Bank – Imphal',                          state: 'Manipur',           district: 'Imphal West',  address: 'Lamphelpat, Imphal - 795004',                 phone: '0385-2415094',  hours: '24×7',  type: 'Government' },

  // Meghalaya
  { id: 88, name: 'Civil Hospital Blood Bank – Shillong',              state: 'Meghalaya',         district: 'East Khasi Hills', address: 'Laban, Shillong - 793004',                phone: '0364-2222345',  hours: '24×7',  type: 'Government' },
];

// Helper: filter by state + optional district
export function filterBloodBanks(state, district = '') {
  return BLOOD_BANKS.filter(
    (b) =>
      (!state || b.state === state) &&
      (!district || b.district.toLowerCase().includes(district.toLowerCase()))
  );
}

// Get all unique states that have blood bank entries
export const BLOOD_BANK_STATES = [...new Set(BLOOD_BANKS.map((b) => b.state))].sort();
