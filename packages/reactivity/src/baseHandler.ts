import { isObject } from '@vue/shared'
import { track, trigger } from './reactiveEffect'
import { reactive } from './reactive'


export enum ReactiveFlags {
  IS_REACTIVE = "__v_isReactive",
}

// 使用proxy 时 最好搭配 Reflect 使用
export const handler: ProxyHandler<any> = {
  get(target, key, receiver) {
    if (target[ReactiveFlags.IS_REACTIVE]) {
      return true
    }

    track(target, key)

    let res = Reflect.get(target, key, receiver)

    if (isObject(res)) {
      // 如果属性值是一个对象，则返回一个新的代理对象,递归代理
      return reactive(res)
    }

    return Reflect.get(target, key, receiver)
  },
  set(target, key, value, receiver) {
    let oldValue = Reflect.get(target, key, receiver)
    if (oldValue === value) {
      return true
    }
    const result = Reflect.set(target, key, value, receiver)
    trigger(target, key, value, oldValue)
    return result
  }
}
