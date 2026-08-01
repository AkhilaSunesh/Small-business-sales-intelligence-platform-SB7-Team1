import PropTypes from 'prop-types';
import { BarChart, Bar, XAxis, YAxis, Tooltip, ResponsiveContainer, CartesianGrid } from 'recharts';

export default function TopProductsChart({ data, loading = false, onElementClick }) {
  if (loading) {
    return <div className="h-56 animate-pulse rounded-lg bg-white/5" />;
  }

  return (
    <div className="h-56">
      <ResponsiveContainer width="100%" height="100%">
        <BarChart
          data={data}
          layout="vertical"
          onClick={(clickData) => {
            if (clickData && clickData.activePayload && onElementClick) {
              const payload = clickData.activePayload[0].payload;
              onElementClick(payload.product);
            }
          }}
          className="cursor-pointer"
        >
          <CartesianGrid strokeDasharray="3 3" stroke="#0f1724" />
          <XAxis type="number" tick={{ fill: '#94a3b8' }} />
          <YAxis dataKey="product" type="category" tick={{ fill: '#94a3b8' }} />
          <Tooltip />
          <Bar dataKey="revenue" fill="#06b6d4" />
        </BarChart>
      </ResponsiveContainer>
    </div>
  );
}

TopProductsChart.propTypes = {
  data: PropTypes.array.isRequired,
  loading: PropTypes.bool,
  onElementClick: PropTypes.func,
};
