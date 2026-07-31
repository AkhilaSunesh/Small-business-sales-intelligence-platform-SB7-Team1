import { Navigate } from 'react-router-dom';
import PropTypes from 'prop-types';
import { useAppContext } from '../../context/AppContext';

/**
 * RoleGuard restricts access to a route component based on the current user's role.
 * Relies on AppContext for user details.
 */
export default function RoleGuard({ children, allowedRoles }) {
  const { isAuthenticated, user } = useAppContext();

  if (!isAuthenticated) {
    return <Navigate to="/login" replace />;
  }

  if (!user || !allowedRoles.includes(user.role)) {
    // Redirect unauthorized roles to the main Dashboard page
    return <Navigate to="/dashboard" replace />;
  }

  return children;
}

RoleGuard.propTypes = {
  children: PropTypes.node.isRequired,
  allowedRoles: PropTypes.arrayOf(PropTypes.string).isRequired,
};
