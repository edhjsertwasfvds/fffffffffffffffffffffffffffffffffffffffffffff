from fastapi import FastAPI, UploadFile, File, HTTPException
from fastapi.middleware.cors import CORSMiddleware
from fastapi.responses import FileResponse
from fastapi.staticfiles import StaticFiles
import httpx
import re
import os
import asyncio
from typing import List

app = FastAPI(title="VDF Checker", version="3.0")

app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

STEAM_API_KEY = os.getenv("STEAM_API_KEY", "9EA60BC3158081747D77604EB9819F19")
FEAR_API_BASE = "https://api.fearproject.ru"
YOOMA_API = "https://yooma.su/api/public/read/punishments"

http_client = httpx.AsyncClient(timeout=30.0, limits=httpx.Limits(max_connections=100))

def parse_vdf_steamids(text: str) -> List[str]:
    found = re.findall(r'"SteamID"\s+"(7656\d{13})"', text)
    return list(dict.fromkeys(found))

@app.post("/api/parse-vdf")
async def parse_vdf(files: List[UploadFile] = File(...)):
    all_ids = []
    for file in files:
        if not file.filename.endswith('.vdf'):
            continue
        content = await file.read()
        try:
            text = content.decode('utf-8', errors='ignore')
        except:
            text = content.decode('latin-1', errors='ignore')
        ids = parse_vdf_steamids(text)
        all_ids.extend(ids)
    unique_ids = list(dict.fromkeys(all_ids))
    return {"total_found": len(all_ids), "unique_ids": len(unique_ids), "steamids": unique_ids}

async def check_steam_batch(steamids: List[str]) -> dict:
    ids_str = ",".join(steamids[:100])
    bans_task = http_client.get(
        "https://api.steampowered.com/ISteamUser/GetPlayerBans/v1/",
        params={"key": STEAM_API_KEY, "steamids": ids_str}
    )
    summaries_task = http_client.get(
        "https://api.steampowered.com/ISteamUser/GetPlayerSummaries/v2/",
        params={"key": STEAM_API_KEY, "steamids": ids_str}
    )
    bans_res, summaries_res = await asyncio.gather(bans_task, summaries_task)

    bans_data = bans_res.json() if bans_res.status_code == 200 else {"players": []}
    summaries_data = summaries_res.json() if summaries_res.status_code == 200 else {"response": {"players": []}}

    bans_map = {}
    for p in bans_data.get("players", []):
        sid = p.get("SteamId") or p.get("SteamID") or p.get("steamid") or p.get("steamID")
        if sid:
            bans_map[str(sid)] = p

    summaries_map = {}
    for p in summaries_data.get("response", {}).get("players", []):
        summaries_map[p.get("steamid")] = p

    return {"bans": bans_map, "summaries": summaries_map}

async def check_fear(steamid: str) -> dict:
    try:
        res = await http_client.get(
            f"{FEAR_API_BASE}/profile/{steamid}",
            headers={"Accept": "application/json", "User-Agent": "Mozilla/5.0"},
            timeout=10.0
        )
        if res.status_code == 200:
            return {"found": True, "profile": res.json()}
        return {"found": False}
    except:
        return {"found": False}

async def check_yooma(steamid: str) -> dict:
    try:
        res = await http_client.get(
            YOOMA_API,
            params={"punish_type": 0, "search": steamid, "page": 1, "mobile": 0},
            headers={
                "Accept": "application/json",
                "User-Agent": "Mozilla/5.0",
                "Referer": "https://yooma.su/ru/punishments",
                "Origin": "https://yooma.su"
            },
            timeout=15.0
        )
        if res.status_code != 200:
            return {"found": False, "bans": []}
        data = res.json()
        if not data.get("ok") or not data.get("punishments"):
            return {"found": False, "bans": []}

        import time
        now = time.time()
        active_bans = []
        for p in data["punishments"]:
            if str(p.get("steamid")) != str(steamid):
                continue
            unpunish = p.get("unpunish_admin_id")
            expires = p.get("expires", 0)
            if unpunish and unpunish != 0:
                continue
            if expires > 0 and expires < now:
                continue
            active_bans.append({
                "id": p.get("id"),
                "reason": p.get("reason", "—"),
                "admin": p.get("admin_name", "—"),
                "created": p.get("created"),
                "expires": expires
            })
        return {"found": len(active_bans) > 0, "bans": active_bans}
    except Exception as e:
        return {"found": False, "bans": [], "error": str(e)}

@app.post("/api/check-all")
async def check_all(request: dict):
    steamids = request.get("steamids", [])
    if not steamids:
        raise HTTPException(400, "No steamids provided")

    steam_results = {}
    for i in range(0, len(steamids), 100):
        batch = steamids[i:i+100]
        result = await check_steam_batch(batch)
        for k, v in result.get("bans", {}).items():
            steam_results[k] = v
        for k, v in result.get("summaries", {}).items():
            if k not in steam_results:
                steam_results[k] = v
            else:
                steam_results[k].update(v)

    sem = asyncio.Semaphore(25)

    async def check_player(sid):
        async with sem:
            fear, yooma = await asyncio.gather(check_fear(sid), check_yooma(sid))

            ban = steam_results.get(sid, {})
            summary = steam_results.get(sid, {})

            profile = fear.get("profile") or {}
            ban_info = profile.get("banInfo") or {}

            return {
                "steamid": sid,
                "nickname": profile.get("name") or summary.get("personaname") or sid,
                "avatar": summary.get("avatarfull") or summary.get("avatar") or "",
                "onFear": fear.get("found", False),
                "fearBanned": ban_info.get("isBanned", False),
                "fearReason": ban_info.get("reason", ""),
                "fearUnban": ban_info.get("unbanTimestamp"),
                "vacBanned": ban.get("VACBanned", False),
                "vacDays": ban.get("DaysSinceLastBan", 0),
                "gameBans": ban.get("NumberOfGameBans", 0),
                "communityBan": ban.get("CommunityBanned", False),
                "yoomaBans": yooma.get("bans", []),
                "yoomaFound": yooma.get("found", False)
            }

    all_results = await asyncio.gather(*[check_player(sid) for sid in steamids])
    return {"results": all_results, "total": len(all_results)}

@app.get("/")
async def root():
    return FileResponse("frontend/index.html")

app.mount("/static", StaticFiles(directory="frontend/static"), name="static")

if __name__ == "__main__":
    import uvicorn
    uvicorn.run(app, host="0.0.0.0", port=8080)
