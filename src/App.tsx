import React, { useState, useEffect, useCallback } from 'react';
import { motion, AnimatePresence } from 'motion/react';
import { Terminal, Lock, Heart as HeartIcon, Sparkles } from 'lucide-react';
import TextHeart from './components/TextHeart';

const Typewriter = ({ text, delay = 50, onComplete }: { text: string, delay?: number, onComplete?: () => void }) => {
  const [currentText, setCurrentText] = useState("");
  const [index, setIndex] = useState(0);

  useEffect(() => {
    if (index < text.length) {
      const timeout = setTimeout(() => {
        setCurrentText(prev => prev + text[index]);
        setIndex(prev => prev + 1);
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
  const [decodedMessage, setDecodedMessage] = useState<string>("");
  const [recipientName, setRecipientName] = useState<string>("");
  const [inputMessage, setInputMessage] = useState<string>("");
  const [inputName, setInputName] = useState<string>("");
  const [generatedUrl, setGeneratedUrl] = useState<string>("");

  useEffect(() => {
    const params = new URLSearchParams(window.location.search);
    const q = params.get('q');
    const n = params.get('n');
    if (q) {
      try {
        const decoded = atob(q);
        setDecodedMessage(decodeURIComponent(decoded));
        if (n) {
          setRecipientName(decodeURIComponent(atob(n)));
        }
      } catch (e) {
        console.error('Failed to decode base64 message:', e);
        setStage('generator');
      }
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

  return (
    <div 
      onClick={handleReveal}
      className={`relative min-h-screen w-full flex items-center justify-center bg-[#050505] selection:bg-pink-deep/30 ${stage === 'console' && consoleFinished ? 'cursor-pointer' : ''}`}
    >
      <div className="scanline" />
      
      <AnimatePresence mode="wait">
        {stage === 'generator' ? (
          <motion.div
            key="generator"
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="relative w-full max-w-2xl p-8 font-mono text-sm md:text-base text-white/80"
          >
            <div className="space-y-6">
              <div className="flex gap-2 text-pink-soft/60">
                <span>[generator]</span>
                <span>Create encrypted message link</span>
              </div>
              
              <div className="space-y-4">
                <div>
                  <label className="block text-white/60 mb-2 text-xs uppercase tracking-widest">
                    Recipient Name
                  </label>
                  <input
                    type="text"
                    value={inputName}
                    onChange={(e) => setInputName(e.target.value)}
                    placeholder="Enter recipient name..."
                    className="w-full bg-white/5 border border-pink-deep/20 rounded px-4 py-2 text-white placeholder-white/30 focus:outline-none focus:border-pink-deep/50"
                  />
                </div>

                <div>
                  <label className="block text-white/60 mb-2 text-xs uppercase tracking-widest">
                    Your Message
                  </label>
                  <textarea
                    value={inputMessage}
                    onChange={(e) => setInputMessage(e.target.value)}
                    placeholder="Enter your secret message..."
                    className="w-full bg-white/5 border border-pink-deep/20 rounded p-4 text-white placeholder-white/30 focus:outline-none focus:border-pink-deep/50 min-h-[120px] resize-none"
                  />
                </div>
                
                <button
                  onClick={() => {
                    if (inputMessage.trim()) {
                      const encoded = btoa(encodeURIComponent(inputMessage));
                      const nameParam = inputName.trim() ? `&n=${btoa(encodeURIComponent(inputName.trim()))}` : '';
                      const url = `${window.location.origin}${window.location.pathname}?q=${encoded}${nameParam}`;
                      setGeneratedUrl(url);
                    }
                  }}
                  className="group flex items-center gap-3 px-6 py-3 border border-pink-deep/30 bg-pink-deep/5 hover:bg-pink-deep/10 text-pink-soft transition-all duration-300"
                >
                  <Sparkles size={16} className="group-hover:rotate-12 transition-transform" />
                  <span className="font-mono tracking-widest uppercase text-xs">Generate Link</span>
                </button>
                
                {generatedUrl && (
                  <motion.div
                    initial={{ opacity: 0, y: 10 }}
                    animate={{ opacity: 1, y: 0 }}
                    className="space-y-2"
                  >
                    <label className="block text-white/60 text-xs uppercase tracking-widest">
                      Your Encrypted Link
                    </label>
                    <div className="flex gap-2">
                      <input
                        type="text"
                        value={generatedUrl}
                        readOnly
                        className="flex-1 bg-white/5 border border-pink-deep/20 rounded px-4 py-2 text-white/80 text-xs"
                      />
                      <button
                        onClick={() => {
                          navigator.clipboard.writeText(generatedUrl);
                        }}
                        className="px-4 py-2 border border-pink-deep/30 bg-pink-deep/5 hover:bg-pink-deep/10 text-pink-soft transition-all duration-300 text-xs uppercase tracking-widest"
                      >
                        Copy
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
            className="w-full max-w-2xl p-8 font-mono text-sm md:text-base text-white/80"
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
                    <motion.span 
                        initial={{ opacity: 0 }} 
                        animate={{ opacity: 1 }} 
                        className="text-green-400"
                    >
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
                  <p className="text-white/40 italic">
                    {">"} One encrypted package found for you.
                  </p>
                  
                  <button
                    id="decrypt-button"
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
                  
                  <p className="text-[10px] text-white/20 animate-pulse">
                    (or just click anywhere)
                  </p>
                </motion.div>
              )}
            </div>
          </motion.div>
        ) : (
          <motion.div
            key="reveal"
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            className="relative w-full h-screen flex items-center justify-center overflow-hidden"
          >
            <TextHeart />
            
            <motion.div
              initial={{ scale: 0.8, opacity: 0 }}
              animate={{ scale: 1, opacity: 1 }}
              transition={{ delay: 3, duration: 1.5 }}
              className="z-20 text-center"
            >
              <div className="w-12 h-px bg-pink-deep/30 mx-auto mb-8" />
              
              <motion.button
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
            <div className="absolute top-8 left-8 text-[10px] font-mono text-white/10 uppercase tracking-widest space-y-1">
                <div>ln: 420</div>
                <div>id: 0xDEADBEEF</div>
                <div>type: organic_emotion</div>
            </div>
            
            <div className="absolute bottom-8 right-8 text-[10px] font-mono text-white/10 uppercase tracking-widest">
                heart_reveal // success
            </div>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
}

