import jwt from "jsonwebtoken";

export const authMiddleware = (req, res, next) => {
  const authHeader = req.headers["authorization"]; // Renamed for clarity
  
  console.log("=== Auth Middleware Called ===");
  console.log("Full Authorization header:", authHeader);
  
  if (!authHeader) {
    console.log("❌ No token provided");
    return res.status(403).json({ message: "No token provided" });
  }

  // 💡 Improvement: Ensure header starts with 'Bearer ' and has a second part
  const parts = authHeader.split(" ");
  if (parts.length !== 2 || parts[0].toLowerCase() !== "bearer") {
      console.log("❌ Malformed Authorization header");
      return res.status(401).json({ message: "Invalid token format. Expected: Bearer <token>" });
  }

  const bearerToken = parts[1];
  console.log("Extracted Bearer token:", bearerToken?.substring(0, 30) + "...");
  
  try {
    // Ensure JWT_KEY is available
    if (!process.env.JWT_KEY) {
        throw new Error("JWT_KEY is not defined in environment variables.");
    }
    
    const decoded = jwt.verify(bearerToken, process.env.JWT_KEY);
    console.log("✅ Token decoded successfully");
    console.log("Decoded user:", { id: decoded.id, role: decoded.role });
    
    req.user = decoded;
    next();
  } catch (err) {
    console.log("❌ Token verification failed:", err.message);
    return res.status(401).json({ message: "Invalid token", error: err.message });
  }
};

export const adminMiddleware = (req, res, next) => {
  // Added optional chaining just in case authMiddleware was skipped, though it shouldn't be
  console.log("Admin middleware - checking role:", req.user?.role);
  
  // Note: authMiddleware MUST run before adminMiddleware for req.user to exist.
  if (!req.user || req.user.role !== "admin") {
    return res.status(403).json({ message: "Access denied: Admins only" });
  }
  next();
};