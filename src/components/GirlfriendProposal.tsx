import React, { useState, useEffect } from 'react';
import { Heart, ArrowRight, ArrowLeft, Send, Sparkles, AlertCircle, RefreshCw, CheckCircle2 } from 'lucide-react';
import { AppConfig, ProposalResponses } from '../types';
import { soundService } from '../services/soundService';
import { submitProposalAnswers } from '../services/submissionService';
import { ConfettiCanvas } from './ConfettiCanvas';

interface Props {
  config: AppConfig;
}

export const GirlfriendProposal: React.FC<Props> = ({ config }) => {
  // Step 1 to 8
  const [currentStep, setCurrentStep] = useState<number>(1);
  const [formData, setFormData] = useState<ProposalResponses>({
    bestMemory: '',
    dreamDestination: '',
    cuteHabit: '',
    ourSong: '',
    finalMessage: ''
  });

  const [validationError, setValidationError] = useState<string | null>(null);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [submissionSuccessId, setSubmissionSuccessId] = useState<string | null>(null);
  const [submissionError, setSubmissionError] = useState<string | null>(null);

  // Restore step or submission if already completed
  useEffect(() => {
    try {
      const savedSubmission = sessionStorage.getItem('romantic_proposal_submitted');
      if (savedSubmission) {
        const parsed = JSON.parse(savedSubmission);
        if (parsed.submissionId) {
          setSubmissionSuccessId(parsed.submissionId);
          setCurrentStep(8);
        }
      }
    } catch {
      // Ignore session read issues
    }
  }, []);

  const girlfriendName = config.girlfriendName || 'My Love';

  // Navigation handlers
  const goToStep = (step: number) => {
    setValidationError(null);
    setSubmissionError(null);
    soundService.playSparkle();
    setCurrentStep(step);
    window.scrollTo({ top: 0, behavior: 'smooth' });
  };

  const handleInputChange = (field: keyof ProposalResponses, value: string) => {
    setValidationError(null);
    setFormData((prev) => ({
      ...prev,
      [field]: value
    }));
  };

  // Validate step before advancing
  const handleNextFromStep = (stepNum: number) => {
    if (stepNum === 3) {
      if (!formData.bestMemory.trim()) {
        setValidationError('Please share a special memory with me 🌸');
        return;
      }
    } else if (stepNum === 4) {
      if (!formData.dreamDestination.trim()) {
        setValidationError('Please tell me where you would like us to escape ✈️');
        return;
      }
    } else if (stepNum === 5) {
      if (!formData.cuteHabit.trim()) {
        setValidationError('Please tell me which habit you secretly find cute 😄');
        return;
      }
    } else if (stepNum === 6) {
      if (!formData.ourSong.trim()) {
        setValidationError('Please tell me which song reminds you of us 🎶');
        return;
      }
    }

    goToStep(stepNum + 1);
  };

  // Final submit handler for Step 7
  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setValidationError(null);
    setSubmissionError(null);

    if (!formData.finalMessage.trim()) {
      setValidationError('Please write a message from your heart before sending 💖');
      return;
    }

    setIsSubmitting(true);
    soundService.playSparkle();

    try {
      const result = await submitProposalAnswers(
        formData,
        girlfriendName,
        config.googleAppsScriptUrl
      );

      if (result.success) {
        setSubmissionSuccessId(result.submissionId);
        soundService.playCelebrationChime();

        // Mark as completed in session so reload won't re-submit
        try {
          sessionStorage.setItem(
            'romantic_proposal_submitted',
            JSON.stringify({ submissionId: result.submissionId, at: new Date().toISOString() })
          );
        } catch {
          // ignore
        }

        setCurrentStep(8);
      } else {
        setSubmissionError('Something went wrong while saving your answers. Please try again.');
      }
    } catch (err: any) {
      console.error('Submission failed:', err);
      setSubmissionError('Could not connect. Please check your internet connection and try again.');
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleRestart = () => {
    try {
      sessionStorage.removeItem('romantic_proposal_submitted');
    } catch {
      // ignore
    }
    setSubmissionSuccessId(null);
    goToStep(1);
  };

  return (
    <div className="relative min-h-[90vh] flex flex-col items-center justify-center px-4 py-8 md:py-16">
      {/* Celebration Confetti on Step 8 */}
      {currentStep === 8 && <ConfettiCanvas />}

      {/* Progress pill for Questions 1-4 (Steps 3-6) */}
      {currentStep >= 3 && currentStep <= 7 && (
        <div className="mb-6 flex items-center gap-2 text-xs text-pink-300/80 font-medium tracking-wide">
          <span>Step {currentStep - 2} of 5</span>
          <span aria-hidden="true">·</span>
          <span>From Your Heart</span>
          <span aria-hidden="true">·</span>
          <span className="flex items-center gap-1">
            {Array.from({ length: 5 }).map((_, idx) => (
              <span
                key={idx}
                className={`inline-block w-2 h-2 rounded-full transition-all duration-300 ${
                  idx === currentStep - 3
                    ? 'bg-[#ff007f] shadow-[0_0_8px_#ff007f] scale-125'
                    : idx < currentStep - 3
                    ? 'bg-pink-400'
                    : 'bg-pink-900/40'
                }`}
              />
            ))}
          </span>
        </div>
      )}

      {/* Main Glassmorphic Card Container */}
      <div className="w-full max-w-xl mx-auto glass-card rounded-3xl p-6 sm:p-10 text-center relative overflow-hidden transition-all duration-500 neon-glow-box">
        {/* Subtle decorative top neon rim */}
        <div className="absolute top-0 left-1/4 right-1/4 h-[2px] bg-gradient-to-r from-transparent via-[#ff007f] to-transparent shadow-[0_0_12px_#ff007f]" />

        {/* ------------------ SCREEN 1: WELCOME ------------------ */}
        {currentStep === 1 && (
          <div className="space-y-6 animate-fadeIn">
            {/* Animated Heart Icon */}
            <div className="inline-flex items-center justify-center w-20 h-20 rounded-full bg-[#ff007f]/10 border border-[#ff007f]/40 shadow-[0_0_20px_rgba(255,0,127,0.3)] animate-heartbeat mb-2">
              <Heart className="w-10 h-10 text-[#ff007f] fill-current drop-shadow-[0_0_10px_#ff007f]" />
            </div>

            <h1 className="text-3xl sm:text-4xl md:text-5xl font-dancing font-bold text-white neon-glow-text tracking-wide">
              Hey, {girlfriendName} ✨
            </h1>

            <p className="text-sm sm:text-base text-pink-100/90 leading-relaxed font-light max-w-md mx-auto">
              {config.welcomeMessage ||
                'Every single time I look at you, I find myself completely lost for words. You are one of the most beautiful parts of my life, and your smile makes even my ordinary days feel special.'}
            </p>

            {/* OPEN ❤️ Button with working first-click handler */}
            <div className="pt-4">
              <button
                type="button"
                id="openButton"
                onClick={() => goToStep(2)}
                className="w-full sm:w-auto px-8 py-4 rounded-full bg-[#ff007f] hover:bg-[#e60073] active:scale-95 text-white font-semibold text-base sm:text-lg tracking-wider transition-all duration-200 neon-glow-box-strong shadow-[0_0_30px_rgba(255,0,127,0.5)] flex items-center justify-center gap-3 mx-auto cursor-pointer"
              >
                <span>OPEN</span>
                <Heart className="w-5 h-5 fill-current animate-pulse" />
              </button>
            </div>

            <p className="text-xs text-pink-300/50 pt-2">
              Made with pure love, especially for you
            </p>
          </div>
        )}

        {/* ------------------ SCREEN 2: A LITTLE SURPRISE ------------------ */}
        {currentStep === 2 && (
          <div className="space-y-6 animate-fadeIn">
            <div className="inline-flex items-center justify-center w-16 h-16 rounded-full bg-[#ff007f]/10 border border-[#ff007f]/30 shadow-[0_0_15px_rgba(255,0,127,0.25)]">
              <Sparkles className="w-8 h-8 text-[#ff007f]" />
            </div>

            <h2 className="text-3xl sm:text-4xl font-dancing font-bold text-white neon-glow-text">
              For You... 💗
            </h2>

            <p className="text-sm sm:text-base text-pink-100/90 leading-relaxed font-light max-w-md mx-auto">
              {config.surpriseMessage ||
                "I've been wanting to ask you a few things for a while. Sometimes, words get difficult when you're right in front of me, so I made this little space just for us. Ready for a few questions from my heart?"}
            </p>

            <div className="pt-4 flex flex-col sm:flex-row items-center justify-center gap-3">
              <button
                type="button"
                onClick={() => goToStep(1)}
                className="w-full sm:w-auto px-5 py-3 rounded-full bg-white/5 hover:bg-white/10 text-pink-200/80 text-sm font-medium transition-colors flex items-center justify-center gap-2"
              >
                <ArrowLeft className="w-4 h-4" />
                <span>Reread</span>
              </button>
              <button
                type="button"
                onClick={() => goToStep(3)}
                className="w-full sm:w-auto px-8 py-3.5 rounded-full bg-[#ff007f] hover:bg-[#e60073] active:scale-95 text-white font-semibold text-base tracking-wider transition-all duration-200 neon-glow-box shadow-[0_0_25px_rgba(255,0,127,0.4)] flex items-center justify-center gap-2 cursor-pointer"
              >
                <span>LET'S DO IT</span>
                <Sparkles className="w-4 h-4" />
              </button>
            </div>
          </div>
        )}

        {/* ------------------ SCREEN 3: QUESTION ONE ------------------ */}
        {currentStep === 3 && (
          <div className="space-y-6 animate-fadeIn text-left">
            <div className="text-center">
              <span className="text-xs uppercase tracking-widest text-[#ff007f] font-semibold">
                Question 01
              </span>
              <h2 className="text-xl sm:text-2xl font-dancing font-bold text-white neon-glow-text mt-1 text-center">
                A Precious Memory 💭
              </h2>
            </div>

            <p className="text-sm sm:text-base text-pink-100/95 leading-relaxed font-medium text-center max-w-md mx-auto">
              "What is one special moment with me that always brings a smile to your face?"
            </p>

            <div className="space-y-2">
              <textarea
                value={formData.bestMemory}
                onChange={(e) => handleInputChange('bestMemory', e.target.value)}
                placeholder="Tell me about that memory..."
                rows={3}
                maxLength={1000}
                className="w-full p-4 rounded-2xl bg-black/40 border border-[#ff007f]/40 text-pink-50 placeholder:text-pink-300/40 text-sm focus:outline-none focus:border-[#ff007f] focus:ring-1 focus:ring-[#ff007f] transition-all resize-none"
              />
              <div className="flex justify-between items-center text-xs text-pink-300/50 px-1">
                <span>Take your time</span>
                <span>{formData.bestMemory.length}/1000</span>
              </div>
            </div>

            {validationError && (
              <div className="flex items-center gap-2 text-xs text-pink-400 justify-center bg-pink-950/40 p-2.5 rounded-xl border border-pink-500/30">
                <AlertCircle className="w-4 h-4 shrink-0" />
                <span>{validationError}</span>
              </div>
            )}

            <div className="pt-2 flex items-center justify-between gap-3">
              <button
                type="button"
                onClick={() => goToStep(2)}
                className="px-5 py-2.5 rounded-full bg-white/5 hover:bg-white/10 text-pink-200/80 text-sm font-medium transition-colors flex items-center gap-1.5"
              >
                <ArrowLeft className="w-4 h-4" />
                <span>Back</span>
              </button>
              <button
                type="button"
                onClick={() => handleNextFromStep(3)}
                className="px-7 py-3 rounded-full bg-[#ff007f] hover:bg-[#e60073] active:scale-95 text-white font-semibold text-sm tracking-wide transition-all duration-200 neon-glow-box shadow-[0_0_20px_rgba(255,0,127,0.4)] flex items-center gap-2 cursor-pointer"
              >
                <span>NEXT</span>
                <ArrowRight className="w-4 h-4" />
              </button>
            </div>
          </div>
        )}

        {/* ------------------ SCREEN 4: QUESTION TWO ------------------ */}
        {currentStep === 4 && (
          <div className="space-y-6 animate-fadeIn text-left">
            <div className="text-center">
              <span className="text-xs uppercase tracking-widest text-[#ff007f] font-semibold">
                Question 02
              </span>
              <h2 className="text-xl sm:text-2xl font-dancing font-bold text-white neon-glow-text mt-1 text-center">
                Our Getaway ✈️
              </h2>
            </div>

            <p className="text-sm sm:text-base text-pink-100/95 leading-relaxed font-medium text-center max-w-md mx-auto">
              "If we could escape from the world together for a weekend, where would you want us to go?"
            </p>

            <div className="space-y-2">
              <textarea
                value={formData.dreamDestination}
                onChange={(e) => handleInputChange('dreamDestination', e.target.value)}
                placeholder="Tell me our dream destination..."
                rows={3}
                maxLength={1000}
                className="w-full p-4 rounded-2xl bg-black/40 border border-[#ff007f]/40 text-pink-50 placeholder:text-pink-300/40 text-sm focus:outline-none focus:border-[#ff007f] focus:ring-1 focus:ring-[#ff007f] transition-all resize-none"
              />
              <div className="flex justify-between items-center text-xs text-pink-300/50 px-1">
                <span>Any place in the world</span>
                <span>{formData.dreamDestination.length}/1000</span>
              </div>
            </div>

            {validationError && (
              <div className="flex items-center gap-2 text-xs text-pink-400 justify-center bg-pink-950/40 p-2.5 rounded-xl border border-pink-500/30">
                <AlertCircle className="w-4 h-4 shrink-0" />
                <span>{validationError}</span>
              </div>
            )}

            <div className="pt-2 flex items-center justify-between gap-3">
              <button
                type="button"
                onClick={() => goToStep(3)}
                className="px-5 py-2.5 rounded-full bg-white/5 hover:bg-white/10 text-pink-200/80 text-sm font-medium transition-colors flex items-center gap-1.5"
              >
                <ArrowLeft className="w-4 h-4" />
                <span>Back</span>
              </button>
              <button
                type="button"
                onClick={() => handleNextFromStep(4)}
                className="px-7 py-3 rounded-full bg-[#ff007f] hover:bg-[#e60073] active:scale-95 text-white font-semibold text-sm tracking-wide transition-all duration-200 neon-glow-box shadow-[0_0_20px_rgba(255,0,127,0.4)] flex items-center gap-2 cursor-pointer"
              >
                <span>NEXT</span>
                <ArrowRight className="w-4 h-4" />
              </button>
            </div>
          </div>
        )}

        {/* ------------------ SCREEN 5: QUESTION THREE ------------------ */}
        {currentStep === 5 && (
          <div className="space-y-6 animate-fadeIn text-left">
            <div className="text-center">
              <span className="text-xs uppercase tracking-widest text-[#ff007f] font-semibold">
                Question 03
              </span>
              <h2 className="text-xl sm:text-2xl font-dancing font-bold text-white neon-glow-text mt-1 text-center">
                Honest Confession 😄
              </h2>
            </div>

            <p className="text-sm sm:text-base text-pink-100/95 leading-relaxed font-medium text-center max-w-md mx-auto">
              "What is one of my annoying habits that you secretly find cute?"
            </p>

            <div className="space-y-2">
              <textarea
                value={formData.cuteHabit}
                onChange={(e) => handleInputChange('cuteHabit', e.target.value)}
                placeholder="Be honest with me 😄"
                rows={3}
                maxLength={1000}
                className="w-full p-4 rounded-2xl bg-black/40 border border-[#ff007f]/40 text-pink-50 placeholder:text-pink-300/40 text-sm focus:outline-none focus:border-[#ff007f] focus:ring-1 focus:ring-[#ff007f] transition-all resize-none"
              />
              <div className="flex justify-between items-center text-xs text-pink-300/50 px-1">
                <span>No judgment here!</span>
                <span>{formData.cuteHabit.length}/1000</span>
              </div>
            </div>

            {validationError && (
              <div className="flex items-center gap-2 text-xs text-pink-400 justify-center bg-pink-950/40 p-2.5 rounded-xl border border-pink-500/30">
                <AlertCircle className="w-4 h-4 shrink-0" />
                <span>{validationError}</span>
              </div>
            )}

            <div className="pt-2 flex items-center justify-between gap-3">
              <button
                type="button"
                onClick={() => goToStep(4)}
                className="px-5 py-2.5 rounded-full bg-white/5 hover:bg-white/10 text-pink-200/80 text-sm font-medium transition-colors flex items-center gap-1.5"
              >
                <ArrowLeft className="w-4 h-4" />
                <span>Back</span>
              </button>
              <button
                type="button"
                onClick={() => handleNextFromStep(5)}
                className="px-7 py-3 rounded-full bg-[#ff007f] hover:bg-[#e60073] active:scale-95 text-white font-semibold text-sm tracking-wide transition-all duration-200 neon-glow-box shadow-[0_0_20px_rgba(255,0,127,0.4)] flex items-center gap-2 cursor-pointer"
              >
                <span>NEXT</span>
                <ArrowRight className="w-4 h-4" />
              </button>
            </div>
          </div>
        )}

        {/* ------------------ SCREEN 6: QUESTION FOUR ------------------ */}
        {currentStep === 6 && (
          <div className="space-y-6 animate-fadeIn text-left">
            <div className="text-center">
              <span className="text-xs uppercase tracking-widest text-[#ff007f] font-semibold">
                Question 04
              </span>
              <h2 className="text-xl sm:text-2xl font-dancing font-bold text-white neon-glow-text mt-1 text-center">
                Our Soundtrack 🎶
              </h2>
            </div>

            <p className="text-sm sm:text-base text-pink-100/95 leading-relaxed font-medium text-center max-w-md mx-auto">
              "Which song reminds you of us whenever you hear it?"
            </p>

            <div className="space-y-2">
              <input
                type="text"
                value={formData.ourSong}
                onChange={(e) => handleInputChange('ourSong', e.target.value)}
                placeholder="Our special song 🎶"
                maxLength={300}
                className="w-full p-4 rounded-2xl bg-black/40 border border-[#ff007f]/40 text-pink-50 placeholder:text-pink-300/40 text-sm focus:outline-none focus:border-[#ff007f] focus:ring-1 focus:ring-[#ff007f] transition-all"
              />
              <div className="flex justify-between items-center text-xs text-pink-300/50 px-1">
                <span>A melody that holds our memories</span>
                <span>{formData.ourSong.length}/300</span>
              </div>
            </div>

            {validationError && (
              <div className="flex items-center gap-2 text-xs text-pink-400 justify-center bg-pink-950/40 p-2.5 rounded-xl border border-pink-500/30">
                <AlertCircle className="w-4 h-4 shrink-0" />
                <span>{validationError}</span>
              </div>
            )}

            <div className="pt-2 flex items-center justify-between gap-3">
              <button
                type="button"
                onClick={() => goToStep(5)}
                className="px-5 py-2.5 rounded-full bg-white/5 hover:bg-white/10 text-pink-200/80 text-sm font-medium transition-colors flex items-center gap-1.5"
              >
                <ArrowLeft className="w-4 h-4" />
                <span>Back</span>
              </button>
              <button
                type="button"
                onClick={() => handleNextFromStep(6)}
                className="px-7 py-3 rounded-full bg-[#ff007f] hover:bg-[#e60073] active:scale-95 text-white font-semibold text-sm tracking-wide transition-all duration-200 neon-glow-box shadow-[0_0_20px_rgba(255,0,127,0.4)] flex items-center gap-2 cursor-pointer"
              >
                <span>NEXT</span>
                <ArrowRight className="w-4 h-4" />
              </button>
            </div>
          </div>
        )}

        {/* ------------------ SCREEN 7: HER HEART'S MESSAGE ------------------ */}
        {currentStep === 7 && (
          <form onSubmit={handleSubmit} className="space-y-6 animate-fadeIn text-left">
            <div className="text-center">
              <span className="text-xs uppercase tracking-widest text-[#ff007f] font-semibold">
                Final Step
              </span>
              <h2 className="text-2xl sm:text-3xl font-dancing font-bold text-white neon-glow-text mt-1 text-center">
                One Last Thing, My Love 💌
              </h2>
            </div>

            <p className="text-sm sm:text-base text-pink-100/95 leading-relaxed font-light text-center max-w-md mx-auto">
              "If there's anything you've wanted to tell me about us, your feelings, or your dreams, this is your space. Write whatever your heart wants."
            </p>

            <div className="space-y-2">
              <textarea
                value={formData.finalMessage}
                onChange={(e) => handleInputChange('finalMessage', e.target.value)}
                placeholder="Write your heart out... I'm listening ❤️"
                rows={5}
                maxLength={4000}
                required
                className="w-full p-4 rounded-2xl bg-black/40 border border-[#ff007f]/40 text-pink-50 placeholder:text-pink-300/40 text-sm focus:outline-none focus:border-[#ff007f] focus:ring-1 focus:ring-[#ff007f] transition-all resize-none"
              />
              <div className="flex justify-between items-center text-xs text-pink-300/50 px-1">
                <span>Everything you say is treasured forever</span>
                <span>{formData.finalMessage.length}/4000</span>
              </div>
            </div>

            {/* Privacy Note */}
            <p className="text-[11px] text-pink-300/60 text-center leading-relaxed max-w-sm mx-auto">
              🔒 <span className="font-medium text-pink-200">Private & Confidential:</span> Your answers will be delivered directly and privately to me.
            </p>

            {validationError && (
              <div className="flex items-center gap-2 text-xs text-pink-400 justify-center bg-pink-950/40 p-2.5 rounded-xl border border-pink-500/30">
                <AlertCircle className="w-4 h-4 shrink-0" />
                <span>{validationError}</span>
              </div>
            )}

            {submissionError && (
              <div className="flex items-center gap-2 text-xs text-pink-300 justify-center bg-red-950/60 p-3 rounded-xl border border-red-500/40">
                <AlertCircle className="w-4 h-4 text-red-400 shrink-0" />
                <span>{submissionError}</span>
              </div>
            )}

            <div className="pt-2 flex items-center justify-between gap-3">
              <button
                type="button"
                disabled={isSubmitting}
                onClick={() => goToStep(6)}
                className="px-5 py-2.5 rounded-full bg-white/5 hover:bg-white/10 text-pink-200/80 text-sm font-medium transition-colors flex items-center gap-1.5 disabled:opacity-50"
              >
                <ArrowLeft className="w-4 h-4" />
                <span>Back</span>
              </button>
              <button
                type="submit"
                disabled={isSubmitting}
                className="px-8 py-3.5 rounded-full bg-[#ff007f] hover:bg-[#e60073] active:scale-95 text-white font-semibold text-base tracking-wider transition-all duration-200 neon-glow-box-strong shadow-[0_0_30px_rgba(255,0,127,0.5)] flex items-center gap-2 disabled:opacity-60 cursor-pointer"
              >
                {isSubmitting ? (
                  <>
                    <RefreshCw className="w-4 h-4 animate-spin" />
                    <span>Delivering... 💖</span>
                  </>
                ) : (
                  <>
                    <span>SEND TO ME</span>
                    <Heart className="w-4 h-4 fill-current animate-pulse" />
                  </>
                )}
              </button>
            </div>
          </form>
        )}

        {/* ------------------ SCREEN 8: THANK YOU ------------------ */}
        {currentStep === 8 && (
          <div className="space-y-6 animate-fadeIn">
            <div className="inline-flex items-center justify-center w-24 h-24 rounded-full bg-[#ff007f]/20 border-2 border-[#ff007f] shadow-[0_0_35px_rgba(255,0,127,0.6)] animate-heartbeat-fast mb-1">
              <Heart className="w-12 h-12 text-[#ff007f] fill-current drop-shadow-[0_0_15px_#ff007f]" />
            </div>

            <h1 className="text-3xl sm:text-4xl md:text-5xl font-dancing font-bold text-white neon-glow-text leading-tight">
              Thank You, My Love! 🥹❤️
            </h1>

            <p className="text-sm sm:text-base text-pink-100 leading-relaxed font-light max-w-md mx-auto">
              {config.thankYouMessage ||
                "Thank you for sharing a little piece of your heart with me. Every word matters to me, and I'm so lucky to have these memories with you."}
            </p>

            <div className="p-4 rounded-2xl bg-black/40 border border-[#ff007f]/30 max-w-sm mx-auto text-xs text-pink-200/80 space-y-1.5">
              <div className="flex items-center justify-center gap-2 text-emerald-400 font-medium">
                <CheckCircle2 className="w-4 h-4" />
                <span>Safely saved to my heart</span>
              </div>
              {submissionSuccessId && (
                <p className="text-[11px] text-pink-300/50 font-mono">
                  Receipt: {submissionSuccessId}
                </p>
              )}
            </div>

            <p className="font-dancing text-xl sm:text-2xl text-pink-300 neon-glow-text-subtle">
              Forever & Always, <br />
              {config.yourName || 'Yours Forever'} 🌹
            </p>

            <div className="pt-4 flex items-center justify-center gap-3">
              <button
                type="button"
                onClick={handleRestart}
                className="px-6 py-2.5 rounded-full bg-white/5 hover:bg-white/10 text-pink-200/70 hover:text-pink-100 text-xs font-medium transition-colors flex items-center gap-2"
              >
                <RefreshCw className="w-3.5 h-3.5" />
                <span>Reread My Words</span>
              </button>
            </div>
          </div>
        )}
      </div>
    </div>
  );
};
