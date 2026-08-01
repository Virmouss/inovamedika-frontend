import React, { useContext } from 'react';
import { Navigate } from 'react-router-dom';
import { AuthContext } from '../contexts/AuthContext';

const HOME_BY_ROLE = {
    Admin: '/dashboard',
    Registrator: '/patients',
    Doctor: '/assessment',
};

const ProtectedRoute = ({ children, allowedRoles }) => {
    const { user } = useContext(AuthContext);

    if (!user) {
        return <Navigate to="/" replace />;
    }

    if (allowedRoles && !allowedRoles.includes(user.role)) {
        const home = HOME_BY_ROLE[user.role] || '/';
        return <Navigate to={home} replace />;
    }

    return children;
};

export default ProtectedRoute;
