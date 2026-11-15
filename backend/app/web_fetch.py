"""שליפת טקסט מדף אינטרנט, עם הגנה מפני SSRF (גישה לכתובות פנימיות)."""
import asyncio
import ipaddress
import socket
from typing import NamedTuple
from urllib.parse import urljoin, urlparse

import httpx
from bs4 import BeautifulSoup

from .errors import ApiError

MAX_BYTES = 2_000_000
MAX_REDIRECTS = 3
MIN_TEXT = 200
BLOCKED_STATUSES = (401, 403, 429, 503)  # האתר חוסם גישה אוטומטית (לרוב מכתובות של שרתי ענן)

# כותרות של דפדפן רגיל: אתרים רבים חוסמים בקשות עם User-Agent של בוט
REQUEST_HEADERS = {
    "User-Agent": "Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/130.0 Safari/537.36",
    "Accept": "text/html,application/xhtml+xml,text/plain;q=0.9,*/*;q=0.8",
    "Accept-Language": "he,en;q=0.8",
}


class FetchedPage(NamedTuple):
    title: str | None
    text: str
    embed_url: str | None  # הכתובת להצגה בתוך האתר, או None אם הדף חוסם הטמעה


def frame_allowed(url: str, headers: httpx.Headers) -> bool:
    """האם הדפדפן יסכים להציג את הדף בתוך iframe באתר שלנו.

    אתרים חוסמים הטמעה בשתי דרכים: X-Frame-Options (DENY / SAMEORIGIN),
    או Content-Security-Policy עם frame-ancestors שלא מתיר כל אתר.
    בנוסף, דף http לא יוצג בתוך אתר https (Mixed content).
    """
    if urlparse(url).scheme != "https":
        return False
    if headers.get("x-frame-options", "").strip():
        return False
    for csp in headers.get_list("content-security-policy"):
        for directive in csp.split(";"):
            name, _, value = directive.strip().partition(" ")
            if name.lower() == "frame-ancestors" and value.split() != ["*"]:
                return False
    return True


def _bad(msg: str) -> ApiError:
    return ApiError(422, msg, {"source": msg})


async def _assert_public(url: str) -> None:
    p = urlparse(url)
    if p.scheme not in ("http", "https") or not p.hostname:
        raise _bad("הקישור חייב להתחיל ב-http:// או https://")
    if p.port not in (None, 80, 443):
        raise _bad("הפורט בקישור אינו נתמך")
    try:
        infos = await asyncio.get_running_loop().getaddrinfo(p.hostname, p.port or 443, type=socket.SOCK_STREAM)
    except socket.gaierror:
        raise _bad("לא ניתן למצוא את האתר מהקישור שהוזן")
    for info in infos:
        ip = ipaddress.ip_address(info[4][0])
        if not ip.is_global:
            raise _bad("הקישור מצביע על כתובת שאינה ציבורית")


async def fetch_page(url: str) -> FetchedPage:
    """מוריד את הדף ומחזיר כותרת, טקסט נקי לתצוגת קריאה, וכתובת להטמעה (אם מותר)."""
    async with httpx.AsyncClient(follow_redirects=False, timeout=8.0, headers=REQUEST_HEADERS) as client:
        current = url
        for _ in range(MAX_REDIRECTS + 1):
            await _assert_public(current)  # בכל קפיצה מחדש, גם בהפניות
            try:
                async with client.stream("GET", current) as resp:
                    if resp.status_code in (301, 302, 303, 307, 308):
                        loc = resp.headers.get("location")
                        if not loc:
                            raise _bad("הדף הפנה למקום לא ידוע")
                        current = urljoin(current, loc)
                        continue
                    if resp.status_code in BLOCKED_STATUSES:
                        raise _bad("האתר חוסם גישה אוטומטית לדף. אפשר להעתיק את הטקסט ולהוסיף אותו כפריט מסוג טקסט")
                    if resp.status_code != 200:
                        raise _bad(f"האתר החזיר שגיאה ({resp.status_code})")
                    ctype = resp.headers.get("content-type", "")
                    if "html" not in ctype and "text/plain" not in ctype:
                        raise _bad("הקישור אינו מצביע על דף טקסט או HTML")
                    body = b""
                    async for chunk in resp.aiter_bytes():
                        body += chunk
                        if len(body) > MAX_BYTES:
                            raise _bad("הדף גדול מדי")
                    encoding = resp.encoding or "utf-8"
                    embed_url = current if frame_allowed(current, resp.headers) else None
            except httpx.HTTPError:
                raise _bad("לא הצלחנו לגשת לדף. בדקו את הקישור ונסו שוב")
            break
        else:
            raise _bad("יותר מדי הפניות בדרך לדף")

    html = body.decode(encoding, errors="replace")
    soup = BeautifulSoup(html, "html.parser")
    title = soup.title.get_text(strip=True) if soup.title else None
    for tag in soup(["script", "style", "noscript", "nav", "footer", "header", "aside", "form", "svg"]):
        tag.decompose()
    blocks = [t.get_text(" ", strip=True) for t in soup.find_all(["h1", "h2", "h3", "p", "li", "blockquote"])]
    text = "\n\n".join(b for b in blocks if len(b) > 1)
    if len(text) < MIN_TEXT:
        text = soup.get_text("\n", strip=True)
    if len(text) < MIN_TEXT:
        raise _bad("לא הצלחנו לחלץ מהדף טקסט לקריאה")
    return FetchedPage(title, text[:300_000], embed_url)
