import { auth } from "@/lib/auth";
import { headers } from "next/headers";
import { NextResponse } from "next/server";
import type { UserRole } from "@/types";

/**
 * Get the current session from headers.
 * Returns null if not authenticated.
 */
export async function getServerSession() {
  const session = await auth.api.getSession({
    headers: await headers(),
  });
  return session;
}

/**
 * Require authentication. Throws if not authenticated.
 */
export async function requireAuth() {
  const session = await getServerSession();
  if (!session) {
    throw new Error("Unauthorized");
  }
  return session;
}

/**
 * Require a specific role. Throws if not authorized.
 */
export async function requireRole(role: UserRole) {
  const session = await requireAuth();
  if ((session.user as unknown as { role: string }).role !== role) {
    throw new Error("Forbidden: insufficient permissions");
  }
  return session;
}

/**
 * Require one of the specified roles.
 */
export async function requireAnyRole(...roles: UserRole[]) {
  const session = await requireAuth();
  const userRole = (session.user as unknown as { role: string }).role;
  if (!roles.includes(userRole as UserRole)) {
    throw new Error("Forbidden: insufficient permissions");
  }
  return session;
}

/**
 * Create a standardized API error response.
 */
export function apiError(message: string, status: number = 400) {
  return NextResponse.json(
    { success: false, error: message },
    { status }
  );
}

/**
 * Create a standardized API success response.
 */
export function apiSuccess<T>(data: T, status: number = 200) {
  return NextResponse.json(
    { success: true, data },
    { status }
  );
}

/**
 * Wrap an API handler with error handling.
 */
export function withErrorHandler(
  handler: (req: Request) => Promise<NextResponse>
) {
  return async (req: Request) => {
    try {
      return await handler(req);
    } catch (error: unknown) {
      // Re-throw Next.js internal control-flow errors (redirects, prerender bailout, etc.)
      if (
        typeof error === "object" &&
        error !== null &&
        "digest" in error &&
        typeof (error as { digest?: unknown }).digest === "string"
      ) {
        throw error;
      }

      const message =
        error instanceof Error ? error.message : "Internal server error";

      if (message === "Unauthorized") {
        return apiError(message, 401);
      }
      if (message.startsWith("Forbidden")) {
        return apiError(message, 403);
      }

      console.error("API Error:", error);
      return apiError(message, 500);
    }
  };
}
