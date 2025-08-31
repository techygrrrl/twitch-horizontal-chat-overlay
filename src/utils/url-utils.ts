export function tokenFromURL() {
  const params = new URLSearchParams(location.search);
  return params.get("token");
}

export function portFromURL() {
  const params = new URLSearchParams(location.search);
  return params.get("port") || "9999";
}


export function broadcasterIdFromURL(): string | null {
    const params = new URLSearchParams(location.search);
    return params.get("broadcaster_id");
}


export function sslFromURL(): boolean {
  const params = new URLSearchParams(location.search);
  const value = (params.get("ssl") || "").toLowerCase()

  return value === "true" || value === "1" || value === "yes";
}


export function hostFromURL() {
  const params = new URLSearchParams(location.search);
  return params.get("host") || "localhost";
}

export function connectModeFromURL() {
  const params = new URLSearchParams(location.search);
  let connectMode = 'ws'
  if (params.get("connect") === 'sse') {
    connectMode = 'sse'
  }

  return connectMode
}

export function debugModeFromURL(): boolean {
  const params = new URLSearchParams(location.search);

  const value = (params.get("debug") || "").toLowerCase()

  return value === "true" || value === "1" || value === "yes";
}

export function shouldHideErrorConfigFromURL(): boolean {
  const params = new URLSearchParams(location.search);
  const value = (params.get("hide_error") || "").toLowerCase()

  return value === "true" || value === "1" || value === "yes";
}

/**
 * does not validate that this is a valid hex code
 */
export function hexBackgroundColourFromURL(): string | undefined {
  const params = new URLSearchParams(location.search);
  return params.get("bg") ? "#" + params.get("bg") : undefined;
}

/**
 * does not validate that this is a valid hex code
 */
export function hexForegroundColourFromURL(): string | undefined {
  const params = new URLSearchParams(location.search);
  return params.get("fg") ? "#" + params.get("fg") : undefined;
}

export function messageVisibilityMilliseconds(): number {
  const defaultMillis = 5000

  const params = new URLSearchParams(location.search);

  const value = params.get("time_ms")

  if (!value) {
    return defaultMillis
  }

  const parsedValue = parseInt(value)
  if (isNaN(parsedValue)) {
    return defaultMillis
  }

  return Math.max(parsedValue, defaultMillis)
}
