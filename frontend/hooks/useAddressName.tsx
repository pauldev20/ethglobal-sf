import { useDynamicContext } from "@dynamic-labs/sdk-react-core";
import abi from "@/contracts/ensAbi.json";
import { useReadContract } from "wagmi";
import { sepolia } from "wagmi/chains";

export default function useAddressName() {
	const { primaryWallet } = useDynamicContext();

	const { data: nameData, refetch: refetchName } = useReadContract({
		abi,
		address: '0x927fB1414F83905620F460B024bcFf2dD1dA430c',
		functionName: 'getName',
		args: [primaryWallet?.address as `0x${string}`],
		chainId: sepolia.id
	});

	return {
		name: (nameData ? (!String(nameData).startsWith('.') ? String(nameData) : undefined) : undefined),
		refetchName
	}
}
