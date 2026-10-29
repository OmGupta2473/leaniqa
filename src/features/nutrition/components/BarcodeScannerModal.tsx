import { useState, useEffect, useRef, useCallback } from 'react';
import { createPortal } from 'react-dom';
import { motion, AnimatePresence } from 'motion/react';
import { BrowserMultiFormatReader, type IScannerControls } from '@zxing/browser';
import {
  X, Camera, AlertTriangle, Loader2, ScanLine, Check, Keyboard,
  Minus, Plus,
} from 'lucide-react';
import { supabase } from '@/shared/utils/supabase';
import { authService } from '@/features/auth/services/authService';
import { haptics } from '@/shared/utils/haptics';
import { analytics } from '@/shared/utils/analytics';
import {
  availableUnits,
  calcGrams,
  calcMacros,
  unitLabel,
  type BarcodeProduct,
  type BarcodeUnit,
} from '../utils/barcodeNutrition';

interface BarcodeScannerModalProps {
  isOpen: boolean;
  onClose: () => void;
  onConfirm: (payload: {
    text: string;
    calories: number;
    protein: number;
    fat: number;
    carbs: number;
    fiber: number;
  }) => void;
  /**
   * Optional: called when a scan returns "not found" and the user taps
   * "Add manually". If provided, a full "Add manually" CTA appears on the
   * not-found screen. Caller is responsible for closing the scanner and
   * opening the manual entry modal.
   */
  onManualAdd?: (barcode: string) => void;
  /**
   * Optional: called after the modal's exit animation completes and the
   * component has fully unmounted. Used by MealLoggerPage to open the
   * CustomMealModal only after the scanner overlay is gone, so the modal
   * can never mount behind a still-exiting scanner (z-120 > modal z-110).
   */
  onExitComplete?: () => void;
}

type Phase = 'scanning' | 'loading' | 'result' | 'not_found' | 'permission_denied';

const SCAN_DEBOUNCE_MS = 300;

