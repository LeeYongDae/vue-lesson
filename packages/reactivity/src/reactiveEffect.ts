import { activeEffect, traceEffect, triggerEffects } from './effect'

const createDep = (cleanup) => {
  const dep = new Map() as any
  if (cleanup) {
    dep.cleanup = cleanup
  }
  return dep
}

const targetMap = new WeakMap()
export function track(target, key) {
  //activeEffect 是 effect.ts 中定义的一个全局变量，在 track 函数执行时，
  if (activeEffect) {
    let depsMap = targetMap.get(target)
    if (!depsMap) {
      targetMap.set(target, (depsMap = new Map()))
    }
    let dep = depsMap.get(key)
    if (!dep) {
      depsMap.set(key, dep = createDep(() => depsMap.delete(key))) //用于清理不需要的属性
    }
    traceEffect(activeEffect, dep) // 用于添加 effect 到 dep 中
  }
}

export function trigger(target, key, value, oldValue) {
  const depsMap = targetMap.get(target)
  if (!depsMap) return // 如果没有依赖，则直接返回

  const dep = depsMap.get(key)
  if (dep) {
    triggerEffects(dep)
  }
}
