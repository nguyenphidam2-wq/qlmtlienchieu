import { NextRequest, NextResponse } from "next/server";
import crypto from "crypto";

/**
 * Validate Agent Secret Header
 * Checks 'x-agent-secret' header or 'Authorization: Bearer <token>'
 */
export function validateAgentAuth(request: NextRequest): {
  authorized: boolean;
  response?: NextResponse;
} {
  const configuredSecret = process.env.AGENT_SECRET_KEY;

  if (!configuredSecret) {
    console.error("[Agent Auth] AGENT_SECRET_KEY is not defined in environment variables.");
    return {
      authorized: false,
      response: NextResponse.json(
        {
          error: "AGENT_SECRET_KEY_NOT_CONFIGURED",
          message: "Server has not configured AGENT_SECRET_KEY in environment variables.",
        },
        { status: 500 }
      ),
    };
  }

  const customHeaderSecret = request.headers.get("x-agent-secret");
  const authHeader = request.headers.get("authorization");
  let bearerToken: string | null = null;

  if (authHeader && authHeader.startsWith("Bearer ")) {
    bearerToken = authHeader.substring(7).trim();
  }

  const providedSecret = customHeaderSecret || bearerToken;

  if (!providedSecret) {
    return {
      authorized: false,
      response: NextResponse.json(
        {
          error: "UNAUTHORIZED",
          message: "Missing 'x-agent-secret' header or Bearer token.",
        },
        { status: 401 }
      ),
    };
  }

  const providedBuffer = Buffer.from(providedSecret);
  const configuredBuffer = Buffer.from(configuredSecret);

  if (
    providedBuffer.length !== configuredBuffer.length ||
    !crypto.timingSafeEqual(providedBuffer, configuredBuffer)
  ) {
    return {
      authorized: false,
      response: NextResponse.json(
        {
          error: "INVALID_AGENT_SECRET",
          message: "Provided agent secret token is invalid.",
        },
        { status: 401 }
      ),
    };
  }

  return { authorized: true };
}
