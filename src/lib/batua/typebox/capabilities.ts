import * as Permissions from "@/lib/batua/typebox/permissions"
import * as Primitive from "@/lib/batua/typebox/primitive"
import * as Schema from "@/lib/batua/typebox/schema"
import { Type } from "@/lib/batua/typebox/schema"

export namespace createAccount {
    export const Request = Type.Union([
        Type.Boolean(),
        Type.Object({
            chainId: Schema.Optional(Primitive.TypeboxNumber),
            label: Schema.Optional(Type.String())
        })
    ])
    export type Request = Schema.StaticDecode<typeof Request>
}

export namespace grantPermissions {
    export const Request = Permissions.Request
    export type Request = Schema.StaticDecode<typeof Request>
}

export namespace permissions {
    export const Request = Type.Object({
        id: Schema.Optional(Primitive.Hex)
    })
    export type Request = Schema.StaticDecode<typeof Request>

    export const Response = Type.Array(Permissions.Permissions)
    export type Response = Schema.StaticDecode<typeof Response>
}
