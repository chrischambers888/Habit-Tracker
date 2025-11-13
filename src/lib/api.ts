import { NextResponse } from "next/server";
import { ZodError } from "zod";

type ErrorOptions = {
  status?: number;
};

export function jsonResponse<T>(
  data: T,
  init?: ResponseInit,
): NextResponse<T> {
  return NextResponse.json(data, init);
}

export function errorResponse(
  error: unknown,
  fallbackMessage = "Internal Server Error",
  options: ErrorOptions = {},
) {
  if (error instanceof ZodError) {
    return NextResponse.json(
      {
        message: "Validation failed",
        issues: error.flatten(),
      },
      {
        status: 400,
      },
    );
  }

  const status = options.status ?? 500;
  const message =
    error instanceof Error ? error.message : fallbackMessage ?? "Error";

  return NextResponse.json(
    {
      message,
    },
    { status },
  );
}

export async function parseJsonRequest<T>(
  request: Request,
  schema: { parseAsync(data: unknown): Promise<T> },
) {
  const body = await request.json().catch(() => {
    throw new Error("Invalid JSON body");
  });

  return schema.parseAsync(body);
}

