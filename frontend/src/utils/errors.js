// FastAPI returns a plain string in `detail` for most errors we raise
// ourselves (e.g. "Incorrect username or password"), but returns a LIST of
// validation-error objects for Pydantic validation failures (422s), e.g.
// [{ loc: [...], msg: "...", type: "..." }]. Rendering that array directly
// as a React child would crash. This normalizes either shape into a single
// readable string.
export function getErrorMessage(err, fallback = "Something went wrong. Please try again.") {
  const detail = err?.response?.data?.detail;
  if (typeof detail === "string") return detail;
  if (Array.isArray(detail)) {
    const messages = detail.map((d) => d?.msg).filter(Boolean);
    if (messages.length > 0) return messages.join(" ");
  }
  return fallback;
}
