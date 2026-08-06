import { useState, useEffect, useCallback } from 'react';
import { motion, AnimatePresence } from 'motion/react';
import { Lock, Sparkles, Copy, Check } from 'lucide-react';
import { HEART_ANIMATIONS, DEFAULT_ANIMATION_ID, getAnimationById } from './components/animations/registry';
import { decodeHeartPayload, buildHeartUrl, type HeartPayload } from './lib/urlPayload';

const Typewriter = ({ text, delay = 50, onComplete }: { text: string; delay?: number; onComplete?: () => void }) => {
  const [currentText, setCurrentText] = useState('');
  const [index, setIndex] = useState(0);

  useEffect(() => {
    if (index < text.length) {
      const timeout = setTimeout(() => {
        setCurrentText((prev) => prev + text[index]);
        setIndex((prev) => prev + 1);
      }, delay);
      return () => clearTimeout(timeout);
    } else if (onComplete) {
      onComplete();
    }
  }, [index, text, delay, onComplete]);

  return <span className="font-mono">{currentText}</span>;
};

export default function App() {
  const [stage, setStage] = useState<'console' | 'generator' | 'reveal'>('console');
  const [consoleFinished, setConsoleFinished] = useState(false);
  const [decodedMessage, setDecodedMessage] = useState<string>('');
  const [recipientName, setRecipientName] = useState<string>('');
  const [longMessage, setLongMessage] = useState<string>('');
  const [animationId, setAnimationId] = useState<string>(DEFAULT_ANIMATION_ID);

  const [inputMessage, setInputMessage] = useState<string>('');
  const [inputName, setInputName] = useState<string>('');
  const [inputLongMessage, setInputLongMessage] = useState<string>('');
  const [selectedAnimationId, setSelectedAnimationId] = useState<string>(DEFAULT_ANIMATION_ID);
  const [generatedUrl, setGeneratedUrl] = useState<string>('');
  const [copied, setCopied] = useState(false);

  useEffect(() => {
    const payload = decodeHeartPayload(window.location.search);
    if (payload) {
      setDecodedMessage(payload.q);
      if (payload.n) setRecipientName(payload.n);
      if (payload.m) setLongMessage(payload.m);
      setAnimationId(payload.a ?? DEFAULT_ANIMATION_ID);
    } else {
      setStage('generator');
    }
  }, []);

  useEffect(() => {
    if (recipientName) {
      document.title = `For You, ${recipientName}`;
    }
  }, [recipientName]);

  const handleReveal = useCallback(() => {
    if (stage === 'console' && consoleFinished) {
      setStage('reveal');
    }
  }, [stage, consoleFinished]);

  const handleGenerate = useCallback(() => {
    const trimmedMessage = inputMessage.trim();
    if (!trimmedMessage) return;

    const payload: HeartPayload = { q: trimmedMessage, a: selectedAnimationId };
    const trimmedName = inputName.trim();
    const trimmedLongMessage = inputLongMessage.trim();
    if (trimmedName) payload.n = trimmedName;
    if (trimmedLongMessage) payload.m = trimmedLongMessage;

    setGeneratedUrl(buildHeartUrl(window.location.origin, window.location.pathname, payload));
    setCopied(false);
  }, [inputMessage, inputName, inputLongMessage, selectedAnimationId]);

  const handleCopy = useCallback(async () => {
    try {
      await navigator.clipboard.writeText(generatedUrl);
      setCopied(true);
    } catch {
      // Fallback for contexts where the Clipboard API isn't available
      const textarea = document.createElement('textarea');
      textarea.value = generatedUrl;
      textarea.style.position = 'fixed';
      textarea.style.opacity = '0';
      document.body.appendChild(textarea);
      textarea.select();
      try {
        document.execCommand('copy');
        setCopied(true);
      } catch (err) {
        console.error('Copy failed:', err);
      }
      document.body.removeChild(textarea);
    }
    setTimeout(() => setCopied(false), 2000);
  }, [generatedUrl]);

  const ActiveAnimation = getAnimationById(animationId).Component;

  return (
    <div
      onClick={handleReveal}
      className={`relative min-h-screen w-full flex items-center justify-center bg-[#050505] selection:bg-pink-deep/30 ${
        stage === 'console' && consoleFinished ? 'cursor-pointer' : ''
      }`}
    >
      <div className="scanline" />

      <AnimatePresence mode="wait">
        {stage === 'generator' ? (
          <motion.div
            key="generator"
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="relative w-full max-w-2xl p-4 sm:p-8 font-mono text-sm text-white/80"
          >
            <div className="rounded-2xl border border-pink-deep/15 bg-white/[0.03] backdrop-blur-sm p-5 sm:p-10 space-y-8">
              <div className="flex flex-wrap items-baseline gap-2 text-pink-soft/60">
                <span>[generator]</span>
                <span className="text-white/40">Buat link pesan terenkripsi</span>
              </div>

              <div className="space-y-6">
                <div>
                  <label className="block text-white/60 mb-2 text-xs uppercase tracking-widest">
                    Nama Penerima
                  </label>
                  <input
                    type="text"
                    value={inputName}
                    onChange={(e) => setInputName(e.target.value)}
                    placeholder="Tulis nama penerima..."
                    className="w-full bg-white/5 border border-pink-deep/20 rounded px-4 py-2.5 text-white placeholder-white/30 focus:outline-none focus:border-pink-deep/50 focus:ring-1 focus:ring-pink-deep/30 transition-colors"
                  />
                </div>

                <div>
                  <div className="flex items-baseline justify-between mb-2">
                    <label className="text-white/60 text-xs uppercase tracking-widest">Pesan Singkat</label>
                    <span className="text-[10px] text-white/25">{inputMessage.length} karakter</span>
                  </div>
                  <textarea
                    value={inputMessage}
                    onChange={(e) => setInputMessage(e.target.value)}
                    placeholder="Tulis pesan rahasiamu..."
                    className="w-full bg-white/5 border border-pink-deep/20 rounded p-4 text-white placeholder-white/30 focus:outline-none focus:border-pink-deep/50 focus:ring-1 focus:ring-pink-deep/30 min-h-[100px] resize-none transition-colors"
                  />
                </div>

                <div>
                  <div className="flex items-baseline justify-between mb-2">
                    <label className="text-white/60 text-xs uppercase tracking-widest">
                      Pesan Panjang <span className="text-white/30 normal-case tracking-normal">(opsional)</span>
                    </label>
                    <span className="text-[10px] text-white/25">{inputLongMessage.length} karakter</span>
                  </div>
                  <textarea
                    value={inputLongMessage}
                    onChange={(e) => setInputLongMessage(e.target.value)}
                    placeholder="Pesan lebih panjang yang akan diketik perlahan..."
                    className="w-full bg-white/5 border border-pink-deep/20 rounded p-4 text-white placeholder-white/30 focus:outline-none focus:border-pink-deep/50 focus:ring-1 focus:ring-pink-deep/30 min-h-[100px] resize-none transition-colors"
                  />
                </div>

                <div>
                  <label className="block text-white/60 mb-3 text-xs uppercase tracking-widest">
                    Pilih Animasi Reveal
                  </label>
                  <div className="grid grid-cols-2 gap-3">
                    {HEART_ANIMATIONS.map((anim) => {
                      const Icon = anim.icon;
                      const isSelected = selectedAnimationId === anim.id;
                      return (
                        <button
                          key={anim.id}
                          type="button"
                          onClick={() => setSelectedAnimationId(anim.id)}
                          aria-pressed={isSelected}
                          className={`text-left rounded-lg border p-3 transition-all duration-200 ${
                            isSelected
                              ? 'border-pink-deep/60 bg-pink-deep/10 text-pink-soft'
                              : 'border-white/10 bg-white/[0.02] text-white/60 hover:border-pink-deep/30 hover:bg-white/[0.05]'
                          }`}
                        >
                          <Icon size={16} className={isSelected ? 'text-pink-soft' : 'text-white/40'} />
                          <div className="mt-2 text-xs font-semibold uppercase tracking-wide">{anim.name}</div>
                          <div className="mt-1 text-[10px] leading-snug text-white/35">{anim.description}</div>
                        </button>
                      );
                    })}
                  </div>
                </div>

                <div className="flex flex-col gap-2">
                  <button
                    type="button"
                    onClick={handleGenerate}
                    disabled={!inputMessage.trim()}
                    className="group flex items-center gap-3 px-6 py-3 border border-pink-deep/30 bg-pink-deep/5 hover:bg-pink-deep/10 disabled:opacity-30 disabled:cursor-not-allowed disabled:hover:bg-pink-deep/5 text-pink-soft transition-all duration-300 self-start"
                  >
                    <Sparkles size={16} className="group-hover:rotate-12 transition-transform" />
                    <span className="font-mono tracking-widest uppercase text-xs">Generate Link</span>
                  </button>
                  <p className="text-[10px] text-white/25">
                    Semua isian dipadatkan jadi satu parameter, jadi link tetap ringkas walau pesannya panjang.
                  </p>
                </div>

                {generatedUrl && (
                  <motion.div initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} className="space-y-2">
                    <label className="block text-white/60 text-xs uppercase tracking-widest">Link Terenkripsi</label>
                    <div className="flex flex-col sm:flex-row gap-2">
                      <input
                        type="text"
                        value={generatedUrl}
                        readOnly
                        title={generatedUrl}
                        onFocus={(e) => e.currentTarget.select()}
                        className="min-w-0 flex-1 bg-white/5 border border-pink-deep/20 rounded px-4 py-2.5 text-white/80 text-xs truncate"
                      />
                      <button
                        type="button"
                        onClick={handleCopy}
                        className="shrink-0 flex items-center justify-center gap-2 px-4 py-2.5 border border-pink-deep/30 bg-pink-deep/5 hover:bg-pink-deep/10 text-pink-soft transition-all duration-300 text-xs uppercase tracking-widest"
                      >
                        {copied ? <Check size={14} /> : <Copy size={14} />}
                        {copied ? 'Tersalin' : 'Salin'}
                      </button>
                    </div>
                  </motion.div>
                )}
              </div>
            </div>
          </motion.div>
        ) : stage === 'console' ? (
          <motion.div
            key="console"
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0, scale: 1.05 }}
            className="w-full max-w-2xl p-4 sm:p-8 font-mono text-sm md:text-base text-white/80"
          >
            <div className="space-y-2">
              <div className="flex gap-2 text-pink-soft/60">
                <span>[system]</span>
                <Typewriter
                  text="Initializing heart.PROTOCOL_v2.0..."
                  delay={30}
                  onComplete={() => setConsoleFinished(true)}
                />
              </div>

              {decodedMessage && (
                <div className="flex gap-2 text-yellow-300">
                  <span>[message]</span>
                  <span>{decodedMessage}</span>
                </div>
              )}

              <div className="flex gap-2 h-6">
                <span>[status]</span>
                {consoleFinished && (
                  <motion.span initial={{ opacity: 0 }} animate={{ opacity: 1 }} className="text-green-400">
                    READY
                  </motion.span>
                )}
              </div>

              {consoleFinished && (
                <motion.div
                  initial={{ opacity: 0, y: 10 }}
                  animate={{ opacity: 1, y: 0 }}
                  className="pt-8 flex flex-col items-start gap-6"
                >
                  <p className="text-white/40 italic">{'>'} One encrypted package found for you.</p>

                  <button
                    id="decrypt-button"
                    type="button"
                    onClick={(e) => {
                      e.stopPropagation();
                      setStage('reveal');
                    }}
                    className="group flex items-center gap-3 px-6 py-3 border border-pink-deep/30 bg-pink-deep/5 hover:bg-pink-deep/10 text-pink-soft transition-all duration-300 pointer-events-auto"
                  >
                    <Lock size={16} className="group-hover:rotate-12 transition-transform" />
                    <span className="font-mono tracking-widest uppercase text-xs">Decrypt Message</span>
                    <span className="terminal-cursor" />
                  </button>

                  <p className="text-[10px] text-white/20 animate-pulse">(or just click anywhere)</p>
                </motion.div>
              )}
            </div>
          </motion.div>
        ) : (
          <motion.div
            key="reveal"
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            className="relative w-full min-h-screen flex items-center justify-center py-20"
          >
            <div>
              <ActiveAnimation />
            </div>

            <motion.div
              initial={{ scale: 0.8, opacity: 0 }}
              animate={{ scale: 1, opacity: 1 }}
              transition={{ delay: 4.5, duration: 1.5 }}
              className="z-20 text-center"
            >
              <div className="w-12 h-px bg-pink-deep/30 mx-auto mb-8" />

              {longMessage && (
                <motion.div
                  initial={{ opacity: 0 }}
                  animate={{ opacity: 1 }}
                  transition={{ delay: 5, duration: 1 }}
                  className="mb-8 px-4 max-w-md sm:max-w-xl mx-auto"
                >
                  <Typewriter text={longMessage} delay={30} />
                </motion.div>
              )}

              <motion.button
                type="button"
                onClick={(e) => {
                  e.stopPropagation();
                  setStage('console');
                }}
                className="text-white/20 hover:text-white/60 transition-colors uppercase text-[10px] tracking-widest font-mono"
              >
                Re-encrypt
              </motion.button>
            </motion.div>

            {/* Subtle tech overlays */}
            <div className="hidden sm:block absolute top-8 left-8 text-[10px] font-mono text-white/10 uppercase tracking-widest space-y-1">
              <div>ln: 420</div>
              <div>id: 0xDEADBEEF</div>
              <div>type: organic_emotion</div>
            </div>

            <div className="hidden sm:block absolute bottom-8 right-8 text-[10px] font-mono text-white/10 uppercase tracking-widest">
              heart_reveal // success
            </div>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
}
