import { DiscordSDK } from '@discord/embedded-app-sdk'
import { Client } from "@piggo-gg/core"

export type Discord = {
  sdk: DiscordSDK
  login: (client: Client) => Promise<void>
}

export const Discord = (): Discord | undefined => {

  let sdk = undefined

  try {
    sdk = new DiscordSDK("1433003541521236100")
  } catch (error) {
    console.error("Discord SDK not available")
    return undefined
  }

  return {
    sdk,
    login: async (client: Client) => {
      const authorized = await sdk.commands.authorize({ client_id: "1433003541521236100", scope: ["identify"] })

      client.discordLogin(authorized.code, (token) => {
        const authenticated = sdk.commands.authenticate({ access_token: token.access_token })

        authenticated.then((auth) => {
          client.player.components.pc.data.name = auth.user.username
        })
      })
    }
  }
}
