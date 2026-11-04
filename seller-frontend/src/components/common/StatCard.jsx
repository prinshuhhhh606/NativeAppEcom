import React from 'react';

export const StatCard = ({
  title,
  value,
  subtitle,
  icon: Icon,
  color = 'blue',
  gradient = false,
  trend,
  trendLabel,
  badge,
}) => {
  // Themes for modern light cards
  const themeMap = {
    blue: {
      border: 'border-blue-100/80 dark:border-blue-900/40 hover:border-blue-300',
      iconBg: 'bg-gradient-to-tr from-blue-600 to-indigo-600 text-white shadow-md shadow-blue-500/25',
      trendBg: 'bg-blue-50 text-blue-700 dark:bg-blue-950/60 dark:text-blue-300',
      glow: 'hover:shadow-glow-primary',
    },
    purple: {
      border: 'border-purple-100/80 dark:border-purple-900/40 hover:border-purple-300',
      iconBg: 'bg-gradient-to-tr from-purple-600 to-indigo-600 text-white shadow-md shadow-purple-500/25',
      trendBg: 'bg-purple-50 text-purple-700 dark:bg-purple-950/60 dark:text-purple-300',
      glow: 'hover:shadow-glow-secondary',
    },
    orange: {
      border: 'border-orange-100/80 dark:border-orange-900/40 hover:border-orange-300',
      iconBg: 'bg-gradient-to-tr from-amber-500 to-orange-600 text-white shadow-md shadow-orange-500/25',
      trendBg: 'bg-orange-50 text-orange-700 dark:bg-orange-950/60 dark:text-orange-300',
      glow: 'hover:shadow-glow-accent',
    },
    green: {
      border: 'border-emerald-100/80 dark:border-emerald-900/40 hover:border-emerald-300',
      iconBg: 'bg-gradient-to-tr from-emerald-500 to-teal-600 text-white shadow-md shadow-emerald-500/25',
      trendBg: 'bg-emerald-50 text-emerald-700 dark:bg-emerald-950/60 dark:text-emerald-300',
      glow: 'hover:shadow-glow-success',
    },
    rose: {
      border: 'border-rose-100/80 dark:border-rose-900/40 hover:border-rose-300',
      iconBg: 'bg-gradient-to-tr from-rose-500 to-pink-600 text-white shadow-md shadow-rose-500/25',
      trendBg: 'bg-rose-50 text-rose-700 dark:bg-rose-950/60 dark:text-rose-300',
      glow: 'hover:shadow-rose-500/20',
    },
    indigo: {
      border: 'border-indigo-100/80 dark:border-indigo-900/40 hover:border-indigo-300',
      iconBg: 'bg-gradient-to-tr from-indigo-600 to-blue-600 text-white shadow-md shadow-indigo-500/25',
      trendBg: 'bg-indigo-50 text-indigo-700 dark:bg-indigo-950/60 dark:text-indigo-300',
      glow: 'hover:shadow-indigo-500/20',
    },
  };

  const gradientCardMap = {
    blue: 'bg-gradient-to-br from-blue-600 via-blue-700 to-indigo-800 text-white shadow-lg shadow-blue-600/20',
    purple: 'bg-gradient-to-br from-purple-600 via-purple-700 to-indigo-800 text-white shadow-lg shadow-purple-600/20',
    orange: 'bg-gradient-to-br from-amber-500 via-orange-600 to-red-600 text-white shadow-lg shadow-orange-600/20',
    green: 'bg-gradient-to-br from-emerald-500 via-teal-600 to-cyan-700 text-white shadow-lg shadow-emerald-600/20',
    rose: 'bg-gradient-to-br from-pink-500 via-rose-600 to-red-700 text-white shadow-lg shadow-rose-600/20',
  };

  const selectedTheme = themeMap[color] || themeMap.blue;

  if (gradient) {
    const cardBg = gradientCardMap[color] || gradientCardMap.blue;
    return (
      <div className={`relative overflow-hidden rounded-3xl p-6 transition-all duration-300 hover:-translate-y-1 ${cardBg}`}>
        {/* Background glow circle */}
        <div className="absolute -right-6 -bottom-6 w-32 h-32 rounded-full bg-white/10 blur-xl pointer-events-none" />
        <div className="relative z-10 flex items-center justify-between">
          <span className="text-xs font-bold tracking-wider uppercase text-white/80">{title}</span>
          {Icon && (
            <div className="w-12 h-12 rounded-2xl bg-white/20 backdrop-blur-md flex items-center justify-center text-white border border-white/20">
              <Icon className="w-6 h-6" />
            </div>
          )}
        </div>
        <div className="relative z-10 mt-4">
          <h3 className="text-3xl font-extrabold tracking-tight text-white">{value}</h3>
          <div className="mt-2.5 flex items-center gap-2">
            {trend !== undefined && (
              <span className="inline-flex items-center text-xs font-extrabold px-2 py-0.5 rounded-full bg-white/20 backdrop-blur-md text-white">
                {trend >= 0 ? '↑ +' : '↓ '}{Math.abs(trend)}%
              </span>
            )}
            {(subtitle || trendLabel) && (
              <p className="text-xs font-medium text-white/80">{subtitle || trendLabel}</p>
            )}
          </div>
        </div>
      </div>
    );
  }

  return (
    <div
      className={`relative overflow-hidden bg-white dark:bg-slate-900 rounded-3xl p-6 border shadow-sm transition-all duration-300 hover:-translate-y-1 hover:shadow-card-hover ${selectedTheme.border} ${selectedTheme.glow}`}
    >
      <div className="flex items-center justify-between">
        <span className="text-xs font-bold uppercase tracking-wider text-slate-500 dark:text-slate-400">
          {title}
        </span>
        {Icon && (
          <div className={`w-12 h-12 rounded-2xl flex items-center justify-center ${selectedTheme.iconBg}`}>
            <Icon className="w-6 h-6" />
          </div>
        )}
      </div>

      <div className="mt-4">
        <h3 className="text-3xl font-extrabold tracking-tight text-slate-900 dark:text-white">
          {value}
        </h3>

        <div className="mt-2.5 flex items-center gap-2 flex-wrap">
          {trend !== undefined && (
            <span
              className={`inline-flex items-center text-xs font-extrabold px-2.5 py-0.5 rounded-full ${
                trend >= 0
                  ? 'bg-emerald-50 dark:bg-emerald-950/60 text-emerald-600 dark:text-emerald-400'
                  : 'bg-rose-50 dark:bg-rose-950/60 text-rose-600 dark:text-rose-400'
              }`}
            >
              {trend >= 0 ? '↑ +' : '↓ '}{Math.abs(trend)}%
            </span>
          )}
          {badge && (
            <span className={`inline-flex items-center text-[11px] font-bold px-2 py-0.5 rounded-md ${selectedTheme.trendBg}`}>
              {badge}
            </span>
          )}
          {(subtitle || trendLabel) && (
            <p className="text-xs text-slate-500 dark:text-slate-400 font-medium">
              {subtitle || trendLabel}
            </p>
          )}
        </div>
      </div>
    </div>
  );
};

export default StatCard;
