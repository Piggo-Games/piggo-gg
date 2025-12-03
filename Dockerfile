from oven/bun:1.2.21-slim

# openssl for postgres
run apt-get update -y && apt-get install -y openssl

# add package.json
add package.json package.json

# add top-level modules
add core core
add docs docs
add web web
add server server
add electron electron

# install dependencies
run bun install --production

# run the server
cmd [ "bun", "prod" ]
