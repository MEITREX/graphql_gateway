# graphql_gateway
The gateway provides a unified API to access the functionality of the MEITREX backend.

The gateway is run as a [GraphQL Mesh](https://the-guild.dev/graphql/mesh) server which merges the GraphQL schemas of the different microservices into one unified schema.

More information on the basic idea of our setup using GraphQL Mesh can be found [here](../backend/graphql.md).

## API Documentation

See [api.md](api.md).

## Usage

**Please note that currently all services need to be running during startup of the Gateway to allow the Gateway to fetch the services' schemas. This makes sense during the development phase but in a production environment the schemas should be imported to the gateway via the services' schema files to improve system robustness when some services are offline during gateway startup.**

### Docker Environment
As the gateway is useless without any other services, it is recommended you run it via the [gits_backend repository](https://github.com/MEITREX/backend).

### Running the Gateway Standalone
A `docker-compose` file is provided which can be used to run the gateway via a terminal using `docker compose up`.

The gateway expects environment variables to be set which provide relevant configuration information for the gateway to run. The basic `docker-compose` file is set up to set these env variables for a configuration in which the other microservices are running on their default ports inside of the local docker network.

If the gateway is to be run without the `docker-compose` file, these environment variables have to be set by other means.

### Changing Configuration

Changing the hostname and port of the gateway can be achieved by modifying the relevant environment variables, located inside the `docker-compose` file.

If ports of the other microservices are changed or microservices are being run on another address, the environment variables for the different microservices, located inside the `environment` section of the `docker-compose` file, need to be changed.

## Adding More Microservices to the Gateway

Please take a look at the [GraphQL Mesh Documentation](https://the-guild.dev/graphql/mesh/docs/getting-started/your-first-mesh-gateway).

Sources (i.e. our different microservices) are defined at the top of the `.meshrc.yaml` file, inside the `sources` section.

The gateway stitches together the schemas provided by the sources provided.

The `additionalTypeDefs` section defines modifications to the stiched-together GraphQL schema. Here, fields are added and relevant information is provided which the gateway uses to populate the fields with data.

For example, a `contents` field is added to the Chapter type. This field's data is retrieved by sending a `contentsByChapterIds` Query to the `ContentService` source, where the query's `chapterIds` parameter is filled with the value of the `id`-field of the current `Chapter` object. 

The `additionalResolvers` section defines code for custom GraphQL queries which are implemented in TypeScript files in the corresponding folder.

## Environment variables

### Relevant for deployment

| Name                   | Description                        | Value in Dev Environment                                                   | Value in Prod Environment                                           |
|------------------------|------------------------------------|----------------------------------------------------------------------------|---------------------------------------------------------------------|
| GATEWAY_PORT           | Gateway port                       | 8080                                                                       | 8080                                                                |
| GATEWAY_HOSTNAME       | Gateway host name                  | 0.0.0.0                                                                    | 0.0.0.0                                                             |
| DAPR_HTTP_PORT         | Dapr HTTP Port                     | -                                                                          | 3500                                                                |
| COURSE_SERVICE_URL     | URL for course service GraphQL     | http://host.docker.internal:2001/graphql                                   | http://localhost:3500/v1.0/invoke/course-service/method/graphql     |
| MEDIA_SERVICE_URL      | URL for media service GraphQL      | http://host.docker.internal:3001/graphql                                   | http://localhost:3500/v1.0/invoke/media-service/method/graphql      |
| CONTENT_SERVICE_URL    | URL for content service GraphQL    | http://host.docker.internal:4001/graphql                                   | http://localhost:3500/v1.0/invoke/content-service/method/graphql    |
| USER_SERVICE_URL       | URL for user service GraphQL       | http://host.docker.internal:5001/graphql                                   | http://localhost:3500/v1.0/invoke/user-service/method/graphql       |
| FLASHCARD_SERVICE_URL  | URL for flashcard service GraphQL  | http://host.docker.internal:6001/graphql                                   | http://localhost:3500/v1.0/invoke/flashcard-service/method/graphql  |
| REWARD_SERVICE_URL     | URL for reward service GraphQL     | http://host.docker.internal:7001/graphql                                   | http://localhost:3500/v1.0/invoke/reward-service/method/graphql     |
| SKILLLEVEL_SERVICE_URL | URL for skilllevel service GraphQL | http://host.docker.internal:8001/graphql                                   | http://localhost:3500/v1.0/invoke/skilllevel-service/method/graphql |
| QUIZ_SERVICE_URL       | URL for quiz service GraphQL       | http://host.docker.internal:9001/graphql                                   | http://localhost:3500/v1.0/invoke/quiz-service/method/graphql       |                                                               |
| ASSIGNMENT_SERVICE_URL | URL for assignment service GraphQL | http://host.docker.internal:11001/graphql                                  | http://localhost:3500/v1.0/invoke/assignment-service/method/graphql  |
| GAMIFICATION_SERVICE_URL | URL for gamification service GraphQL | http://host.docker.internal:1201/graphql                                   | http://localhost:1200\v1.0/invoke/gamifiation-service/method/graphql  |
| JWKS_URL               | URL for jwks keycloak              | http://host.docker.internal:9009/realms/GITS/protocol/openid-connect/certs | http://keycloak/keycloak/realms/GITS/protocol/openid-connect/certs  |



### Other properties
| Name                   | Description                        | Value in Dev Environment                                                   | Value in Prod Environment                                           |
|------------------------|------------------------------------|----------------------------------------------------------------------------|---------------------------------------------------------------------|
| DAPR_GRPC_PORT         | Dapr gRPC Port                     | -                                                                          | 50001                                                               |
