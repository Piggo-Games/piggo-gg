import { DiscordSDK } from '@discord/embedded-app-sdk'

export type Discord = {
  sdk: DiscordSDK
}

export const Discord = (): Discord | null => {
  const sdk = new DiscordSDK("1433003541521236100")

  console.log("Discord SDK initialized:", sdk)

  return { sdk }
}
