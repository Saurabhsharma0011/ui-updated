'use client'

import { ThemeProvider } from '@/components/theme-provider'
import { SolanaWalletProvider } from '@/components/wallet/WalletProvider'

interface ProvidersProps {
  children: React.ReactNode
}

export function Providers({ children }: ProvidersProps) {
  return (
    <ThemeProvider attribute="class" defaultTheme="dark" enableSystem>
      <SolanaWalletProvider>
        {children}
      </SolanaWalletProvider>
    </ThemeProvider>
  )
} 