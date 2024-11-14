import "dotenv/config";

import {
	http,
	type Account,
	type Address,
	type Chain,
	type Client,
	type Hex,
	type Transport,
	createClient,
	createPublicClient,
} from "viem";
import { Config } from "wagmi";

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
	operator: Address;
};

export type PimlicoMagicSpendStake = {
	chainId: number;
	token: Address;
	amount: bigint;
	pending: bigint;
	remaining: bigint;
	unstakeDelaySec: bigint;
	withdrawTime: Date;
};

export const MAGIC_SPEND_ETH: Address =
	"0xEeeeeEeeeEeEeeEeEeEeeEEEeeeeEeeeeeeeEEeE";

export type PimlicoMagicSpendSchema = [
	{
		Parameters: [
			{
				account: Address;
				asset: Address;
			},
		];
		ReturnType: PimlicoMagicSpendStake[];
		Method: "pimlico_getMagicSpendStakes";
	},
	{
		Parameters: {
			account: Address;
			token: Address;
			amount: string;
		}[];
		ReturnType: MagicSpendAllowance;
		Method: "pimlico_prepareMagicSpendAllowance";
	},
	{
		Parameters: [{
			allowance: MagicSpendAllowance;
			signature: Hex;
		}];
		ReturnType: {
			withdrawal: MagicSpendWithdrawal;
			signature: Hex;
		};
		Method: "pimlico_grantMagicSpendAllowance";
	},
	{
		Parameters: [{
			token: Address;
			recipient: Address;
			amount: string;
			signature: Hex;
			salt: Hex;
		}];
		ReturnType: [
			MagicSpendWithdrawal,
			Hex
		];
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
	account: Address;
	token: Address;
	amount: string;
};

export type MagicSpendBalance = {
	chain: string;
	token: string;
	balance: bigint;
};

export class MagicSpend {
	client: Client<
		Transport,
		Chain | undefined,
		Account | undefined,
		PimlicoMagicSpendSchema
	>;

	wagmiConfig: Config;

	constructor(wagmiConfig: Config) {
		this.client = createClient({
			transport: http(process.env.NEXT_PUBLIC_PIMLICO_API_URL),
		});
		this.wagmiConfig = wagmiConfig;
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
					chain: chain.name,
					token: chain.nativeCurrency.symbol,
					balance,
				};
			}),
		);
	}

	async getStakes(account: Address) {
		const stakes = await this.client.request({
			method: "pimlico_getMagicSpendStakes",
			params: [
				{
					account,
					asset: MAGIC_SPEND_ETH,
				},
			],
		});

		return stakes.map((stake) => ({
			...stake,
			withdrawTime: new Date(Number(stake.withdrawTime)),
			unstakeDelaySec: BigInt(stake.unstakeDelaySec),
			amount: BigInt(stake.amount),
			remaining: BigInt(stake.remaining),
			pending: BigInt(stake.pending),
			chainId: Number(stake.chainId),
		}));
	}

	async getAllowancesByOperator(operator: Address) {
		const allowances = await this.client.request({
			method: "pimlico_getMagicSpendAllowancesByOperator",
			params: [operator],
		});

		return allowances.map((allowance) => ({
			...allowance,
			assets: allowance.assets.map((asset) => ({
				...asset,
				amount: BigInt(asset.amount),
				used: BigInt(asset.used),
			})),
		}));
	}

	async prepareAllowance(params: PimlicoMagicSpendPrepareAllowanceParams) {
		return this.client.request({
			method: "pimlico_prepareMagicSpendAllowance",
			params: [params],
		});
	}

	async grantAllowance(allowance: MagicSpendAllowance, signature: Hex) {
		return this.client.request({
			method: "pimlico_grantMagicSpendAllowance",
			params: [{ allowance, signature }],
		});
	}

	async sponsorWithdrawal({
		token,
		recipient,
		amount,
		signature,
	}: {
		token: Address, recipient: Address, amount: string, signature: Hex
	}) {
		return this.client.request({
			method: "pimlico_sponsorMagicSpendWithdrawal",
			params: [{
				token,
				recipient,
				amount,
				signature,
				salt: "0x000000",
			}],
		});
	}
}
