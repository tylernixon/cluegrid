const COOKIE_NAME = "admin_session";

function hasAdminSessionCookie(cookieHeader: string | null): boolean {
  if (!cookieHeader) return false;

  for (const part of cookieHeader.split(";")) {
    const trimmed = part.trim();
    if (!trimmed.startsWith(`${COOKIE_NAME}=`)) continue;

    const value = trimmed.slice(COOKIE_NAME.length + 1);
    return value.length > 0;
  }

  return false;
}

function hasValidBasicAuth(authHeader: string | null): boolean {
  if (!authHeader?.startsWith("Basic ")) return false;

  let decoded = "";
  try {
    decoded = atob(authHeader.slice(6));
  } catch {
    return false;
  }

  const separatorIndex = decoded.indexOf(":");
  if (separatorIndex < 0) return false;

  const username = decoded.slice(0, separatorIndex);
  const password = decoded.slice(separatorIndex + 1);

  return (
    username === process.env.ADMIN_USERNAME &&
    password === process.env.ADMIN_PASSWORD
  );
}

export function isAdminAuthenticated(request: Request): boolean {
  if (hasAdminSessionCookie(request.headers.get("cookie"))) {
    return true;
  }

  return hasValidBasicAuth(request.headers.get("authorization"));
}
