import {
  Component, ComponentTypes, NetworkedComponentData, ValidComponents, deserializeComponent,
  entries, keys, serializeComponent, values
} from "@piggo-gg/core"

export type SerializedEntity = Record<string, NetworkedComponentData>

export type ProtoEntity<T extends ComponentTypes = ComponentTypes> = {
  id: string
  persists?: boolean
  components: ComponentTypes extends T ?
  {
    // all components optional
    [P in ComponentTypes['type']]?: Extract<ComponentTypes, { type: P }>
  } : {
    // provided components are required, the rest are optional
    [P in T['type']]: Extract<T, { type: P }> } & {
    [P in Exclude<ComponentTypes['type'], T['type']>]?: Extract<ComponentTypes, { type: P }>
  }
}

// an Entity is a uniquely identified set of Components
export type Entity<T extends ComponentTypes = ComponentTypes> = ProtoEntity<T> & {
  serialize: () => SerializedEntity
  deserialize: (serializedEntity: SerializedEntity, component?: ValidComponents) => void
  removed: boolean
}

export const Entity = <T extends ComponentTypes>(protoEntity: ProtoEntity<T>): Entity<T> => {

  const entity: Entity<T> = {
    ...protoEntity,
    removed: false,
    serialize: () => {
      const serializedEntity: SerializedEntity = {}

      const sortedComponents = values(protoEntity.components).sort((a: Component, b: Component) => a.type.localeCompare(b.type))
      sortedComponents.forEach((component: Component<string, NetworkedComponentData>) => {
        const serializedComponent = serializeComponent(component)
        if (keys(serializedComponent).length) {
          serializedEntity[component.type] = { ...serializedComponent }
        }
      })

      return serializedEntity
    },
    deserialize: (serializedEntity: SerializedEntity, component?: ValidComponents) => {

      // deprecated
      for (const type of keys(serializedEntity)) {
        if (!(type in entity.components)) {
          console.error(`MISSING COMPONENT type=${type} entity=${entity.id}`)
        }
      }

      for (const [type, serializedComponent] of entries(serializedEntity)) {
        // entries(serializedEntity).forEach(([type, serializedComponent]) => {
        if (type in entity.components) {
          if (component && type !== component) continue
          // @ts-expect-error
          deserializeComponent(entity.components[type], serializedComponent)
        }
      }
    }
  }

  return entity
}
