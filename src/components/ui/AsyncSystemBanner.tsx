import { getPublicSystemConfig } from "@/app/[locale]/admin/system-action";
import SystemBanner from "./SystemBanner";

export default async function AsyncSystemBanner() {
  const systemConfig = await getPublicSystemConfig();
  
  return (
    <SystemBanner 
      bannerText={systemConfig.globalBanner} 
      isMaintenance={systemConfig.maintenanceMode} 
    />
  );
}
