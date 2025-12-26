import { useState } from 'react'
import { replayVMAlert } from '../services/vmalertService'
import './VMAlertReplay.css'

interface ReplayResult {
  success: boolean
  output?: string
  error?: string
}

function VMAlertReplay() {
  const [ruleFile, setRuleFile] = useState<File | null>(null)
  const [ruleFileName, setRuleFileName] = useState<string>('')
  const [startTime, setStartTime] = useState<string>('')
  const [endTime, setEndTime] = useState<string>('')
  const [datasourceUrl, setDatasourceUrl] = useState<string>('http://localhost:8428')
  const [isLoading, setIsLoading] = useState<boolean>(false)
  const [result, setResult] = useState<ReplayResult | null>(null)

  const handleSubmit = async (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault()
    
    if (!ruleFile) {
      setResult({
        success: false,
        error: 'Please select a rule file to upload'
      })
      return
    }
    
    setIsLoading(true)
    setResult(null)

    try {
      const response = await replayVMAlert({
        ruleFile,
        startTime,
        endTime,
        datasourceUrl
      })
      setResult({
        success: true,
        output: response.output
      })
    } catch (error: any) {
      setResult({
        success: false,
        error: error.message || 'An error occurred during replay'
      })
    } finally {
      setIsLoading(false)
    }
  }
  
  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0]
    if (file) {
      setRuleFile(file)
      setRuleFileName(file.name)
    }
  }

  const handleReset = () => {
    setRuleFile(null)
    setRuleFileName('')
    setStartTime('')
    setEndTime('')
    setDatasourceUrl('http://localhost:8428')
    setResult(null)
    // Reset file input
    const fileInput = document.getElementById('ruleFile') as HTMLInputElement
    if (fileInput) {
      fileInput.value = ''
    }
  }

  return (
    <div className="vm-alert-replay">
      <div className="replay-header">
        <h2>VM Alert Replay</h2>
        <p className="description">
          Replay alerting rules against historical data to test and validate your alert configurations.
        </p>
      </div>

      <form onSubmit={handleSubmit} className="replay-form">
        <div className="form-group">
          <label htmlFor="ruleFile">
            Rule File <span className="required">*</span>
          </label>
          <input
            id="ruleFile"
            type="file"
            accept=".yml,.yaml,application/x-yaml,text/yaml"
            onChange={handleFileChange}
            required
            className="form-input"
          />
          {ruleFileName && (
            <div className="file-name-display">
              Selected: <strong>{ruleFileName}</strong>
            </div>
          )}
          <small className="form-help">
            Upload your alerting rules file (YAML format, max 5MB)
          </small>
        </div>

        <div className="form-row">
          <div className="form-group">
            <label htmlFor="startTime">
              Start Time <span className="required">*</span>
            </label>
            <input
              id="startTime"
              type="datetime-local"
              value={startTime}
              onChange={(e: React.ChangeEvent<HTMLInputElement>) => setStartTime(e.target.value)}
              required
              className="form-input"
            />
            <small className="form-help">
              Start time for the replay period
            </small>
          </div>

          <div className="form-group">
            <label htmlFor="endTime">
              End Time <span className="required">*</span>
            </label>
            <input
              id="endTime"
              type="datetime-local"
              value={endTime}
              onChange={(e: React.ChangeEvent<HTMLInputElement>) => setEndTime(e.target.value)}
              required
              className="form-input"
            />
            <small className="form-help">
              End time for the replay period
            </small>
          </div>
        </div>

        <div className="form-group">
          <label htmlFor="datasourceUrl">
            Datasource URL
          </label>
          <input
            id="datasourceUrl"
            type="url"
            value={datasourceUrl}
            onChange={(e: React.ChangeEvent<HTMLInputElement>) => setDatasourceUrl(e.target.value)}
            placeholder="http://localhost:8428"
            className="form-input"
          />
          <small className="form-help">
            Victoria Metrics datasource URL (default: http://localhost:8428)
          </small>
        </div>

        <div className="form-actions">
          <button
            type="button"
            onClick={handleReset}
            className="btn btn-secondary"
            disabled={isLoading}
          >
            Reset
          </button>
          <button
            type="submit"
            className="btn btn-primary"
            disabled={isLoading}
          >
            {isLoading ? 'Running Replay...' : 'Run Replay'}
          </button>
        </div>
      </form>

      {result && (
        <div className={`result-container ${result.success ? 'success' : 'error'}`}>
          <div className="result-header">
            <h3>{result.success ? 'Replay Successful' : 'Replay Failed'}</h3>
          </div>
          <div className="result-content">
            {result.success ? (
              <pre className="result-output">{result.output || 'No output'}</pre>
            ) : (
              <pre className="result-error">{result.error}</pre>
            )}
          </div>
        </div>
      )}
    </div>
  )
}

export default VMAlertReplay

