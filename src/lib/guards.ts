import { fail } from "@/lib/http";
import { assertSameOrigin } from "@/lib/csrf";
import { getSession, type SessionUser } from "@/lib/auth";
import { ADMIN_ROLES, type Portal, type Role } from "@/lib/constants";

export async function requireUser(req: Request, portal: Portal, roles?: Role[]) {
  try {
    assertSameOrigin(req);
  } catch {
    return { error: fail("Forbidden", 403) } as const;
  }
  const session = await getSession(portal);
  if (!session) return { error: fail("Please sign in", 401) } as const;
  if (roles && !roles.includes(session.role)) return { error: fail("You do not have access", 403) } as const;
  return { session } as const;
}

export async function requireAdmin(req: Request, roles: Role[] = ADMIN_ROLES) {
  return requireUser(req, "admin", roles);
}

export function sessionData(session: SessionUser) {
  return {
    id: session.id,
    name: session.name,
    email: session.email,
    phone: session.phone,
    role: session.role,
    status: session.status,
    emailVerified: session.emailVerified,
    avatar: session.avatar,
  };
}
