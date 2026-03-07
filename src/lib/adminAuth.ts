import { cookies } from "next/headers";

const COOKIE_NAME = "admin_session";

async function hasAdminSessionCookie(): Promise<boolean> {
  const cookieStore = await cookies();
  const sessions = cookieStore.getAll(COOKIE_NAME);

  return sessions.some((session) => session.value.length > 0);
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

export async function isAdminAuthenticated(request: Request): Promise<boolean> {
  if (await hasAdminSessionCookie()) {
    return true;
  }

  return hasValidBasicAuth(request.headers.get("authorization"));
}
