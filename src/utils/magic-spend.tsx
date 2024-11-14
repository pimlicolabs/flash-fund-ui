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
} from "viem";

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
	chainId: string;
	asset: Address;
	amount: string;
	pending: string;
	remaining: string;
};

export const MAGIC_SPEND_ETH: Address =
	"0xEeeeeEeeeEeEeeEeEeEeeEEEeeeeEeeeeeeeEEeE";

export type PimlicoMagicSpendSchema = [
	{
		Parameters: [account: Address];
		ReturnType: {
			amount: string;
		};
		Method: "pimlico_getMagicSpendStakes";
	},
	{
		Parameters: [
			{
				account: Address;
				asset: Address;
			},
		];
		ReturnType: {
			amount: string;
		};
		Method: "pimlico_getMagicSpendStakes";
	},
	{
		Parameters: {
			account: Address;
			asset: Address;
			amount: string;
		};
		ReturnType: MagicSpendAllowance;
		Method: "pimlico_prepareMagicSpendAllowance";
	},
	{
		Parameters: {
			allowance: MagicSpendAllowance;
			signature: Hex;
		};
		ReturnType: {
			withdrawal: MagicSpendWithdrawal;
			signature: Hex;
		};
		Method: "pimlico_grantMagicSpendAllowance";
	},
	{
		Parameters: Record<string, never>;
		ReturnType: {
			signature: Hex;
			withdrawal: MagicSpendWithdrawal;
		};
		Method: "pimlico_sponsorMagicSpendWithdrawal";
	},
	{
		Parameters: {
			operator: Address;
		};
		ReturnType: {
			signature: Hex;
		};
		Method: "pimlico_getMagicSpendAllowancesByOperator";
	},
];

export type PimlicoMagicSpendPrepareAllowanceParams = {
	account: Address;
	asset: Address;
	amount: string;
};

export class MagicSpend {
	client: Client<
		Transport,
		Chain | undefined,
		Account | undefined,
		PimlicoMagicSpendSchema
	>;

	constructor() {
		this.client = createClient({
			transport: http(process.env.NEXT_PUBLIC_PIMLICO_API_URL),
		});
	}

	async getStakes(account: Address) {
		return this.client.request({
			method: "pimlico_getMagicSpendStakes",
			params: [
				{
					account,
					asset: MAGIC_SPEND_ETH,
				},
			],
		});
	}

	async prepareAllowance(params: PimlicoMagicSpendPrepareAllowanceParams) {
		return this.client.request({
			method: "pimlico_prepareMagicSpendAllowance",
			params,
		});
	}
}
