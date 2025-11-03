import { DiscordSDK } from '@discord/embedded-app-sdk'
import { Client, DiscordMe, GoodResponse } from "@piggo-gg/core"

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
    return undefined
  }

  return {
    sdk,
    login: async (client: Client) => {
      if (loggedIn) return
      loggedIn = true

      // cookie already has token
      const signedInFlow = async (response: GoodResponse<DiscordMe["response"]>) => {
        client.player.components.pc.data.name = response.username
      }

      // fresh login
      const unsignedInFlow = async () => {
        const authorized = await sdk.commands.authorize({ client_id: "1433003541521236100", scope: ["identify"] })

        client.discordLogin(authorized.code, (token) => {
          const authenticated = sdk.commands.authenticate({ access_token: token.access_token })

          authenticated.then((auth) => {
            client.player.components.pc.data.name = auth.user.username
          })
        })
      }

      client.discordMe(signedInFlow, unsignedInFlow)
    }
  }
}
