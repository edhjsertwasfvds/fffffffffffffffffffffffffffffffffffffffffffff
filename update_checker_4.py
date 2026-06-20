import re

with open('bot.py', 'r', encoding='utf-8') as f:
    content = f.read()

# Add yooma checks to the embed output in _build_vdf_embeds
fear_ban_pattern = r'(status_parts\.append\(ban_info\)\n\s*else:\n\s*status_parts\.append\("✅ Fear: найден\."\))'
yooma_add = r'''\1

          ydata = r.get("yooma_data", {})
          if ydata.get("found"):
              active_yooma = [p for p in ydata["punishments"] if p["status"] == "active"]
              if active_yooma:
                  p = active_yooma[0]
                  status_parts.append(f"🔴 Yooma: бан за {p['reason']}")
              else:
                  status_parts.append("🟡 Yooma: есть история")'''

# Need to find where this is to inject properly. Let's do a more stable replace.
# Actually, fear_ban_pattern doesn't match perfectly. Let's just find `status_parts.append("✅ Fear: найден.")`
content = content.replace('status_parts.append("✅ Fear: найден.")', 'status_parts.append("✅ Fear: найден.")' + yooma_add.replace(r'\1', ''))

with open('bot.py', 'w', encoding='utf-8') as f:
    f.write(content)
print("done step 4")
