import { motion } from 'framer-motion';
import { useAuth } from '../hooks/useAuth';
import {
  Shield, Zap, Lock, Eye, BarChart3, Users, Ban, Search, Globe,
  ChevronRight, Sparkles, TrendingUp, Activity
} from 'lucide-react';

const ghostLogo = '/ghost-logo.webp';

export default function LoginPage() {
  const { login } = useAuth();

  const highlights = [
    { label: 'Discord OAuth2', value: 'Безопасный вход', icon: Lock },
    { label: 'Роли сервера', value: 'Автоматические права', icon: Shield },
    { label: 'Live data', value: 'Обновления онлайн', icon: Activity },
  ];

  const featurePills = [
    { icon: Shield, text: 'Стафф' },
    { icon: Search, text: 'Проверки' },
    { icon: Ban, text: 'Наказания' },
    { icon: BarChart3, text: 'Топ-1000' },
    { icon: Globe, text: 'Сервера' },
    { icon: TrendingUp, text: 'Дропы' },
  ];

  return (
    <div className="h-screen bg-[#080a10] flex flex-col relative overflow-hidden">
      {/* Background layers */}
      <div className="absolute inset-0 pointer-events-none">
        <div className="absolute top-0 left-1/4 w-[600px] h-[600px] bg-[#4f7cff]/10 rounded-full blur-[150px]" />
        <div className="absolute bottom-0 right-1/4 w-[500px] h-[500px] bg-[#7c5cfc]/10 rounded-full blur-[140px]" />
        <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[800px] h-[800px] bg-[#38bdf8]/5 rounded-full blur-[180px]" />
        <div
          className="absolute inset-0 opacity-[0.03]"
          style={{
            backgroundImage:
              'linear-gradient(#4f7cff 1px, transparent 1px), linear-gradient(90deg, #4f7cff 1px, transparent 1px)',
            backgroundSize: '60px 60px',
          }}
        />
      </div>

      {/* Header */}
      <motion.header
        initial={{ opacity: 0, y: -20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.6 }}
        className="relative z-10 px-6 py-4 flex items-center justify-between max-w-7xl mx-auto w-full"
      >
        <div className="flex items-center gap-3">
          <img
            src={ghostLogo}
            alt="FearProject"
            className="w-9 h-9 rounded-xl shadow-lg shadow-[#4f7cff]/20"
          />
          <span className="text-xl font-bold text-white tracking-tight">
            Fear<span className="text-[#4f7cff]">Search</span>
          </span>
        </div>
        <div className="hidden md:flex items-center gap-2 text-xs text-gray-400">
          <span className="w-2 h-2 rounded-full bg-emerald-500 animate-pulse" />
          Система онлайн
        </div>
      </motion.header>

      {/* Hero — full screen, centered */}
      <section className="relative z-10 flex-1 flex flex-col items-center justify-center px-4 py-4 min-h-0">
        <div className="max-w-5xl w-full">
          <div className="grid lg:grid-cols-2 gap-8 lg:gap-12 items-center">
            {/* Left text */}
            <motion.div
              initial={{ opacity: 0, x: -40 }}
              animate={{ opacity: 1, x: 0 }}
              transition={{ duration: 0.7 }}
            >
              <div className="inline-flex items-center gap-2 px-3 py-1.5 rounded-full bg-[#12151e] border border-[#4f7cff]/20 text-[#4f7cff] text-xs font-semibold mb-5">
                <Sparkles className="w-3.5 h-3.5" />
                Staff панель для FearProject
              </div>
              <h1 className="text-4xl md:text-5xl lg:text-6xl font-extrabold text-white leading-[1.1] mb-5">
                Управляй сервером
                <br />
                <span className="bg-gradient-to-r from-[#4f7cff] via-[#7c5cfc] to-[#38bdf8] bg-clip-text text-transparent">
                  FearProject
                </span>
              </h1>
              <p className="text-base md:text-lg text-gray-400 mb-6 max-w-xl leading-relaxed">
                Админ-панель для стаффа FearProject. Авторизация через Discord,
                статистика серверов, дропы, наказания и проверки — всё под рукой.
              </p>

              <motion.button
                whileHover={{ scale: 1.03, boxShadow: '0 0 40px rgba(88, 101, 242, 0.35)' }}
                whileTap={{ scale: 0.97 }}
                onClick={login}
                className="group relative flex items-center justify-center gap-3 px-7 py-3.5 bg-[#5865f2] hover:bg-[#4752c4] text-white font-semibold rounded-2xl transition-all duration-200 shadow-xl shadow-[#5865f2]/20"
              >
                <svg className="w-5 h-5" viewBox="0 0 24 24" fill="currentColor">
                  <path d="M20.317 4.3698a19.7913 19.7913 0 00-4.8851-1.5152.0741.0741 0 00-.0785.0371c-.211.3753-.4447.8648-.6083 1.2495-1.8447-.2762-3.68-.2762-5.4868 0-.1636-.3933-.4058-.8742-.6177-1.2495a.077.077 0 00-.0785-.037 19.7363 19.7363 0 00-4.8852 1.515.0699.0699 0 00-.0321.0277C.5334 9.0458-.319 13.5799.0992 18.0578a.0824.0824 0 00.0312.0561 19.9312 19.9312 0 005.9932 3.0294.0777.0777 0 00.0842-.0276c.4616-.6304.8731-1.2952 1.226-1.9942a.076.076 0 00-.0416-.1057c-.6528-.2476-1.2743-.5495-1.8722-.8923a.077.077 0 01-.0076-.1277c.1258-.0943.2517-.1923.3718-.2914a.0743.0743 0 01.0776-.0105c3.9278 1.7933 8.18 1.7933 12.0614 0a.0739.0739 0 01.0785.0095c.1202.099.246.1981.3728.2924a.077.077 0 01-.0066.1276 12.2986 12.2986 0 01-1.873.8914.0766.0766 0 00-.0407.1067c.3604.698.7719 1.3628 1.225 1.9932a.076.076 0 00.0842.0286 19.8975 19.8975 0 006.0022-3.0294.0771.0771 0 00.0313-.0552c.5004-5.177-.8382-9.6739-3.5485-13.6604a.061.061 0 00-.0312-.0286zM8.02 15.3312c-1.1825 0-2.1569-1.0857-2.1569-2.419 0-1.3332.9555-2.4189 2.157-2.4189 1.2108 0 2.1757 1.0952 2.1568 2.419 0 1.3332-.9555 2.4189-2.1569 2.4189zm7.9748 0c-1.1825 0-2.1569-1.0857-2.1569-2.419 0-1.3332.9554-2.4189 2.1569-2.4189 1.2108 0 2.1757 1.0952 2.1568 2.419 0 1.3332-.946 2.4189-2.1568 2.4189Z" />
                </svg>
                Войти через Discord
                <ChevronRight className="w-4 h-4 opacity-70 group-hover:translate-x-1 transition-transform" />
              </motion.button>

              <p className="text-xs text-gray-500 mt-3">
                Только для участников Discord сервера FearProject с ролью стаффа.
              </p>
            </motion.div>

            {/* Right visual card */}
            <motion.div
              initial={{ opacity: 0, x: 40 }}
              animate={{ opacity: 1, x: 0 }}
              transition={{ duration: 0.7, delay: 0.15 }}
              className="relative"
            >
              <div className="glass-card p-5 md:p-6 relative overflow-hidden">
                <div className="absolute top-0 right-0 w-40 h-40 bg-[#4f7cff]/20 rounded-full blur-[80px]" />
                <div className="relative z-10">
                  <div className="flex items-center justify-between mb-4">
                    <h3 className="text-base font-bold text-white">Превью панели</h3>
                    <span className="px-2 py-0.5 rounded-full bg-emerald-500/10 text-emerald-400 text-xs font-semibold border border-emerald-500/20">
                      Live
                    </span>
                  </div>

                  <div className="grid grid-cols-2 gap-2 mb-3">
                    {highlights.map((h, i) => (
                      <motion.div
                        key={h.label}
                        initial={{ opacity: 0, y: 10 }}
                        animate={{ opacity: 1, y: 0 }}
                        transition={{ delay: 0.4 + i * 0.1 }}
                        className="bg-[#0c0e14] border border-white/5 rounded-xl p-3"
                      >
                        <h.icon className="w-4 h-4 text-[#4f7cff] mb-1.5" />
                        <p className="text-[10px] text-gray-500">{h.label}</p>
                        <p className="text-xs font-semibold text-white">{h.value}</p>
                      </motion.div>
                    ))}
                    <motion.div
                      initial={{ opacity: 0, y: 10 }}
                      animate={{ opacity: 1, y: 0 }}
                      transition={{ delay: 0.7 }}
                      className="bg-[#0c0e14] border border-white/5 rounded-xl p-3 col-span-2"
                    >
                      <div className="flex items-center justify-between mb-1.5">
                        <span className="text-[10px] text-gray-500">FearProject сервера</span>
                        <Globe className="w-3.5 h-3.5 text-[#38bdf8]" />
                      </div>
                      <div className="h-2 bg-[#1a1f2e] rounded-full overflow-hidden mb-1.5">
                        <div className="h-full w-3/4 bg-gradient-to-r from-[#4f7cff] to-[#38bdf8] rounded-full" />
                      </div>
                      <div className="flex justify-between text-[10px] text-gray-400">
                        <span>Онлайн</span>
                        <span>Заполненность</span>
                      </div>
                    </motion.div>
                  </div>

                  <div className="flex items-center gap-2 text-[10px] text-gray-500">
                    <Zap className="w-3.5 h-3.5 text-amber-400" />
                    <span>Данные обновляются в реальном времени через WebSocket</span>
                  </div>
                </div>
              </div>
            </motion.div>
          </div>
        </div>

        {/* Feature pills at bottom */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.5, delay: 0.6 }}
          className="mt-8 md:mt-10 flex flex-wrap items-center justify-center gap-2 max-w-3xl"
        >
          {featurePills.map((pill, i) => (
            <motion.div
              key={pill.text}
              initial={{ opacity: 0, scale: 0.9 }}
              animate={{ opacity: 1, scale: 1 }}
              transition={{ delay: 0.7 + i * 0.05 }}
              className="flex items-center gap-1.5 px-3 py-1.5 rounded-full bg-[#12151e] border border-white/5 text-xs text-gray-400"
            >
              <pill.icon className="w-3.5 h-3.5 text-[#4f7cff]" />
              <span>{pill.text}</span>
            </motion.div>
          ))}
        </motion.div>

        {/* Tiny footer */}
        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          transition={{ delay: 1 }}
          className="mt-6 md:mt-8 text-[10px] text-gray-600 flex items-center gap-2"
        >
          <Eye className="w-3 h-3" />
          <span>© {new Date().getFullYear()} FearSearch Staff Panel — только для авторизованного стаффа</span>
        </motion.div>
      </section>
    </div>
  );
}
