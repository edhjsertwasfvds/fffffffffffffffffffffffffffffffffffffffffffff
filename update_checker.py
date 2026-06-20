import re

with open('bot.py', 'r', encoding='utf-8') as f:
    content = f.read()

# 1. remove yooma tasks from button, put them directly in the check loop
on_msg_pattern = r'(bans_results, summary_results = await asyncio\.gather\(\n\s*asyncio\.gather\(\*bans_tasks\),\n\s*asyncio\.gather\(\*summary_tasks\)\n\s*\))'
new_on_msg = '''yooma_tasks = [_check_yooma_ban(session, sid) for sid in steamids]
                    yooma_results_raw = await asyncio.gather(*yooma_tasks)
                    yooma_map = {sid: ydata for sid, ydata in zip(steamids, yooma_results_raw)}

                    bans_results, summary_results = await asyncio.gather(
                        asyncio.gather(*bans_tasks),
                        asyncio.gather(*summary_tasks)
                    )'''
content = content.replace(re.search(on_msg_pattern, content).group(1), new_on_msg)

# 2. Add yooma data to results array
results_pattern = r'(community_ban = steam_ban\.get\("CommunityBanned", False\)\n\s*nickname\s*= summary\.get\("personaname", sid\))'
new_results = r'''\1
                        yooma_data    = yooma_map.get(sid, {})'''
content = re.sub(results_pattern, new_results, content)

append_pattern = r'("community_ban":community_ban,\n\s*\})'
new_append = r'''"community_ban":community_ban,
                            "yooma_data":   yooma_data,
                        }'''
content = re.sub(append_pattern, new_append, content)

with open('bot.py', 'w', encoding='utf-8') as f:
    f.write(content)
print("done step 1")
