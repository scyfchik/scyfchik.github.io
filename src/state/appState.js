const state = {
  currentLanguage: "ru",
  robloxStats: null,
  studios: null,
  errors: { robloxStats: null, studios: null },
};

export function getState() {
  return state;
}

export function setResourceState(resource, { data, error = null }) {
  if (data !== undefined) state[resource] = data;
  state.errors[resource] = error;
}
