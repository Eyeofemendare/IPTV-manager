import React from 'react';
import { Layers, SlidersHorizontal, Radio, CloudRain, Check, ArrowRight, ArrowLeft } from 'lucide-react';

interface WizardStepsProps {
  currentStep: number;
  onSelectStep: (step: number) => void;
  channelCount: number;
  selectedCount: number;
  mappedCount: number;
}

export const WizardSteps: React.FC<WizardStepsProps> = ({
  currentStep,
  onSelectStep,
  channelCount,
  selectedCount,
  mappedCount,
}) => {
  const steps = [
    {
      number: 1,
      title: '1. Πηγές',
      subtitle: 'Sources',
      icon: Layers,
      badge: channelCount > 0 ? `${channelCount} κανάλια` : 'M3U / Xtream',
      status: channelCount > 0 ? 'completed' : 'active',
    },
    {
      number: 2,
      title: '2. Κατηγορίες & Φίλτρα',
      subtitle: 'Groups & Filters',
      icon: SlidersHorizontal,
      badge: selectedCount > 0 ? `${selectedCount} επιλεγμένα` : 'Επιλογή',
      status: selectedCount > 0 ? 'completed' : 'pending',
    },
    {
      number: 3,
      title: '3. Χαρτογράφηση EPG',
      subtitle: 'EPG Mapper & Guide',
      icon: Radio,
      badge: mappedCount > 0 ? `${mappedCount} με EPG` : 'Auto-Match',
      status: mappedCount > 0 ? 'completed' : 'pending',
    },
    {
      number: 4,
      title: '4. Cloud & Smart TV',
      subtitle: 'Sync & QR Code',
      icon: CloudRain,
      badge: 'QR & URLs',
      status: 'pending',
    },
  ];

  return (
    <div className="w-full bg-slate-900/60 border-b border-slate-800/80 py-4 px-4 sm:px-8">
      <div className="max-w-7xl mx-auto">
        <div className="grid grid-cols-2 md:grid-cols-4 gap-2 sm:gap-4">
          {steps.map((step) => {
            const isActive = currentStep === step.number;
            const isCompleted = currentStep > step.number || (step.number === 1 && channelCount > 0);
            const Icon = step.icon;

            return (
              <button
                key={step.number}
                id={`wizard-step-${step.number}`}
                onClick={() => onSelectStep(step.number)}
                className={`relative text-left p-3 rounded-xl border transition-all flex items-center gap-3 ${
                  isActive
                    ? 'bg-slate-800/90 border-emerald-500/50 shadow-lg shadow-emerald-500/10 ring-1 ring-emerald-500/30'
                    : isCompleted
                    ? 'bg-slate-900/40 border-slate-800 hover:border-slate-700 text-slate-300'
                    : 'bg-slate-950/40 border-slate-800/60 opacity-80 hover:opacity-100 text-slate-400'
                }`}
              >
                {/* Step Circle Indicator */}
                <div
                  className={`w-9 h-9 rounded-lg flex items-center justify-center font-bold text-xs shrink-0 transition-colors ${
                    isActive
                      ? 'bg-emerald-500 text-slate-950 shadow-md shadow-emerald-500/20'
                      : isCompleted
                      ? 'bg-emerald-500/20 text-emerald-400 border border-emerald-500/30'
                      : 'bg-slate-800 text-slate-400'
                  }`}
                >
                  {isCompleted && !isActive ? <Check className="w-4 h-4 stroke-[3]" /> : <Icon className="w-4 h-4" />}
                </div>

                {/* Step Text Info */}
                <div className="overflow-hidden min-w-0 flex-1">
                  <div className="flex items-center justify-between gap-1">
                    <span
                      className={`text-xs sm:text-sm font-bold truncate block ${
                        isActive ? 'text-white' : 'text-slate-300'
                      }`}
                    >
                      {step.title}
                    </span>
                  </div>
                  <div className="flex items-center justify-between mt-0.5">
                    <span className="text-[11px] text-slate-400 truncate">{step.subtitle}</span>
                    <span
                      className={`text-[10px] px-1.5 py-0.5 rounded font-medium truncate ${
                        isActive
                          ? 'bg-emerald-500/20 text-emerald-300'
                          : 'bg-slate-800/80 text-slate-400'
                      }`}
                    >
                      {step.badge}
                    </span>
                  </div>
                </div>

                {/* Bottom Active Line Accent */}
                {isActive && (
                  <div className="absolute bottom-0 left-3 right-3 h-0.5 bg-gradient-to-r from-emerald-500 to-cyan-400 rounded-full" />
                )}
              </button>
            );
          })}
        </div>
      </div>
    </div>
  );
};
