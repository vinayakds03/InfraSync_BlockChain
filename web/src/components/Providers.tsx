"use client";

import { QueryClient, QueryClientProvider } from '@tanstack/react-query'
import { WagmiProvider, createConfig, http } from 'wagmi'
import { sepolia, hardhat } from 'wagmi/chains'
import { injected } from 'wagmi/connectors'
import { ReactNode } from 'react'

export const config = createConfig({
  chains: [hardhat, sepolia],
  connectors: [injected()], // This automatically handles MetaMask
  transports: {
    [hardhat.id]: http(),
    [sepolia.id]: http(),
  },
})

const queryClient = new QueryClient()

export function Providers({ children }: { children: ReactNode }) {
  return (
    <WagmiProvider config={config}>
      <QueryClientProvider client={queryClient}>
        {children}
      </QueryClientProvider>
    </WagmiProvider>
  )
}
