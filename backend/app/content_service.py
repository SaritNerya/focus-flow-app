import re
from urllib.parse import parse_qs, urlparse

from .errors import ApiError
from .schemas import ContentIn
from .web_fetch import fetch_page_text

SUPPORTED = ("youtube", "text", "web")
YT_ID = re.compile(r"^[A-Za-z0-9_-]{11}$")
MIN_TEXT_LEN = 10
MAX_TEXT_LEN = 200_000


def _bad_source(msg: str) -> ApiError:
    return ApiError(422, msg, {"source": msg})


def parse_youtube_id(url: str) -> str | None:
    try:
        p = urlparse(url.strip())
    except ValueError:
        return None
    host = (p.hostname or "").lower().removeprefix("www.").removeprefix("m.")
    vid = None
    if host == "youtu.be":
        vid = p.path.lstrip("/").split("/")[0]
    elif host in ("youtube.com", "youtube-nocookie.com"):
        if p.path == "/watch":
            vid = parse_qs(p.query).get("v", [None])[0]
        else:
            m = re.match(r"^/(embed|shorts|live)/([^/?]+)", p.path)
            vid = m.group(2) if m else None
    return vid if vid and YT_ID.match(vid) else None


async def prepare_content(data: ContentIn) -> dict:
    """מאמת לפי הסוג ומחזיר את השדות לשמירה במסד."""
    if data.type not in SUPPORTED:
        msg = "סוג התוכן אינו נתמך. הסוגים הנתמכים: youtube, text, web"
        raise ApiError(422, msg, {"type": msg})

    src = data.source.strip()
    if data.type == "youtube":
        vid = parse_youtube_id(src)
        if not vid:
            raise _bad_source("הקישור אינו קישור תקין לסרטון YouTube")
        return {"type": "youtube", "title": data.title, "source": f"https://www.youtube.com/watch?v={vid}", "youtube_id": vid}

    if data.type == "text":
        if len(src) < MIN_TEXT_LEN:
            raise _bad_source(f"הטקסט קצר מדי (לפחות {MIN_TEXT_LEN} תווים)")
        if len(src) > MAX_TEXT_LEN:
            raise _bad_source("הטקסט ארוך מדי")
        return {"type": "text", "title": data.title, "source": src, "text": src}

    # web
    page_title, text = await fetch_page_text(src)
    return {"type": "web", "title": data.title or page_title, "source": src, "text": text}
