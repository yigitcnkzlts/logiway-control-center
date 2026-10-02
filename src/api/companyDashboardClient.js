import { apiJson, isDemoMode } from "./apiClient";

const demoMonths=[
  ["Eyl",18,12,48600],["Eki",21,15,59400],["Kas",24,17,66800],["Ara",27,19,74200],
  ["Oca",29,22,81600],["Şub",32,24,89400],["Mar",36,28,103500],["Nis",39,31,118200],
  ["May",44,35,132800],["Haz",48,38,146400],["Tem",52,42,159600],["Ağu",57,46,174900],
].map(([month,loads,trips,revenue])=>({month,loads,offers:loads+8,trips,revenue}));

export const demoCompanyDashboard={
  source:"demo",
  company:{id:"CO-HOROZ-DEMO",name:"Horoz Lojistik",type:"LOGISTICS_COMPANY",country:"TR",status:"VERIFIED"},
  kpis:{drivers:38,vehicles:46,loads:57,offers:65,activeTrips:14,completedTrips:46,grossRevenue:174900},
  monthly:demoMonths,
  drivers:[
    {id:"DRV-101",name:"Mehmet Yılmaz",email:"mehmet@example.com",status:"ACTIVE",yearsExperience:12,completedTrips:18,revenue:68400},
    {id:"DRV-102",name:"Can Koç",email:"can@example.com",status:"ACTIVE",yearsExperience:9,completedTrips:15,revenue:57200},
    {id:"DRV-103",name:"Serkan Demir",email:"serkan@example.com",status:"ON_TRIP",yearsExperience:15,completedTrips:13,revenue:49300},
    {id:"DRV-104",name:"Murat Aydın",email:"murat@example.com",status:"PENDING",yearsExperience:6,completedTrips:0,revenue:0},
  ],
  recentLoads:[
    {id:"LW-3018",title:"Beyaz eşya",route:"İstanbul, TR → Berlin, DE",status:"MATCHED",offerCount:7,acceptedAmount:4250,currency:"EUR",createdAt:"2026-09-08T09:00:00Z"},
    {id:"LW-3012",title:"Otomotiv parçaları",route:"Bursa, TR → Milano, IT",status:"IN_PROGRESS",offerCount:5,acceptedAmount:3680,currency:"EUR",createdAt:"2026-09-05T09:00:00Z"},
    {id:"LW-3004",title:"Paletli tekstil",route:"İzmir, TR → Paris, FR",status:"COMPLETED",offerCount:4,acceptedAmount:3940,currency:"EUR",createdAt:"2026-09-01T09:00:00Z"},
  ],
  recentTrips:[
    {id:"TR-811",loadTitle:"Beyaz eşya",route:"İstanbul → Berlin",driverName:"Mehmet Yılmaz",amount:4250,currency:"EUR",status:"ACTIVE",matchedAt:"2026-09-08T10:00:00Z"},
    {id:"TR-806",loadTitle:"Otomotiv parçaları",route:"Bursa → Milano",driverName:"Can Koç",amount:3680,currency:"EUR",status:"ACTIVE",matchedAt:"2026-09-05T10:00:00Z"},
    {id:"TR-798",loadTitle:"Paletli tekstil",route:"İzmir → Paris",driverName:"Serkan Demir",amount:3940,currency:"EUR",status:"COMPLETED",matchedAt:"2026-09-01T10:00:00Z"},
  ],
};

const api=path=>apiJson(path);

export async function getCompanyDashboard(){
  if(!isDemoMode()&&localStorage.getItem("guc-access-token")){
    const companies=await api("/api/v1/companies/mine");
    const company=companies.find(x=>x.type==="LOGISTICS")||companies[0];
    if(!company)throw new Error("Bu hesap herhangi bir şirketin üyesi değil.");
    return {...await api(`/api/v1/companies/${company.id}/dashboard?months=12`),source:"live"};
  }
  if(isDemoMode())return demoCompanyDashboard;
  throw new Error("Şirket paneli için güvenli oturum açmanız gerekiyor.");
}
