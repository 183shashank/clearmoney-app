import { useState, useRef, useCallback } from 'react';
import { Upload, MessageSquare, ChevronRight, Lock, Gem, Key } from 'lucide-react';
import { parsePDF } from '../../utils/pdfParser.js';
import { parseSMS } from '../../utils/smsParser.js';
import { useApp } from '../../context/AppContext.jsx';

const INCOME_RANGES = ['Under ₹25K', '₹25K–50K', '₹50K–1L', '₹1L–2L', 'Above ₹2L'];
const DEPENDENTS = ['0', '1', '2', '3+'];
const GOALS = ['Save more', 'Build emergency fund', 'Start investing', 'Pay off debt'];

function ProgressBar({ step }) {
  return (
    <div className="flex items-center gap-2 mb-8">
      {[1, 2, 3].map(n => (
        <div key={n} className="flex items-center gap-2">
          <div
            className={`w-7 h-7 rounded-full flex items-center justify-center text-xs font-semibold transition-all duration-300 ${
              n < step ? 'bg-indigo-500 text-white' :
              n === step ? 'bg-indigo-500 text-white ring-4 ring-indigo-100' :
              'bg-gray-100 text-gray-400'
            }`}
          >
            {n < step ? '✓' : n}
          </div>
          {n < 3 && (
            <div className={`h-0.5 w-12 rounded transition-all duration-300 ${n < step ? 'bg-indigo-500' : 'bg-gray-100'}`} />
          )}
        </div>
      ))}
      <span className="ml-2 text-sm text-gray-400">Step {step} of 3</span>
    </div>
  );
}

function Step1({ profile, setProfile, onNext }) {
  const valid = profile.incomeRange && profile.primaryGoal;
  return (
    <div className="stagger-1">
      <h1 className="text-3xl font-bold text-gray-900 mb-2">Let's build your financial picture</h1>
      <p className="text-gray-500 mb-8">Takes under 2 minutes. Your data never leaves your device.</p>

      {/* Income range */}
      <div className="mb-6">
        <label className="block text-sm font-medium text-gray-700 mb-3">
          Monthly take-home income
        </label>
        <div className="flex flex-wrap gap-2">
          {INCOME_RANGES.map(r => (
            <button
              key={r}
              onClick={() => setProfile(p => ({ ...p, incomeRange: r }))}
              className={`px-4 py-2.5 rounded-xl text-sm font-medium border transition-all duration-200 ${
                profile.incomeRange === r
                  ? 'bg-indigo-500 text-white border-indigo-500 shadow-sm'
                  : 'bg-white text-gray-600 border-gray-200 hover:border-indigo-300 hover:bg-indigo-50'
              }`}
            >
              {r}
            </button>
          ))}
        </div>
      </div>

      {/* Dependents */}
      <div className="mb-6">
        <label className="block text-sm font-medium text-gray-700 mb-3">
          Number of financial dependents
        </label>
        <div className="flex gap-2">
          {DEPENDENTS.map(d => (
            <button
              key={d}
              onClick={() => setProfile(p => ({ ...p, dependents: d }))}
              className={`w-14 h-12 rounded-xl text-sm font-semibold border transition-all duration-200 ${
                profile.dependents === d
                  ? 'bg-indigo-500 text-white border-indigo-500'
                  : 'bg-white text-gray-600 border-gray-200 hover:border-indigo-300'
              }`}
            >
              {d}
            </button>
          ))}
        </div>
      </div>

      {/* Primary goal */}
      <div className="mb-6">
        <label className="block text-sm font-medium text-gray-700 mb-3">
          Primary financial goal right now
        </label>
        <div className="flex flex-wrap gap-2">
          {GOALS.map(g => (
            <button
              key={g}
              onClick={() => setProfile(p => ({ ...p, primaryGoal: g }))}
              className={`px-4 py-2.5 rounded-xl text-sm font-medium border transition-all duration-200 ${
                profile.primaryGoal === g
                  ? 'bg-indigo-500 text-white border-indigo-500'
                  : 'bg-white text-gray-600 border-gray-200 hover:border-indigo-300 hover:bg-indigo-50'
              }`}
            >
              {g}
            </button>
          ))}
        </div>
      </div>

      {/* Monthly savings */}
      <div className="mb-8">
        <label className="block text-sm font-medium text-gray-700 mb-2">
          Current savings per month (approximate)
        </label>
        <div className="relative">
          <span className="absolute left-4 top-1/2 -translate-y-1/2 text-gray-400 font-medium">₹</span>
          <input
            type="number"
            value={profile.monthlySavings || ''}
            onChange={e => setProfile(p => ({ ...p, monthlySavings: Number(e.target.value) }))}
            placeholder="e.g. 8000"
            className="w-full pl-8 pr-4 py-3 rounded-xl border border-gray-200 text-gray-900 focus:outline-none focus:ring-2 focus:ring-indigo-300 focus:border-indigo-400 transition-all"
          />
        </div>
      </div>

      <button
        onClick={onNext}
        disabled={!valid}
        className={`w-full flex items-center justify-center gap-2 px-6 py-3.5 rounded-xl font-semibold text-white transition-all duration-200 ${
          valid
            ? 'bg-indigo-500 hover:bg-indigo-600 hover:-translate-y-0.5 hover:shadow-md'
            : 'bg-gray-200 text-gray-400 cursor-not-allowed'
        }`}
      >
        Continue <ChevronRight size={18} />
      </button>
    </div>
  );
}

