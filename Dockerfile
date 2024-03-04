# use the official Bun image
# see all versions at https://hub.docker.com/r/oven/bun/tags
# FROM oven/bun:1.0.29 as www
# # USER bun
# RUN pwd
# COPY frontend .
# RUN bun --version
# RUN bun install
# # RUN bun install --frozen-lockfile --production
# RUN bun run build

FROM node:20 as www
WORKDIR /root
COPY frontend .
RUN npm ci
RUN ls
RUN npm run build

FROM rust:1.76-buster as server
WORKDIR /root
COPY backend .
RUN cargo build -r
RUN ls

FROM debian:buster
WORKDIR /root
COPY --from=www /root/dist/livequiz/browser frontend
COPY --from=server /root/target/release/backend .