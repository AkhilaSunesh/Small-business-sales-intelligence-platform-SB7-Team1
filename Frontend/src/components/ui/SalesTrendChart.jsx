import PropTypes from 'prop-types';
import {
  LineChart,
  Line,
  XAxis,
  YAxis,
  Tooltip,
  ResponsiveContainer,
  CartesianGrid,
} from 'recharts';

export default function SalesTrendChart({ data, loading = false, onElementClick }) {
  if (loading) {
    return <div className="h-56 animate-pulse rounded-lg bg-white/5" />;
  }

  return (
    <div className="h-56">
      <ResponsiveContainer width="100%" height="100%">
        <LineChart
          data={data}
          onClick={(clickData) => {
            if (clickData && clickData.activePayload && onElementClick) {
              const payload = clickData.activePayload[0].payload;
              onElementClick(payload.date || payload.month);
            }
          }}
          className="cursor-pointer"
        >
          <CartesianGrid strokeDasharray="3 3" stroke="#0f1724" />
          <XAxis dataKey="date" tick={{ fill: '#94a3b8' }} />
          <YAxis tick={{ fill: '#94a3b8' }} />
          <Tooltip
            contentStyle={{
              backgroundColor: '#0f172a',
              border: '1px solid rgba(255,255,255,0.12)',
              borderRadius: '12px',
              boxShadow: '0 8px 32px rgba(0,0,0,0.5)',
            }}
            labelStyle={{ color: '#e2e8f0', fontWeight: 700, fontSize: 12 }}
            itemStyle={{ color: '#22d3ee', fontSize: 12 }}
            formatter={(value) => [`$${Number(value).toLocaleString(undefined, { minimumFractionDigits: 2, maximumFractionDigits: 2 })}`, 'Revenue']}
          />
          <Line type="monotone" dataKey="revenue" stroke="#06b6d4" strokeWidth={2} dot={true} />
        </LineChart>
      </ResponsiveContainer>
    </div>
  );
}

SalesTrendChart.propTypes = {
  data: PropTypes.array.isRequired,
  loading: PropTypes.bool,
  onElementClick: PropTypes.func,
};
