import React, { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import {
  X,
  Coins,
  Sparkles,
  ShoppingBag,
  Check,
  Gift,
  KeyRound,
  ShieldCheck,
  Zap,
  Music,
  Disc,
  Lock,
} from 'lucide-react';
import confetti from 'canvas-confetti';
import {
  getPlayerEconomy,
  purchaseShopItem,
  redeemPromoCode,
  SHOP_CATALOG,
  ShopItem,
  formatCoins,
  PlayerEconomy,
} from '../../utils/economy';
import { getPlayerProfile, savePlayerProfile } from '../../firebase/auth';
import { AvatarDisplay } from '../common/AvatarDisplay';
import { soundEffects } from '../../utils/audio';
import { useMusic } from '../../context/MusicContext';

interface ShopModalProps {
  isOpen: boolean;
  onClose: () => void;
  onProfileUpdated?: () => void;
  onUpdateEconomy?: (economy: PlayerEconomy) => void;
}

export const ShopModal: React.FC<ShopModalProps> = ({
  isOpen,
  onClose,
  onProfileUpdated,
  onUpdateEconomy,
}) => {
  const { toggleTrackInPlaylist, equipTrack, refreshEconomyState } = useMusic();
  const [economy, setEconomy] = useState<PlayerEconomy>(() => getPlayerEconomy());
  const [currentAvatar, setCurrentAvatar] = useState<string>(() => getPlayerProfile().avatar);
  const [activeTab, setActiveTab] = useState<'avatars' | 'music'>('avatars');
  const [promoInput, setPromoInput] = useState<string>('');
  const [promoFeedback, setPromoFeedback] = useState<{
    type: 'success' | 'error';
    text: string;
  } | null>(null);

  useEffect(() => {
    if (isOpen) {
      const eco = getPlayerEconomy();
      setEconomy(eco);
      setCurrentAvatar(getPlayerProfile().avatar);
      setPromoFeedback(null);
      setPromoInput('');
    }
  }, [isOpen]);

  const handleBuy = (item: ShopItem) => {
    const res = purchaseShopItem(item.id);
    if (res.success) {
      soundEffects.victory();
      confetti({
        particleCount: 80,
        spread: 70,
        origin: { y: 0.6 },
      });
      const updatedEco = getPlayerEconomy();
      setEconomy(updatedEco);
      onUpdateEconomy?.(updatedEco);
      refreshEconomyState();

      if (item.type === 'music') {
        equipTrack(item.id);
        setPromoFeedback({
          type: 'success',
          text: `¡"${item.name}" adquirida y añadida a tu bucle de música!`,
        });
      } else {
        // Auto-equipar el avatar comprado
        const profile = getPlayerProfile();
        savePlayerProfile(profile.name, item.value);
        setCurrentAvatar(item.value);
        onProfileUpdated?.();

        setPromoFeedback({
          type: 'success',
          text: `¡${item.name} comprado y equipado exitosamente!`,
        });
      }
    } else {
      soundEffects.invalidCard();
      setPromoFeedback({
        type: 'error',
        text: res.message,
      });
    }
  };

  const handleEquipAvatar = (item: ShopItem) => {
    const profile = getPlayerProfile();
    savePlayerProfile(profile.name, item.value);
    setCurrentAvatar(item.value);
    soundEffects.cardTouch();
    onProfileUpdated?.();
    setPromoFeedback({
      type: 'success',
      text: `¡Has equipado ${item.name} como tu nuevo avatar!`,
    });
  };

  const handleToggleMusicLoop = (item: ShopItem) => {
    toggleTrackInPlaylist(item.id);
    const updatedEco = getPlayerEconomy();
    setEconomy(updatedEco);
    onUpdateEconomy?.(updatedEco);
    refreshEconomyState();
    soundEffects.cardTouch();

    const inList = (updatedEco.equippedPlaylist || []).includes(item.id);
    setPromoFeedback({
      type: 'success',
      text: inList
        ? `¡"${item.name}" añadida al bucle de música!`
        : `¡"${item.name}" retirada del bucle de música!`,
    });
  };

  const handleRedeem = (e: React.FormEvent) => {
    e.preventDefault();
    if (!promoInput.trim()) return;

    const res = redeemPromoCode(promoInput);
    if (res.success) {
      soundEffects.victory();
      confetti({
        particleCount: 120,
        spread: 80,
        origin: { y: 0.5 },
      });
      const updatedEco = getPlayerEconomy();
      setEconomy(updatedEco);
      onUpdateEconomy?.(updatedEco);
      refreshEconomyState();
      setPromoInput('');

      // Auto-equipar el ítem si se desbloqueó uno nuevo
      if (res.avatarUnlocked) {
        if (res.avatarUnlocked.startsWith('music_')) {
          equipTrack(res.avatarUnlocked);
        } else {
          const item = SHOP_CATALOG.find((i) => i.id === res.avatarUnlocked);
          if (item) {
            const profile = getPlayerProfile();
            savePlayerProfile(profile.name, item.value);
            setCurrentAvatar(item.value);
            onProfileUpdated?.();
          }
        }
      }

      setPromoFeedback({
        type: 'success',
        text: res.message,
      });
    } else {
      soundEffects.invalidCard();
      setPromoFeedback({
        type: 'error',
        text: res.message,
      });
    }
  };

  if (!isOpen) return null;

  const avatarItems = SHOP_CATALOG.filter((item) => item.type === 'avatar' && !item.hidden);
  const musicItems = SHOP_CATALOG.filter((item) => item.type === 'music' && !item.hidden);

  return (
    <AnimatePresence>
      <div
        className="fixed inset-0 z-50 flex items-center justify-center p-3 sm:p-5 bg-black/80 backdrop-blur-md select-none overflow-y-auto"
        onClick={onClose}
      >
        <motion.div
          initial={{ scale: 0.92, opacity: 0, y: 15 }}
          animate={{ scale: 1, opacity: 1, y: 0 }}
          exit={{ scale: 0.92, opacity: 0, y: 15 }}
          transition={{ type: 'spring', damping: 24, stiffness: 280 }}
          onClick={(e) => e.stopPropagation()}
          className="relative w-full max-w-xl bg-gradient-to-b from-slate-900 via-slate-950 to-black border-2 border-amber-400/50 rounded-3xl p-4 sm:p-6 shadow-[0_0_80px_rgba(245,158,11,0.25)] text-slate-100 max-h-[92vh] flex flex-col justify-between overflow-hidden"
        >
          {/* Fondo iluminado */}
          <div className="absolute -top-24 -right-24 w-60 h-60 bg-amber-500/15 rounded-full blur-3xl pointer-events-none" />
          <div className="absolute -bottom-24 -left-24 w-60 h-60 bg-purple-500/15 rounded-full blur-3xl pointer-events-none" />

          {/* Botón Cerrar - Fijo y visible */}
          <button
            type="button"
            onClick={onClose}
            className="absolute top-3 right-3 sm:top-4 sm:right-4 z-40 w-9 h-9 sm:w-10 sm:h-10 rounded-full bg-slate-800 hover:bg-slate-700 active:bg-slate-600 border-2 border-white/40 text-white flex items-center justify-center transition-all active:scale-90 cursor-pointer shadow-2xl backdrop-blur-md"
            title="Cerrar tienda"
            aria-label="Cerrar"
          >
            <X className="w-5 h-5 sm:w-6 sm:h-6 stroke-[2.5]" />
          </button>

          {/* Header de la Tienda */}
          <div className="relative z-10 flex flex-col sm:flex-row sm:items-center sm:justify-between border-b border-white/10 pb-3 mb-3 pr-12 sm:pr-14 gap-2.5">
            <div className="flex items-center gap-2.5">
              <div className="w-10 h-10 rounded-2xl bg-gradient-to-tr from-amber-500 to-yellow-400 p-0.5 shadow-lg flex items-center justify-center flex-shrink-0">
                <div className="w-full h-full bg-slate-950 rounded-[14px] flex items-center justify-center">
                  <ShoppingBag className="w-5 h-5 text-amber-300" />
                </div>
              </div>
              <div>
                <h2 className="text-xl sm:text-2xl font-black tracking-tight text-white flex items-center gap-2">
                  <span>TIENDA</span>
                  <span className="text-transparent bg-clip-text bg-gradient-to-r from-yellow-300 to-amber-400">
                    ALGEBRAICA
                  </span>
                </h2>
                <p className="text-[11px] sm:text-xs text-amber-200/70 font-medium">
                  Desbloquea avatares y música para ambientar tu lobby
                </p>
              </div>
            </div>

            {/* Contador de monedas */}
            <div className="flex items-center self-start sm:self-auto">
              <div className="flex items-center gap-1.5 px-3 py-1.5 rounded-full bg-amber-400/15 border border-amber-400/40 text-amber-300 font-black text-xs sm:text-sm shadow-md">
                <Coins className="w-4 h-4 text-yellow-300 animate-pulse" />
                <span>{economy.coins.toLocaleString()}</span>
                <span className="text-[10px] text-amber-400/80 font-normal">
                  ({formatCoins(economy.coins)})
                </span>
              </div>
            </div>
          </div>

          {/* Pestañas de Categoría: Avatares vs Música */}
          <div className="relative z-10 grid grid-cols-2 gap-2 mb-3">
            <button
              type="button"
              onClick={() => setActiveTab('avatars')}
              className={`py-2 px-3 rounded-2xl text-xs font-black flex items-center justify-center gap-2 transition cursor-pointer ${
                activeTab === 'avatars'
                  ? 'bg-amber-400 text-slate-950 shadow-lg shadow-amber-400/30'
                  : 'bg-white/5 hover:bg-white/10 text-slate-300 border border-white/10'
              }`}
            >
              <span>🎭</span>
              <span>Avatares</span>
              <span
                className={`text-[10px] px-1.5 py-0.2 rounded-full ${
                  activeTab === 'avatars' ? 'bg-slate-950/20 text-slate-950' : 'bg-white/10 text-white/70'
                }`}
              >
                {avatarItems.length}
              </span>
            </button>

            <button
              type="button"
              onClick={() => setActiveTab('music')}
              className={`py-2 px-3 rounded-2xl text-xs font-black flex items-center justify-center gap-2 transition cursor-pointer ${
                activeTab === 'music'
                  ? 'bg-purple-500 text-white shadow-lg shadow-purple-500/30'
                  : 'bg-white/5 hover:bg-white/10 text-slate-300 border border-white/10'
              }`}
            >
              <Music className="w-3.5 h-3.5" />
              <span>Música de Lobby</span>
              <span
                className={`text-[10px] px-1.5 py-0.2 rounded-full ${
                  activeTab === 'music' ? 'bg-white/20 text-white' : 'bg-white/10 text-white/70'
                }`}
              >
                {musicItems.length}
              </span>
            </button>
          </div>

          {/* Feedback Toast si existe */}
          {promoFeedback && (
            <motion.div
              initial={{ opacity: 0, y: -6 }}
              animate={{ opacity: 1, y: 0 }}
              className={`mb-3 p-2.5 rounded-2xl text-xs font-semibold flex items-center gap-2 border ${
                promoFeedback.type === 'success'
                  ? 'bg-emerald-950/80 border-emerald-500/60 text-emerald-200'
                  : 'bg-rose-950/80 border-rose-500/60 text-rose-200'
              }`}
            >
              <span>{promoFeedback.type === 'success' ? '✨' : '⚠️'}</span>
              <span className="flex-1">{promoFeedback.text}</span>
            </motion.div>
          )}

          {/* Catálogo Scrollable */}
          <div className="relative z-10 flex-1 overflow-y-auto space-y-4 pr-1 max-h-[48vh] sm:max-h-[52vh]">
            {/* SECCIÓN 1: AVATARES */}
            {activeTab === 'avatars' && (
              <div className="max-w-md mx-auto space-y-3.5">
                <div className="text-xs font-black uppercase tracking-wider text-amber-300/80 flex items-center gap-1.5">
                  <Sparkles className="w-3.5 h-3.5 text-yellow-300" />
                  Avatares Exclusivos
                </div>

                {avatarItems.map((item) => {
                  const isOwned = economy.unlockedAvatars.includes(item.id);
                  const isEquipped = currentAvatar === item.value;
                  const canAfford = economy.coins >= item.price;
                  const isEpic = item.rarity === 'épico';

                  return (
                    <motion.div
                      key={item.id}
                      whileHover={{ scale: 1.01 }}
                      className={`relative rounded-3xl p-4 flex flex-col justify-between border transition-all ${
                        isEpic
                          ? 'bg-gradient-to-b from-purple-950/40 via-slate-900 to-black border-purple-400/50 shadow-[0_0_30px_rgba(168,85,247,0.2)]'
                          : 'bg-gradient-to-b from-amber-950/40 via-slate-900 to-black border-amber-400/60 shadow-[0_0_30px_rgba(245,158,11,0.25)]'
                      }`}
                    >
                      {/* Badge de rareza */}
                      <div className="flex items-center justify-between mb-2">
                        <span
                          className={`px-2.5 py-0.5 rounded-full text-[10px] font-black uppercase tracking-wider border ${
                            isEpic
                              ? 'bg-gradient-to-r from-purple-500 to-indigo-500 text-white border-purple-300 shadow-[0_0_10px_rgba(168,85,247,0.4)]'
                              : 'bg-amber-400 text-slate-950 border-yellow-200 shadow-[0_0_10px_rgba(245,158,11,0.3)]'
                          }`}
                        >
                          {item.rarity}
                        </span>

                        {isOwned && (
                          <span className="flex items-center gap-1 text-[10px] font-bold text-emerald-400">
                            <Check className="w-3.5 h-3.5" /> Adquirido
                          </span>
                        )}
                      </div>

                      {/* Previsualización del Avatar */}
                      <div className="flex items-center gap-4 my-2">
                        <div
                          className={`w-20 h-20 sm:w-22 sm:h-22 rounded-2xl bg-black/60 border-2 p-1 flex items-center justify-center flex-shrink-0 shadow-2xl ring-2 overflow-hidden ${
                            isEpic
                              ? 'border-purple-400/60 ring-purple-400/30'
                              : 'border-amber-400/60 ring-amber-400/30'
                          }`}
                        >
                          <AvatarDisplay
                            avatar={item.value}
                            className="w-full h-full rounded-xl object-cover"
                            fallbackClassName="text-4xl"
                          />
                        </div>

                        <div className="flex-1 min-w-0">
                          <h3 className="text-sm font-black text-white truncate">{item.name}</h3>
                          <div className="mt-1 flex items-center gap-1 font-black text-xs text-amber-300">
                            <Coins className="w-3.5 h-3.5 text-yellow-400" />
                            <span>{item.price.toLocaleString()}</span>
                          </div>
                        </div>
                      </div>

                      {/* Botón de acción */}
                      <div className="mt-2.5">
                        {isEquipped ? (
                          <button
                            type="button"
                            disabled
                            className="w-full py-2 rounded-xl bg-emerald-500/20 border border-emerald-400/50 text-emerald-300 text-xs font-black flex items-center justify-center gap-1 cursor-default"
                          >
                            <ShieldCheck className="w-3.5 h-3.5" />
                            EQUIPADO
                          </button>
                        ) : isOwned ? (
                          <button
                            type="button"
                            onClick={() => handleEquipAvatar(item)}
                            className="w-full py-2 rounded-xl bg-emerald-500 hover:bg-emerald-400 text-slate-950 text-xs font-black transition active:scale-95 shadow-md flex items-center justify-center gap-1 cursor-pointer"
                          >
                            <Zap className="w-3.5 h-3.5" />
                            EQUIPAR
                          </button>
                        ) : (
                          <button
                            type="button"
                            onClick={() => handleBuy(item)}
                            disabled={!canAfford}
                            className={`w-full py-2 rounded-xl text-xs font-black transition active:scale-95 shadow-md flex items-center justify-center gap-1 ${
                              canAfford
                                ? isEpic
                                  ? 'bg-gradient-to-r from-purple-500 to-indigo-500 hover:from-purple-400 hover:to-indigo-400 text-white cursor-pointer'
                                  : 'bg-gradient-to-r from-amber-400 to-yellow-500 hover:from-amber-300 hover:to-yellow-400 text-slate-950 cursor-pointer'
                                : 'bg-white/10 text-slate-400 border border-white/10 cursor-not-allowed opacity-60'
                            }`}
                          >
                            <Coins className="w-3.5 h-3.5" />
                            {canAfford
                              ? `COMPRAR (${item.price.toLocaleString()} 🪙)`
                              : 'MONEDAS INSUFICIENTES'}
                          </button>
                        )}
                      </div>
                    </motion.div>
                  );
                })}
              </div>
            )}

            {/* SECCIÓN 2: MÚSICA DE LOBBY (SIN DESCRIPCIONES, SOLO NOMBRES) */}
            {activeTab === 'music' && (
              <div className="max-w-md mx-auto space-y-3.5">
                <div className="text-xs font-black uppercase tracking-wider text-purple-300/90 flex items-center gap-1.5">
                  <Disc className="w-3.5 h-3.5 text-purple-400" />
                  Pistas Musicales Exclusivas
                </div>

                {musicItems.map((item) => {
                  const isOwned = economy.unlockedMusic?.includes(item.id);
                  const inLoop = (economy.equippedPlaylist || []).includes(item.id);
                  const canAfford = economy.coins >= item.price;
                  const isLegendary = item.rarity === 'legendario';

                  return (
                    <motion.div
                      key={item.id}
                      whileHover={{ scale: 1.01 }}
                      className={`relative rounded-3xl p-4 flex flex-col justify-between border transition-all ${
                        isLegendary
                          ? 'bg-gradient-to-b from-amber-950/40 via-purple-950/40 to-black border-amber-400/60 shadow-[0_0_35px_rgba(245,158,11,0.25)]'
                          : 'bg-gradient-to-b from-purple-950/40 via-slate-900 to-black border-purple-400/50 shadow-[0_0_30px_rgba(168,85,247,0.2)]'
                      }`}
                    >
                      {/* Badge de rareza */}
                      <div className="flex items-center justify-between mb-2">
                        <span
                          className={`px-2.5 py-0.5 rounded-full text-[10px] font-black uppercase tracking-wider border ${
                            isLegendary
                              ? 'bg-gradient-to-r from-amber-400 to-yellow-500 text-slate-950 border-yellow-200 shadow-[0_0_10px_rgba(245,158,11,0.4)]'
                              : 'bg-gradient-to-r from-purple-500 to-indigo-500 text-white border-purple-300 shadow-[0_0_10px_rgba(168,85,247,0.4)]'
                          }`}
                        >
                          {item.rarity}
                        </span>

                        {isOwned ? (
                          <span className="flex items-center gap-1 text-[10px] font-bold text-emerald-400">
                            <Check className="w-3.5 h-3.5" /> Adquirida
                          </span>
                        ) : (
                          <span className="text-[10px] font-bold text-purple-300/80">
                            🔒 Bloqueada
                          </span>
                        )}
                      </div>

                      {/* Portada Oculta con ? en tienda, o revelada al comprar */}
                      <div className="flex items-center gap-4 my-2">
                        <div
                          className={`w-20 h-20 sm:w-22 sm:h-22 rounded-2xl bg-black/80 border-2 p-1 flex items-center justify-center flex-shrink-0 shadow-2xl relative overflow-hidden ring-2 ${
                            isLegendary
                              ? 'border-amber-400/60 ring-amber-400/30'
                              : 'border-purple-400/60 ring-purple-400/30'
                          }`}
                        >
                          {isOwned ? (
                            <img
                              src={`https://img.youtube.com/vi/${item.value}/mqdefault.jpg`}
                              alt={item.realTitle || item.name}
                              className="w-full h-full object-cover rounded-xl"
                              loading="lazy"
                            />
                          ) : (
                            <div className="w-full h-full rounded-xl bg-gradient-to-br from-purple-950 via-slate-900 to-black flex flex-col items-center justify-center text-amber-300">
                              <span className="text-3xl font-black animate-pulse">?</span>
                              <span className="text-[8px] uppercase tracking-wider text-purple-300/90 font-bold">
                                Misterio
                              </span>
                            </div>
                          )}

                          {!isOwned && (
                            <div className="absolute top-1.5 right-1.5 p-1 rounded-full bg-black/60 border border-white/20">
                              <Lock className="w-3 h-3 text-white/70" />
                            </div>
                          )}
                        </div>

                        {/* Solo Título (Sin descripciones) */}
                        <div className="flex-1 min-w-0">
                          <h3 className="text-sm font-black text-white">{item.name}</h3>

                          {/* Precio y estado */}
                          <div className="mt-2 flex items-center gap-2">
                            <div className="flex items-center gap-1 font-black text-xs text-amber-300">
                              <Coins className="w-3.5 h-3.5 text-yellow-400" />
                              <span>{item.price.toLocaleString()}</span>
                            </div>

                            {isOwned && inLoop && (
                              <span className="text-[10px] text-amber-300 font-bold px-2 py-0.5 rounded-md bg-amber-400/20 border border-amber-400/30">
                                🔁 En Bucle
                              </span>
                            )}
                          </div>
                        </div>
                      </div>

                      {/* Botón de acción */}
                      <div className="mt-2.5">
                        {isOwned ? (
                          <button
                            type="button"
                            onClick={() => handleToggleMusicLoop(item)}
                            className={`w-full py-2 rounded-xl text-xs font-black transition active:scale-95 shadow-md flex items-center justify-center gap-1.5 cursor-pointer ${
                              inLoop
                                ? 'bg-amber-400 text-slate-950 shadow-amber-400/30'
                                : 'bg-emerald-500 hover:bg-emerald-400 text-slate-950'
                            }`}
                          >
                            <Disc className="w-3.5 h-3.5" />
                            {inLoop ? 'QUITAR DEL BUCLE' : 'AÑADIR AL BUCLE'}
                          </button>
                        ) : (
                          <button
                            type="button"
                            onClick={() => handleBuy(item)}
                            disabled={!canAfford}
                            className={`w-full py-2 rounded-xl text-xs font-black transition active:scale-95 shadow-md flex items-center justify-center gap-1 ${
                              canAfford
                                ? isLegendary
                                  ? 'bg-gradient-to-r from-amber-400 to-yellow-500 hover:from-amber-300 hover:to-yellow-400 text-slate-950 cursor-pointer'
                                  : 'bg-gradient-to-r from-purple-500 to-indigo-500 hover:from-purple-400 hover:to-indigo-400 text-white cursor-pointer'
                                : 'bg-white/10 text-slate-400 border border-white/10 cursor-not-allowed opacity-60'
                            }`}
                          >
                            <Coins className="w-3.5 h-3.5" />
                            {canAfford
                              ? `COMPRAR (${item.price.toLocaleString()} 🪙)`
                              : 'MONEDAS INSUFICIENTES'}
                          </button>
                        )}
                      </div>
                    </motion.div>
                  );
                })}
              </div>
            )}

            {/* SECCIÓN CANJE DE CÓDIGOS (Sin ejemplos) */}
            <div className="mt-4 pt-4 border-t border-white/10">
              <div className="text-xs font-black uppercase tracking-wider text-amber-300/80 flex items-center gap-1.5 mb-2">
                <KeyRound className="w-3.5 h-3.5 text-yellow-300" />
                Canjear Código Secreto
              </div>

              <form onSubmit={handleRedeem} className="flex gap-2">
                <input
                  type="text"
                  value={promoInput}
                  onChange={(e) => setPromoInput(e.target.value)}
                  placeholder="Ingresa tu código secreto..."
                  className="flex-1 bg-black/60 border border-white/30 focus:border-amber-400 rounded-xl px-3 py-2 text-xs font-mono uppercase tracking-wider text-amber-300 placeholder:text-slate-400 placeholder:normal-case placeholder:font-sans focus:outline-none transition shadow-inner"
                />
                <button
                  type="submit"
                  disabled={!promoInput.trim()}
                  className="px-4 py-2 rounded-xl bg-gradient-to-r from-amber-500 to-yellow-500 hover:from-amber-400 hover:to-yellow-400 text-slate-950 font-black text-xs shadow-md disabled:opacity-40 transition active:scale-95 cursor-pointer flex items-center gap-1"
                >
                  <Gift className="w-3.5 h-3.5" />
                  Canjear
                </button>
              </form>
            </div>
          </div>

          {/* Footer Informativo */}
          <div className="relative z-10 pt-3 border-t border-white/10 mt-3 flex items-center justify-between text-[10px] text-slate-400">
            <span>Victorias: <strong className="text-amber-300">{economy.victories}</strong></span>
            <span>Música y avatares se guardan en tu perfil</span>
          </div>
        </motion.div>
      </div>
    </AnimatePresence>
  );
};
