import { DiscordSDK } from '@discord/embedded-app-sdk'
import { Client } from "@piggo-gg/core"

export type Discord = {
  sdk: DiscordSDK
  login: (client: Client) => Promise<void>
}

export const Discord = (): Discord | undefined => {

  let sdk: DiscordSDK | undefined = undefined
  let loggedIn = false

  try {
    sdk = new DiscordSDK("1433003541521236100")
  } catch (error) {
    console.error("Discord SDK not available")
    return undefined
  }

  console.log("Discord SDK initialized", sdk)

  return {
    sdk,
    login: async (client: Client) => {
      if (loggedIn) return
      loggedIn = true

      // two paths — authorized (cookie stored) / unauthorized (need to allow)
      client.discordMe(async (response) => {
        client.player.components.pc.data.name = response.username

        await sdk.commands.authenticate({ access_token: response.access_token })
        const participants = await sdk.commands.getActivityInstanceConnectedParticipants()

        console.log("PARTICIPANTS", participants)

        console.log("INSTANCE ID", sdk.instanceId)
      }, async () => {
        const authorized = await sdk.commands.authorize({ client_id: "1433003541521236100", scope: ["identify"] })

        client.discordLogin(authorized.code, (token) => {
          const authenticated = sdk.commands.authenticate({ access_token: token.access_token })

          authenticated.then((auth) => {
            client.player.components.pc.data.name = auth.user.username
          })
        })
      })
    }
  }
}
