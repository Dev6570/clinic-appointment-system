"""
Simple in-memory rate limiting, applied per client IP.

This is deliberately lightweight (no Redis/external dependency) since the
app runs as a single process. It complements the per-account lockout in
auth_utils.py: lockout protects one specific account after repeated
failures against it; this limits how many login attempts *any* single
client can make in a time window, regardless of which username they're
trying - defense against a broader brute-force sweep across many accounts.

Note: this resets if the server process restarts, and doesn't share state
across multiple worker processes. That's an acceptable tradeoff for a
single-instance deployment; a busier multi-worker deployment would want a
shared store (e.g. Redis) instead.
"""
import time
from collections import defaultdict
from fastapi import HTTPException, Request, status

WINDOW_SECONDS = 5 * 60
MAX_REQUESTS_PER_WINDOW = 20

_attempts = defaultdict(list)


def _client_ip(request: Request) -> str:
    forwarded = request.headers.get("x-forwarded-for")
    if forwarded:
        return forwarded.split(",")[0].strip()
    return request.client.host if request.client else "unknown"


def enforce_login_rate_limit(request: Request):
    ip = _client_ip(request)
    now = time.time()

    timestamps = _attempts[ip]
    cutoff = now - WINDOW_SECONDS
    while timestamps and timestamps[0] < cutoff:
        timestamps.pop(0)

    if len(timestamps) >= MAX_REQUESTS_PER_WINDOW:
        raise HTTPException(
            status_code=status.HTTP_429_TOO_MANY_REQUESTS,
            detail="Too many login attempts from this network. Please wait a few minutes and try again.",
        )

    timestamps.append(now)
