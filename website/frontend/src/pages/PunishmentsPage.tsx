import { useState, useEffect, useMemo } from 'react';
import { motion } from 'framer-motion';
import { Search, AlertTriangle, ShieldX, Clock, Check, Scissors, User, Users } from 'lucide-react';
import { api } from '../services/api';
import { useAuth } from '../hooks/useAuth';

type SearchMode = 'all' | 'admin' | 'player';
type PunishmentType = 'all' | 'ban' | 'mute';

interface Punishment {
  id: number;
  type: number;
  steamid: string;
  name: string;
  admin: string;
  admin_steamid: string;
  reason: string;
  status: number;
  duration: number;
  created: number;
}

interface StaffMember {
  steam_id: string;
  name: string;
  discord_name?: string;
  group_name?: string;
}

export default function PunishmentsPage() {
  const { user } = useAuth();
  const [mode, setMode] = useState<SearchMode>('all');
  const [query, setQuery] = useState('');
  const [ptype, setPtype] = useState<PunishmentType>('all');
  const [loading, setLoading] = useState(false);
  const [punishments, setPunishments] = useState<Punishment[]>([]);
  const [staff, setStaff] = useState<StaffMember[]>([]);
  const [searched, setSearched] = useState(false);

  useEffect(() => {
    api.getStaff().then((res: any) => setStaff(res.data || [])).catch(() => {});
    loadAll();
  }, []);

  const typeNum = ptype === 'ban' ? 1 : ptype === 'mute' ? 2 : 0;

  const loadAll = async () => {
    setLoading(true);
    setMode('all');
    setQuery('');
    setSearched(false);
    try {
      const res = await api.getStaffPunishments({ type: typeNum || undefined, limit: 100 });
      setPunishments(res.punishments || []);
    } catch {
      setPunishments([]);
    } finally {
      setLoading(false);
    }
  };

  const handleSearch = async () => {
    const raw = query.trim();
    if (!raw) {
      loadAll();
      return;
    }
    setLoading(true);
    setSearched(true);
    try {
      if (mode === 'admin') {
        const isSteamId = /^7656119\d{10,}$/.test(raw);
        let adminSteamId = raw;
        if (!isSteamId) {
          const q = raw.toLowerCase();
          const match = staff.find(s =>
            s.name?.toLowerCase().includes(q) ||
            s.discord_name?.toLowerCase().includes(q)
          );
          if (match) adminSteamId = match.steam_id;
        }
        const res = await api.getPunishmentsByAdminPG(adminSteamId, typeNum || undefined, 100);
        setPunishments(res.punishments || []);
      } else if (mode === 'player') {
        const res = await api.getPunishmentsBySteamID(raw, typeNum || undefined, 100);
        setPunishments(res.punishments || []);
      } else {
        const res = await api.getStaffPunishments({ type: typeNum || undefined, limit: 100 });
        setPunishments(res.punishments || []);
      }
    } catch {
      setPunishments([]);
    } finally {
      setLoading(false);
    }
  };

  const handleShowOwn = async () => {
    if (!user?.steam_id) return;
    setMode('admin');
    setQuery(user.steam_id);
    setLoading(true);
    setSearched(true);
    try {
      const res = await api.getPunishmentsByAdminPG(user.steam_id, typeNum || undefined, 100);
      setPunishments(res.punishments || []);
    } catch {
      setPunishments([]);
    } finally {
      setLoading(false);
    }
  };

  const filtered = useMemo(() => {
    let list = punishments;
    if (typeNum > 0) {
      list = list.filter(p => p.type === typeNum);
    }
    return [...list].sort((a, b) => (b.created || 0) - (a.created || 0));
  }, [punishments, typeNum]);

  const bansActive = filtered.filter(p => p.type === 1 && p.status === 1).length;
  const bansRemoved = filtered.filter(p => p.type === 1 && p.status === 2).length;
  const bansExpired = filtered.filter(p => p.type === 1 && p.status === 4).length;
  const bansTotal = filtered.filter(p => p.type === 1).length;

  const mutesActive = filtered.filter(p => p.type === 2 && p.status === 1).length;
  const mutesRemoved = filtered.filter(p => p.type === 2 && p.status === 2).length;
  const mutesExpired = filtered.filter(p => p.type === 2 && p.status === 4).length;
  const mutesTotal = filtered.filter(p => p.type === 2).length;

  const effective = (bansTotal - bansRemoved) + (mutesTotal - mutesRemoved);

  const getStatusLabel = (status: number) => {
    switch (status) {
      case 1: return { label: 'Активен', color: 'text-red-400 bg-red-400/10' };
      case 2: return { label: 'Снят', color: 'text-emerald-400 bg-emerald-400/10' };
      case 4: return { label: 'Истёк', color: 'text-gray-400 bg-gray-400/10' };
      default: return { label: '—', color: 'text-gray-400 bg-gray-400/10' };
    }
  };

  const durStr = (dur?: number) => {
    if (dur == null) return '—';
    if (dur <= 0) return '∞';
    if (dur >= 2592000) return `${Math.floor(dur / 2592000)}мес`;
    if (dur >= 86400) return `${Math.floor(dur / 86400)}д`;
    if (dur >= 3600) return `${Math.floor(dur / 3600)}ч`;
    if (dur >= 60) return `${Math.floor(dur / 60)}м`;
    return `${dur}с`;
  };

  const formatDate = (ts?: number) => {
    if (!ts) return '—';
    return new Date(ts * 1000).toLocaleDateString('ru-RU', { day: 'numeric', month: 'short', year: 'numeric' });
  };

  const placeholder = mode === 'admin' ? 'Ник или SteamID админа...' : mode === 'player' ? 'SteamID игрока...' : 'Поиск...';

  return (
    <div className="max-w-[1100px] mx-auto">
      <motion.div
        initial={{ opacity: 0, y: -10 }}
        animate={{ opacity: 1, y: 0 }}
        className="mb-6"
      >
        <h1 className="text-2xl font-bold text-white">Наказания</h1>
        <p className="text-sm text-gray-500 mt-1">Баны и муты, выданные стаффом</p>
      </motion.div>

      <motion.div
        initial={{ opacity: 0, y: 10 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ delay: 0.05 }}
        className="bg-[#12151e] rounded-xl border border-white/5 p-4 mb-6"
      >
        <div className="flex flex-col sm:flex-row gap-3">
          <div className="flex gap-2">
            {([
              { key: 'all', label: 'Все', icon: Users },
              { key: 'admin', label: 'По админу', icon: User },
              { key: 'player', label: 'По игроку', icon: Search },
            ] as const).map(m => (
              <button
                key={m.key}
                onClick={() => setMode(m.key)}
                className={`flex items-center gap-1.5 px-3 py-2 rounded-lg text-sm font-medium transition-all ${
                  mode === m.key
                    ? 'bg-[#4f7cff] text-white'
                    : 'bg-[#0c0e14] text-gray-400 border border-white/5 hover:text-white'
                }`}
              >
                <m.icon className="w-4 h-4" />
                {m.label}
              </button>
            ))}
          </div>

          <div className="flex-1 relative">
            <Search className="absolute left-4 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-500" />
            <input
              type="text"
              placeholder={placeholder}
              value={query}
              onChange={(e) => setQuery(e.target.value)}
              onKeyDown={(e) => e.key === 'Enter' && handleSearch()}
              disabled={mode === 'all'}
              className="w-full pl-11 pr-4 py-3 bg-[#0c0e14] border border-white/5 rounded-xl text-sm text-white placeholder-gray-600 focus:outline-none focus:border-blue-500/30 transition-all disabled:opacity-50"
            />
          </div>

          <motion.button
            whileHover={{ scale: 1.02 }}
            whileTap={{ scale: 0.98 }}
            onClick={handleSearch}
            disabled={loading || (mode !== 'all' && !query.trim())}
            className="px-6 py-3 bg-[#4f7cff] hover:bg-[#3d6aff] text-white font-medium rounded-xl transition-all disabled:opacity-50"
          >
            {loading ? <div className="w-5 h-5 border-2 border-white/30 border-t-white rounded-full animate-spin" /> : 'Поиск'}
          </motion.button>
          {user?.steam_id && (
            <motion.button
              whileHover={{ scale: 1.02 }}
              whileTap={{ scale: 0.98 }}
              onClick={handleShowOwn}
              disabled={loading}
              className="px-6 py-3 bg-[#1a1f2e] hover:bg-[#222840] border border-white/10 text-gray-300 font-medium rounded-xl transition-all disabled:opacity-50"
            >
              Мои
            </motion.button>
          )}
        </div>

        <div className="flex gap-2 mt-3">
          {(['all', 'ban', 'mute'] as const).map(t => (
            <button
              key={t}
              onClick={() => setPtype(t)}
              className={`px-3 py-1.5 rounded-lg text-xs font-medium transition-all ${
                ptype === t
                  ? 'bg-[#1a1f2e] text-white border border-white/10'
                  : 'text-gray-500 hover:text-gray-300'
              }`}
            >
              {t === 'all' ? 'Все типы' : t === 'ban' ? 'Баны' : 'Муты'}
            </button>
          ))}
        </div>

        {filtered.length > 0 && (
          <div className="grid grid-cols-2 md:grid-cols-5 gap-3 mt-4">
            <div className="flex items-center gap-2 px-3 py-2 bg-red-500/5 border border-red-500/10 rounded-lg">
              <ShieldX className="w-4 h-4 text-red-400" />
              <div>
                <p className="text-lg font-bold text-white">{bansTotal}</p>
                <p className="text-[10px] text-gray-500">Банов</p>
              </div>
            </div>
            <div className="flex items-center gap-2 px-3 py-2 bg-amber-500/5 border border-amber-500/10 rounded-lg">
              <AlertTriangle className="w-4 h-4 text-amber-400" />
              <div>
                <p className="text-lg font-bold text-white">{mutesTotal}</p>
                <p className="text-[10px] text-gray-500">Мутов</p>
              </div>
            </div>
            <div className="flex items-center gap-2 px-3 py-2 bg-blue-500/5 border border-blue-500/10 rounded-lg">
              <Check className="w-4 h-4 text-blue-400" />
              <div>
                <p className="text-lg font-bold text-white">{effective}</p>
                <p className="text-[10px] text-gray-500">Всего (без снятых)</p>
              </div>
            </div>
            <div className="flex items-center gap-2 px-3 py-2 bg-emerald-500/5 border border-emerald-500/10 rounded-lg">
              <Scissors className="w-4 h-4 text-emerald-400" />
              <div>
                <p className="text-lg font-bold text-white">{bansRemoved + mutesRemoved}</p>
                <p className="text-[10px] text-gray-500">Снято</p>
              </div>
            </div>
            <div className="flex items-center gap-2 px-3 py-2 bg-purple-500/5 border border-purple-500/10 rounded-lg">
              <Clock className="w-4 h-4 text-purple-400" />
              <div>
                <p className="text-lg font-bold text-white">{bansExpired + mutesExpired}</p>
                <p className="text-[10px] text-gray-500">Истекло</p>
              </div>
            </div>
          </div>
        )}
      </motion.div>

      <motion.div
        initial={{ opacity: 0, y: 10 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ delay: 0.15 }}
        className="bg-[#12151e] rounded-xl border border-white/5 overflow-hidden"
      >
        <div className="hidden sm:grid grid-cols-[40px_1fr_1fr_80px_80px_80px_100px] gap-3 px-4 py-3 border-b border-white/5 text-xs text-gray-500 uppercase tracking-wider font-semibold">
          <span>№</span><span>Игрок</span><span>Админ</span><span>Тип</span><span>Статус</span><span>Длит.</span><span>Дата</span>
        </div>

        {loading ? (
          <div className="flex items-center justify-center py-12">
            <div className="w-6 h-6 border-2 border-blue-500/30 border-t-blue-500 rounded-full animate-spin" />
          </div>
        ) : filtered.length > 0 ? (
          <div className="divide-y divide-white/[0.03] max-h-[calc(100vh-420px)] overflow-y-auto">
            {filtered.map((p, i) => {
              const statusInfo = getStatusLabel(p.status);
              return (
                <div key={p.id} className="grid grid-cols-1 sm:grid-cols-[40px_1fr_1fr_80px_80px_80px_100px] gap-2 sm:gap-3 px-4 py-3 hover:bg-[#161a25] transition-colors items-start sm:items-center">
                  <span className="hidden sm:block text-sm text-gray-600">{i + 1}</span>
                  <div className="min-w-0">
                    <p className="text-sm text-white truncate">{p.name || p.steamid}</p>
                    <a href={`https://fearproject.ru/profile/${p.steamid}`} target="_blank" rel="noopener noreferrer"
                      className="text-[10px] text-gray-500 hover:text-blue-400 font-mono truncate block">{p.steamid}</a>
                  </div>
                  <div className="min-w-0">
                    <p className="text-sm text-gray-300 truncate">{p.admin || p.admin_steamid}</p>
                    <p className="text-[10px] text-gray-500 font-mono truncate">{p.admin_steamid}</p>
                  </div>
                  <span className={`text-xs font-medium px-2 py-0.5 rounded w-fit ${p.type === 1 ? 'bg-red-500/20 text-red-400' : 'bg-amber-500/20 text-amber-400'}`}>
                    {p.type === 1 ? 'BAN' : 'MUTE'}
                  </span>
                  <span className={`text-[11px] font-medium px-2 py-0.5 rounded w-fit ${statusInfo.color}`}>{statusInfo.label}</span>
                  <span className="text-xs text-gray-400"><Clock className="w-3 h-3 inline mr-1" />{durStr(p.duration)}</span>
                  <span className="text-xs text-gray-500">{formatDate(p.created)}</span>
                  <div className="sm:hidden col-span-full text-xs text-gray-400 mt-1">
                    Причина: <span className="text-white">{p.reason || '—'}</span>
                  </div>
                </div>
              );
            })}
          </div>
        ) : (
          <div className="text-center py-12">
            <p className="text-gray-500">
              {searched ? 'Наказания не найдены' : 'Загрузите наказания или измените фильтр'}
            </p>
          </div>
        )}
      </motion.div>
    </div>
  );
}
