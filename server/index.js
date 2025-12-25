const express = require('express');
const { exec } = require('child_process');
const { promisify } = require('util');
const path = require('path');

const execAsync = promisify(exec);
const app = express();
const PORT = process.env.PORT || 8080;

// Middleware
app.use(express.json());
app.use(express.static(path.join(__dirname, '../dist')));

// CORS middleware
app.use((req, res, next) => {
  res.header('Access-Control-Allow-Origin', '*');
  res.header('Access-Control-Allow-Methods', 'GET, POST, PUT, DELETE, OPTIONS');
  res.header('Access-Control-Allow-Headers', 'Origin, X-Requested-With, Content-Type, Accept');
  if (req.method === 'OPTIONS') {
    return res.sendStatus(200);
  }
  next();
});

/**
 * POST /vmalert/replay
 * Execute vmalert replay command
 */
app.post('/vmalert/replay', async (req, res) => {
  const { ruleFile, startTime, endTime, datasourceUrl } = req.body;

  // Validate required fields
  if (!ruleFile || !startTime || !endTime) {
    return res.status(400).json({
      error: 'Missing required fields: ruleFile, startTime, and endTime are required'
    });
  }

  // Get vmalert path from environment or use default
  const vmalertPath = process.env.VMALERT_PATH || './vmalert-prod';
  const datasource = datasourceUrl || 'http://localhost:8428';
  // remoteWrite.url is required for replay mode - use a dummy URL or optional from env
  const remoteWriteUrl = process.env.REMOTE_WRITE_URL || 'http://localhost:8428/api/v1/write';

  try {
    // Adjust rule file path if it's relative to /app/rules (mounted volume)
    let adjustedRuleFile = ruleFile;
    if (!ruleFile.startsWith('/')) {
      // If relative path, assume it's in the mounted rules directory
      adjustedRuleFile = `/app/rules/${ruleFile}`;
    }
    
    // Build vmalert replay command with adjusted path
    // vmalert uses -replay.timeFrom and -replay.timeTo flags, not a "replay" subcommand
    // remoteWrite.url is required for replay mode (even if we don't actually write)
    const command = `${vmalertPath} -rule="${adjustedRuleFile}" -replay.timeFrom="${startTime}" -replay.timeTo="${endTime}" -datasource.url="${datasource}" -remoteWrite.url="${remoteWriteUrl}" -replay.disableProgressBar`;
    
    console.log(`Executing: ${command}`);
    console.log(`Rule file: ${ruleFile} -> ${adjustedRuleFile}`);
    
    const { stdout, stderr } = await execAsync(command, {
      maxBuffer: 10 * 1024 * 1024, // 10MB buffer
      timeout: 300000 // 5 minutes timeout
    });

    // vmalert replay outputs to stderr for some information, stdout for results
    const output = stdout || stderr || 'Replay completed successfully';
    
    console.log(`Command output (stdout): ${stdout}`);
    console.log(`Command output (stderr): ${stderr}`);

    res.json({
      output: output.trim()
    });
  } catch (error) {
    console.error('Error executing vmalert replay:', error);
    console.error('Error details:', {
      message: error.message,
      stderr: error.stderr,
      stdout: error.stdout,
      code: error.code,
      signal: error.signal
    });
    
    // Extract error message with more details
    let errorMessage = 'Unknown error occurred';
    if (error.stderr) {
      errorMessage = error.stderr.toString();
    } else if (error.stdout) {
      errorMessage = error.stdout.toString();
    } else if (error.message) {
      errorMessage = error.message;
    }
    
    res.status(500).json({
      error: `Failed to execute vmalert replay: ${errorMessage}`
    });
  }
});

// Health check endpoint
app.get('/health', (req, res) => {
  res.json({ status: 'ok', timestamp: new Date().toISOString() });
});

// Serve frontend for all other routes
app.get('*', (req, res) => {
  res.sendFile(path.join(__dirname, '../dist/index.html'));
});

app.listen(PORT, '0.0.0.0', () => {
  console.log(`Victoria Tools server running on port ${PORT}`);
  console.log(`vmalert path: ${process.env.VMALERT_PATH || 'vmalert (from PATH)'}`);
});

