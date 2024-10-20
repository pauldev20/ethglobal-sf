"use client";

import { Button, Card, CardBody, Input, Modal, ModalBody, ModalContent, ModalHeader, Spinner, useDisclosure } from "@nextui-org/react";
import { ChevronLeftIcon, PlusIcon, WifiIcon } from "@heroicons/react/24/outline";
import { waitForTransactionReceipt, writeContract } from "wagmi/actions";
// @ts-expect-error idk
import { execHaloCmdWeb } from "@arx-research/libhalo/api/web.js";
import { useDynamicContext } from "@dynamic-labs/sdk-react-core";
import { useRouter, useSearchParams } from "next/navigation";
import { useReadContracts } from "wagmi";
import { useState } from "react";

import BasicPage from "@/components/basicPage";
import WalletAddress from "@/components/walletAddress";

import { getENSAddessForNFC } from "@/hooks/useAddressName";
import useBeerBalance from "@/hooks/useBeerBalance";
import useBeerPrice from "@/hooks/useBeerPrice";
import useLogin from "@/hooks/useLogin";

import partyAbi from "@/contracts/partyAbi.json";
import { config } from "@/lib/wagmi";

interface BuyBeerModalProps {
	isOpen: boolean;
	onOpenChange: (isOpen: boolean) => void;
	partyAddr: string;
}
function BuyBeerModal({ isOpen, onOpenChange, partyAddr }: BuyBeerModalProps) {
	const [loadingWristband, setLoadingWristband] = useState(false);
	const [userName, setUserName] = useState<undefined | string>(undefined);
	const [user, setUser] = useState<undefined | string>(undefined);
	const [loading, setLoading] = useState(false);
	const [value, setValue] = useState(1);

	const connWristband = async () => {
		try {
			setLoadingWristband(true);
			const result = await execHaloCmdWeb({
				name: "get_pkeys"
			});
			const address = result["etherAddresses"]["1"];
			setUser(address);
			setUserName(await getENSAddessForNFC(address));
			setLoadingWristband(false);
		} catch (e) {
			console.log(e);
			setLoadingWristband(false);
		}
	}

	const checkout = async () => {
		try {
			if (user == undefined) {
				return;
			}
			setLoading(true);
			const resultBurn = await writeContract(config, {
				abi: partyAbi,
				address: partyAddr as `0x${string}`,
				functionName: 'burnBeer',
				args: [user as `0x${string}`, BigInt(value)],
				// @ts-expect-error idk
				chainId: parseInt(process.env.NEXT_PUBLIC_CHAIN_ID || "")
			});
			await waitForTransactionReceipt(config, {
				hash: resultBurn,
				confirmations: 1
			});
			console.log("Checked out beer", resultBurn);
			setLoading(false);
			onOpenChange(false);
		} catch (e) {
			console.log(e);
			setLoading(false);
		}
	}

	return (
		<Modal isOpen={isOpen} onOpenChange={onOpenChange} hideCloseButton isDismissable={!loadingWristband && !loading}>
			<ModalContent>
				<ModalHeader className="flex items-center justify-between">Checkout</ModalHeader>
				<ModalBody>
					<div className="flex items-center justify-between">
						<h1>Stuttgarter Hofbräu</h1>
						<Input
							className="w-32"
							type="number"
							label="Amount"
							value={value.toString()}
							onChange={(e) => setValue(parseInt(e.target.value))}
							labelPlacement="inside"
						/>
					</div>
					<Button color={user ? "success" : "secondary"} isLoading={loadingWristband} onClick={connWristband} isDisabled={user != undefined}>
						{(user || userName) ? (userName ? userName : user) : "Scan Wristband"}
					</Button>
					<Button color="primary" className="mb-5" isLoading={loading} onClick={checkout} isDisabled={user == undefined}>
						Checkout
					</Button>
				</ModalBody>
			</ModalContent>
		</Modal>
	)
}

interface BeerProps {
	addr: string;
	party: string;
	usdc: string;
}
function Beer({ addr, party, usdc }: BeerProps) {
	const { beerBalance, isLoading } = useBeerBalance(addr as `0x${string}`);
	const { beerPrice, isLoading: isLoadingPrice } = useBeerPrice(party);
	const router = useRouter();

	return (
		<Card onClick={() => router.replace(`/chart?beer=${addr}&party=${party}&usdc=${usdc}`)} isPressable={!isLoading}>
			<CardBody className="w-full flex flex-row justify-between">
				{(isLoading || isLoadingPrice) && <Spinner size="sm" className="ml-auto mr-auto" />}
				{(!isLoading && !isLoadingPrice) && (<>
					<div className="flex gap-2">
						<h1 className="font-bold">{beerBalance?.toString()}x</h1>
						<h2>Stuttgarter Hofbräu</h2>
					</div>
					<span>{beerPrice?.toString()} $</span>
				</>)}
			</CardBody>
		</Card>
	)
}

export default function EventPage() {
	const { isOpen, onOpen, onOpenChange } = useDisclosure();
	const { primaryWallet } = useDynamicContext();
	const searchParams = useSearchParams();
	const router = useRouter();
	useLogin();

	const { data } = useReadContracts({
		contracts: [
		  {
			abi: partyAbi,
			address: searchParams.get("addr") as `0x${string}`,
			functionName: 'owner',
			// @ts-expect-error idk
			chainId: parseInt(process.env.NEXT_PUBLIC_CHAIN_ID || ""),
		  },
		  {
			abi: partyAbi,
			address: searchParams.get("addr") as `0x${string}`,
			functionName: 'beer',
			// @ts-expect-error idk
			chainId: parseInt(process.env.NEXT_PUBLIC_CHAIN_ID || ""),
		  },
		  {
			abi: partyAbi,
			address: searchParams.get("addr") as `0x${string}`,
			functionName: 'usdc',
			// @ts-expect-error idk
			chainId: parseInt(process.env.NEXT_PUBLIC_CHAIN_ID || ""),
		  },
		]
	});
	const owner = data?.[0].result;
	const beer = data?.[1].result;
	const usdc = data?.[2].result;

	return (<>
		<BuyBeerModal isOpen={isOpen} onOpenChange={onOpenChange} partyAddr={searchParams.get("addr") || ""} />
		<BasicPage
			topLeftBtn={<ChevronLeftIcon />}
			topLeftClick={() => router.replace("/main")}
			topRightBtn={primaryWallet?.address == owner ? <WifiIcon /> : <></>}
			topRightClick={() => onOpen()}
			emoji="🍺"
			pageTitle="Beers"
		>
			{beer === undefined && (<div className="flex flex-grow items-center justify-center gap-3">
				<Spinner size="lg"/>
			</div>)}
			{beer !== undefined && (<>
				<Beer addr={beer as string} party={searchParams.get("addr") || ""} usdc={usdc as string} />
				<Card isPressable isDisabled>
					<CardBody className="w-full flex flex-row justify-center">
						<PlusIcon className="size-4"/>
					</CardBody>
				</Card>
				<WalletAddress className="self-center mt-auto" partyAddress={searchParams.get("addr") || ""}/>
			</>)}
		</BasicPage>
	</>)
}
