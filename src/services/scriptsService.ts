import { createResourceService } from './resourceFactory'
import type { ScriptRequest, ScriptResponse } from '@/types/scripts'

export const scriptsService = createResourceService<ScriptResponse, ScriptRequest>('/api/scripts', '/api/scripts/{id}')
