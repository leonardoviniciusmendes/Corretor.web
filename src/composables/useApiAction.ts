import { ref } from 'vue'
import { getErrorMessage } from '@/services/apiClient'
import { useToast } from './useToast'

export function useApiAction() {
  const loading = ref(false)
  const error = ref<string | null>(null)
  const toast = useToast()

  async function run<T>(action: () => Promise<T>, successMessage?: string): Promise<T | null> {
    loading.value = true
    error.value = null

    try {
      const result = await action()
      if (successMessage) toast.success(successMessage)
      return result
    } catch (err) {
      const message = getErrorMessage(err)
      error.value = message
      toast.error(message)
      return null
    } finally {
      loading.value = false
    }
  }

  return { loading, error, run }
}
