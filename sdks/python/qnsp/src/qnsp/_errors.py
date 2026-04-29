"""Typed error hierarchy for the QNSP Python SDK.

Mirrors the structure used by the official @qnsp/* TypeScript SDKs so that
log analysis and error-handling code can be consistent across runtimes.
"""

from __future__ import annotations

from typing import Any


class QnspError(Exception):
    """Base class for every QNSP SDK error."""


class QnspNetworkError(QnspError):
    """The QNSP platform could not be reached (DNS, timeout, TLS failure)."""

    def __init__(self, message: str, *, cause: BaseException | None = None) -> None:
        super().__init__(message)
        self.cause = cause


class QnspAuthError(QnspError):
    """Credentials were rejected by auth-service or the JWT was invalid."""

    def __init__(self, message: str, *, status_code: int = 401) -> None:
        super().__init__(message)
        self.status_code = status_code


class QnspApiError(QnspError):
    """A typed error returned by a QNSP service (4xx/5xx)."""

    def __init__(
        self,
        message: str,
        *,
        status_code: int,
        code: str | None = None,
        body: Any = None,
    ) -> None:
        super().__init__(message)
        self.status_code = status_code
        self.code = code
        self.body = body

    def __str__(self) -> str:
        parts = [super().__str__(), f"status={self.status_code}"]
        if self.code:
            parts.append(f"code={self.code}")
        return " ".join(parts)


class QnspWebhookError(QnspError):
    """A webhook from QNSP failed signature verification or parsing."""
