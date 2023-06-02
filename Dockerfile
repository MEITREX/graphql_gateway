FROM node:20

WORKDIR /gateway/

RUN npm install -g pnpm

COPY . .

RUN pnpm install --frozen-lockfile --prod

CMD pnpm start