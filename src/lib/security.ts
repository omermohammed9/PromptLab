import { headers } from "next/headers";

/**
 * Validates if the requester's IP address is within the allowed whitelist.
 * If the ADMIN_IP_WHITELIST environment variable is not set, whitelisting is disabled.
 * 
 * @param requesterIp The IP address of the requester. If not provided, it attempts to resolve it from headers.
 * @returns boolean indicating if the access is permitted.
 */
export async function isIpWhitelisted(requesterIp?: string): Promise<boolean> {
  const whitelist = process.env.ADMIN_IP_WHITELIST;
  
  // If no whitelist is defined, we default to allowing all (or you could default to blocking all)
  // For this implementation, we assume that if the variable is missing, the feature is disabled.
  if (!whitelist) return true;

  const allowedIps = whitelist.split(",").map(ip => ip.trim());
  
  // Resolve IP if not provided (Server Action context)
  let ipToCheck = requesterIp;
  if (!ipToCheck) {
    try {
      const headerList = await headers();
      // Try multiple standard headers for IP detection
      ipToCheck = 
        headerList.get("x-client-ip") || 
        headerList.get("x-forwarded-for")?.split(",")[0] || 
        headerList.get("x-real-ip") || 
        "127.0.0.1";
    } catch (e) {
      // Not in a request context (e.g., build time or background job)
      return false;
    }
  }

  if (!ipToCheck) return false;

  // Development Bypass: If we are in development, we allow all access
  if (process.env.NODE_ENV === 'development') return true;

  // Basic check: direct match or localhost mapping
  return allowedIps.includes(ipToCheck) || (allowedIps.includes("::1") && ipToCheck === "127.0.0.1");
}

/**
 * Strict check for admin IP. Throws an error if not whitelisted.
 */
export async function validateAdminIp(ip?: string) {
  // We need to resolve the IP here too for logging purposes if it fails
  let detectedIp = ip;
  if (!detectedIp) {
    try {
      const headerList = await headers();
      detectedIp = headerList.get("x-client-ip") || 
                   headerList.get("x-forwarded-for")?.split(",")[0] || 
                   headerList.get("x-real-ip") || 
                   "Unknown";
    } catch {
      detectedIp = "Unknown";
    }
  }

  if (!(await isIpWhitelisted(ip))) {
    console.warn(`[SECURITY] Unauthorized Admin Access Attempt from IP: ${detectedIp}`);
    throw new Error(`Access Denied: Your IP address (${detectedIp}) is not whitelisted for administrative actions.`);
  }
}

/**
 * Strict check for admin access. 
 * Validates:
 * 1. User is authenticated
 * 2. User has 'admin' role in Supabase profiles
 * 3. Requester IP is whitelisted (if configured)
 * 
 * @param supabase The Supabase client instance
 */
export async function requireAdmin(supabase: any) {
  // 1. Auth Gate
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) throw new Error("Unauthorized");

  // 2. Role Gate
  const { data: profile } = await supabase
    .from('profiles')
    .select('role')
    .eq('id', user.id)
    .single();

  if (profile?.role !== 'admin') {
    throw new Error("Forbidden: Only Admins can perform this action");
  }

  // 3. IP Gate
  await validateAdminIp();
  
  return user;
}
