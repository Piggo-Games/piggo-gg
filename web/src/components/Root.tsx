import { World } from "@piggo-gg/core"
import { Canvas } from "@piggo-gg/web"
import { useEffect, useState } from "react"
import { Toaster } from "react-hot-toast"

export type LoginState = "not logged in" | "🟢 Logged In" | ""

export const Root = () => {

  const [world, setWorld] = useState<World | undefined>()
  const [loginState, setLoginState] = useState<LoginState>("")

  // expose World to the console
  useEffect(() => {
    (window as any).world = world
  }, [world])

  const rootDiv = document.getElementById("root")
  if (rootDiv) {
    rootDiv.addEventListener("pointerup", () => {
      if (!world) return
      const audioElement = document.getElementById("sound") as HTMLAudioElement
      audioElement.play().then(() => {
        if (world.client) world.client.sound.ready = true
      })

    }, { capture: true, once: true })
  }

  return (
    <div>
      <audio id="sound">
        <source src="/silent.mp3" type="audio/mp3" />
      </audio>
      {/* <audio id="sound">
        <source src="data:audio/wav;base64,UklGRqxYAQBXQVZFZm10IBAAAAABAAEARKwAAIhYAQACABAAZGF0YYhYAQAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAA" type="audio/wav" />
      </audio> */}
      <Toaster position="bottom-center" containerStyle={{ fontFamily: "sans-serif" }} />
      <div>
        <Canvas setWorld={setWorld} />
        {/* <div style={{ width: "fit-content", display: "block", marginLeft: "auto", marginRight: "auto" }}> */}
        {/* {isMobile() ? null : <Title loginState={loginState} setLoginState={setLoginState} world={world} />} */}

        {/* <div style={{
          display: "flex", position: "absolute", left: "50%", top: "50px", transform: "translate(-50%, -50%)", alignItems: "center"
        }}>
          <h1 style={{
            fontFamily: "Courier New",
            fontSize: 52,
            margin: "0 10px",
            WebkitTextStrokeWidth: "0.5px",
            WebkitTextStrokeColor: "black"
          }}>
            Piggo
          </h1>
          <svg width="46" height="46" viewBox="0 0 160 170" xmlns="http://www.w3.org/2000/svg">
            <circle cx="80" cy="90" fill="#FFC0CB" r="79" />

            <path d="m10,53c0,-61.32 10.11,-51.43 50.54,-39.56" fill="#FFC0CB" transform="matrix(1, 0, 0, 1, 0, 0)" />
            <path d="m150,53c0,-61.32 -10.16,-51.43 -50.81,-39.56" fill="#FFC0CB" />

            <path d="m33.33,68.61q13.33,-22.22 26.67,0" fill="none" stroke="black" strokeLinecap="round" strokeWidth="10" />
            <path d="m99.17,68.96q13.75,-22.92 27.5,0" fill="none" stroke="black" strokeLinecap="round" strokeWidth="10" transform="matrix(1, 0, 0, 1, 0, 0)" />

            <ellipse cx="81.25" cy="106.25" fill="#FFA0AB" rx="30" ry="20" stroke="black" strokeWidth="4" />
            <circle cx="71" cy="106" fill="#000000" r="5" />
            <circle cx="91" cy="106" fill="#000000" r="5" />

            <path d="m107.6,117.17c6.98,-10.28 -4.43,31.08 -21.41,31.08c-17,0 -33.16,-30.69 -24.33,-25.04c8.83,5.64 38.77,4.25 45.74,-6.03z" fill="#000000" stroke="#000000" strokeWidth="3" />
            <path d="m76.82,141.95c0,-2.54 9.32,-6.11 14.45,-6.11c5.14,0 6.73,0.59 6.73,3.13c0,2.54 -6.25,7.42 -11.39,7.42c-5.14,0 -9.79,-1.89 -9.79,-4.43l0,-0.01z" fill="#ff909b" stroke="null" transform="matrix(1, 0, 0, 1, 0, 0)" />
          </svg>
        </div> */}
      </div>
    </div>
  )
}
