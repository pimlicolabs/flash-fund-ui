import { announceProvider } from "mipd"
import { Address, Hex, Provider as ProviderOx } from "ox"
import type { Internal } from "@/lib/batua/type"
import { getClient as getClientHelper } from "@/lib/batua/helpers/getClient"
import * as Rpc from "@/lib/batua/typebox/rpc"

export const Provider = {
    from: ({ internal }: { internal: Internal }) => {
        const { store, getImplementation, config } = internal

        function getClient(chainId_?: Hex.Hex | number | undefined) {
            const chainId =
                typeof chainId_ === "string" ? Hex.toNumber(chainId_) : chainId_
            return getClientHelper({ internal, chainId })
        }

        const emitter = ProviderOx.createEmitter()
        const provider = ProviderOx.from({
            ...emitter,
            request: async (request_) => {
                let request: Rpc.parseRequest.ReturnType
                try {
                    request = Rpc.parseRequest(request_)
                } catch (e) {
                    const unsupportedCode = 62
                    if ((e as any).error?.type !== unsupportedCode) throw e

                    // catch unsupported methods
                    if (
                        (request_ as { method: string }).method.startsWith(
                            "wallet_"
                        )
                    )
                        throw new ProviderOx.UnsupportedMethodError()
                    return getClient().request(request_ as any)
                }

                const state = store.getState()

                switch (request.method) {
                    case "eth_accounts": {
                        if (state.accounts.length === 0)
                            throw new ProviderOx.DisconnectedError()
                        const response = state.accounts.map(
                            (account) => account.address
                        )
                        return response
                    }
                    case "eth_chainId": {
                        const response = Hex.fromNumber(state.chain.id)
                        return response
                    }
                    case "wallet_getCapabilities": {
                        const value = {
                            atomicBatch: {
                                supported: true
                            },
                            // createAccount: {
                            //     supported: true
                            // },
                            // permissions: {
                            //     supported: true
                            // },
                            paymasterService: {
                                supported: true
                            }
                        }

                        const capabilities = {} as Record<Hex.Hex, typeof value>
                        for (const chain of config.chains)
                            capabilities[Hex.fromNumber(chain.id)] = value

                        return capabilities
                    }
                    case "eth_requestAccounts": {
                        if (state.accounts.length > 0) {
                            return state.accounts.map(
                                (account) => account.address
                            )
                        }
                        const client = getClient()
                        const { accounts } =
                            await getImplementation().actions.loadAccounts({
                                client,
                                config,
                                request,
                                store
                            })

                        emitter.emit("connect", {
                            chainId: Hex.fromNumber(client.chain.id)
                        })
                        const response = accounts.map(
                            (account) => account.address
                        )
                        return response
                    }
                    case "eth_sendTransaction": {
                        if (state.accounts.length === 0)
                            throw new ProviderOx.DisconnectedError()

                        const [{ chainId, data = "0x", from, to, value }] =
                            request._decoded.params

                        const client = getClient(chainId)

                        if (chainId && chainId !== client.chain.id)
                            throw new ProviderOx.ChainDisconnectedError()

                        const account = state.accounts.find((account) =>
                            Address.isEqual(account.address, from)
                        )
                        if (!account) throw new ProviderOx.UnauthorizedError()

                        const hash =
                            await getImplementation().actions.sendCalls({
                                account,
                                calls: [
                                    {
                                        data,
                                        to,
                                        value
                                    }
                                ],
                                client,
                                config,
                                request,
                                store
                            })

                        let txHash: Hex.Hex | undefined

                        while (!txHash) {
                            const receipts =
                                await getImplementation().actions.getCallsStatus(
                                    {
                                        client,
                                        config,
                                        request,
                                        store,
                                        userOperationHash: hash,
                                        timeout: 60_000 // 1 minute
                                    }
                                )

                            if (receipts.status >= 200) {
                                txHash = receipts.receipts?.[0]?.transactionHash
                            }
                        }

                        return txHash
                    }
                    case "wallet_sendCalls": {
                        if (state.accounts.length === 0)
                            throw new ProviderOx.DisconnectedError()

                        const [{ chainId, calls }] = request._decoded.params

                        const from =
                            request._decoded.params[0].from ??
                            state.accounts[0].address

                        const client = getClient(chainId)

                        if (chainId && chainId !== client.chain.id)
                            throw new ProviderOx.ChainDisconnectedError()

                        const account = state.accounts.find((account) =>
                            Address.isEqual(account.address, from)
                        )
                        if (!account) throw new ProviderOx.UnauthorizedError()

                        const hash =
                            await getImplementation().actions.sendCalls({
                                account,
                                calls,
                                capabilities:
                                    request._decoded.params[0]?.capabilities ??
                                    undefined,
                                client,
                                config,
                                request,
                                store
                            })

                        return hash
                    }
                    case "wallet_getCallsStatus": {
                        if (state.accounts.length === 0)
                            throw new ProviderOx.DisconnectedError()

                        const [userOperationHash] = request._decoded.params

                        const client = getClient()

                        const receipts =
                            await getImplementation().actions.getCallsStatus({
                                client,
                                config,
                                request,
                                store,
                                userOperationHash
                            })

                        return receipts
                    }
                    case "wallet_revokePermissions": {
                        if (state.accounts.length === 0)
                            throw new ProviderOx.DisconnectedError()

                        internal.store.setState((x) => ({
                            ...x,
                            accounts: []
                        }))

                        return undefined
                    }
                }
            }
        })

        const setup = () => {
            const unsubscribe_accounts = store.subscribe(
                (state) => state.accounts,
                (accounts) => {
                    emitter.emit(
                        "accountsChanged",
                        accounts.map((account) => account.address)
                    )
                }
            )

            const unsubscribe_chain = store.subscribe(
                (state) => state.chain,
                (chain) => {
                    emitter.emit("chainChanged", Hex.fromNumber(chain.id))
                }
            )

            const unAnnounce =
                internal.config.announceProvider &&
                typeof window !== "undefined"
                    ? announceProvider({
                          info: {
                              name: "Batua",
                              icon: "data:image/png;base64,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AAAA5QkcAAAAQHkCBwAAAFCewAEAAACUJ3AAAAAA5QkcAAAAQHkCBwAAAFCewAEAAACUJ3AAAAAA5QkcAAAAQHkCBwAAAFCewAEAAACUJ3AAAAAA5QkcAAAAQHkCBwAAAFCewAEAAACUJ3AAAAAA5QkcAAAAQHkCBwAAAFCewAEAAACUJ3AAAAAA5QkcAAAAQHkCBwAAAFCewAEAAACUJ3AAAAAA5QkcAAAAQHkCBwAAAFCewAEAAACUJ3AAAAAA5QkcAAAAQHkCBwAAAFCewAEAAACUJ3AAAAAA5QkcAAAAQHkCBwAAAFCewAEAAACUJ3AAAAAA5QkcAAAAQHkCBwAAAFCewAEAAACUJ3AAAAAA5QkcAAAAQHkCBwAAAFCewAEAAACUJ3AAAAAA5QkcAAAAQHkCBwAAAFCewAEAAACUJ3AAAAAA5QkcAAAAQHkCBwAAAFCewAEAAACUJ3AAAAAA5QkcAAAAQHkCBwAAAFCewAEAAACUJ3AAAAAA5QkcAAAAQHkCBwAAAFCewAEAAACUJ3AAAAAA5QkcAAAAQHkCBwAAAFCewAEAAACUJ3AAAAAA5QkcAAAAQHkCBwAAAFCewAEAAACUJ3AAAAAA5QkcAAAAQHkCBwAAAFCewAEAAACUJ3AAAAAA5QkcAAAAQHkCBwAAAFCewAEAAACUJ3AAAAAA5QkcAAAAQHkCBwAAAFCewAEAAACUJ3AAAAAA5QkcAAAAQHkCBwAAAFCewAEAAACUJ3AAAAAA5QkcAAAAQHkCBwAAAFCewAEAAACUJ3AAAAAA5QkcAAAAQHkCBwAAAFCewAEAAACUJ3AAAAAA5QkcAAAAQHkCBwAAAFCewAEAAACUJ3AAAAAA5QkcAAAAQHkCBwAAAFCewAEAAACUJ3AAAAAA5QkcAAAAQHkCBwAAAFCewAEAAACUJ3AAAAAA5QkcAAAAQHkCBwAAAFCewAEAAACUJ3AAAAAA5QkcAAAAQHkCBwAAAFCewAEAAACUJ3AAAAAA5QkcAAAAQHkCBwAAAFCewAEAAACUJ3AAAAAA5QkcAAAAQHkCBwAAAFCewAEAAACUJ3AAAAAA5QkcAAAAQHkCBwAAAFCewAEAAACUJ3AAAAAA5QkcAAAAQHkCBwAAAFCewAEAAACUJ3AAAAAA5QkcAAAAQHkCBwAAAFCewAEAAACUJ3AAAAAA5QkcAAAAQHkCBwAAAFCewAEAAACUJ3AAAAAA5QkcAAAAQHkCBwAAAFCewAEAAACUJ3AAAAAA5QkcAAAAQHkCBwAAAFCewAEAAACUJ3AAAAAA5QkcAAAAQHkCBwAAAFCewAEAAACUJ3AAAAAA5QkcAAAAQHkCBwAAAFCewAEAAACUJ3AAAAAA5QkcAAAAQHkCBwAAAFCewAEAAACUJ3AAAAAA5QkcAAAAQHkCBwAAAFCewAEAAACUJ3AAAAAA5QkcAAAAQHkCBwAAAFCewAEAAACUJ3AAAAAA5QkcAAAAQHkCBwAAAFCewAEAAACUJ3AAAAAA5QkcAAAAQHkCBwAAAFCewAEAAACUJ3AAAAAA5QkcAAAAQHkCBwAAAFDe/wOkBT/J2dbWtAAAAABJRU5ErkJggg==",
                              rdns: "pimlico.io",
                              uuid: internal.id
                          },
                          // biome-ignore lint/suspicious/noExplicitAny: viem & announceProvider has different declaration but same thing
                          provider: provider as any
                      })
                    : () => {}
            return () => {
                unsubscribe_accounts()
                unsubscribe_chain()
                unAnnounce()
            }
        }

        const destroy = setup()

        return Object.assign(provider, {
            destroy
        })
    }
}
