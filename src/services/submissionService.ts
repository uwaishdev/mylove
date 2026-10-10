import { AppConfig, ProposalResponses, StoredResponse } from '../types';

const BACKUP_STORAGE_KEY = 'romantic_proposal_local_responses';

export async function fetchPublicConfig(): Promise<AppConfig> {
  try {
    const res = await fetch('/api/config');
    if (res.ok) {
      return await res.json();
    }
  } catch (err) {
    console.warn('Using local default config:', err);
  }

  return {
    girlfriendName: 'My Love',
    yourName: 'Yours Forever',
    welcomeMessage: 'Every single time I look at you, I find myself completely lost for words. You are one of the most beautiful parts of my life, and your smile makes even my ordinary days feel special.',
    surpriseMessage: "I've been wanting to ask you a few things for a while. Sometimes, words get difficult when you're right in front of me, so I made this little space just for us. Ready for a few questions from my heart?",
    thankYouMessage: "Thank you for sharing a little piece of your heart with me. Every word matters to me, and I'm so lucky to have these memories with you.",
    hasGoogleScriptUrl: false
  };
}

export async function submitProposalAnswers(
  responses: ProposalResponses,
  girlfriendName: string,
  directGoogleAppsScriptUrl?: string
): Promise<{ success: boolean; submissionId: string; message: string }> {
  const payload = {
    girlfriendName,
    ...responses
  };

  let submissionId = `PROP-${Date.now().toString(36).toUpperCase()}`;
  let isSavedOnServer = false;

  // 1. Try server-side submit endpoint
  try {
    const res = await fetch('/api/submit', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(payload)
    });

    if (res.ok) {
      const data = await res.json();
      submissionId = data.submissionId || submissionId;
      isSavedOnServer = true;
    }
  } catch (err) {
    console.warn('Server endpoint error, using client fallback:', err);
  }

  // 2. Client-side LocalStorage Backup (never lose an answer)
  try {
    const existingStr = localStorage.getItem(BACKUP_STORAGE_KEY) || '[]';
    const list: StoredResponse[] = JSON.parse(existingStr);
    const newRecord: StoredResponse = {
      id: submissionId,
      submissionId,
      submissionDate: new Date().toLocaleString(),
      timestamp: new Date().toISOString(),
      girlfriendName,
      ...responses,
      status: 'Submitted with Love ❤️',
      forwardedToSheets: isSavedOnServer
    };
    list.unshift(newRecord);
    localStorage.setItem(BACKUP_STORAGE_KEY, JSON.stringify(list));
  } catch (storageErr) {
    console.error('LocalStorage backup error:', storageErr);
  }

  // 3. Direct Google Apps Script Web App submission if configured on client side
  if (directGoogleAppsScriptUrl && directGoogleAppsScriptUrl.startsWith('http')) {
    try {
      // Use no-cors or standard fetch for Apps Script
      await fetch(directGoogleAppsScriptUrl, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          submissionId,
          submissionDate: new Date().toLocaleString(),
          girlfriendName,
          ...responses,
          status: 'Submitted via Web'
        }),
        mode: 'no-cors' // Google Apps Script redirects require no-cors in direct browser fetches
      });
    } catch (scriptErr) {
      console.warn('Direct Apps Script push:', scriptErr);
    }
  }

  return {
    success: true,
    submissionId,
    message: 'Your romantic answers have been saved with love ❤️'
  };
}

// Admin APIs
export async function loginAdmin(pin: string): Promise<{ success: boolean; token?: string; error?: string }> {
  try {
    const res = await fetch('/api/admin/login', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ pin })
    });
    const data = await res.json();
    if (res.ok && data.success) {
      return { success: true, token: data.token };
    }
    return { success: false, error: data.error || 'Invalid Admin PIN' };
  } catch (err: any) {
    // If backend is static, check local default PIN
    if (pin === 'love2026' || pin === 'admin123') {
      return { success: true, token: 'local_offline_token_' + Date.now() };
    }
    return { success: false, error: 'Could not connect to authentication server.' };
  }
}

export async function fetchAdminResponses(token: string): Promise<{ responses: StoredResponse[]; stats: any }> {
  try {
    const res = await fetch('/api/admin/responses', {
      headers: { Authorization: `Bearer ${token}` }
    });
    if (res.ok) {
      return await res.json();
    }
  } catch (err) {
    console.warn('Fallback to local responses:', err);
  }

  // Fallback to local storage responses
  const localStr = localStorage.getItem(BACKUP_STORAGE_KEY) || '[]';
  const responses: StoredResponse[] = JSON.parse(localStr);
  return {
    responses,
    stats: {
      total: responses.length,
      latestDate: responses.length > 0 ? responses[0].submissionDate : null,
      configuredSheets: false
    }
  };
}

export async function deleteAdminResponse(id: string, token: string): Promise<boolean> {
  try {
    const res = await fetch(`/api/admin/responses/${id}`, {
      method: 'DELETE',
      headers: { Authorization: `Bearer ${token}` }
    });
    if (res.ok) return true;
  } catch (err) {
    console.warn('Backend delete error:', err);
  }

  // Also remove from local storage
  try {
    const localStr = localStorage.getItem(BACKUP_STORAGE_KEY) || '[]';
    let responses: StoredResponse[] = JSON.parse(localStr);
    responses = responses.filter(r => r.id !== id && r.submissionId !== id);
    localStorage.setItem(BACKUP_STORAGE_KEY, JSON.stringify(responses));
    return true;
  } catch {
    return false;
  }
}

export async function fetchAdminConfig(token: string): Promise<AppConfig | null> {
  try {
    const res = await fetch('/api/admin/config', {
      headers: { Authorization: `Bearer ${token}` }
    });
    if (res.ok) {
      return await res.json();
    }
  } catch (err) {
    console.error('Config fetch error:', err);
  }
  return null;
}

export async function saveAdminConfig(config: Partial<AppConfig>, token: string): Promise<boolean> {
  try {
    const res = await fetch('/api/admin/config', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        Authorization: `Bearer ${token}`
      },
      body: JSON.stringify(config)
    });
    return res.ok;
  } catch (err) {
    console.error('Config save error:', err);
    return false;
  }
}

export async function testWebhookUrl(url: string, token: string): Promise<{ success: boolean; message: string }> {
  try {
    const res = await fetch('/api/admin/test-webhook', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        Authorization: `Bearer ${token}`
      },
      body: JSON.stringify({ url })
    });
    const data = await res.json();
    if (res.ok && data.success) {
      return { success: true, message: data.message };
    }
    return { success: false, message: data.error || 'Failed to ping webhook' };
  } catch (err: any) {
    return { success: false, message: err.message || 'Network error testing webhook' };
  }
}
