import { apiJson, clearSession, isApiConfigured, isDemoMode, saveTokens } from "./apiClient";

function fingerprint(){
  const key="logiway-device-id";let value=localStorage.getItem(key);
  if(!value){value=crypto.randomUUID();localStorage.setItem(key,value)}
  return value;
}

const post=(path,body)=>apiJson(path,{method:"POST",body:JSON.stringify(body)});

function saveSession(tokens){
  saveTokens(tokens);
  localStorage.setItem("guc-session",JSON.stringify({userId:tokens.userId,roles:tokens.roles,expiresAt:Date.now()+tokens.expiresInSeconds*1000}));
}

async function hydrateCompany(){
  const token=localStorage.getItem("guc-access-token");
  if(!isApiConfigured()||!token)return;
  const companies=await apiJson("/api/v1/companies/mine");
  const company=companies.find(x=>x.type==="LOGISTICS"||x.type==="SHIPPER")||companies[0];
  if(!company)return;
  const session=JSON.parse(localStorage.getItem("guc-session")||"{}");
  localStorage.setItem("guc-session",JSON.stringify({...session,companyId:company.id,companyName:company.tradeName||company.legalName,companyCountry:company.country}));
}

const COUNTRY_CODES={"Almanya":"DE","Andorra":"AD","Arnavutluk":"AL","Avusturya":"AT","Azerbaycan":"AZ","Belarus":"BY","Belçika":"BE","Birleşik Krallık":"GB","Bosna-Hersek":"BA","Bulgaristan":"BG","Çekya":"CZ","Danimarka":"DK","Ermenistan":"AM","Estonya":"EE","Finlandiya":"FI","Fransa":"FR","Gürcistan":"GE","Hırvatistan":"HR","Hollanda":"NL","İrlanda":"IE","İspanya":"ES","İsveç":"SE","İsviçre":"CH","İtalya":"IT","İzlanda":"IS","Karadağ":"ME","Kazakistan":"KZ","Kıbrıs":"CY","Kosova":"XK","Kuzey Makedonya":"MK","Letonya":"LV","Lihtenştayn":"LI","Litvanya":"LT","Lüksemburg":"LU","Macaristan":"HU","Malta":"MT","Moldova":"MD","Monako":"MC","Norveç":"NO","Polonya":"PL","Portekiz":"PT","Romanya":"RO","Rusya":"RU","San Marino":"SM","Sırbistan":"RS","Slovakya":"SK","Slovenya":"SI","Türkiye":"TR","Ukrayna":"UA","Vatikan":"VA","Yunanistan":"GR"};

export const isBackendConfigured=()=>isApiConfigured()&&!isDemoMode();
export const getSession=()=>{try{return JSON.parse(localStorage.getItem("guc-session")||"null")}catch{return null}};
export const isAuthenticated=()=>isDemoMode()||Boolean(localStorage.getItem("guc-access-token")&&getSession());
export const hasAnyRole=roles=>isDemoMode()||roles.some(role=>getSession()?.roles?.includes(role));

export async function loginUser({email,password}){
  if(isDemoMode())return {mode:"demo"};
  const tokens=await post("/api/v1/auth/login",{email,password,deviceFingerprint:fingerprint(),platform:"WEB",deviceName:navigator.userAgent.slice(0,120)});
  if(tokens.mfaRequired)return {...tokens,mode:"mfa"};
  saveSession(tokens);await hydrateCompany();return {...tokens,mode:"live"};
}

export async function verifyMfa({mfaToken,code}){
  if(isDemoMode())return {mode:"demo"};
  const tokens=await post("/api/v1/auth/mfa/verify",{mfaToken,code,deviceFingerprint:fingerprint(),platform:"WEB",deviceName:navigator.userAgent.slice(0,120)});
  saveSession(tokens);return {...tokens,mode:"live"};
}

export async function registerUser({email,password,phone,role,company,country}){
  if(isDemoMode())return {mode:"demo"};
  const roleCode=role==="sofor"?"INDEPENDENT_DRIVER":role==="lojistik"?"LOGISTICS_COMPANY":"SHIPPER";
  const tokens=await post("/api/v1/auth/register",{email,password,phone,role:roleCode,companyName:company,companyCountry:COUNTRY_CODES[country]||"TR",deviceFingerprint:fingerprint(),platform:"WEB",deviceName:navigator.userAgent.slice(0,120),locale:"tr",timezone:Intl.DateTimeFormat().resolvedOptions().timeZone});
  saveSession(tokens);
  await hydrateCompany();return {...tokens,mode:"live"};
}

export async function currentUser(){return apiJson("/api/v1/me")}

export async function logoutUser(){
  const refreshToken=localStorage.getItem("guc-refresh-token");
  try{if(isBackendConfigured())await post("/api/v1/auth/logout",refreshToken?{refreshToken}:null)}finally{clearSession()}
}
