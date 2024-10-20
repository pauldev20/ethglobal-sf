import { polygonAmoy, sepolia, flowTestnet, morphHolesky, skaleCalypsoTestnet, zircuitTestnet } from "wagmi/chains";
import { http, createConfig } from "wagmi";

export const config = createConfig({
    chains: [polygonAmoy, sepolia, skaleCalypsoTestnet, flowTestnet, morphHolesky, zircuitTestnet],
    multiInjectedProviderDiscovery: false,
    ssr: true,
    transports: {
        [polygonAmoy.id]: http(),
        [skaleCalypsoTestnet.id]: http(),
        [flowTestnet.id]: http(),
        [morphHolesky.id]: http(),
        [sepolia.id]: http(),
        [zircuitTestnet.id]: http()
    },
});

declare module "wagmi" {
    interface Register {
        config: typeof config;
    }
}
