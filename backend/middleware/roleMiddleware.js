const roleMiddleware = (...roles) => {
    const allowedRoles = roles.map((role) => role.toUpperCase());

    return (req, res, next) => {
        if (!req.user) {
            return res.status(401).json({
                success: false,
                message: "Authentication required",
            });
        }

        if (!allowedRoles.includes(req.user.role?.toUpperCase())) {
            return res.status(403).json({
                success: false,
                message: "Access denied. You do not have permission to perform this action.",
            });
        }

        next();
    };
};

export { roleMiddleware as authorize };
export default roleMiddleware;
