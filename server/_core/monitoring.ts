import * as Sentry from "@sentry/node";
import type { ErrorRequestHandler, Express, Request } from "express";
import crypto from "node:crypto";

const sentryDsn = process.env.SENTRY_DSN?.trim();
const sentryEnabled = Boolean(sentryDsn);

if (sentryDsn) {
  Sentry.init({
    dsn: sentryDsn,
    environment: process.env.SENTRY_ENVIRONMENT || process.env.NODE_ENV || "development",
    release: process.env.APP_VERSION || process.env.npm_package_version,
    tracesSampleRate: Number(process.env.SENTRY_TRACES_SAMPLE_RATE || "0.1"),
  });
}

export function requestIdMiddleware(req: Request, _res: unknown, next: () => void) {
  const requestId = req.header("x-request-id")?.slice(0, 120) || crypto.randomUUID();
  (req as Request & { requestId?: string }).requestId = requestId;
  next();
}

export function getRequestId(req: Request) {
  return (req as Request & { requestId?: string }).requestId || "unknown";
}

export function captureApiError(error: unknown, context: { req?: Request; route?: string; type?: string } = {}) {
  const requestId = context.req ? getRequestId(context.req) : "unknown";
  const errorObject = error instanceof Error ? error : new Error(String(error));
  console.error(`[API error] ${requestId}${context.route ? ` ${context.route}` : ""}`, errorObject);

  if (!sentryEnabled) return;
  Sentry.withScope((scope) => {
    scope.setTag("request_id", requestId);
    if (context.route) scope.setTag("trpc_route", context.route);
    if (context.type) scope.setTag("trpc_type", context.type);
    scope.setContext("api", { requestId, method: context.req?.method, url: context.req?.originalUrl });
    Sentry.captureException(errorObject);
  });
}

export function registerApiErrorHandler(app: Express) {
  const errorHandler: ErrorRequestHandler = (error, req, res, next) => {
    captureApiError(error, { req });
    if (res.headersSent) return next(error);
    res.status(Number(error?.statusCode) >= 400 && Number(error?.statusCode) < 600 ? Number(error.statusCode) : 500).json({
      error: "Internal server error",
      requestId: getRequestId(req),
    });
  };
  app.use(errorHandler);
}

export function registerProcessErrorHandlers() {
  process.on("unhandledRejection", (reason) => {
    captureApiError(reason);
  });
  process.on("uncaughtException", (error) => {
    captureApiError(error);
    console.error("[Process] Uncaught exception; shutting down to avoid serving corrupted state.");
    void Sentry.flush(2000).finally(() => process.exit(1));
  });
}

export function isMonitoringEnabled() {
  return sentryEnabled;
}
