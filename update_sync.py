import re

with open('bot.py', 'r', encoding='utf-8') as f:
    content = f.read()

# Find cmd_staffsync
pattern = r'@tree\.command\(name="staffsync".*?\nasync def cmd_staffsync\(interaction: discord\.Interaction\):.*?(?=\n@|\Z)'
old_func = re.search(pattern, content, re.DOTALL)

if old_func:
    new_func = '''@tree.command(name="staffsync", description="Синхронизировать список стаффа с базой админов Fear Project")
async def cmd_staffsync(interaction: discord.Interaction):
    if not _is_admin(interaction):
        return await interaction.response.send_message("Нет прав.", ephemeral=True)
    await interaction.response.defer(ephemeral=True)
    try:
        res = await _sync_staff_list()
        
        if res.get("error"):
            return await interaction.followup.send(f"❌ Ошибка синхронизации: {res['error']}", ephemeral=True)

        embed = discord.Embed(
            title="✅ Синхронизация стаффа завершена",
            color=0x2ecc71,
            timestamp=datetime.now(timezone.utc)
        )
        embed.add_field(name="📊 Итого в списке", value=f"**{res['total']}**", inline=True)
        embed.add_field(name="➕ Добавлено/Обновлено", value=f"**{res['new'] + res['updated']}**", inline=True)
        embed.add_field(name="➖ Удалено", value=f"**{res['removed']}**", inline=True)

        await interaction.followup.send(embed=embed, ephemeral=True)
    except Exception as e:
        _log(f"Ошибка в /staffsync: {e}")
        await interaction.followup.send(f"❌ Произошла ошибка: {e}", ephemeral=True)
'''
    content = content.replace(old_func.group(0), new_func)
    with open('bot.py', 'w', encoding='utf-8') as f:
        f.write(content)
    print('Done!')
else:
    print('Not found')
