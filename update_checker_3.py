import re

with open('bot.py', 'r', encoding='utf-8') as f:
    content = f.read()

# Make the newbies_panel command
newbies_cmd = '''
@tree.command(name="newbies_panel", description="Создать панель со всеми игроками онлайн, у которых наиграно менее 2 часов на сервере")
async def cmd_newbies_panel(interaction: discord.Interaction):
    if not _is_admin(interaction):
        return await interaction.response.send_message("Нет прав.", ephemeral=True)

    await interaction.response.defer(ephemeral=False)
    try:
        servers = await _fetch_online_servers()
        if not servers:
            return await interaction.followup.send("❌ Не удалось получить данные серверов.")

        lines = []
        async with aiohttp.ClientSession() as session:
            for srv in servers:
                srv_name = srv.get("name", "Unknown Server")
                srv_connect = srv.get("connect", "unknown:27015")
                for player in srv.get("live_data", {}).get("players", []):
                    steam_id = player["steam_id"]
                    profile = await _get_profile(session, steam_id)
                    if profile:
                        stats = profile.get("stats", {})
                        playtime_h = stats.get("playtime", 0) / 3600
                        if playtime_h < 2:
                            nickname = player.get("nickname", steam_id)
                            fear_url = f"https://fearproject.ru/profile/{steam_id}"
                            lines.append(f"**[{nickname}]({fear_url})** `{steam_id}`\\n{srv_name} 鈥� `connect {srv_connect}`\\n")

        if not lines:
            return await interaction.followup.send("✅ Сейчас нет игроков с наигранными часами менее 2.")

        embeds = []
        current = ""
        for line in lines:
            if len(current) + len(line) > 3500:
                embeds.append(discord.Embed(title="Новички онлайн (< 2ч)", description=current.strip(), color=0xf1c40f))
                current = line + "\\n"
            else:
                current += line + "\\n"
        if current:
            embeds.append(discord.Embed(title="Новички онлайн (< 2ч)", description=current.strip(), color=0xf1c40f))

        for e in embeds:
            await interaction.followup.send(embed=e)
    except Exception as e:
        _log(f"Ошибка в /newbies_panel: {e}")
        await interaction.followup.send(f"❌ Ошибка: {e}")
'''

# Find a good place to insert this command. Let's put it before cmd_checker
content = re.sub(r'(@tree\.command\(name="checker")', newbies_cmd.replace('\\n', '\n') + r'\n\n\1', content)

with open('bot.py', 'w', encoding='utf-8') as f:
    f.write(content)
print("done step 3")
