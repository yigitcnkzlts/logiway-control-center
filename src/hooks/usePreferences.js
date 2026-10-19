/**
 * usePreferences — Unified UI preference store
 *
 * Single localStorage key: "logiway-ui-prefs"
 * Schema version: 1
 *
 * Shape:
 * {
 *   version: 1,
 *   density: "comfortable" | "compact",
 *   dashboardWidgets: [{ id, visible, order }],
 *   savedFilters: [{ id, label, filters }],         // max 8
 *   savedLoadIds: string[],                          // max 50
 *   pinnedConversationIds: string[],                 // max 10
 *   recentSearches: string[],                        // max 8
 *   recentlyViewed: [{ type, id, label, sub }],      // max 8
 *   notifPrefs: { [type]: boolean },
 *   viewMode: { [screen]: "card" | "list" },
 *   columnVisibility: { [screen]: { [col]: boolean } },
 *   onboardingDone: { [role]: boolean },
 * }
 */

import { useCallback, useState } from "react";

const PREF_KEY = "logiway-ui-prefs";
const VERSION = 1;

const DEFAULT_DASHBOARD_WIDGETS = [
  { id: "action-center",     label: "Aksiyon Merkezi",      visible: true,  order: 0 },
  { id: "active-operations", label: "Aktif Operasyonlar",   visible: true,  order: 1 },
  { id: "kpi",               label: "KPI",                  visible: true,  order: 2 },
  { id: "recent-activity",   label: "Son Aktivite",         visible: true,  order: 3 },
  { id: "saved-loads",       label: "Kaydedilen Yükler",    visible: true,  order: 4 },
];

const DEFAULT_NOTIF_PREFS = {
  new_offer:       true,
  counter_offer:   true,
  offer_accepted:  true,
  message:         true,
  shipment_status: true,
  delay:           true,
};

const DEFAULTS = {
  version: VERSION,
  density: "comfortable",
  dashboardWidgets: DEFAULT_DASHBOARD_WIDGETS,
  savedFilters: [],
  savedLoadIds: [],
  pinnedConversationIds: [],
  recentSearches: [],
  recentlyViewed: [],
  notifPrefs: DEFAULT_NOTIF_PREFS,
  viewMode: {},
  columnVisibility: {},
  onboardingDone: {},
};

function load() {
  try {
    const raw = JSON.parse(localStorage.getItem(PREF_KEY) || "null");
    if (!raw || raw.version !== VERSION) return { ...DEFAULTS };
    return { ...DEFAULTS, ...raw };
  } catch {
    return { ...DEFAULTS };
  }
}

function persist(prefs) {
  try {
    localStorage.setItem(PREF_KEY, JSON.stringify({ ...prefs, version: VERSION }));
    window.dispatchEvent(new CustomEvent("logiway-prefs-change"));
  } catch {/* quota */ }
}

