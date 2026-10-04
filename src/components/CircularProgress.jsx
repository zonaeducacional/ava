import React from 'react';

/**
 * Componente de Progresso Circular em SVG
 * Exibe a porcentagem de conclusão de forma visual e acessível.
 */
export default function CircularProgress({
  percent = 0,
  size = 60,
  strokeWidth = 5,
  showText = true,
  color
}) {
  const normalizedPercent = Math.min(Math.max(Math.round(percent), 0), 100);
  const radius = (size - strokeWidth) / 2;
  const circumference = 2 * Math.PI * radius;
  const strokeDashoffset = circumference - (normalizedPercent / 100) * circumference;

  // Cor dinâmica baseada no nível de conclusão se não for passada explicitamente
  const strokeColor =
    color ||
    (normalizedPercent === 100
      ? 'var(--success)'
      : normalizedPercent > 0
      ? 'var(--primary)'
      : 'var(--text-muted)');

  const fontSize = Math.max(Math.round(size * 0.22), 11);

  return (
    <div
      className="circular-progress-wrapper"
      style={{ width: size, height: size }}
      role="progressbar"
      aria-valuenow={normalizedPercent}
      aria-valuemin={0}
      aria-valuemax={100}
      aria-label={`Progresso: ${normalizedPercent}% concluído`}
      title={`${normalizedPercent}% concluído`}
    >
      <svg
        className="circular-progress-svg"
        width={size}
        height={size}
        viewBox={`0 0 ${size} ${size}`}
      >
        {/* Círculo de fundo */}
        <circle
          className="circular-progress-bg"
          cx={size / 2}
          cy={size / 2}
          r={radius}
          strokeWidth={strokeWidth}
          fill="none"
        />
        {/* Círculo de preenchimento do progresso */}
        <circle
          className="circular-progress-fill"
          cx={size / 2}
          cy={size / 2}
          r={radius}
          strokeWidth={strokeWidth}
          stroke={strokeColor}
          strokeDasharray={circumference}
          strokeDashoffset={strokeDashoffset}
          strokeLinecap="round"
          fill="none"
        />
      </svg>

      {showText && (
        <div className="circular-progress-text" style={{ fontSize }}>
          <span>{normalizedPercent}%</span>
        </div>
      )}
    </div>
  );
}
