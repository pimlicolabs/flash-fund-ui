import "dotenv/config";

import {
	http,
	type Account,
	type Address,
	type Chain,
	type Client,
	type Hex,
	type Transport,
	type HttpTransport,
	type HttpTransportConfig,
	createClient,
	createPublicClient,
	createTransport,
	RpcRequestError,
	UrlRequiredError,
} from "viem";
import { sepolia } from "viem/chains";
import { Config } from "wagmi";
import { getPimlicoUrl } from ".";
import { getHttpRpcClient } from "viem/utils";

export type MagicSpendCall = {
	to: Address;
	data: Hex;
	value: bigint;
};

export type MagicSpendWithdrawal = {
	token: Address;
	amount: bigint;
	chainId: bigint;
	recipient: Address;
	preCalls: MagicSpendCall[];
	postCalls: MagicSpendCall[];
	validUntil: bigint;
	validAfter: bigint;
	salt: bigint;
};

export type MagicSpendAssetAllowance = {
	token: Address;
	amount: bigint;
	chainId: bigint;
};

export type MagicSpendAllowance = {
	account: Address;
	assets: MagicSpendAssetAllowance[];
	validUntil: bigint;
	validAfter: bigint;
	salt: bigint;
	version: bigint;
	metadata: Hex;
};

export type PimlicoMagicSpendStake = {
	chainId: number;
	token: Address;
	amount: bigint;
	unstakeDelaySec: bigint;
	withdrawTime: Date;
	staked: boolean;
	testnet: boolean;
	usdValue: bigint;
};

export type SponsorWithdrawalCreditParams = {
	type: "credits";
	data: {
		token: Address;
		recipient: Address;
		amount: string;
		signature: Hex;
	};
};

export type SponsorWithdrawalPimlicoLockParams = {
	type: "pimlico_lock";
	data: {
		allowance: MagicSpendAllowance;
		signature: Hex;
	};
};

export type GetStakesParams = {
	type: "pimlico_lock";
	data: {
		account: Address;
	};
};

export const MAGIC_SPEND_ETH: Address =
	"0xEeeeeEeeeEeEeeEeEeEeeEEEeeeeEeeeeeeeEEeE";

export type PimlicoMagicSpendSchema = [
	{
		Parameters: [
			{
				type: "pimlico_lock";
				data: {
					account: Address;
				};
			},
		];
		ReturnType: PimlicoMagicSpendStake[];
		Method: "pimlico_getMagicSpendStakes";
	},
	{
		Parameters: [
			{
				type: "pimlico_lock",
				data: {
					account: Address;
					token: Address;
					amount: string;
					recipient: Address;
				}
			}
		];
		ReturnType: MagicSpendAllowance;
		Method: "pimlico_prepareMagicSpendAllowance";
	},
	{
		Parameters: [
			{
				allowance: MagicSpendAllowance;
				signature: Hex;
			},
		];
		ReturnType: {
			withdrawal: MagicSpendWithdrawal;
			signature: Hex;
		};
		Method: "pimlico_grantMagicSpendAllowance";
	},
	{
		Parameters: [SponsorWithdrawalCreditParams | SponsorWithdrawalPimlicoLockParams, null];
		ReturnType: [Address, Hex];
		Method: "pimlico_sponsorMagicSpendWithdrawal";
	},
	{
		Parameters: [Address];
		ReturnType: {
			signature: Hex;
			assets: (MagicSpendAssetAllowance & { used: bigint })[];
		}[];
		Method: "pimlico_getMagicSpendAllowancesByOperator";
	},
];

export type PimlicoMagicSpendPrepareAllowanceParams = {
	type: "pimlico_lock";
	data: {
		account: Address;
		token: Address;
		amount: string;
		recipient: Address;
	};
};

export type MagicSpendBalance = {
	chain: Chain;
	balance: bigint;
};

export type MagicSpendSponsorWithdrawalResponse = [Address, Hex];