export function usePreferences() {
  const [prefs, setPrefs] = useState(load);

  const update = useCallback((patch) => {
    setPrefs((prev) => {
      const next = typeof patch === "function" ? patch(prev) : { ...prev, ...patch };
      persist(next);
      return next;
    });
  }, []);

  // ── Density ────────────────────────────────────────────────────────────
  const setDensity = useCallback((density) => update({ density }), [update]);

  // ── Dashboard widgets ──────────────────────────────────────────────────
  const setWidgetVisible = useCallback((id, visible) => {
    update((p) => ({
      ...p,
      dashboardWidgets: p.dashboardWidgets.map((w) => w.id === id ? { ...w, visible } : w),
    }));
  }, [update]);

  const moveWidget = useCallback((id, direction) => {
    update((p) => {
      const widgets = [...p.dashboardWidgets].sort((a, b) => a.order - b.order);
      const idx = widgets.findIndex((w) => w.id === id);
      const target = direction === "up" ? idx - 1 : idx + 1;
      if (target < 0 || target >= widgets.length) return p;
      [widgets[idx].order, widgets[target].order] = [widgets[target].order, widgets[idx].order];
      return { ...p, dashboardWidgets: widgets };
    });
  }, [update]);

  // ── Saved filters ──────────────────────────────────────────────────────
  const saveFilter = useCallback((label, filters) => {
    update((p) => {
      const id = `sf-${Date.now()}`;
      const next = [{ id, label, filters, savedAt: new Date().toISOString() }, ...p.savedFilters].slice(0, 8);
      return { ...p, savedFilters: next };
    });
  }, [update]);

  const removeFilter = useCallback((id) => {
    update((p) => ({ ...p, savedFilters: p.savedFilters.filter((f) => f.id !== id) }));
  }, [update]);

  // ── Saved loads ────────────────────────────────────────────────────────
  const toggleSavedLoad = useCallback((loadId) => {
    update((p) => {
      const exists = p.savedLoadIds.includes(loadId);
      const next = exists
        ? p.savedLoadIds.filter((id) => id !== loadId)
        : [loadId, ...p.savedLoadIds].slice(0, 50);
      return { ...p, savedLoadIds: next };
    });
  }, [update]);

  // ── Recent searches ────────────────────────────────────────────────────
  const addRecentSearch = useCallback((query) => {
    if (!query?.trim()) return;
    update((p) => {
      const next = [query.trim(), ...p.recentSearches.filter((q) => q !== query.trim())].slice(0, 8);
      return { ...p, recentSearches: next };
    });
  }, [update]);

  const clearRecentSearches = useCallback(() => {
    update((p) => ({ ...p, recentSearches: [] }));
  }, [update]);

  // ── Recently viewed ────────────────────────────────────────────────────
  const addRecentlyViewed = useCallback((item) => {
    // item: { type, id, label, sub }
    if (!item?.id) return;
    update((p) => {
      const next = [item, ...p.recentlyViewed.filter((v) => !(v.type === item.type && v.id === item.id))].slice(0, 8);
      return { ...p, recentlyViewed: next };
    });
  }, [update]);

  // ── Pinned conversations ───────────────────────────────────────────────
  const togglePinned = useCallback((convId) => {
    update((p) => {
      const exists = p.pinnedConversationIds.includes(convId);
      const next = exists
        ? p.pinnedConversationIds.filter((id) => id !== convId)
        : [convId, ...p.pinnedConversationIds].slice(0, 10);
      return { ...p, pinnedConversationIds: next };
    });
  }, [update]);

  // ── Notification prefs ─────────────────────────────────────────────────
  const setNotifPref = useCallback((type, enabled) => {
    update((p) => ({ ...p, notifPrefs: { ...p.notifPrefs, [type]: enabled } }));
  }, [update]);

  // ── View mode ──────────────────────────────────────────────────────────
  const setViewMode = useCallback((screen, mode) => {
    update((p) => ({ ...p, viewMode: { ...p.viewMode, [screen]: mode } }));
  }, [update]);

  // ── Column visibility ──────────────────────────────────────────────────
  const setColumnVisible = useCallback((screen, col, visible) => {
    update((p) => ({
      ...p,
      columnVisibility: {
        ...p.columnVisibility,
        [screen]: { ...(p.columnVisibility[screen] || {}), [col]: visible },
      },
    }));
  }, [update]);

  // ── Onboarding ─────────────────────────────────────────────────────────
  const markOnboardingDone = useCallback((role) => {
    update((p) => ({ ...p, onboardingDone: { ...p.onboardingDone, [role]: true } }));
  }, [update]);

  // ── Reset ──────────────────────────────────────────────────────────────
  const resetPreferences = useCallback(() => {
    persist(DEFAULTS);
    setPrefs({ ...DEFAULTS });
  }, []);

  return {
    prefs,
    // density
    setDensity,
    // dashboard
    setWidgetVisible,
    moveWidget,
    // filters
    saveFilter,
    removeFilter,
    // saved loads
    toggleSavedLoad,
    isSavedLoad: (id) => prefs.savedLoadIds.includes(id),
    // recent
    addRecentSearch,
    clearRecentSearches,
    addRecentlyViewed,
    // pins
    togglePinned,
    isPinned: (id) => prefs.pinnedConversationIds.includes(id),
    // notif
    setNotifPref,
    // view
    setViewMode,
    setColumnVisible,
    // onboarding
    markOnboardingDone,
    // reset
    resetPreferences,
    // defaults exposed for reset UI
    DEFAULT_DASHBOARD_WIDGETS,
    DEFAULT_NOTIF_PREFS,
  };
}

// ── Standalone helpers (no hook, for use outside React) ────────────────────
export function getPrefs() {
  return load();
}

export function resetPrefsStorage() {
  localStorage.removeItem(PREF_KEY);
}
