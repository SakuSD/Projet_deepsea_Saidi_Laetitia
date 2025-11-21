const jwt = require("jsonwebtoken");

module.exports = function obsAuthMiddleware(req, res, next) {
  try {
    const authHeader = req.headers.authorization || req.headers.Authorization;
    if (!authHeader) {
      console.log(`[AUTH][MISSING] IP=${req.ip} time=${new Date().toISOString()}`);
      return res.status(401).json({ error: "Missing authorization header" });
    }

    const token = authHeader.startsWith("Bearer ") ? authHeader.slice(7) : authHeader;
    if (!token) {
      console.log(`[AUTH][MISSING_TOKEN] IP=${req.ip} time=${new Date().toISOString()}`);
      return res.status(401).json({ error: "Missing token" });
    }

    const secret = process.env.JWT_SECRET || "defaultsecretkey";
    let payload;
    try {
      payload = jwt.verify(token, secret);
    } catch (err) {
      console.log(`[AUTH][INVALID_TOKEN] message=${err.message} IP=${req.ip} time=${new Date().toISOString()}`);
      return res.status(401).json({ error: "Invalid token" });
    }

    if (!payload || !payload.id) {
      console.log(`[AUTH][INVALID_PAYLOAD] payload=${JSON.stringify(payload)} IP=${req.ip} time=${new Date().toISOString()}`);
      return res.status(401).json({ error: "Invalid token payload" });
    }

    req.user = { id: Number(payload.id), email: payload.email, role: payload.role };

    console.log(`[AUTH][OK] userId=${req.user.id} email=${req.user.email || "unknown"} role=${req.user.role || "unknown"} IP=${req.ip} time=${new Date().toISOString()}`);

    next();
  } catch (err) {
    console.log(`[AUTH][ERR] message=${err.message} IP=${req.ip} time=${new Date().toISOString()}`);
    return res.status(401).json({ error: "Invalid token" });
  }
};