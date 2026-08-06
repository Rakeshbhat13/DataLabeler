module.exports = function requireRole(role) {
  return function (req, res, next) {
    const user = req.user;
    if (!user) return res.status(401).json({ error: 'Not authenticated' });
    if (user.role !== role) return res.status(403).json({ error: 'Forbidden' });
    return next();
  };
};
