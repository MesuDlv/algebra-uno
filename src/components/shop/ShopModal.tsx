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
  const [economy, setEconomy] = useState<PlayerEconomy>(() => getPlayerEconomy());
  const [currentAvatar, setCurrentAvatar] = useState<string>(() => getPlayerProfile().avatar);
  const [promoInput, setPromoInput] = useState<string>('');
  const [promoFeedback, setPromoFeedback] = useState<{
    type: 'success' | 'error';
    text: string;
  } | null>(null);

  useEffect(() => {
    if (isOpen) {
      setEconomy(getPlayerEconomy());
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
        particleCount: 70,
        spread: 60,
        origin: { y: 0.6 },
      });
      const updatedEco = getPlayerEconomy();
      setEconomy(updatedEco);
      onUpdateEconomy?.(updatedEco);

      // Auto-equipar el avatar comprado
      const profile = getPlayerProfile();
      savePlayerProfile(profile.name, item.value);
      setCurrentAvatar(item.value);
      onProfileUpdated?.();

      setPromoFeedback({
        type: 'success',
        text: `¡${item.name} comprado y equipado exitosamente!`,
      });
    } else {
      soundEffects.invalidCard();
      setPromoFeedback({
        type: 'error',
        text: res.message,
      });
    }
  };

  const handleEquip = (item: ShopItem) => {
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
      setPromoInput('');
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

  return (
    <AnimatePresence>
      <div className="fixed inset-0 z-50 flex items-center justify-center p-3 sm:p-5 bg-black/80 backdrop-blur-md select-none overflow-y-auto">
        <motion.div
          initial={{ scale: 0.92, opacity: 0, y: 15 }}
          animate={{ scale: 1, opacity: 1, y: 0 }}
          exit={{ scale: 0.92, opacity: 0, y: 15 }}
          transition={{ type: 'spring', damping: 24, stiffness: 280 }}
          className="relative w-full max-w-xl bg-gradient-to-b from-slate-900 via-slate-950 to-black border-2 border-amber-400/50 rounded-3xl p-4 sm:p-6 shadow-[0_0_80px_rgba(245,158,11,0.25)] text-slate-100 max-h-[92vh] flex flex-col justify-between overflow-hidden"
        >
          {/* Fondo iluminado */}
          <div className="absolute -top-24 -right-24 w-60 h-60 bg-amber-500/15 rounded-full blur-3xl pointer-events-none" />
          <div className="absolute -bottom-24 -left-24 w-60 h-60 bg-emerald-500/15 rounded-full blur-3xl pointer-events-none" />

          {/* Header de la Tienda */}
          <div className="relative z-10 flex items-center justify-between border-b border-white/10 pb-3 mb-4">
            <div className="flex items-center gap-2.5">
              <div className="w-10 h-10 rounded-2xl bg-gradient-to-tr from-amber-500 to-yellow-400 p-0.5 shadow-lg flex items-center justify-center">
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
                  Canjea tus monedas ganadas por recompensas exclusivas
                </p>
              </div>
            </div>

            {/* Contador de monedas y cerrar */}
            <div className="flex items-center gap-2 sm:gap-3">
              <div className="flex items-center gap-1.5 px-3 py-1.5 rounded-full bg-amber-400/15 border border-amber-400/40 text-amber-300 font-black text-xs sm:text-sm shadow-md">
                <Coins className="w-4 h-4 text-yellow-300 animate-pulse" />
                <span>{economy.coins.toLocaleString()}</span>
                <span className="text-[10px] text-amber-400/80 font-normal">
                  ({formatCoins(economy.coins)})
                </span>
              </div>

              <button
                type="button"
                onClick={onClose}
                className="p-1.5 sm:p-2 rounded-full bg-white/5 hover:bg-white/15 text-slate-300 hover:text-white transition active:scale-90"
              >
                <X className="w-5 h-5" />
              </button>
            </div>
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
          <div className="relative z-10 flex-1 overflow-y-auto space-y-4 pr-1 max-h-[50vh] sm:max-h-[54vh]">
            {/* ÍTEM DESTACADO: PATRIA MILAGRO */}
            <div className="text-xs font-black uppercase tracking-wider text-amber-300/80 flex items-center gap-1.5">
              <Sparkles className="w-3.5 h-3.5 text-yellow-300" />
              Recompensa Especial de Avatar
            </div>

            <div className="max-w-md mx-auto">
              {SHOP_CATALOG.map((item) => {
                const isOwned = economy.unlockedAvatars.includes(item.id);
                const isEquipped = currentAvatar === item.value;
                const canAfford = economy.coins >= item.price;

                return (
                  <motion.div
                    key={item.id}
                    whileHover={{ scale: 1.01 }}
                    className="relative rounded-3xl p-4 sm:p-5 flex flex-col justify-between border transition-all bg-gradient-to-b from-amber-950/40 via-slate-900 to-black border-amber-400/60 shadow-[0_0_30px_rgba(245,158,11,0.25)]"
                  >
                    {/* Badge de rareza */}
                    <div className="flex items-center justify-between mb-3">
                      <span className="px-2.5 py-0.5 rounded-full text-[10px] font-black uppercase tracking-wider border bg-amber-400 text-slate-950 border-yellow-200">
                        {item.rarity}
                      </span>

                      {isOwned && (
                        <span className="flex items-center gap-1 text-[10px] font-bold text-emerald-400">
                          <Check className="w-3.5 h-3.5" /> Adquirido
                        </span>
                      )}
                    </div>

                    {/* Previsualización del Avatar Grande */}
                    <div className="flex items-center gap-4 my-2">
                      <div className="w-20 h-20 sm:w-24 sm:h-24 rounded-3xl bg-black/60 border-2 border-amber-400/60 p-1 flex items-center justify-center flex-shrink-0 shadow-2xl ring-2 ring-amber-400/30 overflow-hidden">
                        <AvatarDisplay
                          avatar={item.value}
                          className="w-full h-full rounded-2xl object-cover"
                          fallbackClassName="text-4xl"
                        />
                      </div>

                      <div className="flex-1 min-w-0">
                        <h3 className="text-sm font-black text-white truncate">{item.name}</h3>
                        <p className="text-[10px] text-slate-400 line-clamp-2 leading-tight mt-0.5">
                          {item.description}
                        </p>
                        <div className="mt-1 flex items-center gap-1 font-black text-xs text-amber-300">
                          <Coins className="w-3.5 h-3.5 text-yellow-400" />
                          <span>{item.price.toLocaleString()}</span>
                        </div>
                      </div>
                    </div>

                    {/* Botón de acción */}
                    <div className="mt-3">
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
                          onClick={() => handleEquip(item)}
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
                              ? 'bg-gradient-to-r from-amber-400 to-yellow-500 hover:from-amber-300 hover:to-yellow-400 text-slate-950 cursor-pointer'
                              : 'bg-white/10 text-slate-400 border border-white/10 cursor-not-allowed opacity-60'
                          }`}
                        >
                          <Coins className="w-3.5 h-3.5" />
                          {canAfford ? `COMPRAR (${item.price.toLocaleString()} 🪙)` : 'MONEDAS INSUFICIENTES'}
                        </button>
                      )}
                    </div>
                  </motion.div>
                );
              })}
            </div>

            {/* SECCIÓN CANJE DE CÓDIGOS */}
            <div className="mt-4 pt-4 border-t border-white/10">
              <div className="text-xs font-black uppercase tracking-wider text-amber-300/80 flex items-center gap-1.5 mb-2">
                <KeyRound className="w-3.5 h-3.5 text-yellow-300" />
                Canjear Código Secreto / Promocional
              </div>

              <form onSubmit={handleRedeem} className="flex gap-2">
                <input
                  type="text"
                  value={promoInput}
                  onChange={(e) => setPromoInput(e.target.value)}
                  placeholder="Ej: BIENVENIDOALAPATRIAMILAGRO"
                  className="flex-1 bg-black/50 border border-white/20 focus:border-amber-400 rounded-xl px-3 py-2 text-xs font-mono uppercase tracking-wider text-yellow-300 placeholder:text-white/30 focus:outline-none transition"
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
            <span>Victorias acumuladas: <strong className="text-amber-300">{economy.victories}</strong></span>
            <span>Tus recompensas se guardan automáticamente</span>
          </div>
        </motion.div>
      </div>
    </AnimatePresence>
  );
};
