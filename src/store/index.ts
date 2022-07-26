import { defineStore } from 'pinia'
import { ProtoFace } from '@/model/ProtoFace'

export const useStore = defineStore('protoface', {
  state: () => {
    return {
      projectLastSavedAt: undefined as Date | undefined,
      face: new ProtoFace()
    }
  },
  getters: {
    totalLedsOn: (state) => state.face.getNumberOfLitLEDs()
  },
  actions: {

  }
})
