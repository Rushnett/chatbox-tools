import { defineStore } from 'pinia'

interface Profile {
  [name: string]: Param[];
}
interface Param {
  ip: string
  port: string
  route: string
  keywords: Keyword[]
  assigns: Assign[]
  activation_signal: string
  pulse_delay: number
}
interface Keyword {
  enabled: boolean
  text: string
}
interface Assign {
  keyword: string
  type: string
  set: string
}

export const useOSCStore = defineStore('osc', {
  state: () => ({
    ws: {
      ip: '127.0.0.1',
      port: '8999',
    },

    ip: '127.0.0.1',
    port: '9000',
    osc_text: true,
    text_typing: true, // typing indicator
    stt_typing: true, // talking indicator
    sfx: true, // vrchat sfx indicator
    show_keyboard: false,

    osc_profiles: {
      'Default': []
    } as Profile,

    current_profile: 'Default'
  }),
  getters: {

  },
  actions: {

  },
})
