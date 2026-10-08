import React from 'react';

/**
 * Logo vetorial do LMS (Ambiente Virtual de Aprendizagem)
 * Combina o capelo de formatura acadêmico com o livro aberto do conhecimento.
 */
export default function LmsLogo({ size = 38, className = '' }) {
  const uniqueId = React.useId().replace(/:/g, '');

  return (
    <svg
      width={size}
      height={size}
      viewBox="0 0 56 56"
      fill="none"
      xmlns="http://www.w3.org/2000/svg"
      className={`lms-brand-logo ${className}`}
      aria-label="LMS Logo"
    >
      <defs>
        {/* Gradiente principal do brasão na paleta: .color3, .color4, .color5 */}
        <linearGradient
          id={`bg-grad-${uniqueId}`}
          x1="0"
          y1="0"
          x2="56"
          y2="56"
          gradientUnits="userSpaceOnUse"
        >
          <stop offset="0%" stopColor="#5bcebf" />
          <stop offset="50%" stopColor="#32b9be" />
          <stop offset="100%" stopColor="#2e97b7" />
        </linearGradient>

        {/* Gradiente da sombra e relevo */}
        <linearGradient
          id={`cap-grad-${uniqueId}`}
          x1="12"
          y1="10"
          x2="44"
          y2="28"
          gradientUnits="userSpaceOnUse"
        >
          <stop offset="0%" stopColor="#ffffff" />
          <stop offset="100%" stopColor="#eaf6fa" />
        </linearGradient>

        {/* Sombra suave interna */}
        <filter id={`shadow-${uniqueId}`} x="-10%" y="-10%" width="120%" height="130%">
          <feDropShadow dx="0" dy="2" stdDeviation="1.5" floodColor="#132f38" floodOpacity="0.35" />
        </filter>
      </defs>

      {/* Brasão de fundo arredondado com efeito moderno */}
      <rect
        x="2"
        y="2"
        width="52"
        height="52"
        rx="14"
        fill={`url(#bg-grad-${uniqueId})`}
      />

      {/* Borda sutil de destaque superior (.color2: #a4dcb9) */}
      <rect
        x="2.5"
        y="2.5"
        width="51"
        height="51"
        rx="13.5"
        stroke="#a4dcb9"
        strokeWidth="1"
        strokeOpacity="0.75"
      />

      {/* Ícone: Capelo Acadêmico & Livro do Conhecimento */}
      <g filter={`url(#shadow-${uniqueId})`}>
        {/* Base do Capelo (Headband) */}
        <path
          d="M17 18.5V23.5C17 26.5 21.5 28.5 28 28.5C34.5 28.5 39 26.5 39 23.5V18.5"
          stroke="#ffffff"
          strokeWidth="2.2"
          strokeLinecap="round"
        />

        {/* Topo do Capelo (Losango em perspectiva) */}
        <polygon
          points="28,10 47,17.5 28,24.5 9,17.5"
          fill={`url(#cap-grad-${uniqueId})`}
          stroke="#2e97b7"
          strokeWidth="0.8"
        />

        {/* Botão central do capelo */}
        <ellipse cx="28" cy="17.5" rx="1.6" ry="1.2" fill="#2e97b7" />

        {/* Cordão do Capelo (Tassel) caindo para a direita (.color2) */}
        <path
          d="M28 17.5 C36 17.5, 42 20.5, 42.5 26.5"
          stroke="#a4dcb9"
          strokeWidth="1.8"
          strokeLinecap="round"
        />
        {/* Pêndulo do tassel (.color1: #fdf4b0) */}
        <ellipse cx="42.5" cy="27" rx="1.6" ry="2.2" fill="#fdf4b0" />

        {/* Livro Aberto na parte inferior */}
        {/* Páginas esquerdas */}
        <path
          d="M28 36.5C23.5 33.2 16.5 33.5 12 35.5V44C16.5 42 23.5 41.7 28 45"
          fill="#ffffff"
          stroke="#2e97b7"
          strokeWidth="1.2"
          strokeLinejoin="round"
        />
        {/* Páginas direitas */}
        <path
          d="M28 36.5C32.5 33.2 39.5 33.5 44 35.5V44C39.5 42 32.5 41.7 28 45"
          fill="#ffffff"
          stroke="#2e97b7"
          strokeWidth="1.2"
          strokeLinejoin="round"
        />

        {/* Lombada central do livro */}
        <line
          x1="28"
          y1="36"
          x2="28"
          y2="45"
          stroke="#0284c7"
          strokeWidth="1.5"
          strokeLinecap="round"
        />
      </g>
    </svg>
  );
}