function Step2({ profile, setProfile, onNext, onProcess }) {
  const [dragOver, setDragOver] = useState(false);
  const [file, setFile]         = useState(null);
  const [smsText, setSmsText]   = useState('');
  const [pdfProgress, setPdfProgress] = useState(0);
  const [parsing, setParsing]   = useState(false);
  const inputRef = useRef(null);

  const handleFile = useCallback(async (f) => {
    if (!f || f.type !== 'application/pdf') return;
    setFile(f);
    setParsing(true);
    const { parsePDF } = await import('../../utils/pdfParser.js');
    const txns = await parsePDF(f, setPdfProgress);
    onProcess(txns.length > 0 ? txns : null, 'pdf');
    setParsing(false);
  }, [onProcess]);

  const handleDrop = (e) => {
    e.preventDefault();
    setDragOver(false);
    const f = e.dataTransfer.files[0];
    handleFile(f);
  };

  const handleSMSSubmit = () => {
    if (!smsText.trim()) { onProcess(null, 'demo'); return; }
    const txns = parseSMS(smsText);
    onProcess(txns.length > 0 ? txns : null, 'sms');
  };

  return (
    <div className="stagger-1">
      <h1 className="text-3xl font-bold text-gray-900 mb-2">Connect your transactions</h1>
      <p className="text-gray-500 mb-8">Choose how you'd like to bring in your financial data</p>

      {/* Optional API key */}
      <div className="mb-6 p-4 bg-indigo-50 rounded-2xl border border-indigo-100">
        <div className="flex items-center gap-2 mb-2">
          <Key size={15} className="text-indigo-500" />
          <span className="text-sm font-medium text-indigo-700">Optional: Claude API Key for AI insights</span>
        </div>
        <input
          type="password"
          value={profile.apiKey || ''}
          onChange={e => setProfile(p => ({ ...p, apiKey: e.target.value }))}
          placeholder="sk-ant-... (leave blank for demo insights)"
          className="w-full px-3 py-2 text-sm rounded-xl border border-indigo-200 bg-white focus:outline-none focus:ring-2 focus:ring-indigo-300 text-gray-700"
        />
        <p className="text-xs text-indigo-400 mt-1">Without a key, we use pre-generated demo insights.</p>
      </div>

      <div className="grid md:grid-cols-2 gap-4 mb-6">
        {/* PDF Upload */}
        <div className="bg-white rounded-2xl border border-gray-200 p-5 flex flex-col gap-3">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-xl bg-indigo-50 flex items-center justify-center">
              <Upload size={20} className="text-indigo-500" />
            </div>
            <div>
              <div className="font-semibold text-gray-900 text-sm">PDF Bank Statement</div>
              <div className="text-xs text-gray-400">HDFC, ICICI, SBI, Axis, Kotak</div>
            </div>
          </div>
          <p className="text-xs text-gray-500 leading-relaxed">
            Download your last 3 months statement from your bank app and upload it here.
          </p>

          {/* Drag & drop zone */}
          <div
            onDragOver={(e) => { e.preventDefault(); setDragOver(true); }}
            onDragLeave={() => setDragOver(false)}
            onDrop={handleDrop}
            onClick={() => inputRef.current?.click()}
            className={`
              border-2 border-dashed rounded-2xl p-6 text-center cursor-pointer transition-all duration-200
              ${dragOver ? 'border-indigo-400 bg-indigo-50' : 'border-gray-200 hover:border-indigo-300 hover:bg-gray-50'}
              ${parsing ? 'pointer-events-none' : ''}
            `}
          >
            <input
              ref={inputRef}
              type="file"
              accept="application/pdf"
              className="hidden"
              onChange={(e) => handleFile(e.target.files[0])}
            />
            {parsing ? (
              <div className="space-y-2">
                <div className="text-sm text-indigo-500 font-medium">Parsing statement...</div>
                <div className="w-full bg-gray-100 rounded-full h-1.5">
                  <div
                    className="bg-indigo-500 h-1.5 rounded-full transition-all duration-300"
                    style={{ width: `${pdfProgress}%` }}
                  />
                </div>
              </div>
            ) : file ? (
              <div className="text-sm text-emerald-600 font-medium">✓ {file.name}</div>
            ) : (
              <>
                <div className="text-2xl mb-2">📄</div>
                <div className="text-sm text-gray-500">Drop your PDF here or <span className="text-indigo-500 font-medium">click to browse</span></div>
              </>
            )}
          </div>
        </div>

        {/* SMS Paste */}
        <div className="bg-white rounded-2xl border border-gray-200 p-5 flex flex-col gap-3">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-xl bg-emerald-50 flex items-center justify-center">
              <MessageSquare size={20} className="text-emerald-500" />
            </div>
            <div>
              <div className="font-semibold text-gray-900 text-sm">UPI Transaction SMSes</div>
              <div className="text-xs text-gray-400">Copy from your inbox</div>
            </div>
          </div>
          <p className="text-xs text-gray-500 leading-relaxed">
            Copy and paste your UPI transaction SMSes. We'll extract all the numbers automatically.
          </p>
          <textarea
            value={smsText}
            onChange={e => setSmsText(e.target.value)}
            rows={5}
            placeholder={`Paste SMSes here...\ne.g. Rs.450.00 debited from A/c XX1234 to Swiggy on 12-04-25`}
            className="w-full px-3 py-2.5 text-xs rounded-xl border border-gray-200 resize-none focus:outline-none focus:ring-2 focus:ring-emerald-300 focus:border-emerald-400 text-gray-600 leading-relaxed"
          />
          <button
            onClick={handleSMSSubmit}
            className="w-full px-4 py-2.5 rounded-xl bg-emerald-500 text-white text-sm font-semibold hover:bg-emerald-600 hover:-translate-y-0.5 hover:shadow-md transition-all duration-200"
          >
            Parse Transactions
          </button>
        </div>
      </div>

      {/* Privacy note */}
      <div className="flex items-center gap-2 text-sm text-gray-400 mb-8 bg-gray-50 rounded-xl p-3">
        <Lock size={14} />
        <span>All processing happens on your device. ClearMoney never stores your financial data.</span>
      </div>

      <button
        onClick={() => onProcess(null, 'demo')}
        className="w-full flex items-center justify-center gap-2 px-6 py-3.5 rounded-xl font-semibold text-white bg-indigo-500 hover:bg-indigo-600 hover:-translate-y-0.5 hover:shadow-md transition-all duration-200"
      >
        Use Demo Data & Continue <ChevronRight size={18} />
      </button>
    </div>
  );
}

