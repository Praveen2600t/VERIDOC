const API_BASE = '';

export async function uploadDocument(file) {
  const formData = new FormData();
  formData.append('file', file);
  const res = await fetch(`${API_BASE}/api/documents/upload`, {
    method: 'POST',
    body: formData
  });
  if (!res.ok) {
    const err = await res.json().catch(() => ({ detail: 'Upload failed' }));
    throw new Error(err.detail || 'Upload failed');
  }
  return res.json();
}

export async function verifyDocuments({ file, secondaryFile, documentId, secondaryDocumentId }) {
  const formData = new FormData();
  if (file) formData.append('file', file);
  if (secondaryFile) formData.append('secondary_file', secondaryFile);
  if (documentId) formData.append('document_id', documentId);
  if (secondaryDocumentId) formData.append('secondary_document_id', secondaryDocumentId);

  const res = await fetch(`${API_BASE}/api/verify`, {
    method: 'POST',
    body: formData
  });
  if (!res.ok) {
    const err = await res.json().catch(() => ({ detail: 'Verification failed' }));
    throw new Error(err.detail || 'Verification failed');
  }
  return res.json();
}

export async function getVerificationDetails(id) {
  const res = await fetch(`${API_BASE}/api/verification/${id}`);
  if (!res.ok) throw new Error('Failed to fetch verification details');
  return res.json();
}

export async function getEvidence(id) {
  const res = await fetch(`${API_BASE}/api/verification/${id}/evidence`);
  if (!res.ok) throw new Error('Failed to fetch evidence');
  return res.json();
}

export async function getHistory(params = {}) {
  const q = new URLSearchParams(params).toString();
  const res = await fetch(`${API_BASE}/api/history?${q}`);
  if (!res.ok) throw new Error('Failed to fetch history');
  return res.json();
}

export async function getAuditLogs() {
  const res = await fetch(`${API_BASE}/api/audit/logs`);
  if (!res.ok) throw new Error('Failed to fetch audit logs');
  return res.json();
}

export async function getReferenceStats() {
  const res = await fetch(`${API_BASE}/api/reference/stats`);
  if (!res.ok) throw new Error('Failed to fetch reference stats');
  return res.json();
}

export async function getDistrictBaseline(district, state = '') {
  const res = await fetch(`${API_BASE}/api/reference/district/${encodeURIComponent(district)}?state=${encodeURIComponent(state)}`);
  if (!res.ok) throw new Error('Failed to fetch district profile');
  return res.json();
}

export async function chatCopilot(query, verificationId = null, verificationData = null) {
  const res = await fetch(`${API_BASE}/api/copilot/chat`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({
      query,
      verification_id: verificationId,
      verification_data: verificationData
    })
  });
  if (!res.ok) throw new Error('Copilot query failed');
  return res.json();
}

export async function askCopilot(query, verificationData = null, mode = 'technical') {
  const res = await fetch(`${API_BASE}/api/copilot/chat`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({
      query,
      verification_id: verificationData?.verification_id,
      verification_data: verificationData,
      mode
    })
  });
  if (!res.ok) throw new Error('Copilot query failed');
  const data = await res.json();
  return { answer: data.response || data.answer || '' };
}

export async function deleteDocument(docId) {
  const res = await fetch(`${API_BASE}/api/documents/${docId}`, {
    method: 'DELETE'
  });
  if (!res.ok) throw new Error('Failed to securely erase document');
  return res.json();
}

export async function uploadCustomCsv(file) {
  const formData = new FormData();
  formData.append('file', file);
  const res = await fetch(`${API_BASE}/api/reference/upload-csv`, {
    method: 'POST',
    body: formData
  });
  if (!res.ok) throw new Error('Failed to upload custom abc.csv');
  return res.json();
}

export async function analyzeAccessibilityAI(userNeed, interactionData = {}) {
  const res = await fetch(`${API_BASE}/api/accessibility/analyze`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ user_need: userNeed, interaction_data: interactionData })
  });
  if (!res.ok) throw new Error('Accessibility AI analysis failed');
  return res.json();
}
