FROM node:20-alpine

WORKDIR /app

ARG NEXT_PUBLIC_API_PORT=3001
ARG NEXT_PUBLIC_WS_PORT=3001
ENV NEXT_PUBLIC_API_PORT=$NEXT_PUBLIC_API_PORT
ENV NEXT_PUBLIC_WS_PORT=$NEXT_PUBLIC_WS_PORT

COPY package*.json ./

RUN npm install

COPY . .

RUN npm run build

# Copy static assets to standalone folder
RUN cp -r public .next/standalone/public || true
RUN cp -r .next/static .next/standalone/.next/static

EXPOSE 3010

ENV PORT 3010
ENV HOSTNAME "0.0.0.0"

CMD ["node", ".next/standalone/server.js"]