const LOADING_MESSAGES = [
  'Reading your transactions...',
  'Categorising your spending...',
  'Computing your Financial Health Score...',
  'Generating your insights...',
];

function Step3() {
  const [msgIndex, setMsgIndex] = useState(0);

  useState(() => {
    const iv = setInterval(() => {
      setMsgIndex(i => Math.min(i + 1, LOADING_MESSAGES.length - 1));
    }, 750);
    return () => clearInterval(iv);
  });

  return (
    <div className="flex flex-col items-center justify-center py-20 stagger-1">
      {/* Animated ring */}
      <div className="relative w-24 h-24 mb-8">
        <svg className="w-full h-full -rotate-90" viewBox="0 0 100 100">
          <circle cx="50" cy="50" r="42" fill="none" stroke="#E5E7EB" strokeWidth="8" />
          <circle
            cx="50" cy="50" r="42" fill="none"
            stroke="#6366f1" strokeWidth="8" strokeLinecap="round"
            strokeDasharray="264"
            strokeDashoffset="66"
            className="spinner"
            style={{ transformOrigin: '50% 50%' }}
          />
        </svg>
        <div className="absolute inset-0 flex items-center justify-center">
          <Gem size={24} className="text-indigo-500" />
        </div>
      </div>

      <h2 className="text-xl font-semibold text-gray-900 mb-3 text-center">
        {LOADING_MESSAGES[msgIndex]}
      </h2>
      <p className="text-gray-400 text-sm text-center">Just a moment</p>

      {/* Progress dots */}
      <div className="flex gap-2 mt-6">
        {LOADING_MESSAGES.map((_, i) => (
          <div
            key={i}
            className={`w-2 h-2 rounded-full transition-all duration-300 ${
              i <= msgIndex ? 'bg-indigo-500' : 'bg-gray-200'
            }`}
          />
        ))}
      </div>
    </div>
  );
}

export default function Onboarding() {
  const { profile, setProfile, processTransactions } = useApp();
  const [step, setStep] = useState(1);

  const handleProcess = useCallback(async (txns, source) => {
    setStep(3);
    await processTransactions(txns, source);
  }, [processTransactions]);

  return (
    <div className="min-h-screen bg-[#FAFAFA] flex items-center justify-center p-4">
      <div className="w-full max-w-xl">
        {/* Logo */}
        <div className="flex items-center gap-2 mb-10">
          <div className="w-8 h-8 rounded-xl bg-indigo-500 flex items-center justify-center">
            <Gem size={18} className="text-white" />
          </div>
          <span className="font-bold text-xl text-gray-900">ClearMoney</span>
        </div>

        {step !== 3 && <ProgressBar step={step} />}

        {step === 1 && (
          <Step1
            profile={profile}
            setProfile={setProfile}
            onNext={() => setStep(2)}
          />
        )}
        {step === 2 && (
          <Step2
            profile={profile}
            setProfile={setProfile}
            onNext={() => setStep(3)}
            onProcess={handleProcess}
          />
        )}
        {step === 3 && <Step3 />}
      </div>
    </div>
  );
}
