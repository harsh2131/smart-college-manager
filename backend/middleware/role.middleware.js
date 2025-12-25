/**
 * Role Middleware
 * Checks if user has the required role(s) to access a route
 */
const roleMiddleware = (...allowedRoles) => {
    return (req, res, next) => {
        // Check if user exists (auth middleware should run first)
        if (!req.user) {
            return res.status(401).json({
                success: false,
                message: 'Authentication required.'
            });
        }

        // Check if user's role is in allowed roles
        if (!allowedRoles.includes(req.user.role)) {
            return res.status(403).json({
                success: false,
                message: `Access denied. Required role: ${allowedRoles.join(' or ')}. Your role: ${req.user.role}`
            });
        }

        next();
    };
};

// Convenience middleware for common role checks
const isTeacher = roleMiddleware('teacher', 'admin');
const isStudent = roleMiddleware('student');
const isAdmin = roleMiddleware('admin');
const isTeacherOrStudent = roleMiddleware('teacher', 'student', 'admin');

module.exports = {
    roleMiddleware,
    isTeacher,
    isStudent,
    isAdmin,
    isTeacherOrStudent
};
