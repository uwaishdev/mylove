import express from 'express';
import { createServer as createViteServer } from 'vite';
import fs from 'fs';
import path from 'path';
import dotenv from 'dotenv';

dotenv.config();

const app = express();
app.use(express.json({ limit: '1mb' }));

const DATA_DIR = path.resolve(process.cwd(), 'data');
const CONFIG_FILE = path.join(DATA_DIR, 'config.json');
const RESPONSES_FILE = path.join(DATA_DIR, 'responses.json');

// Ensure data folder exists
if (!fs.existsSync(DATA_DIR)) {
  fs.mkdirSync(DATA_DIR, { recursive: true });
}

function getConfig() {
  try {
    if (fs.existsSync(CONFIG_FILE)) {
      return JSON.parse(fs.readFileSync(CONFIG_FILE, 'utf-8'));
    }
  } catch (err) {
    console.error('Error reading config file:', err);
  }
  return {
    girlfriendName: 'My Love',
    yourName: 'Yours Forever',
    welcomeMessage: 'Every single time I look at you, I find myself completely lost for words. You are one of the most beautiful parts of my life, and your smile makes even my ordinary days feel special.',
    surpriseMessage: "I've been wanting to ask you a few things for a while. Sometimes, words get difficult when you're right in front of me, so I made this little space just for us. Ready for a few questions from my heart?",
    thankYouMessage: "Thank you for sharing a little piece of your heart with me. Every word matters to me, and I'm so lucky to have these memories with you.",
    googleAppsScriptUrl: process.env.GOOGLE_APPS_SCRIPT_WEB_APP_URL || '',
    adminPin: process.env.ADMIN_PIN || 'love2026'
  };
}

function saveConfig(cfg: any) {
  try {
    fs.writeFileSync(CONFIG_FILE, JSON.stringify(cfg, null, 2), 'utf-8');
    return true;
  } catch (err) {
    console.error('Error saving config:', err);
    return false;
  }
}

function getResponses() {
  try {
    if (fs.existsSync(RESPONSES_FILE)) {
      return JSON.parse(fs.readFileSync(RESPONSES_FILE, 'utf-8'));
    }
  } catch (err) {
    console.error('Error reading responses:', err);
  }
  return [];
}

function saveResponses(list: any[]) {
  try {
    fs.writeFileSync(RESPONSES_FILE, JSON.stringify(list, null, 2), 'utf-8');
    return true;
  } catch (err) {
    console.error('Error saving responses:', err);
    return false;
  }
}

// Simple token authentication for admin
const activeSessions = new Set<string>();

// 1. Public API: Get public config
app.get('/api/config', (req, res) => {
  const cfg = getConfig();
  res.json({
    girlfriendName: cfg.girlfriendName || 'My Love',
    yourName: cfg.yourName || 'Yours Forever',
    welcomeMessage: cfg.welcomeMessage,
    surpriseMessage: cfg.surpriseMessage,
    thankYouMessage: cfg.thankYouMessage,
    hasGoogleScriptUrl: Boolean(cfg.googleAppsScriptUrl && cfg.googleAppsScriptUrl.trim().length > 0)
  });
});

