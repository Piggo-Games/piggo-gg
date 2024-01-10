import { Entity } from "@piggo-legends/core";
import { Position, TextBox, Networked, Clickable, Renderable, Actions, Collider } from "@piggo-legends/contrib";
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
    collider: new Collider({ radius: 7 }),
    renderable: new Renderable({
      debuggable: true,
      zIndex: 1,
      container: async () => {
        const text = new Text("🏀", { fill: "#FFFFFF", fontSize: 16 })
        text.anchor.set(0.5);
        return text;
      }
    })
  }
});