export type LogHooks = {
	onRequest?: (method: string, params: any) => void;
	onResponse?: (method: string, params: any, result: any) => void;
};

function createMagicSpendTransport(
	url: string,
	config: HttpTransportConfig & { logHooks?: LogHooks }
): HttpTransport {
	const {
		fetchOptions,
		key = "http",
		name = "HTTP JSON-RPC",
		retryDelay,
		logHooks,
	} = config;

	return ({ chain, retryCount: retryCount_, timeout: timeout_ }) => {
		const retryCount = config.retryCount ?? retryCount_;
		const timeout = timeout_ ?? config.timeout ?? 10_000;

		if (!url) {
			throw new UrlRequiredError();
		}

		return createTransport(
			{
				key,
				name,
                async request({ method, params }) {
					const body = { method, params: params || [] };
					const httpClient = getHttpRpcClient(url);

					if (logHooks?.onRequest) {
						logHooks.onRequest(method, params);
					}

					const { error, result } = await httpClient.request({
						body,
						fetchOptions,
						timeout,
					});

					if (error) {
						throw new RpcRequestError({
							body,
							error,
							url: url,
						});
					}

					if (logHooks?.onResponse) {
						logHooks.onResponse(result, params, result);
					}

					return result;
				},
				retryCount,
				retryDelay,
				timeout,
				type: "http",
			},
			{
				fetchOptions,
				url,
			}
		);
	};
}

export class MagicSpend {
	wagmiConfig: Config;
	chainId: number;
	pimlicoApiUrl: string;
	logHooks?: LogHooks;

	constructor(wagmiConfig: Config, logHooks?: LogHooks) {
		this.wagmiConfig = wagmiConfig;
		this.chainId = sepolia.id;
		this.logHooks = logHooks;
		const pimlicoApiUrl = process.env.NEXT_PUBLIC_PIMLICO_API_URL;

		if (!pimlicoApiUrl) {
			throw new Error("NEXT_PUBLIC_PIMLICO_API_URL is not set");
		}

		console.log(pimlicoApiUrl)

		this.pimlicoApiUrl = pimlicoApiUrl;
	}

	setChainId(chainId: number) {
		this.chainId = chainId;
	}

	private getClient(): Client<
		Transport,
		Chain | undefined,
		Account | undefined,
		PimlicoMagicSpendSchema
	> {
		const transport = createMagicSpendTransport(getPimlicoUrl(this.chainId), {
			logHooks: this.logHooks,
		});

		return createPublicClient({
			transport,
		});
	}

	async getBalances(account: Address): Promise<MagicSpendBalance[]> {
		return Promise.all(
			this.wagmiConfig.chains.map(async (chain) => {
				const client = createPublicClient({
					chain,
					transport: http(),
				});

				const balance = await client.getBalance({
					address: account,
				});

				return {
					chain,
					balance,
				};
			}),
		);
	}

	async getStakes({
		type,
		data,
	}: GetStakesParams) {
		const stakes = await this.getClient().request({
			method: "pimlico_getMagicSpendStakes",
			params: [
				{
					type,
					data,
				},
			],
		});

		return stakes.map((stake) => ({
			...stake,
			withdrawTime: new Date(Number(stake.withdrawTime)),
			unstakeDelaySec: BigInt(stake.unstakeDelaySec),
			amount: BigInt(stake.amount),
			chainId: Number(stake.chainId),
			testnet: stake.testnet,
			usdValue: BigInt(stake.usdValue),
		}));
	}

	async prepareAllowance(params: PimlicoMagicSpendPrepareAllowanceParams) {
		return this.getClient().request({
			method: "pimlico_prepareMagicSpendAllowance",
			params: [params],
		});
	}

	async sponsorWithdrawal(
		params: SponsorWithdrawalCreditParams | SponsorWithdrawalPimlicoLockParams
	): Promise<MagicSpendSponsorWithdrawalResponse> {
		return this.getClient().request({
			method: "pimlico_sponsorMagicSpendWithdrawal",
			params: [params, null],
		});
	}
}