// 2. Public API: Submit girlfriend's responses
app.post('/api/submit', async (req, res) => {
  try {
    const {
      girlfriendName,
      bestMemory,
      dreamDestination,
      cuteHabit,
      ourSong,
      finalMessage
    } = req.body;

    // Validation
    if (!bestMemory || !bestMemory.trim()) {
      return res.status(400).json({ error: 'Please answer question 1 (Best Memory).' });
    }
    if (!dreamDestination || !dreamDestination.trim()) {
      return res.status(400).json({ error: 'Please answer question 2 (Dream Destination).' });
    }
    if (!cuteHabit || !cuteHabit.trim()) {
      return res.status(400).json({ error: 'Please answer question 3 (Cute Habit).' });
    }
    if (!ourSong || !ourSong.trim()) {
      return res.status(400).json({ error: 'Please answer question 4 (Our Song).' });
    }
    if (!finalMessage || !finalMessage.trim()) {
      return res.status(400).json({ error: 'Please write a message from your heart.' });
    }

    const cfg = getConfig();
    const cleanName = (girlfriendName || cfg.girlfriendName || 'My Love').trim().slice(0, 100);
    const submissionId = `PROP-${Date.now().toString(36).toUpperCase()}-${Math.random().toString(36).substring(2, 6).toUpperCase()}`;
    const now = new Date();
    const submissionDate = now.toLocaleString('en-US', {
      year: 'numeric',
      month: 'short',
      day: 'numeric',
      hour: '2-digit',
      minute: '2-digit',
      second: '2-digit'
    });

    const newRecord = {
      id: submissionId,
      submissionId,
      submissionDate,
      timestamp: now.toISOString(),
      girlfriendName: cleanName,
      bestMemory: String(bestMemory).trim().slice(0, 2000),
      dreamDestination: String(dreamDestination).trim().slice(0, 2000),
      cuteHabit: String(cuteHabit).trim().slice(0, 2000),
      ourSong: String(ourSong).trim().slice(0, 2000),
      finalMessage: String(finalMessage).trim().slice(0, 5000),
      status: 'Submitted',
      forwardedToSheets: false
    };

    // Save to local persistence
    const currentResponses = getResponses();
    currentResponses.unshift(newRecord);
    saveResponses(currentResponses);

    // If Google Apps Script Web App URL is configured, forward to it
    const scriptUrl = cfg.googleAppsScriptUrl || process.env.GOOGLE_APPS_SCRIPT_WEB_APP_URL;
    let sheetsSyncStatus = 'not_configured';

    if (scriptUrl && scriptUrl.startsWith('http')) {
      try {
        const payload = {
          submissionId: newRecord.submissionId,
          submissionDate: newRecord.submissionDate,
          girlfriendName: newRecord.girlfriendName,
          bestMemory: newRecord.bestMemory,
          dreamDestination: newRecord.dreamDestination,
          cuteHabit: newRecord.cuteHabit,
          ourSong: newRecord.ourSong,
          finalMessage: newRecord.finalMessage,
          status: newRecord.status
        };

        const fetchResponse = await fetch(scriptUrl, {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify(payload)
        });

        if (fetchResponse.ok || fetchResponse.status === 302 || fetchResponse.status === 200) {
          sheetsSyncStatus = 'success';
          newRecord.forwardedToSheets = true;
          saveResponses(currentResponses);
        } else {
          sheetsSyncStatus = `http_${fetchResponse.status}`;
        }
      } catch (err: any) {
        console.warn('Google Sheets forward error (local record saved safely):', err?.message);
        sheetsSyncStatus = 'error_forwarding';
      }
    }

    return res.json({
      success: true,
      submissionId,
      submissionDate,
      message: 'Your romantic answers have been saved with love ❤️',
      sheetsSync: sheetsSyncStatus
    });
  } catch (error: any) {
    console.error('Submit error:', error);
    return res.status(500).json({ error: 'Server error while saving answers. Please try again.' });
  }
});

// Admin Auth Middleware
function requireAdminAuth(req: express.Request, res: express.Response, next: express.NextFunction) {
  const authHeader = req.headers.authorization;
  const token = authHeader?.replace('Bearer ', '') || (req.query.token as string);

  if (!token || !activeSessions.has(token)) {
    return res.status(401).json({ error: 'Unauthorized. Please login to admin dashboard.' });
  }
  next();
}

// 3. Admin API: Login
app.post('/api/admin/login', (req, res) => {
  const { pin } = req.body;
  const cfg = getConfig();
  const validPin = cfg.adminPin || 'love2026';

  if (!pin || String(pin).trim() !== String(validPin).trim()) {
    return res.status(401).json({ error: 'Incorrect Admin PIN. Default is "love2026".' });
  }

  const sessionToken = `token_${Date.now()}_${Math.random().toString(36).substring(2)}`;
  activeSessions.add(sessionToken);

  // Clean old sessions after 24 hours
  setTimeout(() => activeSessions.delete(sessionToken), 24 * 60 * 60 * 1000);

  return res.json({
    success: true,
    token: sessionToken,
    message: 'Welcome to Private Admin Dashboard'
  });
});

