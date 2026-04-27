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
      const forwardedFor = headerList.get("x-forwarded-for");
      ipToCheck = forwardedFor ? forwardedFor.split(",")[0] : "127.0.0.1";
    } catch (e) {
      // Not in a request context
      return false;
    }
  }

  if (!ipToCheck) return false;

  // Basic check: direct match
  // In a more advanced version, we could support CIDR ranges
  return allowedIps.includes(ipToCheck) || (allowedIps.includes("::1") && ipToCheck === "127.0.0.1");
}

/**
 * Strict check for admin IP. Throws an error if not whitelisted.
 */
export async function validateAdminIp(ip?: string) {
  if (!(await isIpWhitelisted(ip))) {
    console.warn(`Unauthorized Admin Access Attempt from IP: ${ip || 'Unknown'}`);
    throw new Error("Access Denied: Your IP address is not whitelisted for administrative actions.");
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
