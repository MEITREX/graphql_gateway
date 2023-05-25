import { PluginOrDisabledPlugin } from '@envelop/core'
import { useGenericAuth, ResolveUserFn } from '@envelop/generic-auth'

type UserType = {
    id: string
}
   
const resolveUserFn: ResolveUserFn<UserType> = async context => {
    // Here you can implement any custom sync/async code, and use the context built so far in Envelop and the HTTP request
    // to find the current user.
    // Common practice is to use a JWT token here, validate it, and use the payload as-is, or fetch the user from an external services.
    // Make sure to either return `null` or the user object.

    try {
        console.log(context.req.headers.auth)
        
        // get user information from request headers and validate it using the user service.

        return {"auth": context.req.headers.auth}
    } catch (e) {
        console.error('Failed to validate token')

        return null
    }
}

const plugins: PluginOrDisabledPlugin = [
    useGenericAuth({
        resolveUserFn,
        mode: "protect-all"
    })
]

export default plugins