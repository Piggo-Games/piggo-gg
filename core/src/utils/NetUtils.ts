import { stringify } from "@piggo-gg/core"

export const ValidOrigins = [
  "https://localhost:8000",
  "http://localhost:8000",
  "https://piggo.gg",
  "https://dev.piggo.gg",
  "https://1433003541521236100.discordsays.com"
]

export const CORSHeaders = (origin: string) => ({
  "Access-Control-Allow-Origin": origin,
  "Access-Control-Allow-Methods": "GET,POST,OPTIONS",
  "Access-Control-Allow-Headers": "Content-Type, Authorization",
  "Access-Control-Allow-Credentials": "true"
})

export const DiscordCookie = (token: string) => {
  return `access_token=${token}; ` +
    `Domain=1433003541521236100.discordsays.com; ` +
    `SameSite=None; Partitioned; Secure; Path=/;`
}

export const HttpError = (status: number, message: string, origin: string) => {
  return new Response(stringify({ error: message }), {
    headers: {
      "Content-Type": "application/json",
      ...CORSHeaders(origin)
    },
    status
  })
}

export const HttpOk = (origin: string, data?: any, headers?: Record<string, string>) => {
  return new Response(data ? stringify(data) : null, {
    headers: {
      "Content-Type": "application/json",
      ...CORSHeaders(origin),
      ...(headers ? { ...headers } : {})
    },
    status: 200
  })
}

export const DiscordDomain = "1433003541521236100.discordsays.com"
