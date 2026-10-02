import { apiJson } from "./apiClient";

export const getCurrentUser = () => apiJson("/api/v1/me");
