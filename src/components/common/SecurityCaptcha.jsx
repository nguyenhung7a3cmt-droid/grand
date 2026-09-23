import React, { useState, useEffect, useRef } from 'react';
import { ShieldCheck, RefreshCw, CheckCircle2, AlertCircle, Lock } from 'lucide-react';
import { soundFx } from '../../utils/soundFx';

export default function SecurityCaptcha({ onVerified, onVerify, isVerified, onReset }) {
  const triggerVerified = (tok) => {
    onVerified?.(tok);
    onVerify?.(tok);
  };
  const [num1, setNum1] = useState(0);
  const [num2, setNum2] = useState(0);
  const [operator, setOperator] = useState('+');
  const [expectedAnswer, setExpectedAnswer] = useState(0);
  const [userAnswer, setUserAnswer] = useState('');
  const [status, setStatus] = useState('idle'); // 'idle' | 'verifying' | 'success' | 'error'
  const [errorMessage, setErrorMessage] = useState('');

  // Canvas visual distortion for anti-bot OCR scraping
  const canvasRef = useRef(null);

  const generateChallenge = (keepError = false) => {
    const raw1 = Math.floor(Math.random() * 8) + 2; // 2..9
    const raw2 = Math.floor(Math.random() * 8) + 1; // 1..8
    const ops = ['+', '-'];
    const op = ops[Math.floor(Math.random() * ops.length)];

    let n1 = raw1;
    let n2 = raw2;
    let ans = 0;

    if (op === '+') {
      ans = n1 + n2;
    } else {
      // Strictly guarantee n1 >= n2 so the arithmetic result is ALWAYS positive (never negative)
      n1 = Math.max(raw1, raw2);
      n2 = Math.min(raw1, raw2);
      ans = n1 - n2;
    }

    setNum1(n1);
    setNum2(n2);
    setOperator(op);
    setExpectedAnswer(ans);
    if (typeof window !== 'undefined' && (window.location.hostname === 'localhost' || window.location.hostname === '127.0.0.1')) {
      window.__grandstock_test_captcha_answer = ans;
    }
    setUserAnswer('');
    if (!keepError) {
      setStatus('idle');
      setErrorMessage('');
    }
    onReset?.();

    // Render distorted challenge on canvas
    setTimeout(() => {
      drawCaptchaCanvas(n1, op, n2);
    }, 50);
  };

  const drawCaptchaCanvas = (n1, op, n2) => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    const ctx = canvas.getContext('2d');
    if (!ctx) return;

    ctx.clearRect(0, 0, canvas.width, canvas.height);

    // Dark background with subtle noise lines
    ctx.fillStyle = '#0e1017';
    ctx.fillRect(0, 0, canvas.width, canvas.height);

    // Random security noise lines
    for (let i = 0; i < 5; i++) {
      ctx.strokeStyle = `rgba(238, 29, 54, ${Math.random() * 0.3 + 0.1})`;
      ctx.lineWidth = Math.random() * 2 + 1;
      ctx.beginPath();
      ctx.moveTo(Math.random() * canvas.width, Math.random() * canvas.height);
      ctx.lineTo(Math.random() * canvas.width, Math.random() * canvas.height);
      ctx.stroke();
    }

    // Text style with rotation to prevent automated OCR bots
    ctx.font = 'bold 20px "Chakra Petch", monospace';
    ctx.fillStyle = '#10B981';
    ctx.textBaseline = 'middle';

    const text = `${n1} ${op} ${n2} = ?`;
    ctx.save();
    ctx.translate(canvas.width / 2, canvas.height / 2);
    ctx.rotate((Math.random() - 0.5) * 0.08); // subtle tilt
    ctx.fillText(text, -42, 0);
    ctx.restore();

    // Random dots noise
    for (let i = 0; i < 20; i++) {
      ctx.fillStyle = 'rgba(248, 250, 252, 0.2)';
      ctx.fillRect(Math.random() * canvas.width, Math.random() * canvas.height, 2, 2);
    }
  };

  useEffect(() => {
    generateChallenge();
  }, []);

  const handleVerify = (e) => {
    e?.preventDefault();
    if (!userAnswer.trim()) {
      setErrorMessage('Please solve the security challenge.');
      setStatus('error');
      soundFx.error?.();
      return;
    }

    setStatus('verifying');

    setTimeout(() => {
      if (parseInt(userAnswer.trim(), 10) === expectedAnswer) {
        setStatus('success');
        setErrorMessage('');
        soundFx.success?.();
        const token = `captcha_token_${Date.now()}_${Math.random().toString(36).substring(2, 8)}`;
        triggerVerified(token);
      } else {
        setStatus('error');
        setErrorMessage('Incorrect answer. Please try again.');
        soundFx.error?.();
        generateChallenge(true);
      }
    }, 300);
  };

  return (
    <div
      data-testid="security-captcha"
      className="p-3.5 rounded-2xl bg-[#090a0f] border border-gs-border space-y-2.5"
    >
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-2">
          <ShieldCheck className="w-4 h-4 text-emerald-400" />
          <span className="font-heading font-bold text-[11px] uppercase text-white tracking-wider">
            GrandStock Anti-Spam Captcha
          </span>
        </div>
        <span className="px-1.5 py-0.5 rounded text-[9px] font-mono font-bold bg-emerald-500/15 text-emerald-400 border border-emerald-500/30">
          BOT PROTECTION ACTIVE
        </span>
      </div>

      {isVerified || status === 'success' ? (
        <div className="p-3 rounded-xl bg-emerald-950/40 border border-emerald-500/40 text-emerald-300 text-xs flex items-center justify-between font-mono animate-fadeIn">
          <div className="flex items-center gap-2">
            <CheckCircle2 className="w-4 h-4 text-emerald-400 shrink-0" />
            <span className="font-bold">Human Verification Succeeded</span>
          </div>
          <span className="text-[10px] text-emerald-400/80">TOKEN ATTACHED</span>
        </div>
      ) : (
        <div className="space-y-2">
          <div className="flex flex-col sm:flex-row sm:items-center gap-2">
            {/* Visual Canvas & Refresh */}
            <div className="flex items-center gap-2 shrink-0">
              <div className="relative rounded-xl overflow-hidden border border-gs-border shrink-0 bg-black">
                <canvas
                  ref={canvasRef}
                  width={130}
                  height={44}
                  className="block"
                />
              </div>

              <button
                type="button"
                onClick={() => { generateChallenge(); soundFx.pop?.(); }}
                className="h-11 w-11 min-w-[44px] min-h-[44px] rounded-xl bg-gs-raised hover:bg-gs-card active:scale-95 text-gs-muted hover:text-white border border-gs-border transition-all shrink-0 flex items-center justify-center cursor-pointer"
                title="Refresh Challenge"
                aria-label="Refresh Security Challenge"
              >
                <RefreshCw className="w-4 h-4" />
              </button>
            </div>

            {/* Input & Verify */}
            <div className="flex items-center gap-2 flex-1 min-w-0">
              <input
                type="number"
                inputMode="numeric"
                pattern="[0-9]*"
                min="0"
                autoComplete="off"
                value={userAnswer}
                onChange={(e) => setUserAnswer(e.target.value)}
                onKeyDown={(e) => { if (e.key === 'Enter') handleVerify(e); }}
                placeholder="Answer"
                className="w-full h-11 px-3 py-2.5 rounded-xl bg-gs-raised border border-gs-border focus:border-emerald-500 text-white text-sm font-mono placeholder-slate-500 focus:outline-none touch-manipulation"
              />
              <button
                type="button"
                onClick={handleVerify}
                disabled={status === 'verifying'}
                className="h-11 min-h-[44px] px-4 rounded-xl bg-emerald-600 hover:bg-emerald-500 active:scale-95 text-white font-heading font-black text-xs uppercase tracking-wider shrink-0 transition-all cursor-pointer shadow-glow-success flex items-center justify-center touch-manipulation disabled:opacity-50"
              >
                {status === 'verifying' ? '...' : 'Verify'}
              </button>
            </div>
          </div>

          {errorMessage && (
            <div className="text-[11px] text-red-400 font-sans flex items-center gap-1">
              <AlertCircle className="w-3.5 h-3.5 shrink-0" />
              <span>{errorMessage}</span>
            </div>
          )}
        </div>
      )}
    </div>
  );
}
