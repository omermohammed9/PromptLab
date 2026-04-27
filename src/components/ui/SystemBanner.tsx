import { AlertTriangle, Info } from 'lucide-react'

export default function SystemBanner({ bannerText, isMaintenance }: { bannerText: string, isMaintenance: boolean }) {
  if (!bannerText && !isMaintenance) return null;

  return (
    <div className="w-full z-[100] sticky inset-block-start-0 inset-inline-0">
      {isMaintenance && (
        <div className="bg-red-950 border-block-end border-red-900 text-red-200 py-2 px-4 flex items-center justify-center gap-3 font-bold text-sm text-center">
          <AlertTriangle size={16} className="animate-pulse" />
          SYSTEM IS IN MAINTENANCE MODE (READ-ONLY)
          <AlertTriangle size={16} className="animate-pulse" />
        </div>
      )}
      {bannerText && (
        <div className="bg-purple-900/90 backdrop-blur-md border-block-end border-purple-800 text-purple-100 py-2 px-4 flex items-center justify-center gap-2 text-sm text-center">
          <Info size={16} />
          {bannerText}
        </div>
      )}
    </div>
  )
}
