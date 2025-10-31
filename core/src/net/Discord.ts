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
      const user = await sdk.commands.getUser({ id: "" })
      console.log("Discord user fetched:", user)
      return user?.username
    }
  }
}
