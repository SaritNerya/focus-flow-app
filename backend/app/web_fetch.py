"""שליפת טקסט מדף אינטרנט, עם הגנה מפני SSRF (גישה לכתובות פנימיות)."""
import asyncio
import ipaddress
import socket
from urllib.parse import urljoin, urlparse

import httpx
from bs4 import BeautifulSoup

from .errors import ApiError

MAX_BYTES = 2_000_000
MAX_REDIRECTS = 3
MIN_TEXT = 200


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


async def fetch_page_text(url: str) -> tuple[str | None, str]:
    """מחזיר (כותרת הדף, טקסט נקי)."""
    headers = {"User-Agent": "FocusFlowBot/1.0 (+reader view)"}
    async with httpx.AsyncClient(follow_redirects=False, timeout=8.0, headers=headers) as client:
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
    return title, text[:300_000]
