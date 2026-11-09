import { apiErrorMessage } from "./authValidation.js";

const ENV=import.meta.env||{};
const API_URL=(ENV.VITE_GUC_API_URL||"").replace(/\/$/,"");
// Shared demo access is intentionally disabled for production builds, even if
// the public flag is set accidentally. Use `vite --mode demo` for demo builds.
const DEMO_MODE=ENV.VITE_USE_MOCK_DATA==="true"&&ENV.MODE!=="production";
const REQUEST_TIMEOUT_MS=Number(ENV.VITE_API_TIMEOUT_MS||20000);
const AUTH_TIMEOUT_MS=Number(ENV.VITE_AUTH_TIMEOUT_MS||45000);
let refreshPromise=null;
const AUTH_KEYS=["guc-access-token","guc-refresh-token","guc-session"];
const REMEMBER_ME_KEY="guc-remember-me";
const SESSION_ONLY_KEY="guc-session-only";

export class ApiError extends Error{
  constructor(message,status,details={}){super(message);this.name="ApiError";this.status=status;this.details=details}
}

export function getAuthStorage(){
  if(typeof globalThis.sessionStorage==="undefined")return globalThis.localStorage;
  if(globalThis.sessionStorage.getItem(SESSION_ONLY_KEY)==="true")return globalThis.sessionStorage;
  return globalThis.localStorage;
}

function storageForSession(rememberMe){
  const local=globalThis.localStorage;
  const session=globalThis.sessionStorage;
  for(const storage of [local,session]){
    if(!storage)continue;
    for(const key of AUTH_KEYS)storage.removeItem(key);
    storage.removeItem(REMEMBER_ME_KEY);
    storage.removeItem(SESSION_ONLY_KEY);
  }
  const target=rememberMe?local:session||local;
  target.setItem(rememberMe?REMEMBER_ME_KEY:SESSION_ONLY_KEY,"true");
  return target;
}

function accessToken(){return getAuthStorage()?.getItem("guc-access-token")||null}

function saveTokens(tokens,{rememberMe=true}={}){
  const storage=storageForSession(rememberMe);
  if(tokens.accessToken)storage.setItem("guc-access-token",tokens.accessToken);
  if(tokens.refreshToken)storage.setItem("guc-refresh-token",tokens.refreshToken);
  return storage;
}

export function saveSessionTokens(tokens,{rememberMe=true}={}){
  const currentStorage=getAuthStorage();
  let current={};
  try{current=JSON.parse(currentStorage?.getItem("guc-session")||"{}")}catch{current={}}
  const storage=saveTokens(tokens,{rememberMe});
  storage.setItem("guc-session",JSON.stringify({...current,userId:tokens.userId||current.userId,roles:tokens.roles||current.roles||[],expiresAt:Date.now()+Number(tokens.expiresInSeconds||0)*1000}));
}

async function performRefresh(){
  const storage=getAuthStorage();
  const refreshToken=storage?.getItem("guc-refresh-token");
  if(!refreshToken)return false;
  const controller=new AbortController();
  const timeout=setTimeout(()=>controller.abort(),AUTH_TIMEOUT_MS);
  try{
    const response=await fetch(`${API_URL}/api/v1/auth/refresh`,{method:"POST",signal:controller.signal,headers:{"Content-Type":"application/json",Accept:"application/json"},body:JSON.stringify({refreshToken})});
    if(!response.ok){clearSession();return false}
    saveSessionTokens(await response.json(),{rememberMe:storage===globalThis.localStorage});
    return true;
  }catch{return false}finally{clearTimeout(timeout)}
}

function refresh(){
  if(!refreshPromise)refreshPromise=performRefresh().finally(()=>{refreshPromise=null});
  return refreshPromise;
}

export async function apiFetch(path,options={},retried=false){
  if(!API_URL)throw new Error("Canlı backend adresi yapılandırılmamış. VITE_GUC_API_URL değerini tanımlayın.");
  const {timeoutMs,...fetchOptions}=options;
  const effectiveTimeout=Number(timeoutMs||(path.startsWith("/api/v1/auth/")?AUTH_TIMEOUT_MS:REQUEST_TIMEOUT_MS));
  const controller=new AbortController();
  const timeout=setTimeout(()=>controller.abort(),effectiveTimeout);
  let response;
  try{response=await fetch(`${API_URL}${path}`,{...fetchOptions,signal:fetchOptions.signal||controller.signal,headers:{Accept:"application/json",...(fetchOptions.body?{"Content-Type":"application/json"}:{}),...(accessToken()?{Authorization:`Bearer ${accessToken()}`}:{ }),...fetchOptions.headers}})}
  catch(error){if(error.name==="AbortError")throw new ApiError(path.startsWith("/api/v1/auth/")?"Sunucu hazırlanıyor. Lütfen kısa bir süre sonra tekrar deneyin.":"İstek zaman aşımına uğradı. Lütfen tekrar deneyin.",408);throw new ApiError("Sunucuya ulaşılamadı. İnternet bağlantınızı kontrol edip tekrar deneyin.",0,{cause:error.message})}
  finally{clearTimeout(timeout)}
  const isAuthRequest=path.startsWith("/api/v1/auth/");
  if(response.status===401&&!retried&&!isAuthRequest&&await refresh())return apiFetch(path,options,true);
  if(response.status===401&&!isAuthRequest){clearSession();if(typeof window!=="undefined")window.dispatchEvent(new Event("logiway-auth-expired"))}
  return response;
}

export async function apiJson(path,options={}){
  const response=await apiFetch(path,options);
  const body=await response.json().catch(()=>({}));
  if(!response.ok)throw new ApiError(apiErrorMessage(body,response.status),response.status,body);
  return body;
}

export const isApiConfigured=()=>Boolean(API_URL);
export const isDemoMode=()=>DEMO_MODE;
export function clearSession(){
  for(const storage of [globalThis.localStorage,globalThis.sessionStorage]){
    if(!storage)continue;
    for(const key of [...AUTH_KEYS,REMEMBER_ME_KEY,SESSION_ONLY_KEY])storage.removeItem(key);
  }
}
export { saveTokens };
