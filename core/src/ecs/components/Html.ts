import { ClientSystemBuilder, Component, Entity, World, entries } from "@piggo-gg/core"

export type HtmlSetup = (html: Html, world: World) => Promise<void> | void
export type HtmlElementBuilder = (world: World) => Promise<HTMLElement | null> | HTMLElement | null
export type HtmlAppendTarget = HTMLElement | ((world: World) => HTMLElement | null)

export type Html = Component<"html"> & {
  element: HTMLElement | undefined
  initialized: boolean
  initializing: boolean
  setup: HtmlSetup | undefined
  init: HtmlElementBuilder | undefined
  onTick: undefined | ((world: World) => void)
  cleanup: () => void
  _init: (world: World) => Promise<void>
}

export type HtmlProps = {
  element?: HTMLElement
  init?: HtmlElementBuilder
  setup?: HtmlSetup
  onTick?: (world: World) => void
}

export const Html = (props: HtmlProps = {}): Html => {
  const html: Html = {
    type: "html",
    element: props.element,
    initialized: false,
    initializing: false,
    setup: props.setup,
    init: props.init,
    onTick: props.onTick,
    cleanup: () => {
      if (html.element?.parentElement) {
        html.element.parentElement.removeChild(html.element)
      }
    },
    _init: async (world: World) => {
      if (html.initialized || html.initializing) return
      html.initializing = true

      if (!html.element && html.init) {
        const element = await html.init(world)
        if (element) html.element = element
      }

      if (!html.element) {
        html.initialized = true
        html.initializing = false
        return
      }

      if (html.setup) await html.setup(html, world)

      html.initialized = true
      html.initializing = false
    }
  }

  return html
}

export const HtmlSystem = ClientSystemBuilder({
  id: "HtmlSystem",
  init: (world) => {
    const tracked: Record<string, Html> = {}

    return {
      id: "HtmlSystem",
      query: ["html"],
      priority: 0,
      skipOnRollback: true,
      onTick: (entities: Entity<Html>[]) => {
        for (const entity of entities) {
          const { html } = entity.components
          tracked[entity.id] = html

          if (!html.initialized && !html.initializing) {
            html._init(world).then(() => {
              const parent = document.getElementById("canvas-parent") ?? document.body

              if (html.element) parent.appendChild(html.element)
            })
          }

          if (html.onTick) {
            html.onTick(world)
          }
        }

        for (const [id, html] of entries(tracked)) {
          const entity = world.entity(id)
          if (!entity?.components.html) {
            html.cleanup()
            delete tracked[id]
          }
        }
      }
    }
  }
})
