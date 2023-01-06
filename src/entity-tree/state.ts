import { Engine } from '@dcl/sdk/ecs'
import { getPort, ServerName, waitForServer } from '../modules/port'
import { createTransport } from './transport'
import * as components from '@dcl/ecs/dist/components'

export async function testTransport() {
  console.log('testing transport')
  const port = await getPort(ServerName.WSTransport)
  const url = `http://localhost:${port}`
  await waitForServer(url)
  const engine = Engine({
    onChangeFunction(entity, type, component) {
      console.log('onChangeFunction', entity, type, component?._id)
    },
  })
  const transportA = await createTransport('A')
  const transportB = await createTransport('B')

  const Transform = components.Transform(engine)
  const MeshRenderer = components.MeshRenderer(engine)

  engine.addTransport(transportA)
  engine.addTransport(transportB)
  const entity = engine.addEntity()
  Transform.create(entity, { position: { x: 8, y: 0, z: 8 } })
  MeshRenderer.create(entity, {
    mesh: { $case: 'plane', plane: { uvs: [0, 1, 2] } },
  })
  await engine.update(0)
  const transform = Transform.getMutable(entity)
  transform.position.x = 4
  await engine.update(1)
}
