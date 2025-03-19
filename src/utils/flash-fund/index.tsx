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
	createPublicClient,
	createTransport,
	RpcRequestError,
	UrlRequiredError,
} from "viem";
import { sepolia } from "viem/chains";
import type { Config } from "wagmi";
import { getPimlicoUrl } from "./../.";
import { getHttpRpcClient } from "viem/utils";
import { Quote } from "./../onebalance/quote";

export type FlashFundCall = {
	to: Address;
	data: Hex;
	value: bigint;
};

export type FlashFundWithdrawal = {
	token: Address;
	amount: bigint;
	chainId: bigint;
	recipient: Address;
	preCalls: FlashFundCall[];
	postCalls: FlashFundCall[];
	validUntil: bigint;
	validAfter: bigint;
	salt: bigint;
};

export type FlashFundAssetAllowance = {
	token: Address;
	amount: bigint;
	chainId: bigint;
};

export type FlashFundAllowance = {
	account: Address;
	assets: FlashFundAssetAllowance[];
	validUntil: bigint;
	validAfter: bigint;
	salt: bigint;
	version: bigint;
	metadata: Hex;
};

export type FlashFundLocks = {
	type: "pimlico_lock" | "onebalance";
	chainId: number;
	token: Address;
	amount: bigint;
	withdrawTime?: Date;
	usdValue: bigint;
	testnet: boolean;
	pending?: bigint;
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
		allowance: FlashFundAllowance;
		signature: Hex;
	};
};

export type SponsorWithdrawalOneBalanceParams = {
	type: "onebalance";
	data: {
		quote: Quote;
		amount: string;
		recipient: Address;
	};
};

export type GetStakesParams = {
	account: Address;
};

export const FLASH_FUND_ETH: Address =
	"0xEeeeeEeeeEeEeeEeEeEeeEEEeeeeEeeeeeeeEEeE";

export type FlashFundPreapreLockParams =
	| {
			type: "pimlico_lock";
			data: {
				token: Address;
				amount: string;
				unstakeDelaySec: string;
			};
	  }
	| {
			type: "onebalance";
			data: {
				token: Address;
				amount: string;
				account: Address;
			};
	  };

export type FlashFundSchema = [
	{
		Parameters: [
			{
				account: Address;
			},
		];
		ReturnType: {
			usdValue: bigint;
			stakes: FlashFundLocks[];
		};
		Method: "flashfund_getLocks";
	},
	{
		Parameters: [FlashFundPreapreLockParams];
		ReturnType: [Address, Hex];
		Method: "flashfund_prepareLock";
	},
	{
		Parameters: [
			FlashFundPrepareAllowanceParams,
		];
		ReturnType: FlashFundPrepareAllowanceParams["type"] extends "pimlico_lock" ? FlashFundAllowance : Quote;
		Method: "flashfund_prepareAllowance";
	},
	{
		Parameters: [
			SponsorWithdrawalCreditParams | SponsorWithdrawalPimlicoLockParams | SponsorWithdrawalOneBalanceParams,
			null,
		];
		ReturnType: [Address, Hex];
		Method: "flashfund_sponsorWithdrawal";
	},
];

export type FlashFundPrepareAllowanceParams = {
	type: "pimlico_lock" | "onebalance";
	data: {
		account: Address;
		token: Address;
		amount: string;
		recipient: Address;
	};
};

export type LogHooks = {
	onRequest?: (method: string, params: any) => void;
	onResponse?: (method: string, params: any, result: any) => void;
};

function createFlashFundTransport(
	url: string,
	config: HttpTransportConfig & { logHooks?: LogHooks },
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
			},
		);
	};
}

export class FlashFund {
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

		console.log(pimlicoApiUrl);

		this.pimlicoApiUrl = pimlicoApiUrl;
	}

	setChainId(chainId: number) {
		this.chainId = chainId;
	}

	private getClient(): Client<
		Transport,
		Chain | undefined,
		Account | undefined,
		FlashFundSchema
	> {
		const transport = createFlashFundTransport(getPimlicoUrl(this.chainId), {
			logHooks: this.logHooks,
		});

		return createPublicClient({
			transport,
		});
	}

	async getStakes({ account }: GetStakesParams) {
		const response = await this.getClient().request({
			method: "flashfund_getLocks",
			params: [
				{
					account,
				},
			],
		});

		const stakes = response.stakes.map((stake) => ({
			...stake,
			withdrawTime: new Date(Number(stake.withdrawTime)),
			amount: BigInt(stake.amount),
			chainId: Number(stake.chainId),
			testnet: stake.testnet,
			usdValue: BigInt(stake.usdValue),
			pending: BigInt(stake.pending || "0"),
		}));

		return {
			usdValue: response.usdValue,
			stakes,
		};
	}

	async prepareAllowance<T extends FlashFundPrepareAllowanceParams>(
		params: T
	): Promise<T["type"] extends "pimlico_lock" ? FlashFundAllowance : Quote> {
		return this.getClient().request({
			method: "flashfund_prepareAllowance",
			params: [params],
		});
	}

	async sponsorWithdrawal(
		params: SponsorWithdrawalCreditParams | SponsorWithdrawalPimlicoLockParams | SponsorWithdrawalOneBalanceParams,
	): Promise<[Address, Hex]> {
		return this.getClient().request({
			method: "flashfund_sponsorWithdrawal",
			params: [params, null],
		});
	}

	async prepareStake(
		params: FlashFundPreapreLockParams,
	): Promise<[Address, Hex, Hex]> {
		return this.getClient().request({
			method: "flashfund_prepareLock",
			params: [params],
		});
	}
}
