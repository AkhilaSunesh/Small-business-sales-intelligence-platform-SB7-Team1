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

export default function SalesTrendChart({ data, loading = false }) {
  if (loading) {
    return <div className="h-56 animate-pulse rounded-lg bg-white/5" />;
  }

  return (
    <div className="h-56">
      <ResponsiveContainer width="100%" height="100%">
        <LineChart data={data}>
          <CartesianGrid strokeDasharray="3 3" stroke="#0f1724" />
          <XAxis dataKey="date" tick={{ fill: '#94a3b8' }} />
          <YAxis tick={{ fill: '#94a3b8' }} />
          <Tooltip />
          <Line type="monotone" dataKey="revenue" stroke="#06b6d4" strokeWidth={2} dot={false} />
        </LineChart>
      </ResponsiveContainer>
    </div>
  );
}

SalesTrendChart.propTypes = {
  data: PropTypes.array.isRequired,
  loading: PropTypes.bool,
};
