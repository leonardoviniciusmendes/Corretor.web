import { computed, ref } from 'vue'

export function usePagedList<T>(items: () => T[]) {
  const search = ref('')
  const page = ref(1)
  const pageSize = ref(10)

  const filteredItems = computed(() => {
    const term = search.value.trim().toLowerCase()
    if (!term) return items()
    return items().filter((item) => JSON.stringify(item).toLowerCase().includes(term))
  })

  const totalPages = computed(() => Math.max(1, Math.ceil(filteredItems.value.length / pageSize.value)))
  const pagedItems = computed(() => {
    if (page.value > totalPages.value) page.value = totalPages.value
    const start = (page.value - 1) * pageSize.value
    return filteredItems.value.slice(start, start + pageSize.value)
  })

  function next() {
    page.value = Math.min(totalPages.value, page.value + 1)
  }

  function previous() {
    page.value = Math.max(1, page.value - 1)
  }

  return { search, page, pageSize, filteredItems, pagedItems, totalPages, next, previous }
}
