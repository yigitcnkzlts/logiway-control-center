// Compatibility entry point retained for older imports. The application uses
// the native-fetch client so there is no second interceptor/auth implementation.
export { ApiError, apiFetch, apiJson } from "./apiClient";
