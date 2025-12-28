import axios from 'axios'

interface ReplayRequest {
  ruleFile: File
  startTime: string
  endTime: string
}

interface ReplayResponse {
  output: string
}

/**
 * Replay VM Alert rules against historical data
 * This function calls a backend API that executes vmalert replay command
 */
export async function replayVMAlert(request: ReplayRequest): Promise<ReplayResponse> {
  try {
    // Convert datetime-local format to RFC3339 format expected by vmalert
    const startTimeRFC3339 = new Date(request.startTime).toISOString()
    const endTimeRFC3339 = new Date(request.endTime).toISOString()

    // Create FormData for file upload
    const formData = new FormData()
    formData.append('ruleFile', request.ruleFile)
    formData.append('startTime', startTimeRFC3339)
    formData.append('endTime', endTimeRFC3339)

    const response = await axios.post<ReplayResponse>(
      `/vmalert/replay`,
      formData,
      {
        headers: {
          'Content-Type': 'multipart/form-data'
        }
      }
    )

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

