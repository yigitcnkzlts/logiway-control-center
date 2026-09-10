import { dashboardAlerts, dashboardCompanies, dashboardMonths, dashboardTrips, dashboardUsers } from "../data/ownerDashboard";
import { getMatches } from "../services/marketplaceStore";

const API_URL=(import.meta.env.VITE_GUC_API_URL||"").replace(/\/$/,"");

async function request(path){
  if(!API_URL)return null;
  const token=localStorage.getItem("guc-access-token");
  const response=await fetch(`${API_URL}${path}`,{headers:{Accept:"application/json",...(token?{Authorization:`Bearer ${token}`}:{})}});
  if(!response.ok)throw new Error(`API ${response.status}`);
  return response.json();
}

export async function getOwnerDashboard(){
  try{
    const remote=await request("/api/v1/admin/overview");
    if(remote)return {...remote,source:"live"};
  }catch(error){console.warn("GucLogistics API kullanılamadı, demo veri gösteriliyor.",error)}
  let registrations=[];try{registrations=JSON.parse(localStorage.getItem("logiway-registrations")||"[]")}catch{registrations=[]}
  const newCompanies=registrations.filter(x=>x.role==="Yük veren").map(x=>({id:`CO-${x.id.slice(-4)}`,name:x.company,type:"Yük veren",country:x.country,status:x.status,members:1,vehicles:0,trips:0,volume:"0 €",joined:x.joined}));
  const localTrips=getMatches().map(x=>({id:x.id,month:(x.matchedAt||"").slice(0,7),route:x.route||`${x.from} → ${x.to}`,shipper:x.shipperCompany||"Kaya Lojistik",carrier:x.carrier,driver:x.driver,status:x.status,amount:x.amount,margin:`${Math.round((Number(String(x.amount).replace(/[^0-9]/g,""))||0)*.05).toLocaleString("tr-TR")} €`,date:new Date(x.matchedAt).toLocaleDateString("tr-TR")}));
  return {months:dashboardMonths,companies:[...newCompanies,...dashboardCompanies],users:[...registrations,...dashboardUsers],trips:[...localTrips,...dashboardTrips],alerts:dashboardAlerts,source:"demo"};
}
