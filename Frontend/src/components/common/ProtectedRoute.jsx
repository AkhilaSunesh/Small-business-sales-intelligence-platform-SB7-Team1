import { Navigate } from 'react-router-dom';
import PropTypes from 'prop-types';
import { useAppContext } from '../../context/AppContext';

export default function ProtectedRoute({ children }) {
  const { isAuthenticated } = useAppContext();
  return isAuthenticated ? children : <Navigate to="/login" replace />;
}

ProtectedRoute.propTypes = {
  children: PropTypes.node,
};
