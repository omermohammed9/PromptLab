import { Prompt } from '@/types/interface'
import toast from 'react-hot-toast'

export const exportVaultToJSON = (prompts: Prompt[]) => {
  if (!prompts || prompts.length === 0) {
    toast.error("Nothing to export! Your vault is empty.")
    return
  }

  //  1. CLEAN THE DATA
  // We map over the raw database rows and return a new, clean object
  // containing ONLY what the user actually cares about.
  const cleanData = prompts.map(p => ({
    Title: p.title || "Untitled Prompt",
    Content: p.content,
    Explanation: p.explanation || undefined, // Only show if it exists
    Tags: p.tags || [],
    Date: new Date(p.created_at).toLocaleDateString('en-US', { 
      year: 'numeric', 
      month: 'long', 
      day: 'numeric' 
    })
  }))

  const timestamp = new Date().toISOString().split('T')[0]
  
  //  2. GENERATE FILE
  const dataStr = JSON.stringify(cleanData, null, 2)
  const blob = new Blob([dataStr], { type: 'application/json' })
  const url = URL.createObjectURL(blob)
  
  const link = document.createElement('a')
  link.href = url
  link.download = `PromptLab_Backup_${timestamp}.json`
  document.body.appendChild(link)
  link.click()
  document.body.removeChild(link)
  
  toast.success(`Exported ${prompts.length} clean prompts!`)
}