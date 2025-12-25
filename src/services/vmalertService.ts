import axios from 'axios'

interface ReplayRequest {
  ruleFile: string
  startTime: string
  endTime: string
  datasourceUrl?: string
}

interface ReplayResponse {
  output: string
}

const API_BASE_URL = import.meta.env.VITE_API_BASE_URL || '/api'

/**
 * Replay VM Alert rules against historical data
 * This function calls a backend API that executes vmalert replay command
 */
export async function replayVMAlert(request: ReplayRequest): Promise<ReplayResponse> {
  try {
    // Convert datetime-local format to RFC3339 format expected by vmalert
    const startTimeRFC3339 = new Date(request.startTime).toISOString()
    const endTimeRFC3339 = new Date(request.endTime).toISOString()

    const response = await axios.post<ReplayResponse>(`${API_BASE_URL}/vmalert/replay`, {
      ruleFile: request.ruleFile,
      startTime: startTimeRFC3339,
      endTime: endTimeRFC3339,
      datasourceUrl: request.datasourceUrl || 'http://localhost:8428'
    })

    return response.data
  } catch (error: any) {
    if (error.response) {
      throw new Error(error.response.data?.error || 'Failed to execute replay')
    } else if (error.request) {
      throw new Error('Unable to connect to the server. Make sure the backend is running.')
    } else {
      throw new Error(error.message || 'An unexpected error occurred')
    }
  }
}

