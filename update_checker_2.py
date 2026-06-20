import re

with open('bot.py', 'r', encoding='utf-8') as f:
    content = f.read()

# 3. Update _build_vdf_embeds to show Yooma bans and remove the YoomaCheckView
# We need to change the function signature and the places it's called.

def_pattern = r'def _build_vdf_embeds\(results: list\[dict\], filename: str\) -> tuple\[list\[discord\.Embed\], YoomaCheckView\]:'
new_def = 'def _build_vdf_embeds(results: list[dict], filename: str) -> list[discord.Embed]:'
content = re.sub(def_pattern, new_def, content)

# Remove YoomaCheckView logic from _build_vdf_embeds
view_pattern = r'nicknames = \{r\["steamid"\]: r\["nickname"\] for r in results\}\n\s*yooma_view = YoomaCheckView\(steamids=\[r\["steamid"\] for r in results\], nicknames=nicknames\)\n\s*return embeds, yooma_view'
new_view = 'return embeds'
content = re.sub(view_pattern, new_view, content)

# Change how it's called in on_message
call_pattern = r'embeds, yooma_view = _build_vdf_embeds\(results, attachment\.filename\)\n\s*await msg\.edit\(content=f"✅ Проверено \*\*\{len\(steamids\)\}\*\* аккаунтов", embed=embeds\[0\], view=yooma_view\)'
new_call = '''embeds = _build_vdf_embeds(results, attachment.filename)
                await msg.edit(content=f"✅ Проверено **{len(steamids)}** аккаунтов", embed=embeds[0])'''
content = re.sub(call_pattern, new_call, content)

# Also we need to modify _build_vdf_embeds to include yooma flags if active bans exist
# In `_build_vdf_embeds` we have the `sort_key` and the formatting loop. Let's find the formatting loop.
format_pattern = r'(flags\.append\("VAC"\)\n\s*if r\["game_bans"\] > 0:\n\s*flags\.append\("Game"\))'
new_format = r'''\1
        ydata = r.get("yooma_data", {})
        if ydata.get("found"):
            active = [p for p in ydata["punishments"] if p["status"] == "active"]
            if active:
                flags.append("Yooma")'''
content = re.sub(format_pattern, new_format, content)

with open('bot.py', 'w', encoding='utf-8') as f:
    f.write(content)
print("done step 2")
