export function effect(fn, options?) {
  //创建一个响应式effect 数据变化后可以触发回调
  const _effect = new ReactiveEffect(fn, () => {
    _effect.run()
  })
  //立即执行
  _effect.run()

  if (options) {
    Object.assign(_effect, options) //用户传递的覆盖掉内部的
  }

  const runner = _effect.run.bind(_effect)
  runner.effect = _effect
  return runner
}

export let activeEffect = null

function cleanDepEffect(dep, effect) {
  dep.delete(effect)
  if (dep.size === 0) {
    dep.cleanup() //如果map为空，则删除这个属性
  }
}

// 1._trackId 用于记录执行次数 （防止一个属性在当前effect中多次依赖收集） 只收集一次
// 2.拿到上一次依赖的最后一个和这次比较 （防止重复依赖）

export function traceEffect(effect, dep) {
  //需要重新的去收集依赖，将不需要的依赖过滤掉
  if (dep.get(effect) !== effect._trackId) {
    dep.set(effect, effect._trackId) //更新id
    let oldDep = effect.deps[effect._depsLength]
    if (oldDep !== dep) {
      if (oldDep) {
        cleanDepEffect(oldDep, effect)
      }
      effect.deps[effect._depsLength++] = dep //永远按照本次最新的来存放
    } else {
      effect._depsLength++
    }
  }
}

export function triggerEffects(dep) {
  for (const effect of dep.keys()) {
    if (effect.scheduler) {
      effect.scheduler()
    }
  }
}

function postCleanEffect(effect) {
  if (effect.deps.lenght > effect._depsLength) {
    for (let i = effect._depsLength; i < effect.deps.length; i++) {
      cleanDepEffect(effect.deps[i], effect) //s删除映射表中对应的effect
    }
    effect.deps.length = effect._depsLength // 删除多余的deps
  }
}

function preCleanEffect(effect) {
  effect._depsLength = 0
  effect._trackId++ //每次执行effect时，递增_trackId, 如果当前同一个effect执行，ID是相同的
}

class ReactiveEffect {
  public active = true; //创建的effect是响应式的
  _trackId = 0; //用于跟踪依赖
  public deps = []; //effect的依赖列表
  public _depsLength = 0; //effect的依赖列表长度
  constructor(public fn, public scheduler) { }

  run() {
    if (!this.active) {
      return this.fn()
    }
    let lastEffect = activeEffect

    try {
      activeEffect = this
      preCleanEffect(this) // 执行effect之前，清理依赖
      return this.fn()
    } finally {
      postCleanEffect(this)
      activeEffect = lastEffect
    }
  }

  stop() {
    //
  }
}
