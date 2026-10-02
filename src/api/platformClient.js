import { dashboardAlerts, dashboardCompanies, dashboardMonths, dashboardTrips, dashboardUsers } from "../data/ownerDashboard";
import { getMatches } from "../services/marketplaceStore";
import { apiJson, isDemoMode } from "./apiClient";

async function request(path){
  if(isDemoMode())return null;
  return apiJson(path);
}

export async function getOwnerDashboard(){
  try{
    const remote=await request("/api/v1/admin/overview");
    if(remote)return {...remote,source:"live"};
  }catch(error){if(!isDemoMode())throw error;console.warn("GucLogistics API kullanılamadı, açık demo modu kullanılıyor.",error)}
  let registrations=[];try{registrations=JSON.parse(localStorage.getItem("logiway-registrations")||"[]")}catch{registrations=[]}
  const newCompanies=registrations.filter(x=>x.role==="Yük veren").map(x=>({id:`CO-${x.id.slice(-4)}`,name:x.company,type:"Yük veren",country:x.country,status:x.status,members:1,vehicles:0,trips:0,volume:"0 €",joined:x.joined}));
  const localTrips=getMatches().map(x=>({id:x.id,month:(x.matchedAt||"").slice(0,7),route:x.route||`${x.from} → ${x.to}`,shipper:x.shipperCompany||"Kaya Lojistik",carrier:x.carrier,driver:x.driver,status:x.status,amount:x.amount,margin:`${Math.round((Number(String(x.amount).replace(/[^0-9]/g,""))||0)*.05).toLocaleString("tr-TR")} €`,date:new Date(x.matchedAt).toLocaleDateString("tr-TR")}));
  return {months:dashboardMonths,companies:[...newCompanies,...dashboardCompanies],users:[...registrations,...dashboardUsers],trips:[...localTrips,...dashboardTrips],alerts:dashboardAlerts,source:"demo"};
}
