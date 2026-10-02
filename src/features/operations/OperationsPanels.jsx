/**
 * OperationsPanels.jsx
 * Barrel re-export for backward compatibility with Portal.jsx imports.
 * Each component now lives in its own file.
 */
export { default as MessagesCenter }      from "../messages/MessagesCenter";
export { default as ShipmentDetail }      from "../shipments/ShipmentDetail";
export { default as ActionCenter }        from "./ActionCenter";
export { GlobalSearch }                   from "./GlobalSearch";
export { NotificationCenter }             from "./NotificationCenter";
export { MarketplaceFilters }             from "./MarketplaceFilters";
export { DriverWorkspace }                from "./DriverWorkspace";
export { LoadDetailDrawer }               from "./LoadDetailDrawer";
// CompanyProfile is used directly in LoadDetailDrawer;
// also exported here for any direct consumer
export { default as CompanyProfile }      from "../companies/CompanyProfile";
