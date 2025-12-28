const express = require('express');
const { exec } = require('child_process');
const { promisify } = require('util');
const path = require('path');
const fs = require('fs');
const multer = require('multer');

const execAsync = promisify(exec);
const app = express();
const PORT = process.env.PORT || 8080;

// Configure multer for file uploads
const uploadDir = path.join(__dirname, '../uploads');
if (!fs.existsSync(uploadDir)) {
  fs.mkdirSync(uploadDir, { recursive: true });
}

const storage = multer.diskStorage({
  destination: (req, file, cb) => {
    cb(null, uploadDir);
  },
  filename: (req, file, cb) => {
    // Generate unique filename with timestamp
    const uniqueSuffix = Date.now() + '-' + Math.round(Math.random() * 1E9);
    cb(null, `rules-${uniqueSuffix}.yml`);
  }
});

const upload = multer({
  storage: storage,
  limits: {
    fileSize: 5 * 1024 * 1024 // 5MB limit
  },
  fileFilter: (req, file, cb) => {
    // Accept only YAML files
    if (file.mimetype === 'application/x-yaml' ||
      file.mimetype === 'text/yaml' ||
      file.originalname.endsWith('.yml') ||
      file.originalname.endsWith('.yaml')) {
      cb(null, true);
    } else {
      cb(new Error('Only YAML files are allowed'));
    }
  }
});

// Middleware
app.use(express.json());
app.use(express.urlencoded({ extended: true }));
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
 * Accepts a rule file upload
 */
app.post('/vmalert/replay', upload.single('ruleFile'), async (req, res) => {
  const { startTime, endTime } = req.body;
  const uploadedFile = req.file;

  // Validate required fields
  if (!uploadedFile || !startTime || !endTime) {
    return res.status(400).json({
      error: 'Missing required fields: rule file, startTime and endTime are required'
    });
  }

  // Get the file path from the uploaded file object
  const ruleFilePath = uploadedFile.path;

  // Get vmalert path from environment or use default
  const vmalertPath = process.env.VMALERT_PATH || './vmalert-prod';
  // Use host.docker.internal for Docker containers, localhost for local development
  const datasource = process.env.DATASOURCE_URL || 'http://localhost:8428';
  // remoteWrite.url is required for replay mode - use a dummy URL or optional from env
  const remoteWriteUrl = process.env.REMOTE_WRITE_URL || 'http://localhost:8428';

  try {
    // Verify file exists
    if (!fs.existsSync(ruleFilePath)) {
      return res.status(400).json({
        error: `Rule file not found: ${ruleFilePath}`
      });
    }

    // Build vmalert replay command with file path
    // vmalert uses -replay.timeFrom and -replay.timeTo flags, not a "replay" subcommand
    // remoteWrite.url is required for replay mode (even if we don't actually write)
    const command = `${vmalertPath} -rule="${ruleFilePath}" -replay.timeFrom="${startTime}" -replay.timeTo="${endTime}" -datasource.url="${datasource}" -remoteWrite.url="${remoteWriteUrl}" -replay.disableProgressBar`;

    console.log(`Executing: ${command}`);

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

    // Clean up uploaded file after successful execution
    if (uploadedFile && fs.existsSync(ruleFilePath)) {
      fs.unlinkSync(ruleFilePath);
      console.log(`Cleaned up uploaded file: ${ruleFilePath}`);
    }
  } catch (error) {
    // Clean up uploaded file on error too
    if (uploadedFile && fs.existsSync(ruleFilePath)) {
      fs.unlinkSync(ruleFilePath);
      console.log(`Cleaned up uploaded file after error: ${ruleFilePath}`);
    }
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
  res.status(404).json({ error: 'Route not found' });
});

app.listen(PORT, '0.0.0.0', () => {
  console.log(`Victoria Tools server running on port ${PORT}`);
  console.log(`vmalert path: ${process.env.VMALERT_PATH || 'vmalert (from PATH)'}`);
});

