import { defineStore } from 'pinia'
import { ref } from 'vue'

export const useSettingsStore = defineStore('settings', () => {
  const welcome = ref(true)
  const drawer = ref(true)

  const stt_Settings = ref({
    language: 'en-US',
    confidence: 0.9,
  })

  const languages = ref([
    {
      title: 'English (United States)',
      value: 'en',
    },
    {
      title: 'Spanish (España)',
      value: 'es',
    },
    {
      title: '日本語（日本）',
      value: 'ja',
    },
  ])

  const language = ref(languages.value.map(language => language.value).includes(navigator.language.split('-')[0]) ? navigator.language.split('-')[0] : 'en')

  return {
    welcome,
    drawer,
    stt_Settings,
    languages,
    language,
  }
})
