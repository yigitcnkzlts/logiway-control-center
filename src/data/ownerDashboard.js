export const dashboardMonths=[
  {key:"2025-09",label:"Eylül 2025",loads:248,trips:142,gmv:548000,revenue:27400,newUsers:48,onTime:88},
  {key:"2025-10",label:"Ekim 2025",loads:286,trips:171,gmv:634000,revenue:31700,newUsers:57,onTime:89},
  {key:"2025-11",label:"Kasım 2025",loads:328,trips:208,gmv:762000,revenue:38100,newUsers:64,onTime:89},
  {key:"2025-12",label:"Aralık 2025",loads:402,trips:264,gmv:918000,revenue:45900,newUsers:76,onTime:90},
  {key:"2026-01",label:"Ocak 2026",loads:486,trips:312,gmv:1084000,revenue:54200,newUsers:92,onTime:91},
  {key:"2026-02",label:"Şubat 2026",loads:558,trips:367,gmv:1268000,revenue:63400,newUsers:118,onTime:92},
  {key:"2026-03",label:"Mart 2026",loads:641,trips:425,gmv:1495000,revenue:74750,newUsers:143,onTime:93},
  {key:"2026-04",label:"Nisan 2026",loads:704,trips:478,gmv:1682000,revenue:84100,newUsers:167,onTime:94},
  {key:"2026-05",label:"Mayıs 2026",loads:812,trips:563,gmv:1984000,revenue:99200,newUsers:204,onTime:95},
  {key:"2026-06",label:"Haziran 2026",loads:886,trips:621,gmv:2240000,revenue:112000,newUsers:231,onTime:95},
  {key:"2026-07",label:"Temmuz 2026",loads:934,trips:658,gmv:2398000,revenue:119900,newUsers:246,onTime:96},
  {key:"2026-08",label:"Ağustos 2026",loads:978,trips:701,gmv:2584000,revenue:129200,newUsers:269,onTime:96},
];

export const dashboardCompanies=[
  {id:"CO-1042",name:"Kaya Endüstri",type:"Yük veren",country:"Türkiye",status:"Doğrulandı",members:8,vehicles:0,trips:84,volume:"284.600 €",joined:"18 May 2026"},
  {id:"CO-1041",name:"NordCargo AS",type:"Lojistik firması",country:"Norveç",status:"Doğrulandı",members:22,vehicles:31,trips:184,volume:"612.400 €",joined:"16 May 2026"},
  {id:"CO-1039",name:"EuroLink AB",type:"Filo sahibi",country:"İsveç",status:"Doğrulandı",members:14,vehicles:19,trips:126,volume:"438.250 €",joined:"11 May 2026"},
  {id:"CO-1035",name:"Milano Foods SRL",type:"Yük veren",country:"İtalya",status:"İnceleniyor",members:5,vehicles:0,trips:42,volume:"167.800 €",joined:"7 May 2026"},
  {id:"CO-1028",name:"Rhein Transport GmbH",type:"Lojistik firması",country:"Almanya",status:"Doğrulandı",members:37,vehicles:48,trips:241,volume:"894.100 €",joined:"29 Nis 2026"},
  {id:"CO-1022",name:"Anadolu Filo",type:"Filo sahibi",country:"Türkiye",status:"İnceleniyor",members:18,vehicles:26,trips:97,volume:"328.900 €",joined:"21 Nis 2026"},
  {id:"CO-1017",name:"Benelux Parts BV",type:"Yük veren",country:"Hollanda",status:"Doğrulandı",members:7,vehicles:0,trips:63,volume:"214.750 €",joined:"12 Nis 2026"},
];

export const dashboardUsers=[
  {id:"USR-9321",name:"Ayşe Kaya",email:"ayse@kayaendustri.com",role:"Yük veren",company:"Kaya Endüstri",country:"Türkiye",status:"Aktif",joined:"18 May 2026"},
  {id:"USR-9318",name:"Lars Johansen",email:"lars@nordcargo.no",role:"Şoför",company:"NordCargo AS",country:"Norveç",status:"Doğrulandı",joined:"17 May 2026"},
  {id:"USR-9307",name:"Marco Bianchi",email:"marco@mlog.it",role:"Şoför",company:"Milano Logistics",country:"İtalya",status:"Doğrulandı",joined:"13 May 2026"},
  {id:"USR-9294",name:"Erik Lund",email:"erik@eurolink.se",role:"Filo yöneticisi",company:"EuroLink AB",country:"İsveç",status:"Aktif",joined:"9 May 2026"},
  {id:"USR-9288",name:"Selin Demir",email:"selin@anadolufilo.com",role:"Dispeçer",company:"Anadolu Filo",country:"Türkiye",status:"İnceleniyor",joined:"5 May 2026"},
  {id:"USR-9271",name:"Johannes Weber",email:"j.weber@rhein.de",role:"Muhasebe",company:"Rhein Transport GmbH",country:"Almanya",status:"Aktif",joined:"2 May 2026"},
];

export const dashboardTrips=[
  {id:"TR-2847",month:"2026-05",route:"Bergen → Milano",shipper:"Kaya Endüstri",carrier:"NordCargo AS",driver:"Lars Johansen",status:"Tamamlandı",amount:"4.850 €",margin:"243 €",date:"28 May 2026"},
  {id:"TR-2844",month:"2026-05",route:"Oslo → Verona",shipper:"Milano Foods SRL",carrier:"EuroLink AB",driver:"Erik Lund",status:"Tamamlandı",amount:"4.400 €",margin:"220 €",date:"24 May 2026"},
  {id:"TR-2838",month:"2026-05",route:"Rotterdam → Torino",shipper:"Benelux Parts BV",carrier:"Rhein Transport GmbH",driver:"Johannes Falk",status:"Tamamlandı",amount:"3.650 €",margin:"183 €",date:"18 May 2026"},
  {id:"TR-2829",month:"2026-05",route:"İstanbul → Münih",shipper:"Kaya Endüstri",carrier:"Anadolu Filo",driver:"Mehmet Yılmaz",status:"Tamamlandı",amount:"3.980 €",margin:"199 €",date:"11 May 2026"},
  {id:"TR-2798",month:"2026-04",route:"Bursa → Hamburg",shipper:"Kaya Endüstri",carrier:"Rhein Transport GmbH",driver:"Jan Müller",status:"Tamamlandı",amount:"3.720 €",margin:"186 €",date:"26 Nis 2026"},
  {id:"TR-2742",month:"2026-03",route:"Göteborg → Paris",shipper:"Benelux Parts BV",carrier:"EuroLink AB",driver:"Erik Lund",status:"Tamamlandı",amount:"3.240 €",margin:"162 €",date:"20 Mar 2026"},
  {id:"TR-2688",month:"2026-02",route:"Ankara → Varşova",shipper:"Kaya Endüstri",carrier:"Anadolu Filo",driver:"Can Koç",status:"İptal",amount:"2.850 €",margin:"0 €",date:"17 Şub 2026"},
];

export const dashboardAlerts=[
  {tone:"critical",title:"3 firma doğrulama bekliyor",text:"İki taşıyıcının sigorta belgesi 48 saat içinde incelenmeli."},
  {tone:"warning",title:"Mayıs iptal oranı %1,8 arttı",text:"Türkiye–Almanya koridorunda yükleme zamanı uyuşmazlığı öne çıkıyor."},
  {tone:"good",title:"Boş kilometre %12 azaldı",text:"Norveç–İtalya dönüş yükü önerileri 31 seferde kullanıldı."},
];
