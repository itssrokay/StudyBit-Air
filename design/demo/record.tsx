// Frame-exact recorder entry: the virtual clock is installed before the scene loads,
// and the recorder advances it one frame at a time through window.__stageshow.clock.
import { installVirtualClock } from '../kit/clock'
const fps = Number(new URLSearchParams(location.search).get('fps') || 25)
installVirtualClock({ fps })
const name = new URLSearchParams(location.search).get('scene')!
const { mount } = await import('./preview')
await mount(name, false)
;(window as unknown as { __ready: boolean }).__ready = true
