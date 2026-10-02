import { apiJson, isApiConfigured, isDemoMode } from "./apiClient";
const COUNTRY_CODES={"Almanya":"DE","Avusturya":"AT","Belçika":"BE","Birleşik Krallık":"GB","Bulgaristan":"BG","Çekya":"CZ","Danimarka":"DK","Estonya":"EE","Finlandiya":"FI","Fransa":"FR","Hırvatistan":"HR","Hollanda":"NL","İrlanda":"IE","İspanya":"ES","İsveç":"SE","İsviçre":"CH","İtalya":"IT","İzlanda":"IS","Letonya":"LV","Litvanya":"LT","Lüksemburg":"LU","Macaristan":"HU","Norveç":"NO","Polonya":"PL","Portekiz":"PT","Romanya":"RO","Sırbistan":"RS","Slovakya":"SK","Slovenya":"SI","Türkiye":"TR","Ukrayna":"UA","Yunanistan":"GR"};
const COUNTRY_NAMES=Object.fromEntries(Object.entries(COUNTRY_CODES).map(([name,code])=>[code,name]));

const request=apiJson;
const iso=name=>COUNTRY_CODES[name]||name||"TR";
const country=code=>COUNTRY_NAMES[code]||code;
const coordinate=value=>{const number=Number(String(value||"").split(",")[0].trim());return Number.isFinite(number)?number:null};
const money=(amount,currency)=>`${Number(amount||0).toLocaleString("tr-TR")} ${currency==="EUR"?"€":currency}`;

export const liveMarketplaceEnabled=()=>isApiConfigured()&&!isDemoMode();

export async function loadMarketplace(status="PUBLISHED",mine=false){
  const params=new URLSearchParams({size:"100",mine:String(mine)});if(status)params.set("status",status);
  const page=await request(`/api/v1/loads?${params}`);
  return (page.content||page.items||[]).map(x=>({id:x.id,shipperCompanyId:x.shipperCompanyId,cargo:x.title,from:`${x.pickupCity}, ${country(x.pickupCountry)}`,to:`${x.dropoffCity}, ${country(x.dropoffCountry)}`,originCountry:country(x.pickupCountry),destinationCountry:country(x.dropoffCountry),fromCity:x.pickupCity,toCity:x.dropoffCity,pickupDate:x.readyFrom?.slice(0,10),deliveryDate:x.readyTo?.slice(0,10),pickupAddress:x.pickupAddress,deliveryAddress:x.dropoffAddress,vehicle:x.vehicleRequirements||"Tır",weight:`${Number(x.weightKg)/1000} ton`,price:money(x.expectedPrice,x.currency),currency:x.currency,expectedPrice:x.expectedPrice,date:new Date(x.readyFrom).toLocaleDateString("tr-TR",{day:"numeric",month:"short"}),status:x.status==="PUBLISHED"?"Teklif alıyor":x.status,offers:0,createdAt:x.createdAt,volume:x.volumeM3,company:"Doğrulanmış yük veren"}));
}

export const loadMyLoads=()=>loadMarketplace(null,true);

export async function createAndPublishLoad(form){
  const companies=await request("/api/v1/companies/mine");const company=companies.find(x=>x.type==="SHIPPER")||companies[0];if(!company)throw new Error("Önce yük veren firma hesabı oluşturmalısınız.");
  const pickupDate=form.get("pickupDate"),deliveryDate=form.get("deliveryDate")||pickupDate;
  const created=await request("/api/v1/loads",{method:"POST",body:JSON.stringify({shipperCompanyId:company.id,title:form.get("cargo"),description:form.get("notes"),pickupCountry:iso(form.get("fromCountry")),pickupCity:form.get("fromCity"),pickupAddress:form.get("pickupAddress"),pickupLat:coordinate(form.get("pickupCoordinates")),pickupLng:coordinate(String(form.get("pickupCoordinates")||"").split(",")[1]),dropoffCountry:iso(form.get("toCountry")),dropoffCity:form.get("toCity"),dropoffAddress:form.get("deliveryAddress"),dropoffLat:coordinate(form.get("deliveryCoordinates")),dropoffLng:coordinate(String(form.get("deliveryCoordinates")||"").split(",")[1]),readyFrom:`${pickupDate}T${form.get("pickupStart")||"08:00"}:00Z`,readyTo:`${deliveryDate}T${form.get("deliveryEnd")||"18:00"}:00Z`,weightKg:Number(form.get("weight"))*1000,volumeM3:Number(form.get("volume"))||null,vehicleRequirements:form.get("vehicle"),currency:form.get("currency"),loadType:form.get("cargo"),palletCount:Number(form.get("pallets"))||null,packagingType:form.get("packaging"),cargoValue:Number(form.get("cargoValue"))||null,contactPerson:form.get("pickupContact"),contactPhone:form.get("pickupPhone"),referenceNo:form.get("pickupReference"),doorRamp:form.get("loading"),adr:form.get("adr")==="Evet",coldChain:Boolean(form.get("temperature")),customsRequired:Boolean(form.get("eori")),customsReference:form.get("eori"),insuranceRequired:form.get("insurance")==="Evet",expectedPrice:Number(form.get("price"))})});
  return request(`/api/v1/loads/${created.id}/publish`,{method:"POST"});
}

export async function myOffers(){return request("/api/v1/offers/mine")}
export async function loadMyMatches(){return request("/api/v1/matches")}
export async function offersForLoad(loadId){return request(`/api/v1/loads/${loadId}/offers`)}
export async function submitLiveOffer(job){
  const companies=await request("/api/v1/companies/mine");const company=companies.find(x=>x.type==="LOGISTICS");
  const [vehicles,driver]=await Promise.all([request("/api/v1/vehicles/mine"),request("/api/v1/drivers/me")]);
  const vehicle=vehicles.find(x=>x.status==="ACTIVE");
  if(!vehicle)throw new Error("Teklif vermek için aktif bir araç gerekli.");
  if(driver.status!=="VERIFIED")throw new Error("Teklif vermek için doğrulanmış bir sürücü profili gerekli.");
  return request(`/api/v1/loads/${job.id}/offers`,{method:"POST",body:JSON.stringify({offererType:company?"COMPANY":"DRIVER",offererId:company?.id||null,amount:Number(job.expectedPrice)||Number(String(job.price).replace(/[^0-9]/g,""))||1,currency:job.currency||"EUR",message:"Web panelinden gönderilen taşıma teklifi",vehicleId:vehicle.id,driverProfileId:driver.id,estimatedTransitHours:48,availableAt:new Date().toISOString()})});
}
export async function acceptLiveOffer(id){return request(`/api/v1/offers/${id}/accept`,{method:"POST"})}
export async function cancelLiveLoad(id){return request(`/api/v1/loads/${id}/cancel`,{method:"POST"})}
