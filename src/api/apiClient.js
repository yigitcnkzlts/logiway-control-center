const API_URL=(import.meta.env.VITE_GUC_API_URL||"").replace(/\/$/,"");
const DEMO_MODE=import.meta.env.VITE_USE_MOCK_DATA==="true";
const REQUEST_TIMEOUT_MS=Number(import.meta.env.VITE_API_TIMEOUT_MS||15000);
let refreshPromise=null;

export class ApiError extends Error{
  constructor(message,status,details={}){super(message);this.name="ApiError";this.status=status;this.details=details}
}

function accessToken(){return localStorage.getItem("guc-access-token")}

function saveTokens(tokens){
  if(tokens.accessToken)localStorage.setItem("guc-access-token",tokens.accessToken);
  if(tokens.refreshToken)localStorage.setItem("guc-refresh-token",tokens.refreshToken);
}

async function performRefresh(){
  const refreshToken=localStorage.getItem("guc-refresh-token");
  if(!refreshToken)return false;
  const response=await fetch(`${API_URL}/api/v1/auth/refresh`,{method:"POST",headers:{"Content-Type":"application/json",Accept:"application/json"},body:JSON.stringify({refreshToken})});
  if(!response.ok){clearSession();return false}
  saveTokens(await response.json());
  return true;
}

function refresh(){
  if(!refreshPromise)refreshPromise=performRefresh().finally(()=>{refreshPromise=null});
  return refreshPromise;
}

export async function apiFetch(path,options={},retried=false){
  if(!API_URL)throw new Error("Canlı backend adresi yapılandırılmamış. VITE_GUC_API_URL değerini tanımlayın.");
  const controller=new AbortController();
  const timeout=setTimeout(()=>controller.abort(),REQUEST_TIMEOUT_MS);
  let response;
  try{response=await fetch(`${API_URL}${path}`,{...options,signal:options.signal||controller.signal,headers:{Accept:"application/json",...(options.body?{"Content-Type":"application/json"}:{}),...(accessToken()?{Authorization:`Bearer ${accessToken()}`}:{ }),...options.headers}})}
  catch(error){if(error.name==="AbortError")throw new ApiError("İstek zaman aşımına uğradı.",408);throw new ApiError("Sunucuya ulaşılamadı.",0,{cause:error.message})}
  finally{clearTimeout(timeout)}
  const isAuthRequest=path.startsWith("/api/v1/auth/");
  if(response.status===401&&!retried&&!isAuthRequest&&await refresh())return apiFetch(path,options,true);
  if(response.status===401&&!isAuthRequest){clearSession();window.dispatchEvent(new Event("logiway-auth-expired"))}
  return response;
}

export async function apiJson(path,options={}){
  const response=await apiFetch(path,options);
  const body=await response.json().catch(()=>({}));
  if(!response.ok)throw new ApiError(body.message||`API ${response.status}`,response.status,body);
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
