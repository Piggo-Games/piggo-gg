export const CORSHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Methods": "GET,POST,OPTIONS",
  "Access-Control-Allow-Headers": "Content-Type, Authorization",
}

export const CookieHeader = (token: string) => {
  return `access_token=${token}; ` + 
  `Domain=1433003541521236100.discordsays.com; ` +
  `SameSite=None; Partitioned; Secure; Path=/;`
}

export const DiscordDomain = "1433003541521236100.discordsays.com"
