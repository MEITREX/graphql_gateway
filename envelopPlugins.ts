import { PluginOrDisabledPlugin } from '@envelop/core';
import { useGenericAuth, ResolveUserFn } from '@envelop/generic-auth';

const keycloakHost = "host.docker.internal";
const keycloakPort = "9009";
const realmName = "GITS";

type UserType = {
    id: string
}
   
const resolveUserFn: ResolveUserFn<UserType> = async context => {
    // Here you can implement any custom sync/async code, and use the context built so far in Envelop and the HTTP request
    // to find the current user.
    // Common practice is to use a JWT token here, validate it, and use the payload as-is, or fetch the user from an external services.
    // Make sure to either return `null` or the user object.

    try {
        // get user information from request headers
        const authHeader = context.req.headers.authorization;

        const url = `http://${keycloakHost}:${keycloakPort}/realms/${realmName}/protocol/openid-connect/userinfo`;
        const options = {
            method: "GET",
            headers: {
                "authorization": authHeader
            }
        };

        // send request to keycloak
        const response = await fetch(url, options);
        const responseJson = await response.json();

        if (response.status == 200) {
            return responseJson;
        } else {
            return null;
        }
    } catch (e) {
        console.error('Failed to validate token');
        console.error(e);

        return null;
    }
}

const plugins: PluginOrDisabledPlugin = [
    useGenericAuth({
        resolveUserFn,
        mode: "protect-all"
    })
]

export default plugins;