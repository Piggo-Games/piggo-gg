import { DiscordSDK } from '@discord/embedded-app-sdk'

export type Discord = {
  sdk: DiscordSDK
  userId: () => Promise<string | undefined>
}

export const Discord = (): Discord | undefined => {

  let sdk = undefined

  try {
    sdk = new DiscordSDK("1433003541521236100")
  } catch (error) {
    console.error("Discord SDK not available")
    return undefined
  }

  console.log("Discord SDK initialized:", sdk)

  return {
    sdk,
    userId: async () => {

      const authorized = await sdk.commands.authorize({ client_id: "1433003541521236100", scope: ["identify"] })
      console.log("Discord authorized:", authorized)

      const p = await sdk.commands.getInstanceConnectedParticipants()
      console.log("Discord participants:", p)

      // // get token
      // const token = await sdk.commands

      // const authenticated = await sdk.commands.authenticate( { access_token: authorized.code } )
      // console.log("Discord authenticated:", authenticated)

      // const user = await sdk.commands.getUser({ id: "@me" })
      // console.log("Discord user fetched:", user)
      // return authenticated?.user.username

      return undefined
    }
  }
}
