import { Entity } from "@piggo-legends/core";
import { Position, TextBox, Networked, Clickable, Renderable, Actions } from "@piggo-legends/contrib";
import { Text } from "pixi.js";

export type BallProps = {
  id?: string,
  position?: { x: number, y: number }
}

export const Ball = ({ position, id }: BallProps = {}): Entity => ({
  id: id ?? `ball${Math.trunc(Math.random() * 100)}`,
  components: {
    position: new Position(position ?? { x: Math.random() * 600, y: Math.random() * 600 }),
    networked: new Networked({ isNetworked: true }),
    clickable: new Clickable({
      width: 32,
      height: 32,
      active: true,
      onPress: "click"
    }),
    actions: new Actions({
      "click": (entity: Entity) => {
        const t = (entity.components.renderable as TextBox).c as Text;
        t.text = "🙃";
      }
    }),
    renderable: new Renderable({
      debuggable: true,
      zIndex: 1,
      container: async () => new Text("🏀", { fill: "#FFFFFF", fontSize: 16 }),
    })
  }
});