// 4. Admin API: Get all responses
app.get('/api/admin/responses', requireAdminAuth, (req, res) => {
  const responses = getResponses();
  const cfg = getConfig();
  res.json({
    responses,
    stats: {
      total: responses.length,
      latestDate: responses.length > 0 ? responses[0].submissionDate : null,
      configuredSheets: Boolean(cfg.googleAppsScriptUrl && cfg.googleAppsScriptUrl.trim().length > 0)
    }
  });
});

// 5. Admin API: Delete a response
app.delete('/api/admin/responses/:id', requireAdminAuth, (req, res) => {
  const { id } = req.params;
  let responses = getResponses();
  const initialLength = responses.length;
  responses = responses.filter((r: any) => r.id !== id && r.submissionId !== id);

  if (responses.length === initialLength) {
    return res.status(404).json({ error: 'Response not found' });
  }

  saveResponses(responses);
  res.json({ success: true, message: 'Response deleted' });
});

// 6. Admin API: Get & Update Config
app.get('/api/admin/config', requireAdminAuth, (req, res) => {
  const cfg = getConfig();
  res.json(cfg);
});

app.post('/api/admin/config', requireAdminAuth, (req, res) => {
  const currentCfg = getConfig();
  const {
    girlfriendName,
    yourName,
    welcomeMessage,
    surpriseMessage,
    thankYouMessage,
    googleAppsScriptUrl,
    adminPin
  } = req.body;

  const updated = {
    ...currentCfg,
    ...(girlfriendName !== undefined && { girlfriendName: String(girlfriendName).trim() }),
    ...(yourName !== undefined && { yourName: String(yourName).trim() }),
    ...(welcomeMessage !== undefined && { welcomeMessage: String(welcomeMessage).trim() }),
    ...(surpriseMessage !== undefined && { surpriseMessage: String(surpriseMessage).trim() }),
    ...(thankYouMessage !== undefined && { thankYouMessage: String(thankYouMessage).trim() }),
    ...(googleAppsScriptUrl !== undefined && { googleAppsScriptUrl: String(googleAppsScriptUrl).trim() }),
    ...(adminPin !== undefined && adminPin.trim() && { adminPin: String(adminPin).trim() })
  };

  saveConfig(updated);
  res.json({ success: true, config: updated });
});

// 7. Admin API: Test Webhook
app.post('/api/admin/test-webhook', requireAdminAuth, async (req, res) => {
  const { url } = req.body;
  const targetUrl = url || getConfig().googleAppsScriptUrl;

  if (!targetUrl || !targetUrl.startsWith('http')) {
    return res.status(400).json({ error: 'Please enter a valid Google Apps Script Web App URL starting with https://' });
  }

  try {
    const testPayload = {
      submissionId: 'TEST-PING-001',
      submissionDate: new Date().toLocaleString(),
      girlfriendName: 'Test Connection',
      bestMemory: 'Testing Google Sheets integration from Admin Panel',
      dreamDestination: 'Paris & Santorini',
      cuteHabit: 'Laughing at silly jokes',
      ourSong: 'Perfect - Ed Sheeran',
      finalMessage: 'If you see this row in your Google Sheet, the integration is 100% working! 🎉',
      status: 'Test Connection'
    };

    const response = await fetch(targetUrl, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(testPayload)
    });

    res.json({
      success: true,
      statusCode: response.status,
      statusText: response.statusText,
      message: 'Test ping sent! Please check your Google Sheet to verify the new test row.'
    });
  } catch (err: any) {
    res.status(500).json({
      success: false,
      error: `Could not reach Apps Script: ${err.message}. Make sure the Web App is deployed with 'Who has access' set to 'Anyone'.`
    });
  }
});

// Vite middleware and Server Start
async function startServer() {
  const isProd = process.env.NODE_ENV === 'production';
  const port = parseInt(process.env.PORT || '3000', 10);

  if (!isProd) {
    const vite = await createViteServer({
      server: { middlewareMode: true },
      appType: 'spa',
    });
    app.use(vite.middlewares);
  } else {
    app.use(express.static('dist'));
    app.get('*', (req, res) => {
      res.sendFile(path.resolve('dist/index.html'));
    });
  }

  app.listen(port, '0.0.0.0', () => {
    console.log(`[Proposal Server] Running on http://0.0.0.0:${port}`);
  });
}

startServer().catch((err) => {
  console.error('Failed to start server:', err);
  process.exit(1);
});
