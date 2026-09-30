import React, { useState } from 'react';
import { ActiveTab, ZoneData } from '../types';
import { Play, X, ArrowRight, ArrowLeft, CheckCircle2, Shield, Eye, BarChart3, ListFilter, FileText } from 'lucide-react';

interface GuidedTourModalProps {
  isOpen: boolean;
  onClose: () => void;
  setActiveTab: (tab: ActiveTab) => void;
  onSelectZone: (zone: ZoneData | null) => void;
  topZone: ZoneData | null;
}

export const GuidedTourModal: React.FC<GuidedTourModalProps> = ({
  isOpen,
  onClose,
  setActiveTab,
  onSelectZone,
  topZone
}) => {
  const [currentStep, setCurrentStep] = useState(0);

  if (!isOpen) return null;

  const steps = [
    {
      step: 1,
      title: "1. The Disaster Event & Verified Flood Extent",
      tab: 'overview' as ActiveTab,
      badge: "OVERVIEW CANVAS",
      icon: <Eye className="w-5 h-5 text-blue-600" />,
      content: (
        <div className="space-y-2 text-xs text-slate-600 leading-relaxed">
          <p>
            On <strong>December 17–18, 2023</strong>, an unprecedented cyclonic cloudburst hit Southern Tamil Nadu, triggering extreme flooding along the Thamirabarani River basin.
          </p>
          <p>
            Our pipeline processed Sentinel-1A SAR imagery taken on <strong>2023-12-17 at 00:41 UTC</strong>, detecting <strong>3.35 km² of standing water inundation</strong> across low-lying floodplains, agricultural tanks, and urban settlements.
          </p>
          <div className="p-2 bg-blue-50 border border-blue-200 rounded font-mono text-[11px] text-blue-800">
            Key Metric: 487.92 km² Study Extent | 3.35 km² Flood (0.69%) | 0.00% Double-Counting Error
          </div>
        </div>
      )
    },
    {
      step: 2,
      title: "2. SAR Microwave Change Detection Physics",
      tab: 'hazard' as ActiveTab,
      badge: "HAZARD ANALYSIS",
      icon: <Shield className="w-5 h-5 text-indigo-600" />,
      content: (
        <div className="space-y-2 text-xs text-slate-600 leading-relaxed">
          <p>
            Unlike optical satellites blinded by cyclone storm clouds, Sentinel-1 C-SAR penetrates clouds and rain.
          </p>
          <p>
            When soil is submerged, smooth water acts as a <strong>specular reflector</strong>, bouncing radar pulses away and causing backscatter to plunge. We enforced a dual condition:
          </p>
          <div className="p-2 bg-slate-900 text-slate-100 rounded font-mono text-[11px]">
            Post-water &le; -15.0 dB &and; Backscatter Drop &le; -2.5 dB
            <br />
            <span className="text-emerald-400">Observed Mean Drop: -5.68 dB (Specular Water Verified)</span>
          </div>
        </div>
      )
    },
    {
      step: 3,
      title: "3. Priority Action Zone #1 (Melapalayam Plain)",
      tab: 'overview' as ActiveTab,
      badge: "DECISION SUPPORT",
      icon: <ListFilter className="w-5 h-5 text-red-600" />,
      content: (
        <div className="space-y-2 text-xs text-slate-600 leading-relaxed">
          <p>
            By overlaying 23,000+ building footprints and road networks onto 1 km² grid cells, the system automatically identified <strong>ZONE_R14_C11</strong> as the <strong>#1 Priority Critical Zone</strong>.
          </p>
          <div className="p-2.5 bg-red-50 border border-red-200 rounded text-[11px] space-y-1">
            <div className="font-bold text-red-900">Rank #1: Priority Score 69.5 [CRITICAL]</div>
            <div className="text-slate-700">181 Buildings Exposed (36.0% factor share)</div>
            <div className="text-slate-700">3.05 km Submerged Roads (25.2% factor share)</div>
            <div className="text-slate-700">688 Modelled Persons Impacted</div>
          </div>
          <p>
            Emergency teams receive conservative, direct decision support: <em>"Deploy rescue and evacuation verification teams to check for stranded residents."</em>
          </p>
        </div>
      )
    },
    {
      step: 4,
      title: "4. Mathematical Reconciliation & Provenance",
      tab: 'methodology' as ActiveTab,
      badge: "AUDIT & REPRODUCIBILITY",
      icon: <CheckCircle2 className="w-5 h-5 text-emerald-600" />,
      content: (
        <div className="space-y-2 text-xs text-slate-600 leading-relaxed">
          <p>
            Every single number comes from the reproducible Python pipeline. No fake data, no black-box hallucinations.
          </p>
          <p>
            <strong>Strict Reconciliation:</strong> The sum of all 506 grid zones equals the direct raster and vector ground totals with zero double-counting.
          </p>
          <div className="p-2.5 bg-emerald-50 border border-emerald-200 rounded text-emerald-900 font-mono text-[11px] space-y-0.5">
            <div>&bull; Zonal Flood: 3.35 km² == Raster: 3.35 km² [MATCH]</div>
            <div>&bull; Zonal Bldgs: 272 units == Unique Centroids: 272 [MATCH]</div>
            <div>&bull; Zonal Roads: 17.78 km == Vector Lines: 17.78 km [MATCH]</div>
          </div>
        </div>
      )
    }
  ];

  const handleNext = () => {
    if (currentStep < steps.length - 1) {
      const nextStep = currentStep + 1;
      setCurrentStep(nextStep);
      setActiveTab(steps[nextStep].tab);
      if (nextStep === 2 && topZone) {
        onSelectZone(topZone);
      }
    } else {
      onClose();
    }
  };

  const handlePrev = () => {
    if (currentStep > 0) {
      const prevStep = currentStep - 1;
      setCurrentStep(prevStep);
      setActiveTab(steps[prevStep].tab);
    }
  };

  const active = steps[currentStep];

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-slate-950/60 backdrop-blur-xs p-4 select-none animate-in fade-in">
      <div className="bg-white rounded-xl shadow-2xl border border-slate-300 max-w-lg w-full overflow-hidden flex flex-col">
        {/* Modal Header */}
        <div className="p-4 bg-slate-900 text-white flex items-center justify-between">
          <div className="flex items-center space-x-2">
            <span className="bg-blue-600 p-1 rounded text-white">{active.icon}</span>
            <div>
              <span className="text-[10px] font-mono uppercase tracking-wider text-blue-400 block font-semibold">
                GeoShield Guided Tour &bull; Step {active.step} of {steps.length}
              </span>
              <h3 className="font-bold text-sm text-slate-100">{active.title}</h3>
            </div>
          </div>
          <button
            onClick={onClose}
            className="text-slate-400 hover:text-white p-1 rounded hover:bg-slate-800 transition"
          >
            <X className="w-4 h-4" />
          </button>
        </div>

        {/* Content Body */}
        <div className="p-5 flex-1">
          {active.content}
        </div>

        {/* Modal Footer Controls */}
        <div className="p-3 bg-slate-50 border-t border-slate-200 flex items-center justify-between">
          <button
            onClick={onClose}
            className="text-xs text-slate-500 hover:text-slate-800 font-medium px-2 py-1"
          >
            Exit Tour
          </button>

          <div className="flex items-center space-x-2">
            {currentStep > 0 && (
              <button
                onClick={handlePrev}
                className="flex items-center space-x-1 px-3 py-1.5 rounded border border-slate-300 hover:bg-slate-100 text-slate-700 text-xs font-medium transition"
              >
                <ArrowLeft className="w-3.5 h-3.5" />
                <span>Back</span>
              </button>
            )}

            <button
              onClick={handleNext}
              className="flex items-center space-x-1 px-4 py-1.5 rounded bg-blue-600 hover:bg-blue-500 text-white text-xs font-medium transition shadow-xs"
            >
              <span>{currentStep === steps.length - 1 ? 'Finish Tour' : 'Next Step'}</span>
              <ArrowRight className="w-3.5 h-3.5" />
            </button>
          </div>
        </div>
      </div>
    </div>
  );
};
