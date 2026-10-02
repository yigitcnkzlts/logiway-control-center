import { apiJson } from "./apiClient";

export async function listNotifications({ page = 0, size = 20 } = {}) {
  const response = await apiJson(`/api/v1/notifications?page=${page}&size=${Math.min(size, 100)}`);
  return {
    items: response.content || response.items || [],
    page: response.page ?? page,
    totalElements: response.totalElements ?? 0,
    totalPages: response.totalPages ?? 0,
  };
}

export async function markNotificationRead(id) {
  return apiJson(`/api/v1/notifications/${id}/read`, { method: "POST" });
}

export async function listMatchMessages(matchId) {
  return apiJson(`/api/v1/matches/${matchId}/messages`);
}

export async function sendMatchMessage(matchId, content, senderRole) {
  return apiJson(`/api/v1/matches/${matchId}/messages`, {
    method: "POST",
    body: JSON.stringify({ body: content, senderRole }),
  });
}

export async function loadLatestMatchPosition(matchId) {
  return apiJson(`/api/v1/tracking/matches/${matchId}/latest`);
}

export async function publishMatchPosition(matchId, position) {
  return apiJson(`/api/v1/tracking/matches/${matchId}/positions`, {
    method: "POST",
    body: JSON.stringify(position),
  });
}
