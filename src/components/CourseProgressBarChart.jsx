import React from 'react';
import {
  ResponsiveContainer,
  BarChart,
  Bar,
  XAxis,
  YAxis,
  Tooltip,
  Cell
} from 'recharts';

/**
 * Gráfico de barras com Recharts dentro dos cartões de curso.
 * Visualiza o progresso de entrega das atividades do aluno em relação ao total.
 * Utiliza a paleta de cores definida:
 * - Entregues: #5bcebf (.color3)
 * - Pendentes: #fdf4b0 (.color1) com borda #a4dcb9 (.color2)
 * - Total: #2e97b7 (.color5)
 */
export default function CourseProgressBarChart({
  completed = 0,
  total = 0,
  height = 110
}) {
  const safeTotal = Math.max(total, 0);
  const safeCompleted = Math.min(Math.max(completed, 0), safeTotal);
  const safePending = Math.max(0, safeTotal - safeCompleted);

  const percentCompleted = safeTotal > 0 ? Math.round((safeCompleted / safeTotal) * 100) : 0;

  const data = [
    {
      category: 'Entregues',
      quantidade: safeCompleted,
      color: '#5bcebf', // .color3
      stroke: '#32b9be', // .color4
      desc: `${safeCompleted} de ${safeTotal} atividades entregues`
    },
    {
      category: 'Pendentes',
      quantidade: safePending,
      color: '#fdf4b0', // .color1
      stroke: '#a4dcb9', // .color2
      desc: `${safePending} atividades pendentes de entrega`
    },
    {
      category: 'Total',
      quantidade: safeTotal,
      color: '#2e97b7', // .color5
      stroke: '#1d657b',
      desc: `${safeTotal} atividades cadastradas no curso`
    }
  ];

  // Tooltip customizado com as cores da paleta
  const CustomTooltip = ({ active, payload }) => {
    if (active && payload && payload.length) {
      const item = payload[0].payload;
      return (
        <div
          style={{
            backgroundColor: '#ffffff',
            border: `1px solid ${item.stroke}`,
            padding: '0.45rem 0.75rem',
            borderRadius: 'var(--radius-sm)',
            boxShadow: '0 4px 10px rgba(19, 47, 56, 0.12)',
            fontSize: '0.75rem',
            lineHeight: 1.3
          }}
        >
          <div style={{ fontWeight: 700, color: '#132f38', display: 'flex', alignItems: 'center', gap: '0.35rem' }}>
            <span
              style={{
                width: '8px',
                height: '8px',
                borderRadius: '50%',
                backgroundColor: item.color,
                border: `1px solid ${item.stroke}`
              }}
            />
            <span>{item.category}:</span>
            <span style={{ fontSize: '0.85rem' }}>{item.quantidade}</span>
          </div>
          <div style={{ color: 'var(--text-muted)', marginTop: '0.2rem', fontSize: '0.7rem' }}>
            {item.desc}
          </div>
        </div>
      );
    }
    return null;
  };

  return (
    <div
      className="course-progress-chart-wrapper"
      style={{
        backgroundColor: 'var(--bg-subtle)',
        border: '1px solid var(--border-color)',
        borderRadius: 'var(--radius-md)',
        padding: '0.65rem 0.75rem 0.35rem 0.75rem',
        marginTop: '0.75rem',
        marginBottom: '0.5rem'
      }}
    >
      <div
        style={{
          display: 'flex',
          justifyContent: 'space-between',
          alignItems: 'center',
          marginBottom: '0.35rem',
          fontSize: '0.75rem'
        }}
      >
        <span style={{ fontWeight: 700, color: 'var(--text-secondary)', display: 'flex', alignItems: 'center', gap: '0.3rem' }}>
          <span>📊</span> Entregas vs. Total:
        </span>
        <span style={{ fontWeight: 800, color: percentCompleted === 100 ? '#2ea88b' : '#2e97b7' }}>
          {percentCompleted}% concluído
        </span>
      </div>

      <div style={{ width: '100%', height: height }}>
        <ResponsiveContainer width="100%" height="100%">
          <BarChart
            data={data}
            margin={{ top: 8, right: 10, left: -24, bottom: 0 }}
            barCategoryGap="22%"
          >
            <XAxis
              dataKey="category"
              tick={{ fontSize: 10, fill: '#4e7884', fontWeight: 600 }}
              axisLine={{ stroke: 'var(--border-color)' }}
              tickLine={false}
            />
            <YAxis
              allowDecimals={false}
              domain={[0, Math.max(safeTotal, 1)]}
              tick={{ fontSize: 9, fill: '#4e7884' }}
              axisLine={false}
              tickLine={false}
            />
            <Tooltip content={<CustomTooltip />} />
            <Bar dataKey="quantidade" radius={[4, 4, 0, 0]}>
              {data.map((entry, index) => (
                <Cell
                  key={`cell-${index}`}
                  fill={entry.color}
                  stroke={entry.stroke}
                  strokeWidth={1}
                />
              ))}
            </Bar>
          </BarChart>
        </ResponsiveContainer>
      </div>

      {/* Legenda compacta com as cores da paleta */}
      <div
        style={{
          display: 'flex',
          justifyContent: 'center',
          gap: '0.75rem',
          fontSize: '0.675rem',
          color: 'var(--text-muted)',
          marginTop: '0.2rem',
          paddingTop: '0.25rem',
          borderTop: '1px dashed var(--border-color)'
        }}
      >
        <span style={{ display: 'inline-flex', alignItems: 'center', gap: '0.25rem' }}>
          <span style={{ width: '7px', height: '7px', borderRadius: '2px', backgroundColor: '#5bcebf', border: '1px solid #32b9be' }} />
          Entregues ({safeCompleted})
        </span>
        <span style={{ display: 'inline-flex', alignItems: 'center', gap: '0.25rem' }}>
          <span style={{ width: '7px', height: '7px', borderRadius: '2px', backgroundColor: '#fdf4b0', border: '1px solid #a4dcb9' }} />
          Pendentes ({safePending})
        </span>
        <span style={{ display: 'inline-flex', alignItems: 'center', gap: '0.25rem' }}>
          <span style={{ width: '7px', height: '7px', borderRadius: '2px', backgroundColor: '#2e97b7' }} />
          Total ({safeTotal})
        </span>
      </div>
    </div>
  );
}
