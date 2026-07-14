const state = {
  currentLanguage: "ru",
  robloxStats: null,
  studios: null,
  dashboard: { currentSlide: 0 },
  loading: { robloxStats: true, studios: true },
  errors: { robloxStats: null, studios: null },
  initialized: false,
};

export function getState() {
  return state;
}

export function setState(patch) {
  Object.assign(state, patch);
  return state;
}

export function setResourceState(resource, { data, error = null, loading = false }) {
  if (resource === "robloxStats" && data !== undefined) state.robloxStats = data;
  if (resource === "studios" && data !== undefined) state.studios = data;
  state.loading[resource] = loading;
  state.errors[resource] = error;
}
