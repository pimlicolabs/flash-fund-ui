import { type Chain, type Address, type Hex, createPublicClient, http } from "viem";
import { privateKeyToAccount } from "viem/accounts";
import { createPimlicoClient } from "permissionless/clients/pimlico";
import { entryPoint07Address } from "viem/account-abstraction";
import { toSafeSmartAccount } from "permissionless/accounts";
import { createSmartAccountClient } from "permissionless";
import { getPimlicoUrl } from ".";
import type { AddLogFunction } from "@/app/playground/components/log-section";
import { mainnet } from "viem/chains";

// This is a dummy private key for testing - DO NOT use in production
const DUMMY_KEY =
	"0x1234567890123456789012345678901234567890123456789012345678901234";

export async function sendUserOperation(
	chain: Chain,
	withdrawalManagerAddress: Address,
	withdrawalCallData: Hex,
	addLog: AddLogFunction,
) {
	const publicClient = createPublicClient({
		chain,
		transport: http(
			// Use thirdweb RPC for mainnet, default for other chains
			chain.id === mainnet.id 
				? 'https://1.rpc.thirdweb.com'
				: undefined
		),
	});

	const paymasterClient = createPimlicoClient({
		transport: http(getPimlicoUrl(chain.id)),
		entryPoint: {
			address: entryPoint07Address,
			version: "0.7",
		},
	});

	const dummyAccount = privateKeyToAccount(DUMMY_KEY);

	const safeAccount = await toSafeSmartAccount({
		client: publicClient,
		entryPoint: {
			address: entryPoint07Address,
			version: "0.7",
		},
		owners: [dummyAccount],
		version: "1.4.1",
	});

	const smartAccountClient = createSmartAccountClient({
		account: safeAccount,
		chain,
		paymaster: paymasterClient,
		bundlerTransport: http(getPimlicoUrl(chain.id)),
		userOperation: {
			estimateFeesPerGas: async () =>
				(await paymasterClient.getUserOperationGasPrice()).fast,
		},
	});

	addLog("debug", { message: "Sending user operation..." });

	const userOperation = await smartAccountClient.prepareUserOperation({
		calls: [
			{
				to: withdrawalManagerAddress,
				value: BigInt(0),
				data: withdrawalCallData,
			},
		],
	});

	userOperation.signature = await safeAccount.signUserOperation(userOperation);

	addLog("debug", {
		message: "User operation prepared",
		userOperation,
	});

	const userOpHash = await smartAccountClient.sendUserOperation(userOperation);

	addLog("debug", { message: "User operation sent", userOpHash });

	addLog("info", { message: "Waiting for confirmation..." });
	const receipt = await paymasterClient.waitForUserOperationReceipt({
		hash: userOpHash,
	});

	return receipt;
}
