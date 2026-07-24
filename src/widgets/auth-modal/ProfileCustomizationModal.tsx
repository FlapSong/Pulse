import React, { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'motion/react';
import {
  X,
  User,
  Image as ImageIcon,
  Check,
  Sparkles,
  Shield,
  Tag,
  Smile,
  Zap,
  CheckCircle2,
  Camera,
  AtSign,
  Upload
} from 'lucide-react';
import { useUserStore } from '../../entities/user/userStore';

const PRESET_AVATARS = [
  {
    name: 'Cyberpunk Neon',
    url: 'https://images.unsplash.com/photo-1566492031773-4f4e44671857?w=300&auto=format&fit=crop&q=80'
  },
  {
    name: 'Gamer Girl',
    url: 'https://images.unsplash.com/photo-1534528741775-53994a69daeb?w=300&auto=format&fit=crop&q=80'
  },
  {
    name: 'Tactical Operative',
    url: 'https://images.unsplash.com/photo-1507003211169-0a1dd7228f2d?w=300&auto=format&fit=crop&q=80'
  },
  {
    name: 'Synth Samurai',
    url: 'https://images.unsplash.com/photo-1539571696357-5a69c17a67c6?w=300&auto=format&fit=crop&q=80'
  },
  {
    name: 'Neon Tech',
    url: 'https://images.unsplash.com/photo-1517841905240-472988babdf9?w=300&auto=format&fit=crop&q=80'
  },
  {
    name: 'Cyber Assassin',
    url: 'https://images.unsplash.com/photo-1522075469751-3a6694fb2f61?w=300&auto=format&fit=crop&q=80'
  }
];

const PRESET_BADGES = [
  'CYAN SQUAD',
  'PULSE PRO',
  'VIP GAMER',
  'SQUAD LEADER',
  'TOP FRAGGER',
  'STREAMER'
];

const PRESET_STATUSES = [
  '⚡ В сети в Pulse',
  '🎮 Играет в CS2 / Valorant',
  '🎧 Слушает чилл лоу-фай',
  '🔴 На стриме (Twitch)',
  '💤 Отошел / Не беспокоить'
];

export const ProfileCustomizationModal: React.FC = () => {
  const {
    currentUser,
    profileModalOpen,
    setProfileModalOpen,
    updateProfileServer
  } = useUserStore();

  const [displayName, setDisplayName] = useState(currentUser.displayName || '');
  const [avatar, setAvatar] = useState(currentUser.avatar || '');
  const [isDragging, setIsDragging] = useState(false);

  const [isLoading, setIsLoading] = useState(false);
  const [successMsg, setSuccessMsg] = useState<string | null>(null);
  const [errorMsg, setErrorMsg] = useState<string | null>(null);

  // Sync state when modal opens or user changes
  useEffect(() => {
    if (profileModalOpen) {
      setDisplayName(currentUser.displayName || '');
      setAvatar(currentUser.avatar || '');
      setSuccessMsg(null);
      setErrorMsg(null);
    }
  }, [profileModalOpen, currentUser]);

  if (!profileModalOpen) return null;

  const handleDragOver = (e: React.DragEvent) => {
    e.preventDefault();
    setIsDragging(true);
  };

  const handleDragLeave = () => {
    setIsDragging(false);
  };

  const handleDrop = (e: React.DragEvent) => {
    e.preventDefault();
    setIsDragging(false);
    if (e.dataTransfer.files && e.dataTransfer.files[0]) {
      handleFileChange(e.dataTransfer.files[0]);
    }
  };

  const handleFileChange = (file: File) => {
    if (!file) return;
    if (!file.type.startsWith('image/')) {
      setErrorMsg('Пожалуйста, выберите файл изображения');
      return;
    }

    const reader = new FileReader();
    reader.onload = (event) => {
      const img = new Image();
      img.onload = () => {
        const canvas = document.createElement('canvas');
        const MAX_WIDTH = 200;
        const MAX_HEIGHT = 200;
        let width = img.width;
        let height = img.height;

        if (width > height) {
          if (width > MAX_WIDTH) {
            height *= MAX_WIDTH / width;
            width = MAX_WIDTH;
          }
        } else {
          if (height > MAX_HEIGHT) {
            width *= MAX_HEIGHT / height;
            height = MAX_HEIGHT;
          }
        }

        canvas.width = width;
        canvas.height = height;
        const ctx = canvas.getContext('2d');
        if (ctx) {
          ctx.drawImage(img, 0, 0, width, height);
          const dataUrl = canvas.toDataURL('image/jpeg', 0.85);
          setAvatar(dataUrl);
        }
      };
      img.src = event.target?.result as string;
    };
    reader.readAsDataURL(file);
  };

  const handleSave = async (e: React.FormEvent) => {
    e.preventDefault();
    setErrorMsg(null);
    setSuccessMsg(null);

    if (!displayName.trim()) {
      setErrorMsg('Отображаемое имя не может быть пустым');
      return;
    }

    setIsLoading(true);
    const res = await updateProfileServer({
      displayName: displayName.trim(),
      avatar: avatar.trim(),
      customStatus: currentUser.customStatus || '⚡ В сети в Pulse',
      badge: currentUser.badge || '',
      role: currentUser.role || ''
    });
    setIsLoading(false);

    if (!res.success && res.error) {
      setErrorMsg(res.error);
    } else {
      setSuccessMsg('Профиль успешно сохранен!');
      setTimeout(() => {
        setProfileModalOpen(false);
      }, 900);
    }
  };

  return (
    <AnimatePresence>
      <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-[#09090B]/90 backdrop-blur-xl select-none overflow-y-auto">
        <motion.div
          initial={{ opacity: 0, scale: 0.95, y: 15 }}
          animate={{ opacity: 1, scale: 1, y: 0 }}
          exit={{ opacity: 0, scale: 0.95, y: 15 }}
          transition={{ duration: 0.25, ease: [0.16, 1, 0.3, 1] }}
          className="relative w-full max-w-2xl bg-[#17171C] border border-white/[0.12] rounded-3xl shadow-[0_0_60px_rgba(0,0,0,0.9)] overflow-hidden my-auto"
        >
          {/* Accent Header Glow */}
          <div className="absolute top-0 left-0 right-0 h-1.5 bg-gradient-to-r from-[#22D3EE] via-purple-500 to-[#22D3EE]" />

          {/* Modal Header */}
          <div className="flex items-center justify-between p-6 border-b border-white/[0.08]">
            <div className="flex items-center gap-3">
              <div className="w-10 h-10 rounded-2xl bg-[#22D3EE]/10 border border-[#22D3EE]/30 flex items-center justify-center text-[#22D3EE]">
                <User className="w-5 h-5" />
              </div>
              <div>
                <h3 className="text-lg font-bold text-[#F5F5F7] tracking-tight flex items-center gap-2">
                  Кастомизация Профиля
                  <span className="text-[10px] font-mono font-bold px-2 py-0.5 rounded-full bg-[#22D3EE]/20 text-[#22D3EE] border border-[#22D3EE]/30">
                    LIVE PREVIEW
                  </span>
                </h3>
                <p className="text-xs text-[#A1A1AA]">
                  Измените отображаемое имя и аватарку своего игрового аккаунта
                </p>
              </div>
            </div>

            <button
              onClick={() => setProfileModalOpen(false)}
              className="p-2 rounded-xl bg-[#111113] hover:bg-white/10 text-[#A1A1AA] hover:text-[#F5F5F7] transition-all border border-white/[0.06] cursor-pointer"
            >
              <X className="w-5 h-5" />
            </button>
          </div>

          <div className="p-6 grid grid-cols-1 md:grid-cols-12 gap-6">
            {/* Left Column: Form Inputs */}
            <form onSubmit={handleSave} className="md:col-span-7 space-y-4">
              {errorMsg && (
                <div className="p-3 rounded-2xl bg-rose-500/10 border border-rose-500/30 text-rose-300 text-xs font-medium">
                  {errorMsg}
                </div>
              )}

              {successMsg && (
                <div className="p-3 rounded-2xl bg-emerald-500/10 border border-emerald-500/30 text-emerald-300 text-xs font-bold flex items-center gap-2">
                  <CheckCircle2 className="w-4 h-4 text-emerald-400" />
                  <span>{successMsg}</span>
                </div>
              )}

              {/* Display Name */}
              <div>
                <label className="text-[11px] font-bold text-[#A1A1AA] mb-1.5 block uppercase tracking-wider flex items-center gap-1.5">
                  <User className="w-3.5 h-3.5 text-[#22D3EE]" />
                  Отображаемое Имя
                </label>
                <input
                  type="text"
                  value={displayName}
                  onChange={(e) => setDisplayName(e.target.value)}
                  placeholder="Phantom Gamer"
                  className="w-full bg-[#111113] border border-white/[0.08] focus:border-[#22D3EE] rounded-2xl px-4 py-2.5 text-xs text-[#F5F5F7] focus:outline-none focus:ring-1 focus:ring-[#22D3EE] transition-all font-semibold"
                />
              </div>

              {/* Avatar File Upload & Presets */}
              <div className="space-y-3">
                <label className="text-[11px] font-bold text-[#A1A1AA] block uppercase tracking-wider flex items-center gap-1.5">
                  <Camera className="w-3.5 h-3.5 text-[#22D3EE]" />
                  Загрузка или выбор аватарки
                </label>

                {/* Drag and Drop Zone */}
                <div
                  onDragOver={handleDragOver}
                  onDragLeave={handleDragLeave}
                  onDrop={handleDrop}
                  onClick={() => document.getElementById('avatar-file-input')?.click()}
                  className={`border-2 border-dashed rounded-2xl p-4 text-center cursor-pointer transition-all flex flex-col items-center justify-center gap-1.5 ${
                    isDragging
                      ? 'border-[#22D3EE] bg-[#22D3EE]/5 text-[#22D3EE]'
                      : 'border-white/[0.08] bg-[#111113] hover:border-white/20 text-[#A1A1AA] hover:text-[#F5F5F7]'
                  }`}
                >
                  <input
                    type="file"
                    id="avatar-file-input"
                    accept="image/*"
                    onChange={(e) => {
                      if (e.target.files && e.target.files[0]) {
                        handleFileChange(e.target.files[0]);
                      }
                    }}
                    className="hidden"
                  />
                  <Upload className="w-6 h-6 stroke-[1.5]" />
                  <div className="text-xs font-bold">
                    Перетащите изображение сюда или кликните
                  </div>
                  <div className="text-[10px] opacity-60">
                    PNG, JPG, JPEG (автоматическое сжатие)
                  </div>
                </div>

                {/* Preset Avatars Grid */}
                <div>
                  <div className="text-[10px] font-bold text-[#A1A1AA] uppercase tracking-wider mb-2">
                    Или выберите готовый пресет:
                  </div>
                  <div className="grid grid-cols-6 gap-2">
                    {PRESET_AVATARS.map((av) => (
                      <button
                        key={av.url}
                        type="button"
                        onClick={() => setAvatar(av.url)}
                        className={`relative rounded-xl overflow-hidden aspect-square border-2 transition-all cursor-pointer group ${
                          avatar === av.url
                            ? 'border-[#22D3EE] scale-105 shadow-[0_0_12px_rgba(34,211,238,0.5)]'
                            : 'border-white/10 hover:border-white/30 opacity-70 hover:opacity-100'
                        }`}
                      >
                        <img src={av.url} alt={av.name} className="w-full h-full object-cover" />
                        {avatar === av.url && (
                          <div className="absolute inset-0 bg-[#22D3EE]/30 flex items-center justify-center text-[#09090B]">
                            <Check className="w-4 h-4 stroke-[3]" />
                          </div>
                        )}
                      </button>
                    ))}
                  </div>
                </div>

                {/* Custom Avatar URL Input (Alternative) */}
                <div className="space-y-1">
                  <div className="text-[10px] font-bold text-[#A1A1AA] uppercase tracking-wider">
                    Или укажите прямую ссылку на картинку:
                  </div>
                  <div className="relative">
                    <div className="absolute inset-y-0 left-0 pl-3.5 flex items-center pointer-events-none text-[#A1A1AA]">
                      <ImageIcon className="w-3.5 h-3.5" />
                    </div>
                    <input
                      type="text"
                      value={avatar.startsWith('data:') ? '' : avatar}
                      onChange={(e) => setAvatar(e.target.value)}
                      placeholder="https://images.unsplash.com/..."
                      className="w-full bg-[#111113] border border-white/[0.08] focus:border-[#22D3EE] rounded-2xl pl-9 pr-4 py-2 text-[11px] font-mono text-[#F5F5F7] focus:outline-none focus:ring-1 focus:ring-[#22D3EE] transition-all"
                    />
                  </div>
                </div>
              </div>

              {/* Submit Button */}
              <button
                type="submit"
                disabled={isLoading}
                className="w-full py-3 rounded-2xl bg-[#22D3EE] hover:bg-[#06b6d4] text-[#09090B] font-bold text-xs uppercase tracking-wider shadow-[0_0_20px_rgba(34,211,238,0.3)] transition-all flex items-center justify-center gap-2 mt-4 cursor-pointer active:scale-95 disabled:opacity-50"
              >
                {isLoading ? (
                  <div className="w-4 h-4 border-2 border-[#09090B] border-t-transparent rounded-full animate-spin" />
                ) : (
                  <>
                    <Sparkles className="w-4 h-4" />
                    <span>Сохранить изменения</span>
                  </>
                )}
              </button>
            </form>

            {/* Right Column: Live Card Preview */}
            <div className="md:col-span-5 flex flex-col items-center justify-center bg-[#111113] border border-white/[0.08] rounded-3xl p-5 relative overflow-hidden">
              <div className="absolute top-2 right-3 text-[10px] font-mono font-bold text-[#22D3EE] uppercase tracking-wider">
                Карточка Профиля
              </div>

              {/* Card Banner */}
              <div className="w-full h-20 rounded-2xl bg-gradient-to-r from-[#22D3EE]/30 via-purple-600/30 to-[#22D3EE]/20 border border-white/10 mb-[-32px] relative overflow-hidden flex items-center justify-center">
                <Zap className="w-12 h-12 text-[#22D3EE]/20" />
              </div>

              {/* Avatar Preview */}
              <div className="relative mb-3">
                <img
                  src={avatar || currentUser.avatar}
                  alt={displayName}
                  className="w-20 h-20 rounded-2xl object-cover border-4 border-[#17171C] shadow-2xl relative z-10"
                />
                <span className="absolute bottom-1 right-1 z-20 w-4 h-4 rounded-full bg-emerald-500 border-2 border-[#17171C]" />
              </div>

              {/* User Info Preview */}
              <div className="text-center space-y-1.5 z-10 w-full px-2">
                <div className="text-base font-bold text-[#F5F5F7] truncate">
                  {displayName || 'Ваше Имя'}
                </div>
                <div className="text-xs font-mono text-[#22D3EE] flex items-center justify-center gap-1">
                  <AtSign className="w-3 h-3" />
                  <span>{currentUser.username}</span>
                </div>

                <div className="flex items-center justify-center gap-1.5 pt-1 text-[11px] text-[#A1A1AA]">
                  <span className="w-2 h-2 rounded-full bg-emerald-500" />
                  <span>В сети в Pulse HQ</span>
                </div>
              </div>
            </div>
          </div>
        </motion.div>
      </div>
    </AnimatePresence>
  );
};
