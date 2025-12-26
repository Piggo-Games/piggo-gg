import { ClientSystemBuilder, Component, Entity, World, entries } from "@piggo-gg/core"

export type HtmlSetup = (html: Html, world: World) => Promise<void> | void
export type HtmlElementBuilder = (world: World) => Promise<HTMLElement> | HTMLElement
export type HtmlAppendTarget = HTMLElement | ((world: World) => HTMLElement | null)

export type Html = Component<"html"> & {
  element: HTMLElement | undefined
  initialized: boolean
  initializing: boolean
  rendered: boolean
  setup: HtmlSetup | undefined
  setElement: HtmlElementBuilder | undefined
  cleanup: () => void
  _init: (world: World) => Promise<void>
}

export type HtmlProps = {
  element?: HTMLElement
  setElement?: HtmlElementBuilder
  setup?: HtmlSetup
}

export const Html = (props: HtmlProps = {}): Html => {
  const html: Html = {
    type: "html",
    element: props.element,
    initialized: false,
    initializing: false,
    rendered: false,
    setup: props.setup,
    setElement: props.setElement,
    cleanup: () => {
      if (html.element?.parentElement) {
        html.element.parentElement.removeChild(html.element)
      }
      html.rendered = false
    },
    _init: async (world: World) => {
      if (html.initialized || html.initializing) return
      html.initializing = true

      if (!html.element && html.setElement) {
        html.element = await html.setElement(world)
      }

      if (!html.element) {
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

          if (!html.initialized) {
            html._init(world)
          }

          if (!html.initialized || !html.element || html.rendered) continue

          if (html.element.parentElement) {
            html.rendered = true
            continue
          }

          const parent = document.getElementById("canvas-parent") ?? document.body

          parent.appendChild(html.element)
          html.rendered = true
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
