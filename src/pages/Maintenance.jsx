import React from 'react';
import { Wrench, Clock, RefreshCw, Sun, ShieldCheck } from 'lucide-react';

export default function Maintenance() {
  const handleRefresh = () => {
    window.location.reload();
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-900 via-slate-800 to-amber-950 flex items-center justify-center p-4 sm:p-6 select-none">
      {/* Background ambient decorative glows */}
      <div className="absolute inset-0 overflow-hidden pointer-events-none">
        <div className="absolute -top-40 -right-40 w-96 h-96 bg-amber-500/10 rounded-full blur-3xl" />
        <div className="absolute -bottom-40 -left-40 w-96 h-96 bg-orange-600/10 rounded-full blur-3xl" />
      </div>

      <div className="relative w-full max-w-xl bg-slate-900/80 backdrop-blur-xl border border-slate-700/60 rounded-3xl shadow-2xl p-8 sm:p-12 text-center text-white">
        {/* Brand header */}
        <div className="inline-flex items-center gap-2.5 px-4 py-1.5 rounded-full bg-amber-500/10 border border-amber-500/20 text-amber-400 text-xs sm:text-sm font-medium mb-6">
          <Sun className="w-4 h-4 text-amber-400 animate-spin" style={{ animationDuration: '10s' }} />
          <span>Solarkits ERP & CRM</span>
        </div>

        {/* Central Icon Illustration */}
        <div className="relative mx-auto mb-6 w-24 h-24 sm:w-28 sm:h-28 flex items-center justify-center">
          <div className="absolute inset-0 rounded-3xl bg-gradient-to-tr from-amber-500/20 to-orange-500/20 blur-xl animate-pulse" />
          <div className="relative w-full h-full rounded-3xl bg-slate-800/90 border border-slate-700 flex items-center justify-center shadow-inner">
            <Wrench className="w-12 h-12 sm:w-14 sm:h-14 text-amber-400 animate-bounce" style={{ animationDuration: '2.5s' }} />
            <div className="absolute -bottom-1 -right-1 p-1.5 bg-amber-500 rounded-xl shadow-lg text-slate-950">
              <Clock className="w-4 h-4" />
            </div>
          </div>
        </div>

        {/* Status Badge */}
        <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-red-500/10 border border-red-500/30 text-red-400 text-xs font-semibold uppercase tracking-wider mb-4">
          <span className="w-2 h-2 rounded-full bg-red-400 animate-ping" />
          Temporarily Offline / Under Maintenance
        </div>

        {/* Title */}
        <h1 className="text-2xl sm:text-3xl font-bold tracking-tight text-white mb-3">
          CRM is Temporarily Unavailable
        </h1>

        {/* Description */}
        <p className="text-slate-300 text-sm sm:text-base leading-relaxed mb-2">
          We are currently performing scheduled system updates and maintenance to serve you better.
        </p>
        <p className="text-amber-200/80 text-xs sm:text-sm font-medium mb-8">
          (Hum system par zaroori kaam kar rahe hain. CRM jald hi dobara chalu ho jayega.)
        </p>

        {/* Status Features Card */}
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 mb-8 text-left">
          <div className="p-3.5 rounded-2xl bg-slate-800/60 border border-slate-700/50 flex items-start gap-3">
            <ShieldCheck className="w-5 h-5 text-emerald-400 shrink-0 mt-0.5" />
            <div>
              <p className="text-xs font-semibold text-slate-200">Data is 100% Safe</p>
              <p className="text-[11px] text-slate-400">All records, projects & orders are completely secure.</p>
            </div>
          </div>

          <div className="p-3.5 rounded-2xl bg-slate-800/60 border border-slate-700/50 flex items-start gap-3">
            <Clock className="w-5 h-5 text-amber-400 shrink-0 mt-0.5" />
            <div>
              <p className="text-xs font-semibold text-slate-200">Service Status</p>
              <p className="text-[11px] text-slate-400">Restoration in progress. Please check back shortly.</p>
            </div>
          </div>
        </div>

        {/* Action Button */}
        <div className="flex flex-col sm:flex-row items-center justify-center gap-3">
          <button
            onClick={handleRefresh}
            className="w-full sm:w-auto inline-flex items-center justify-center gap-2 px-6 py-3 rounded-xl bg-gradient-to-r from-amber-500 to-orange-500 hover:from-amber-600 hover:to-orange-600 text-slate-950 font-semibold text-sm transition-all shadow-lg shadow-amber-500/20 active:scale-95 cursor-pointer"
          >
            <RefreshCw className="w-4 h-4" />
            Check Again / Refresh Page
          </button>
        </div>

        {/* Footer Note */}
        <div className="mt-8 pt-6 border-t border-slate-800 text-xs text-slate-400">
          Need urgent assistance? Please contact your system administrator.
        </div>
      </div>
    </div>
  );
}
