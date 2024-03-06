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

CMD ./backend