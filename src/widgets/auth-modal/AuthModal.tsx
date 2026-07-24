import React, { useState } from 'react';
import { motion, AnimatePresence } from 'motion/react';
import {
  Zap,
  Lock,
  Mail,
  User,
  Eye,
  EyeOff,
  ArrowRight,
  X,
  Sparkles,
  Radio,
  ShieldCheck,
  Headphones,
  Activity,
  AtSign,
  UserCheck,
  KeyRound,
  CheckCircle2,
  RefreshCw,
  Inbox,
  Check
} from 'lucide-react';
import { useUserStore } from '../../entities/user/userStore';

export const AuthModal: React.FC = () => {
  const {
    isAuthenticated,
    authModalOpen,
    authMode,
    setAuthModalOpen,
    loginAccountServer,
    registerAccountServer,
    verifyCodeServer,
    pendingVerification,
    currentUser,
    loginAsGuest
  } = useUserStore();

  const [mode, setMode] = useState<'login' | 'register' | 'forgot'>(authMode || 'login');
  const [showPassword, setShowPassword] = useState(false);
  const [rememberMe, setRememberMe] = useState(true);

  const handleRememberMeChange = React.useCallback((checked: boolean) => {
    setRememberMe(checked);
    try {
      localStorage.setItem('pulse_remember_me_v2', checked ? 'true' : 'false');
    } catch (e) {}
  }, []);

  // Form input state
  const [loginInput, setLoginInput] = useState('');
  const [displayNameInput, setDisplayNameInput] = useState('');
  const [emailInput, setEmailInput] = useState('');
  const [passwordInput, setPasswordInput] = useState('');

  // Password Reset state
  const [resetStep, setResetStep] = useState<1 | 2>(1);
  const [resetLoginOrEmail, setResetLoginOrEmail] = useState('');
  const [resetCodeInput, setResetCodeInput] = useState('');
  const [resetNewPasswordInput, setResetNewPasswordInput] = useState('');
  const [resetTargetLogin, setResetTargetLogin] = useState('');
  const [resetDemoCode, setResetDemoCode] = useState<string | undefined>(undefined);

  // 6-digit code verification state
  const [verificationCodeInput, setVerificationCodeInput] = useState('');

  const [error, setError] = useState<string | null>(null);
  const [infoMessage, setInfoMessage] = useState<string | null>(null);
  const [isLoading, setIsLoading] = useState(false);

  const {
    resetPasswordRequestServer,
    resetPasswordConfirmServer,
    resendCodeServer
  } = useUserStore();

  const handleResendCode = async () => {
    if (!pendingVerification?.login) return;
    setIsLoading(true);
    setError(null);
    setInfoMessage(null);
    const res = await resendCodeServer(pendingVerification.login);
    setIsLoading(false);
    if (!res.success && res.error) {
      setError(res.error);
    } else {
      setInfoMessage(res.message || 'Новый 6-значный код сформирован!');
    }
  };

  const isVisible = !isAuthenticated || authModalOpen || !!pendingVerification;
  
  const handleModeSwitch = React.useCallback((newMode: 'login' | 'register' | 'forgot') => {
    setMode(newMode);
    setResetStep(1);
    setError(null);
    setInfoMessage(null);
  }, []);

  if (!isVisible) return null;

  const handleResetRequest = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!resetLoginOrEmail.trim()) {
      setError('Укажите ваш логин или email');
      return;
    }

    setIsLoading(true);
    setError(null);
    setInfoMessage(null);

    const res = await resetPasswordRequestServer(resetLoginOrEmail.trim());
    setIsLoading(false);

    if (!res.success && res.error) {
      setError(res.error);
    } else {
      setResetTargetLogin(res.login || resetLoginOrEmail.trim());
      setResetDemoCode(res.demoCode);
      setResetStep(2);
      setInfoMessage(`Код сброса отправлен на ${res.email}!`);
    }
  };

  const handleResetConfirm = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!resetCodeInput.trim()) {
      setError('Введите 6-значный код из письма');
      return;
    }
    if (!resetNewPasswordInput || resetNewPasswordInput.length < 3) {
      setError('Пароль должен быть не менее 3 символов');
      return;
    }

    setIsLoading(true);
    setError(null);
    setInfoMessage(null);

    const res = await resetPasswordConfirmServer(
      resetTargetLogin,
      resetCodeInput.trim(),
      resetNewPasswordInput
    );
    setIsLoading(false);

    if (!res.success && res.error) {
      setError(res.error);
    } else {
      setInfoMessage('Пароль успешно обновлён! Войдите с новым паролем.');
      setMode('login');
      setPasswordInput(resetNewPasswordInput);
      if (resetTargetLogin) setLoginInput(resetTargetLogin);
    }
  };

  const handleVerifySubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!pendingVerification) return;

    if (!verificationCodeInput.trim() || verificationCodeInput.trim().length < 4) {
      setError('Введите 6-значный код подтверждения');
      return;
    }

    setIsLoading(true);
    setError(null);

    const res = await verifyCodeServer(pendingVerification.login, verificationCodeInput);
    setIsLoading(false);

    if (!res.success && res.error) {
      setError(res.error);
    } else {
      setInfoMessage('Аккаунт успешно подтверждён!');
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError(null);
    setInfoMessage(null);

    if (mode === 'login') {
      if (!loginInput.trim()) {
        setError('Введите ваш Уникальный Логин');
        return;
      }
      if (!passwordInput) {
        setError('Введите пароль');
        return;
      }

      setIsLoading(true);
      const res = await loginAccountServer(loginInput, passwordInput);
      setIsLoading(false);

      if (!res.success && res.error) {
        setError(res.error);
      } else if (res.requireVerification) {
        setInfoMessage(res.message || `Код подтверждения входа отправлен на ${res.email}!`);
      }
    } else {
      if (!loginInput.trim()) {
        setError('Укажите уникальный Логин (ID)');
        return;
      }
      if (loginInput.trim().length < 3) {
        setError('Логин должен состоять минимум из 3 символов');
        return;
      }
      if (!displayNameInput.trim()) {
        setError('Укажите отображаемое Имя профиля (Никнейм)');
        return;
      }
      if (!emailInput.trim() || !emailInput.includes('@')) {
        setError('Введите корректный Email адрес');
        return;
      }
      if (passwordInput.length < 3) {
        setError('Пароль должен быть не менее 3 символов');
        return;
      }

      setIsLoading(true);
      const res = await registerAccountServer(
        loginInput,
        displayNameInput,
        passwordInput,
        emailInput
      );
      setIsLoading(false);

      if (!res.success && res.error) {
        setError(res.error);
      } else if (res.requireVerification) {
        setInfoMessage(`Код подтверждения отправлен на ${res.email}!`);
      }
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-[#070709] backdrop-blur-3xl select-none overflow-y-auto">
      {/* Cyber Tech Grid Background with Edge Fade */}
      <div 
        className="absolute inset-0 bg-[linear-gradient(to_right,#ffffff08_1px,transparent_1px),linear-gradient(to_bottom,#ffffff08_1px,transparent_1px)] bg-[size:40px_40px] pointer-events-none" 
        style={{ maskImage: 'radial-gradient(ellipse 70% 70% at 50% 50%, black 30%, transparent 100%)' }}
      />

      {/* Dynamic Animated Glowing Orbs */}
      <motion.div
        animate={{
          scale: [1, 1.25, 1],
          opacity: [0.2, 0.35, 0.2],
        }}
        transition={{ duration: 8, repeat: Infinity, ease: 'easeInOut' }}
        className="absolute top-1/4 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[600px] h-[600px] bg-gradient-to-tr from-[#22D3EE]/25 via-blue-600/15 to-purple-600/20 rounded-full blur-[140px] pointer-events-none"
      />
      <motion.div
        animate={{
          scale: [1, 1.2, 1],
          opacity: [0.15, 0.3, 0.15],
        }}
        transition={{ duration: 10, repeat: Infinity, ease: 'easeInOut', delay: 2 }}
        className="absolute bottom-10 right-1/4 w-[450px] h-[450px] bg-gradient-to-bl from-purple-600/20 via-indigo-600/15 to-cyan-500/15 rounded-full blur-[120px] pointer-events-none"
      />
      <motion.div
        animate={{
          scale: [1.1, 1, 1.1],
          opacity: [0.1, 0.25, 0.1],
        }}
        transition={{ duration: 9, repeat: Infinity, ease: 'easeInOut', delay: 4 }}
        className="absolute top-10 left-10 w-[380px] h-[380px] bg-cyan-400/15 rounded-full blur-[110px] pointer-events-none"
      />

      {/* Decorative Cyber Rings & Rays */}
      <div className="absolute inset-0 pointer-events-none overflow-hidden flex items-center justify-center">
        <div className="w-[800px] h-[800px] rounded-full border border-white/[0.03] animate-[spin_60s_linear_infinite]" />
        <div className="w-[1100px] h-[1100px] rounded-full border border-cyan-500/[0.03] animate-[spin_90s_linear_infinite_reverse]" />
      </div>

      {/* Decorative Ambient Gaming Badges in Background */}
      <div className="absolute inset-0 pointer-events-none hidden lg:block overflow-hidden">
        {/* Floating Tag Top Left */}
        <motion.div
          initial={{ opacity: 0, x: -30 }}
          animate={{ opacity: 0.7, x: 0 }}
          transition={{ duration: 0.8, delay: 0.2 }}
          className="absolute top-20 left-20 px-4 py-2.5 rounded-2xl bg-[#131317]/80 border border-[#22D3EE]/30 backdrop-blur-xl flex items-center gap-3 shadow-[0_0_25px_rgba(34,211,238,0.2)] text-[#22D3EE] text-xs font-mono font-bold"
        >
          <Radio className="w-4 h-4 animate-pulse text-[#22D3EE]" />
          <span>Low Latency Voice Engine</span>
        </motion.div>

        {/* Floating Tag Bottom Left */}
        <motion.div
          initial={{ opacity: 0, x: -30 }}
          animate={{ opacity: 0.6, x: 0 }}
          transition={{ duration: 0.8, delay: 0.4 }}
          className="absolute bottom-24 left-24 px-4 py-2.5 rounded-2xl bg-[#131317]/80 border border-emerald-500/30 backdrop-blur-xl flex items-center gap-3 shadow-[0_0_25px_rgba(16,185,129,0.15)] text-emerald-400 text-xs font-mono font-bold"
        >
          <ShieldCheck className="w-4 h-4" />
          <span>Encrypted Pulse Session</span>
        </motion.div>

        {/* Floating Tag Top Right */}
        <motion.div
          initial={{ opacity: 0, x: 30 }}
          animate={{ opacity: 0.7, x: 0 }}
          transition={{ duration: 0.8, delay: 0.3 }}
          className="absolute top-24 right-20 px-4 py-2.5 rounded-2xl bg-[#131317]/80 border border-purple-500/30 backdrop-blur-xl flex items-center gap-3 shadow-[0_0_25px_rgba(168,85,247,0.2)] text-purple-300 text-xs font-mono font-bold"
        >
          <Headphones className="w-4 h-4 text-purple-400" />
          <span>Opus Spatial Audio</span>
        </motion.div>

        {/* Floating Tag Bottom Right */}
        <motion.div
          initial={{ opacity: 0, x: 30 }}
          animate={{ opacity: 0.6, x: 0 }}
          transition={{ duration: 0.8, delay: 0.5 }}
          className="absolute bottom-20 right-24 px-4 py-2.5 rounded-2xl bg-[#131317]/80 border border-cyan-500/30 backdrop-blur-xl flex items-center gap-3 shadow-[0_0_25px_rgba(34,211,238,0.15)] text-[#F5F5F7] text-xs font-mono font-bold"
        >
          <Zap className="w-4 h-4 text-[#22D3EE]" />
          <span>Instant Login Access</span>
        </motion.div>
      </div>

      {/* Main Auth Card */}
      <motion.div
        layout
        transition={{
          layout: { duration: 0.3, ease: [0.16, 1, 0.3, 1] }
        }}
        className="relative w-full max-w-md bg-[#131317]/90 border border-white/[0.14] rounded-3xl shadow-[0_0_80px_rgba(34,211,238,0.15),0_20px_50px_rgba(0,0,0,0.9)] p-6 sm:p-8 overflow-hidden z-10 my-auto backdrop-blur-2xl"
      >
        {/* Top cyan gradient accent bar */}
        <div className="absolute top-0 left-0 right-0 h-1 bg-gradient-to-r from-cyan-500 via-[#22D3EE] to-purple-500 shadow-[0_0_15px_#22D3EE]" />

        {/* Close Button if user is logged in and opened manually */}
        {isAuthenticated && !pendingVerification && (
          <button
            type="button"
            onClick={() => setAuthModalOpen(false)}
            className="absolute top-4 right-4 z-20 p-2 rounded-full bg-[#17171C] hover:bg-white/10 text-[#A1A1AA] hover:text-[#F5F5F7] transition-all border border-white/[0.08] cursor-pointer"
          >
            <X className="w-4 h-4" />
          </button>
        )}

        {/* Header Branding */}
        <motion.div layout className="flex flex-col items-center text-center mb-5">
          <div className="w-12 h-12 rounded-2xl bg-[#22D3EE]/10 border border-[#22D3EE]/30 flex items-center justify-center text-[#22D3EE] mb-3 shadow-[0_0_25px_rgba(34,211,238,0.35)]">
            <Zap className="w-6 h-6 fill-[#22D3EE]" />
          </div>
          <h2 className="text-xl font-black text-[#F5F5F7] tracking-tight flex items-center gap-2">
            PULSE
            <span className="text-[10px] uppercase font-mono px-2 py-0.5 rounded-full bg-[#22D3EE]/20 text-[#22D3EE] border border-[#22D3EE]/30">
              PULSE AUTH
            </span>
          </h2>
          <p className="text-xs text-[#A1A1AA] mt-1">
            {mode === 'login'
              ? 'Войдите под своим логином и паролем'
              : mode === 'register'
              ? 'Зарегистрируйте аккаунт для доступа в Pulse'
              : 'Восстановление пароля временно недоступно'}
          </p>
        </motion.div>

        {/* Error / Info Alerts */}
        <AnimatePresence>
          {error && (
            <motion.div
              initial={{ opacity: 0, y: -6 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: -6 }}
              className="mb-4 p-3 rounded-xl bg-rose-500/10 border border-rose-500/30 text-rose-300 text-xs font-medium flex items-center gap-2"
            >
              <div className="w-1.5 h-1.5 rounded-full bg-rose-500 animate-ping flex-shrink-0" />
              <span>{error}</span>
            </motion.div>
          )}

          {infoMessage && (
            <motion.div
              initial={{ opacity: 0, y: -6 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: -6 }}
              className="mb-4 p-3 rounded-xl bg-[#22D3EE]/10 border border-[#22D3EE]/30 text-[#22D3EE] text-xs font-medium flex items-center gap-2"
            >
              <CheckCircle2 className="w-4 h-4 flex-shrink-0" />
              <span>{infoMessage}</span>
            </motion.div>
          )}
        </AnimatePresence>

        {/* PENDING VERIFICATION SCREEN */}
        {pendingVerification ? (
          <motion.form
            initial={{ opacity: 0, scale: 0.98 }}
            animate={{ opacity: 1, scale: 1 }}
            onSubmit={handleVerifySubmit}
            className="space-y-4"
          >
            <div className="p-4 rounded-2xl bg-[#0C0C0E]/90 border border-white/[0.08] text-center space-y-2.5 shadow-inner">
              <div className="flex items-center justify-center gap-2 text-[#22D3EE] text-xs font-bold">
                <Mail className="w-4 h-4" />
                <span>Запрос кода авторизации для:</span>
              </div>
              <div className="text-xs font-mono font-bold text-[#F5F5F7] bg-white/[0.06] py-1.5 px-3 rounded-xl inline-block border border-white/[0.08] shadow-sm">
                {pendingVerification.email}
              </div>

              {pendingVerification.realSent ? (
                <div className="pt-2 border-t border-white/[0.06] flex flex-col items-center gap-1">
                  <p className="text-[11px] text-emerald-400 font-medium leading-relaxed flex items-center gap-1.5">
                    <CheckCircle2 className="w-3.5 h-3.5" />
                    <span>Письмо отправлено на вашу личную почту!</span>
                  </p>
                  <p className="text-[10px] text-[#A1A1AA]">
                    Проверьте папку «Входящие» или «Спам».
                  </p>
                </div>
              ) : (
                <div className="pt-2.5 border-t border-white/[0.06] flex flex-col items-center gap-2">
                  <div className="p-3 rounded-xl bg-cyan-500/10 border border-cyan-500/30 text-left w-full space-y-2">
                    <div className="flex items-center justify-between text-[#22D3EE] text-[11px] font-bold">
                      <span className="flex items-center gap-1.5">
                        <Sparkles className="w-3.5 h-3.5" />
                        <span>Код верификации (Тестовый режим):</span>
                      </span>
                    </div>

                    {pendingVerification.devCode && (
                      <div className="flex items-center justify-between gap-2 bg-[#111113] p-2 rounded-xl border border-[#22D3EE]/40">
                        <span className="font-mono text-base font-black text-[#22D3EE] tracking-[4px] pl-1">
                          {pendingVerification.devCode}
                        </span>
                        <button
                          type="button"
                          onClick={() => setVerificationCodeInput(pendingVerification.devCode!)}
                          className="px-3 py-1.5 text-[10px] font-bold bg-[#22D3EE] text-[#09090B] rounded-lg hover:bg-cyan-300 transition-all cursor-pointer shadow-[0_0_10px_rgba(34,211,238,0.3)] active:scale-95"
                        >
                          Вставить код
                        </button>
                      </div>
                    )}

                    {pendingVerification.smtpError && (
                      <p className="text-[10px] text-amber-300/80 leading-snug">
                        ℹ️ SMTP недоступен ({pendingVerification.smtpError}). Используйте код выше.
                      </p>
                    )}
                  </div>
                </div>
              )}
            </div>

            <div>
              <label className="text-[11px] font-bold text-[#A1A1AA] mb-1 block uppercase tracking-wider">
                6-значный код подтверждения
              </label>
              <div className="relative">
                <div className="absolute inset-y-0 left-0 pl-3.5 flex items-center pointer-events-none text-[#22D3EE]">
                  <KeyRound className="w-4 h-4" />
                </div>
                <input
                  type="text"
                  maxLength={6}
                  value={verificationCodeInput}
                  onChange={(e) => setVerificationCodeInput(e.target.value)}
                  placeholder="849201"
                  className="w-full bg-[#111113] border border-white/[0.08] focus:border-[#22D3EE] rounded-2xl pl-10 pr-4 py-2.5 text-sm font-mono font-bold text-[#F5F5F7] placeholder-[#A1A1AA]/30 focus:outline-none focus:ring-1 focus:ring-[#22D3EE] transition-all tracking-widest text-center"
                />
              </div>
            </div>

            <div className="flex items-center justify-between pt-1">
              <button
                type="button"
                onClick={handleResendCode}
                disabled={isLoading}
                className="text-[11px] text-[#22D3EE] hover:underline cursor-pointer flex items-center gap-1 font-semibold disabled:opacity-50"
              >
                <RefreshCw className={`w-3 h-3 ${isLoading ? 'animate-spin' : ''}`} />
                <span>Отправить повторно</span>
              </button>

              <button
                type="button"
                onClick={() => useUserStore.setState({ pendingVerification: null })}
                className="text-[11px] text-[#A1A1AA] hover:text-[#F5F5F7] cursor-pointer"
              >
                Вернуться к входу
              </button>
            </div>

            <div className="flex items-center justify-center pt-1">
              <button
                type="button"
                onClick={() => handleRememberMeChange(!rememberMe)}
                className="flex items-center gap-2 text-[#A1A1AA] hover:text-[#F5F5F7] cursor-pointer select-none group"
              >
                <div
                  className={`w-4 h-4 rounded-md flex items-center justify-center transition-all border ${
                    rememberMe
                      ? 'bg-[#22D3EE] border-[#22D3EE] text-[#09090B] shadow-[0_0_10px_rgba(34,211,238,0.4)]'
                      : 'bg-[#111113] border-white/20 group-hover:border-[#22D3EE]/50'
                  }`}
                >
                  {rememberMe && <Check className="w-3 h-3 stroke-[3]" />}
                </div>
                <span className="text-[11px] font-medium">Запомнить меня на этом устройстве</span>
              </button>
            </div>

            <button
              type="submit"
              disabled={isLoading}
              className="w-full py-3 rounded-2xl bg-[#22D3EE] hover:bg-[#06b6d4] text-[#09090B] font-bold text-xs uppercase tracking-wider shadow-[0_0_20px_rgba(34,211,238,0.25)] transition-all flex items-center justify-center gap-2 cursor-pointer active:scale-95 disabled:opacity-50"
            >
              {isLoading ? (
                <div className="w-4 h-4 border-2 border-[#09090B] border-t-transparent rounded-full animate-spin" />
              ) : (
                <>
                  <CheckCircle2 className="w-4 h-4" />
                  <span>Подтвердить и войти</span>
                </>
              )}
            </button>
          </motion.form>
        ) : (
          /* STANDARD LOGIN / REGISTER FORM */
          <>
            {/* Mode Switch Tabs */}
            <motion.div layout className="flex p-1 bg-[#111113] border border-white/[0.08] rounded-2xl mb-5">
              <button
                type="button"
                onClick={() => handleModeSwitch('login')}
                className={`flex-1 py-2 text-xs font-bold rounded-xl transition-all duration-200 cursor-pointer ${
                  mode === 'login'
                    ? 'bg-[#22D3EE] text-[#09090B] shadow-[0_0_15px_rgba(34,211,238,0.35)]'
                    : 'text-[#A1A1AA] hover:text-[#F5F5F7]'
                }`}
              >
                Вход
              </button>
              <button
                type="button"
                onClick={() => handleModeSwitch('register')}
                className={`flex-1 py-2 text-xs font-bold rounded-xl transition-all duration-200 cursor-pointer ${
                  mode === 'register'
                    ? 'bg-[#22D3EE] text-[#09090B] shadow-[0_0_15px_rgba(34,211,238,0.35)]'
                    : 'text-[#A1A1AA] hover:text-[#F5F5F7]'
                }`}
              >
                Регистрация
              </button>
              <button
                type="button"
                onClick={() => handleModeSwitch('forgot')}
                className={`flex-1 py-2 text-xs font-bold rounded-xl transition-all duration-200 cursor-pointer ${
                  mode === 'forgot'
                    ? 'bg-[#22D3EE] text-[#09090B] shadow-[0_0_15px_rgba(34,211,238,0.35)]'
                    : 'text-[#A1A1AA] hover:text-[#F5F5F7]'
                }`}
              >
                Забыли пароль?
              </button>
            </motion.div>

            {mode === 'forgot' ? (
              /* PASSWORD RESET DISABLED NOTICE */
              <div className="p-4 rounded-2xl bg-[#0C0C0E]/90 border border-white/[0.08] text-center space-y-3 shadow-inner">
                <div className="w-10 h-10 rounded-xl bg-amber-500/10 border border-amber-500/30 flex items-center justify-center text-amber-400 mx-auto">
                  <Lock className="w-5 h-5" />
                </div>
                <h3 className="text-xs font-bold text-[#F5F5F7] uppercase tracking-wider">
                  Восстановление пароля пока недоступно
                </h3>
                <p className="text-[11px] text-[#A1A1AA] leading-relaxed">
                  Сброс пароля временно отключен. Вы можете войти в созданный аккаунт по логину и паролю или зарегистрировать новый аккаунт.
                </p>
                <button
                  type="button"
                  onClick={() => handleModeSwitch('login')}
                  className="w-full py-2.5 rounded-xl bg-[#22D3EE] text-[#09090B] font-bold text-xs hover:bg-[#06b6d4] transition-all cursor-pointer"
                >
                  Вернуться к форме входа
                </button>
              </div>
            ) : (
              <form onSubmit={handleSubmit} className="space-y-3.5">
                <AnimatePresence mode="wait">
                  <motion.div
                    key={mode}
                    initial={{ opacity: 0, y: 6 }}
                    animate={{ opacity: 1, y: 0 }}
                    exit={{ opacity: 0, y: -6 }}
                    transition={{ duration: 0.2 }}
                    className="space-y-3.5"
                  >
                    {/* Unique Login Input */}
                    <div>
                      <div className="flex items-center justify-between mb-1">
                        <label className="text-[11px] font-bold text-[#A1A1AA] uppercase tracking-wider flex items-center gap-1">
                          <AtSign className="w-3 h-3 text-[#22D3EE]" />
                          Уникальный Логин
                        </label>
                        <span className="text-[10px] text-[#A1A1AA]/60">для входа на любом ПК</span>
                      </div>
                      <div className="relative">
                        <div className="absolute inset-y-0 left-0 pl-3.5 flex items-center pointer-events-none text-[#22D3EE]">
                          @
                        </div>
                        <input
                          type="text"
                          value={loginInput}
                          onChange={(e) => setLoginInput(e.target.value.replace(/\s+/g, ''))}
                          placeholder="alex_squad"
                          className="w-full bg-[#111113] border border-white/[0.08] focus:border-[#22D3EE] rounded-2xl pl-8 pr-4 py-2.5 text-xs text-[#F5F5F7] placeholder-[#A1A1AA]/40 focus:outline-none focus:ring-1 focus:ring-[#22D3EE] transition-all font-mono"
                        />
                      </div>
                    </div>

                    {/* Display Name Input (Register Only) */}
                    {mode === 'register' && (
                      <motion.div
                        initial={{ opacity: 0, height: 0 }}
                        animate={{ opacity: 1, height: 'auto' }}
                        exit={{ opacity: 0, height: 0 }}
                        transition={{ duration: 0.2 }}
                      >
                        <div className="flex items-center justify-between mb-1">
                          <label className="text-[11px] font-bold text-[#A1A1AA] uppercase tracking-wider flex items-center gap-1">
                            <User className="w-3 h-3 text-[#22D3EE]" />
                            Имя профиля (Никнейм)
                          </label>
                        </div>
                        <div className="relative">
                          <div className="absolute inset-y-0 left-0 pl-3.5 flex items-center pointer-events-none text-[#A1A1AA]">
                            <UserCheck className="w-4 h-4" />
                          </div>
                          <input
                            type="text"
                            value={displayNameInput}
                            onChange={(e) => setDisplayNameInput(e.target.value)}
                            placeholder="Алексей (Sniper)"
                            className="w-full bg-[#111113] border border-white/[0.08] focus:border-[#22D3EE] rounded-2xl pl-10 pr-4 py-2.5 text-xs text-[#F5F5F7] placeholder-[#A1A1AA]/40 focus:outline-none focus:ring-1 focus:ring-[#22D3EE] transition-all"
                          />
                        </div>
                      </motion.div>
                    )}

                    {/* Email Input (Register Only) */}
                    {mode === 'register' && (
                      <motion.div
                        initial={{ opacity: 0, height: 0 }}
                        animate={{ opacity: 1, height: 'auto' }}
                        exit={{ opacity: 0, height: 0 }}
                        transition={{ duration: 0.2 }}
                      >
                        <label className="text-[11px] font-bold text-[#A1A1AA] mb-1 block uppercase tracking-wider">
                          Email для подтверждения
                        </label>
                        <div className="relative">
                          <div className="absolute inset-y-0 left-0 pl-3.5 flex items-center pointer-events-none text-[#A1A1AA]">
                            <Mail className="w-4 h-4" />
                          </div>
                          <input
                            type="email"
                            value={emailInput}
                            onChange={(e) => setEmailInput(e.target.value)}
                            placeholder="friend@pulse.gg"
                            className="w-full bg-[#111113] border border-white/[0.08] focus:border-[#22D3EE] rounded-2xl pl-10 pr-4 py-2.5 text-xs text-[#F5F5F7] placeholder-[#A1A1AA]/40 focus:outline-none focus:ring-1 focus:ring-[#22D3EE] transition-all"
                          />
                        </div>
                      </motion.div>
                    )}

                    {/* Password Input */}
                    <div>
                      <div className="flex items-center justify-between mb-1">
                        <label className="text-[11px] font-bold text-[#A1A1AA] uppercase tracking-wider">
                          Пароль
                        </label>
                      </div>
                      <div className="relative">
                        <div className="absolute inset-y-0 left-0 pl-3.5 flex items-center pointer-events-none text-[#A1A1AA]">
                          <Lock className="w-4 h-4" />
                        </div>
                        <input
                          type={showPassword ? 'text' : 'password'}
                          value={passwordInput}
                          onChange={(e) => setPasswordInput(e.target.value)}
                          placeholder="••••••••"
                          className="w-full bg-[#111113] border border-white/[0.08] focus:border-[#22D3EE] rounded-2xl pl-10 pr-10 py-2.5 text-xs text-[#F5F5F7] placeholder-[#A1A1AA]/40 focus:outline-none focus:ring-1 focus:ring-[#22D3EE] transition-all"
                        />
                        <button
                          type="button"
                          onClick={() => setShowPassword(!showPassword)}
                          className="absolute inset-y-0 right-0 pr-3.5 flex items-center text-[#A1A1AA] hover:text-[#F5F5F7] cursor-pointer"
                        >
                          {showPassword ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
                        </button>
                      </div>
                    </div>

                    {/* Remember Me & Forgot Password Options */}
                    <div className="flex items-center justify-between pt-1">
                      <button
                        type="button"
                        onClick={() => handleRememberMeChange(!rememberMe)}
                        className="flex items-center gap-2 text-[#A1A1AA] hover:text-[#F5F5F7] cursor-pointer select-none group"
                      >
                        <div
                          className={`w-4 h-4 rounded-md flex items-center justify-center transition-all border ${
                            rememberMe
                              ? 'bg-[#22D3EE] border-[#22D3EE] text-[#09090B] shadow-[0_0_10px_rgba(34,211,238,0.4)]'
                              : 'bg-[#111113] border-white/20 group-hover:border-[#22D3EE]/50'
                          }`}
                        >
                          {rememberMe && <Check className="w-3 h-3 stroke-[3]" />}
                        </div>
                        <span className="text-[11px] font-medium">Запомнить меня</span>
                      </button>

                      {mode === 'login' && (
                        <button
                          type="button"
                          onClick={() => handleModeSwitch('forgot')}
                          className="text-[11px] text-[#22D3EE] hover:underline cursor-pointer font-semibold"
                        >
                          Забыли пароль?
                        </button>
                      )}
                    </div>
                  </motion.div>
                </AnimatePresence>

                {/* Action Submit Button */}
                <motion.button
                  layout
                  type="submit"
                  disabled={isLoading}
                  className="w-full py-3 rounded-2xl bg-[#22D3EE] hover:bg-[#06b6d4] text-[#09090B] font-bold text-xs uppercase tracking-wider shadow-[0_0_20px_rgba(34,211,238,0.25)] transition-all flex items-center justify-center gap-2 mt-4 active:scale-95 disabled:opacity-50 cursor-pointer"
                >
                  {isLoading ? (
                    <div className="w-4 h-4 border-2 border-[#09090B] border-t-transparent rounded-full animate-spin" />
                  ) : (
                    <>
                      <span>
                        {mode === 'login' ? 'Войти в аккаунт' : 'Зарегистрироваться'}
                      </span>
                      <ArrowRight className="w-4 h-4" />
                    </>
                  )}
                </motion.button>

                {/* Quick Guest Temporary Account Button */}
                <div className="pt-3.5 border-t border-white/[0.08] mt-4 space-y-1.5">
                  <button
                    type="button"
                    onClick={() => loginAsGuest()}
                    className="w-full py-2.5 rounded-2xl bg-[#18181B] hover:bg-[#222226] border border-white/[0.12] hover:border-[#22D3EE]/40 text-[#F5F5F7] font-bold text-xs flex items-center justify-center gap-2 transition-all cursor-pointer group shadow-sm active:scale-95"
                  >
                    <Sparkles className="w-4 h-4 text-[#22D3EE] group-hover:scale-110 transition-transform" />
                    <span>Быстрый вход как Гость (Временный аккаунт)</span>
                  </button>
                  <p className="text-[10px] text-center text-[#A1A1AA]/60">
                    ⚡ Вход в 1 клик без логина и пароля
                  </p>
                </div>
              </form>
            )}
          </>
        )}
      </motion.div>
    </div>
  );
};
