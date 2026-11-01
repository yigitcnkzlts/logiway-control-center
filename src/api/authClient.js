import { apiJson, clearSession, isApiConfigured, isDemoMode, saveSessionTokens } from "./apiClient.js";
import { createDemoSession, validateDemoCredentials } from "./demoAuth.js";
import { registrationValidationMessage, validateRegistration } from "./authValidation.js";

function fingerprint(){
  const key="logiway-device-id";let value=localStorage.getItem(key);
  if(!value){value=crypto.randomUUID();localStorage.setItem(key,value)}
  return value;
}

const post=(path,body)=>apiJson(path,{method:"POST",body:JSON.stringify(body)});

const wait=ms=>new Promise(resolve=>setTimeout(resolve,ms));

export function panelPathForRoles(roles=[]){
  if(roles.includes("SHIPPER"))return "/yuk-veren/panel";
  if(roles.includes("LOGISTICS_COMPANY")||roles.includes("FLEET_OWNER"))return "/lojistik/panel";
  if(roles.includes("INDEPENDENT_DRIVER"))return "/sofor/panel";
  return "/giris";
}

export async function hydrateCompany({request=apiJson,storage=localStorage,maxAttempts=3,apiConfigured=isApiConfigured}={}){
  const token=storage.getItem("guc-access-token");
  if(!apiConfigured()||!token)return;
  for(let attempt=1;attempt<=maxAttempts;attempt+=1){
    try{
      const companies=await request("/api/v1/companies/mine",{timeoutMs:20000});
      const session=JSON.parse(storage.getItem("guc-session")||"{}");
      const preferredType=session.roles?.includes("SHIPPER")?"SHIPPER":"LOGISTICS";
      const company=companies.find(x=>x.type===preferredType)||companies[0];
      if(!company)return;
      storage.setItem("guc-session",JSON.stringify({...session,companyId:company.id,companyName:company.tradeName||company.legalName,companyCountry:company.country}));
      return company;
    }catch(error){
      const retryable=error.status===0||error.status===408||error.status>=500;
      if(!retryable||attempt===maxAttempts)throw error;
      await wait(attempt*750);
    }
  }
}

async function hydrateAuthenticatedSession(){
  await Promise.allSettled([
    apiJson("/api/v1/me",{timeoutMs:20000}),
    hydrateCompany(),
  ]);
}

function continueHydration(){
  void hydrateAuthenticatedSession();
}

const COUNTRY_CODES={"Almanya":"DE","Andorra":"AD","Arnavutluk":"AL","Avusturya":"AT","Azerbaycan":"AZ","Belarus":"BY","Belçika":"BE","Birleşik Krallık":"GB","Bosna-Hersek":"BA","Bulgaristan":"BG","Çekya":"CZ","Danimarka":"DK","Ermenistan":"AM","Estonya":"EE","Finlandiya":"FI","Fransa":"FR","Gürcistan":"GE","Hırvatistan":"HR","Hollanda":"NL","İrlanda":"IE","İspanya":"ES","İsveç":"SE","İsviçre":"CH","İtalya":"IT","İzlanda":"IS","Karadağ":"ME","Kazakistan":"KZ","Kıbrıs":"CY","Kosova":"XK","Kuzey Makedonya":"MK","Letonya":"LV","Lihtenştayn":"LI","Litvanya":"LT","Lüksemburg":"LU","Macaristan":"HU","Malta":"MT","Moldova":"MD","Monako":"MC","Norveç":"NO","Polonya":"PL","Portekiz":"PT","Romanya":"RO","Rusya":"RU","San Marino":"SM","Sırbistan":"RS","Slovakya":"SK","Slovenya":"SI","Türkiye":"TR","Ukrayna":"UA","Vatikan":"VA","Yunanistan":"GR"};

export const isBackendConfigured=()=>isApiConfigured()&&!isDemoMode();
export const getSession=()=>{try{return JSON.parse(localStorage.getItem("guc-session")||"null")}catch{return null}};
export const isAuthenticated=()=>isDemoMode()?Boolean(getSession()?.demo):Boolean(localStorage.getItem("guc-access-token")&&getSession());
export const hasAnyRole=roles=>roles.some(role=>getSession()?.roles?.includes(role));

export async function loginUser({email,password,role}){
  if(isDemoMode()){
    if(!validateDemoCredentials(email,password))throw new Error("E-posta veya şifre hatalı.");
    const session=createDemoSession(role);
    localStorage.setItem("guc-session",JSON.stringify(session));
    return {...session,mode:"demo"};
  }
  const tokens=await post("/api/v1/auth/login",{email,password,deviceFingerprint:fingerprint(),platform:"WEB",deviceName:navigator.userAgent.slice(0,120)});
  if(tokens.mfaRequired)return {...tokens,mode:"mfa"};
  saveSessionTokens(tokens);continueHydration();return {...tokens,mode:"live",panelPath:panelPathForRoles(tokens.roles)};
}

export async function verifyMfa({mfaToken,code}){
  if(isDemoMode())return {mode:"demo"};
  const tokens=await post("/api/v1/auth/mfa/verify",{mfaToken,code,deviceFingerprint:fingerprint(),platform:"WEB",deviceName:navigator.userAgent.slice(0,120)});
  saveSessionTokens(tokens);continueHydration();return {...tokens,mode:"live",panelPath:panelPathForRoles(tokens.roles)};
}

export async function registerUser({email,password,phone,role,company,country}){
  if(isDemoMode()){
    const session=createDemoSession(role);
    localStorage.setItem("guc-session",JSON.stringify(session));
    return {...session,mode:"demo"};
  }
  const validationFields=validateRegistration({email,password,phone,role,company,country});
  if(Object.keys(validationFields).length)throw new Error(registrationValidationMessage(validationFields));
  const roleCode=role==="sofor"?"INDEPENDENT_DRIVER":role==="lojistik"?"LOGISTICS_COMPANY":"SHIPPER";
  const tokens=await post("/api/v1/auth/register",{email:email.trim(),password,phone:phone?.trim()||null,role:roleCode,companyName:company?.trim()||null,companyCountry:COUNTRY_CODES[country]||"TR",deviceFingerprint:fingerprint(),platform:"WEB",deviceName:navigator.userAgent.slice(0,120),locale:"tr",timezone:Intl.DateTimeFormat().resolvedOptions().timeZone});
  saveSessionTokens(tokens);
  continueHydration();return {...tokens,mode:"live",panelPath:panelPathForRoles(tokens.roles)};
}

export async function currentUser(){return apiJson("/api/v1/me")}

export async function logoutUser(){
  const refreshToken=localStorage.getItem("guc-refresh-token");
  try{if(isBackendConfigured())await post("/api/v1/auth/logout",refreshToken?{refreshToken}:null)}finally{clearSession()}
}
