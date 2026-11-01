import { apiErrorMessage } from "./authValidation.js";

const ENV=import.meta.env||{};
const API_URL=(ENV.VITE_GUC_API_URL||"").replace(/\/$/,"");
// Shared demo access is intentionally disabled for production builds, even if
// the public flag is set accidentally. Use `vite --mode demo` for demo builds.
const DEMO_MODE=ENV.VITE_USE_MOCK_DATA==="true"&&ENV.MODE!=="production";
const REQUEST_TIMEOUT_MS=Number(ENV.VITE_API_TIMEOUT_MS||20000);
const AUTH_TIMEOUT_MS=Number(ENV.VITE_AUTH_TIMEOUT_MS||45000);
let refreshPromise=null;

export class ApiError extends Error{
  constructor(message,status,details={}){super(message);this.name="ApiError";this.status=status;this.details=details}
}

function accessToken(){return localStorage.getItem("guc-access-token")}

function saveTokens(tokens){
  if(tokens.accessToken)localStorage.setItem("guc-access-token",tokens.accessToken);
  if(tokens.refreshToken)localStorage.setItem("guc-refresh-token",tokens.refreshToken);
}

export function saveSessionTokens(tokens){
  saveTokens(tokens);
  let current={};
  try{current=JSON.parse(localStorage.getItem("guc-session")||"{}")}catch{current={}}
  localStorage.setItem("guc-session",JSON.stringify({...current,userId:tokens.userId||current.userId,roles:tokens.roles||current.roles||[],expiresAt:Date.now()+Number(tokens.expiresInSeconds||0)*1000}));
}

async function performRefresh(){
  const refreshToken=localStorage.getItem("guc-refresh-token");
  if(!refreshToken)return false;
  const controller=new AbortController();
  const timeout=setTimeout(()=>controller.abort(),AUTH_TIMEOUT_MS);
  try{
    const response=await fetch(`${API_URL}/api/v1/auth/refresh`,{method:"POST",signal:controller.signal,headers:{"Content-Type":"application/json",Accept:"application/json"},body:JSON.stringify({refreshToken})});
    if(!response.ok){clearSession();return false}
    saveSessionTokens(await response.json());
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
  localStorage.removeItem("guc-access-token");
  localStorage.removeItem("guc-refresh-token");
  localStorage.removeItem("guc-session");
}
export { saveTokens };
