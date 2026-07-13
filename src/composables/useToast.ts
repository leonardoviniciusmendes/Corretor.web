import { readonly, ref } from 'vue'

export type ToastKind = 'success' | 'error' | 'info'

interface Toast {
  id: number
  message: string
  kind: ToastKind
}

const toasts = ref<Toast[]>([])
let nextId = 1

export function useToast() {
  function show(message: string, kind: ToastKind = 'info') {
    const id = nextId++
    toasts.value.push({ id, message, kind })
    window.setTimeout(() => dismiss(id), 3500)
  }

  function dismiss(id: number) {
    toasts.value = toasts.value.filter((toast) => toast.id !== id)
  }

  return {
    toasts: readonly(toasts),
    success: (message: string) => show(message, 'success'),
    error: (message: string) => show(message, 'error'),
    info: (message: string) => show(message, 'info'),
    dismiss,
  }
}