export function BarcodeScannerModal({ isOpen, onClose, onConfirm, onManualAdd, onExitComplete }: BarcodeScannerModalProps) {
  const [phase, setPhase] = useState<Phase>('scanning');
  const [barcode, setBarcode] = useState<string>('');
  const [product, setProduct] = useState<BarcodeProduct | null>(null);
  const [quantity, setQuantity] = useState<string>('1');
  const [unit, setUnit] = useState<BarcodeUnit>('g');
  const [errorMsg, setErrorMsg] = useState<string>('');
  const [manualMode, setManualMode] = useState<boolean>(false);
  const [manualBarcode, setManualBarcode] = useState<string>('');

  const videoRef = useRef<HTMLVideoElement>(null);
  const controlsRef = useRef<IScannerControls | null>(null);
  const lastScanRef = useRef<{ code: string; at: number } | null>(null);

  // ---------- lifecycle: start/stop camera ----------
  useEffect(() => {
    if (!isOpen) return;
    if (manualMode) return;
    if (phase !== 'scanning') return;

    let cancelled = false;
    const start = async () => {
      try {
        const reader = new BrowserMultiFormatReader();
        if (!videoRef.current) return;

        // decodeFromConstraints resolves to IScannerControls once the
        // camera is live. That controls object is the ONLY handle that
        // can stop the stream — BrowserMultiFormatReader has no reset()
        // (that method was removed in @zxing/browser; it only existed on
        // the deprecated @zxing/library BrowserCodeReader).
        const controls = await reader.decodeFromConstraints(
          {
            video: {
              facingMode: { ideal: 'environment' },
              width: { ideal: 1280 },
              height: { ideal: 720 },
            },
          },
          videoRef.current,
          (result) => {
            if (cancelled || !result) return;
            const text = result.getText();
            const now = Date.now();
            const last = lastScanRef.current;
            if (last && last.code === text && now - last.at < SCAN_DEBOUNCE_MS) return;
            lastScanRef.current = { code: text, at: now };
            haptics.success();
            analytics.trackEvent('Barcode Scan Attempted', { barcode_length: text.length });
            void lookupBarcode(text);
          },
        );

        // If the component unmounted while the camera was starting, stop
        // immediately so we never leave an orphaned stream.
        if (cancelled) {
          controls.stop();
          return;
        }
        controlsRef.current = controls;
      } catch (err) {
        if (cancelled) return;
        console.error('[BarcodeScanner] camera start failed', err);
        setPhase('permission_denied');
        setErrorMsg(
          err instanceof Error && /permission|denied|notallowed/i.test(err.message)
            ? 'Camera access was denied. You can type the barcode instead.'
            : 'Could not start the camera. You can type the barcode instead.',
        );
      }
    };
    void start();

    return () => {
      cancelled = true;
      try {
        controlsRef.current?.stop();
      } catch {
        /* ignore */
      }
      controlsRef.current = null;
      // Belt-and-braces: release the video element and any remaining
      // MediaStream tracks. On some browsers controls.stop() alone
      // leaves the green camera LED on if the element is still attached.
      if (videoRef.current) {
        try {
          BrowserMultiFormatReader.cleanVideoSource(videoRef.current);
          BrowserMultiFormatReader.releaseAllStreams();
        } catch {
          /* ignore */
        }
      }
    };
  }, [isOpen, phase, manualMode]);

  // reset state on open
  useEffect(() => {
    if (isOpen) {
      setPhase('scanning');
      setBarcode('');
      setProduct(null);
      setQuantity('1');
      setUnit('g');
      setErrorMsg('');
      setManualMode(false);
      setManualBarcode('');
      lastScanRef.current = null;
    }
  }, [isOpen]);

  // ---------- lookup ----------
  const lookupBarcode = useCallback(async (code: string) => {
    setPhase('loading');
    setBarcode(code);
    try {
      await authService.getUserId(); // ensures session is valid
      const { data, error } = await supabase.functions.invoke('lookup-barcode', {
        body: { barcode: code },
      });
      if (error) {
        const ctx = (error as { context?: Response }).context;
        let body: { error?: string; attempted_sources?: string[] } | null = null;
        if (ctx && typeof ctx.json === 'function') {
          try { body = await ctx.json(); } catch { /* ignore */ }
        }
        if (body?.error === 'not_found' || body?.error === 'no_nutrition_data') {
          analytics.trackEvent('Barcode Scan Not Found', {
            barcode: code,
            attempted_sources: Array.isArray((body as { attempted_sources?: string[] }).attempted_sources)
              ? (body as { attempted_sources: string[] }).attempted_sources.join(',')
              : 'unknown',
          });
          setPhase('not_found');
          return;
        }
        throw new Error(body?.error ?? error.message);
      }
      if (!data || typeof data !== 'object' || !data.barcode) {
        throw new Error('Invalid response');
      }
      const p = data as BarcodeProduct;
      setProduct(p);
      setUnit(p.detected_default_unit);
      setQuantity(p.detected_default_unit === 'piece' ? '1' : '1');
      setPhase('result');
      analytics.trackEvent('Barcode Scan Success', {
        barcode: p.barcode,
        cached: Boolean((data as { cached?: boolean }).cached),
      });
    } catch (err) {
      console.error('[BarcodeScanner] lookup failed', err);
      setErrorMsg('Could not look up this product. Check your connection and try again.');
      setPhase('not_found');
    }
  }, []);

  const handleManualSubmit = () => {
    const clean = manualBarcode.replace(/\D/g, '');
    if (!/^\d{8,14}$/.test(clean)) {
      setErrorMsg('Barcode must be 8–14 digits.');
      return;
    }
    setErrorMsg('');
    setManualMode(false);
    haptics.tap();
    void lookupBarcode(clean);
  };

  // ---------- derived macros ----------
  const grams = product ? calcGrams(parseFloat(quantity) || 0, unit, product) : null;
  const macros = product && grams != null ? calcMacros(product, grams) : null;
  const units = product ? availableUnits(product) : [];

  const handleConfirm = () => {
    if (!product || !macros) return;
    const label = product.product_name ?? `Barcode ${product.barcode}`;
    const qty = parseFloat(quantity) || 0;
    const text = `${qty} ${unitLabel(unit)} ${label}${product.brand ? ` (${product.brand})` : ''}`;
    onConfirm({
      text,
      calories: macros.calories,
      protein: macros.protein,
      fat: macros.fat,
      carbs: macros.carbs,
      fiber: macros.fiber,
    });
    haptics.success();
    onClose();
  };

  if (typeof document === 'undefined') return null;

  return createPortal(
    <AnimatePresence onExitComplete={onExitComplete}>
      {isOpen && (
        <motion.div
          key="barcode-modal"
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          exit={{ opacity: 0 }}
          transition={{ duration: 0.2 }}
          style={{
            position: 'fixed',
            inset: 0,
            zIndex: 120,
            background: 'rgba(0,0,0,0.92)',
            display: 'flex',
            flexDirection: 'column',
          }}
        >
          {/* header */}
          <div className="flex items-center justify-between px-5 pt-[calc(env(safe-area-inset-top)+12px)] pb-3">
            <div className="flex items-center gap-2">
              <ScanLine size={18} className="text-[#378ADD]" />
              <span className="text-[16px] font-semibold text-white tracking-tight">
                Scan a barcode
              </span>
            </div>
            <button
              type="button"
              onClick={onClose}
              aria-label="Close"
              className="w-10 h-10 rounded-full bg-[rgba(255,255,255,0.08)] flex items-center justify-center text-white active:scale-95"
            >
              <X size={18} />
            </button>
          </div>

          {/* body */}
          <div className="flex-1 overflow-y-auto px-5 pb-[calc(env(safe-area-inset-bottom)+20px)]">
            {phase === 'scanning' && !manualMode && (
              <div className="flex flex-col gap-4">
                <div className="relative w-full aspect-square max-h-[60dvh] rounded-[24px] overflow-hidden border border-[rgba(255,255,255,0.08)] bg-black">
                  <video
                    ref={videoRef}
                    className="absolute inset-0 w-full h-full object-cover"
                    autoPlay
                    muted
                    playsInline
                  />
                  <div className="absolute inset-0 flex items-center justify-center pointer-events-none">
                    <div className="w-[70%] h-[40%] border-2 border-[#378ADD] rounded-[16px] shadow-[0_0_24px_rgba(55,138,221,0.5)]" />
                  </div>
                </div>
                <button
                  type="button"
                  onClick={() => { setManualMode(true); setErrorMsg(''); }}
                  className="mx-auto flex items-center gap-2 text-[13px] font-medium text-zinc-300 px-4 py-2 rounded-full bg-[rgba(255,255,255,0.05)] active:scale-95"
                >
                  <Keyboard size={14} />
                  Type barcode manually
                </button>
              </div>
            )}

            {phase === 'scanning' && manualMode && (
              <div className="flex flex-col gap-4 pt-6">
                <div className="text-[14px] text-zinc-300">Enter the digits below the barcode.</div>
                <input
                  inputMode="numeric"
                  autoFocus
                  value={manualBarcode}
                  onChange={(e) => setManualBarcode(e.target.value.replace(/\D/g, '').slice(0, 14))}
                  placeholder="e.g. 8901234567890"
                  className="w-full bg-zinc-900 border border-zinc-800 rounded-xl px-4 py-3 text-[16px] text-white outline-none focus:border-[#378ADD] tracking-wider"
                />
                {errorMsg && (
                  <div className="text-[13px] text-[#FF5C4D]">{errorMsg}</div>
                )}
                <button
                  type="button"
                  onClick={handleManualSubmit}
                  disabled={!/^\d{8,14}$/.test(manualBarcode)}
                  className="w-full py-3.5 rounded-full bg-[#378ADD] text-white font-semibold text-[15px] disabled:opacity-40"
                >
                  Look up barcode
                </button>
                <button
                  type="button"
                  onClick={() => { setManualMode(false); setErrorMsg(''); }}
                  className="w-full py-2 text-center text-[13px] text-zinc-400"
                >
                  Back to camera
                </button>
              </div>
            )}

            {phase === 'loading' && (
              <div className="flex flex-col items-center justify-center py-16 text-center">
                <Loader2 size={36} className="text-[#378ADD] animate-spin mb-4" />
                <div className="text-[16px] font-semibold text-white mb-1">Looking up product…</div>
                <div className="text-[13px] text-zinc-400">{barcode}</div>
              </div>
            )}

            {phase === 'permission_denied' && (
              <div className="flex flex-col items-center justify-center py-12 text-center gap-4">
                <div className="w-16 h-16 rounded-full bg-[rgba(255,92,77,0.1)] flex items-center justify-center border border-[rgba(255,92,77,0.3)]">
                  <AlertTriangle size={28} className="text-[#FF5C4D]" />
                </div>
                <div className="text-[16px] font-semibold text-white">Camera unavailable</div>
                <div className="text-[13px] text-zinc-400 max-w-[280px]">{errorMsg}</div>
                <button
                  type="button"
                  onClick={() => { setPhase('scanning'); setManualMode(true); setErrorMsg(''); }}
                  className="mt-2 px-6 py-3 rounded-full bg-[#378ADD] text-white font-semibold text-[14px]"
                >
                  Type barcode manually
                </button>
              </div>
            )}

            {phase === 'not_found' && (
              <div className="flex flex-col items-center justify-center py-10 text-center gap-4">
                <div className="w-16 h-16 rounded-full bg-[rgba(255,176,32,0.1)] flex items-center justify-center border border-[rgba(255,176,32,0.3)]">
                  <AlertTriangle size={28} className="text-[#FFB020]" />
                </div>
                <div className="text-[16px] font-semibold text-white">Product not found</div>
                <div className="text-[13px] text-zinc-400 max-w-[300px]">
                  {errorMsg || `We couldn't find nutrition data for ${barcode}. You can add it manually.`}
                </div>
                {onManualAdd && (
                  <button
                    type="button"
                    onClick={() => {
                      try { haptics.tap(); } catch { /* non-fatal */ }
                      try { onManualAdd(barcode); } catch (err) {
                        console.error('[BarcodeScanner] onManualAdd threw', err);
                      }
                      // Always close, even if onManualAdd threw. The parent's
                      // onExitComplete handler opens the CustomMealModal once
                      // this overlay has fully unmounted — never behind it.
                      onClose();
                    }}
                    className="w-full max-w-[240px] px-6 py-3 rounded-full bg-[#D4FF00] text-black font-semibold text-[14px]"
                  >
                    Add manually
                  </button>
                )}
                <button
                  type="button"
                  onClick={() => { setPhase('scanning'); setProduct(null); setErrorMsg(''); }}
                  className="px-6 py-3 rounded-full bg-[rgba(255,255,255,0.08)] text-white font-semibold text-[14px]"
                >
                  Scan again
                </button>
                <button
                  type="button"
                  onClick={onClose}
                  className="text-[13px] text-zinc-400"
                >
                  Close
                </button>
              </div>
            )}

            {phase === 'result' && product && (
              <div className="flex flex-col gap-4">
                {/* product card */}
                <div className="rounded-[24px] border border-[rgba(255,255,255,0.08)] bg-[rgba(255,255,255,0.03)] p-4 flex gap-3">
                  {product.image_url ? (
                    <img
                      src={product.image_url}
                      alt=""
                      className="w-16 h-16 rounded-xl object-cover bg-zinc-900 shrink-0"
                      loading="lazy"
                    />
                  ) : (
                    <div className="w-16 h-16 rounded-xl bg-zinc-900 flex items-center justify-center shrink-0 text-zinc-600">
                      <Camera size={20} />
                    </div>
                  )}
                  <div className="min-w-0 flex-1">
                    <div className="text-[15px] font-semibold text-white leading-tight break-words">
                      {product.product_name ?? 'Unknown product'}
                    </div>
                    {product.brand && (
                      <div className="text-[12px] text-zinc-400 mt-0.5">{product.brand}</div>
                    )}
                    <div className="text-[11px] text-zinc-500 mt-1 tabular-nums">
                      {product.nutrition_per_100g.kcal} kcal · {product.nutrition_per_100g.protein}g protein · {product.nutrition_per_100g.carbs}g carbs / 100g
                    </div>
                  </div>
                </div>

                {/* unit chips */}
                <div>
                  <div className="text-[11px] font-semibold uppercase tracking-wider text-zinc-500 mb-2">Unit</div>
                  <div className="flex flex-wrap gap-2">
                    {units.map((u) => (
                      <button
                        key={u}
                        type="button"
                        onClick={() => { setUnit(u); haptics.tap(); }}
                        className={`px-3 py-1.5 rounded-full text-[13px] font-semibold transition-colors ${
                          unit === u
                            ? 'bg-[#378ADD] text-white'
                            : 'bg-[rgba(255,255,255,0.06)] text-zinc-300'
                        }`}
                      >
                        {unitLabel(u)}
                      </button>
                    ))}
                  </div>
                </div>

                {/* quantity stepper */}
                <div>
                  <div className="text-[11px] font-semibold uppercase tracking-wider text-zinc-500 mb-2">Quantity</div>
                  <div className="flex items-center gap-2">
                    <button
                      type="button"
                      onClick={() => setQuantity(String(Math.max(0, (parseFloat(quantity) || 0) - 1)))}
                      className="w-11 h-11 rounded-full bg-[rgba(255,255,255,0.06)] flex items-center justify-center text-white active:scale-95"
                      aria-label="Decrease quantity"
                    >
                      <Minus size={16} />
                    </button>
                    <input
                      inputMode="decimal"
                      value={quantity}
                      onChange={(e) => setQuantity(e.target.value.replace(/[^0-9.]/g, ''))}
                      className="flex-1 h-11 bg-zinc-900 border border-zinc-800 rounded-xl px-3 text-[16px] text-white text-center outline-none focus:border-[#378ADD]"
                    />
                    <button
                      type="button"
                      onClick={() => setQuantity(String((parseFloat(quantity) || 0) + 1))}
                      className="w-11 h-11 rounded-full bg-[rgba(255,255,255,0.06)] flex items-center justify-center text-white active:scale-95"
                      aria-label="Increase quantity"
                    >
                      <Plus size={16} />
                    </button>
                  </div>
                </div>

                {/* macro preview */}
                <div className="rounded-[20px] border border-[rgba(212,255,0,0.2)] bg-[rgba(212,255,0,0.04)] p-4">
                  <div className="text-[11px] font-semibold uppercase tracking-wider text-[#D4FF00] mb-2">
                    You'll log
                  </div>
                  {macros && grams != null ? (
                    <>
                      <div className="text-[13px] text-zinc-300 mb-3 tabular-nums">
                        {quantity || '0'} {unitLabel(unit)} · {grams}g
                      </div>
                      <div className="grid grid-cols-4 gap-2 text-center">
                        {[
                          { label: 'kcal', value: macros.calories, color: '#FF4D1C' },
                          { label: 'pro', value: macros.protein, color: '#D4FF00' },
                          { label: 'fat', value: macros.fat, color: '#FFB020' },
                          { label: 'carb', value: macros.carbs, color: '#378ADD' },
                        ].map((m) => (
                          <div key={m.label} className="flex flex-col items-center">
                            <div className="text-[18px] font-bold tabular-nums" style={{ color: m.color }}>
                              {m.value}
                            </div>
                            <div className="text-[10px] uppercase tracking-wider text-zinc-500 mt-0.5">
                              {m.label}
                            </div>
                          </div>
                        ))}
                      </div>
                    </>
                  ) : (
                    <div className="text-[13px] text-zinc-400">Enter a valid quantity.</div>
                  )}
                </div>

                <button
                  type="button"
                  onClick={handleConfirm}
                  disabled={!macros}
                  className="w-full py-3.5 rounded-full bg-[#D4FF00] text-black font-semibold text-[15px] disabled:opacity-40 flex items-center justify-center gap-2"
                >
                  <Check size={16} strokeWidth={3} />
                  Confirm and log
                </button>
              </div>
            )}
          </div>
        </motion.div>
      )}
    </AnimatePresence>,
    document.body,
  );
}