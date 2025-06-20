FROM node:20 AS www
WORKDIR /root
COPY frontend/package* .
RUN npm ci
COPY frontend .
RUN npm run build

FROM rust:1.76-buster AS server
WORKDIR /root
COPY backend .
RUN cargo build -r

FROM debian:buster
WORKDIR /root
COPY --from=www /root/dist/livequiz/browser frontend
COPY --from=server /root/target/release/backend .
ENV ROCKET_ADDRESS=0.0.0.0
ENV STATIC_PAGE=./frontend

CMD ["./backend"]
