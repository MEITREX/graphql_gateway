# graphql_gateway
A gateway which uses graphql mesh to split a query into smaller queries to the different microservices.

## Installation

1. Requires pnpm package manager to run. Install pnpm.
2. Open a terminal in the root folder of the repository and run `pnpm install`

## Usage

1. Start all services the gateway needs (They need to be running before you start the gateway!)
2. Start the gateway with `pnpm start --port <your_favorite_port>`
3. The gateway will automatically fetch the services' GraphQL scheme using introspection and construct the unified scheme using the information provided in the `.meshrc.yaml` file
