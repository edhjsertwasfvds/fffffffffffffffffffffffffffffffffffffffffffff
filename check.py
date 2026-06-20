import json
import re

s = open('bot.py', encoding='utf-8').read()
blacklist_match = re.search(r'_STAFF_BLACKLIST\s*=\s*\{([^}]+)\}', s)
blacklist = set(re.findall(r'"([0-9]{17})"', blacklist_match.group(1)))

admins = json.load(open('admins_cache.json', encoding='utf-8'))
staff_groups = ['STAFF', 'STMODER', 'MODER', 'MLMODER', 'ADMIN', 'ADMIN+', 'STADMIN', 'GLADMIN']
staff_admins = [a for a in admins if a.get('group_name') in staff_groups]

print('Total in staff groups:', len(staff_admins))
valid_staff = [a for a in staff_admins if a.get('steamid') not in blacklist]
print('Valid staff:', len(valid_staff))

for g in ['STAFF', 'STMODER', 'MODER', 'MLMODER']:
    g_admins = [a for a in admins if a.get('group_name') == g]
    g_valid = [a for a in g_admins if a.get('steamid') not in blacklist]
    print(f"{g}: {len(g_valid)}")

print("Admins in ADMIN and ADMIN+ and STADMIN:")
for g in ['ADMIN', 'ADMIN+', 'STADMIN', 'GLADMIN']:
    g_admins = [a for a in admins if a.get('group_name') == g]
    g_valid = [a for a in g_admins if a.get('steamid') not in blacklist]
    print(f"{g}: {len(g_valid)}")
