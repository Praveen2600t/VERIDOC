import requests

BASE = 'http://127.0.0.1:8000'

def test_all():
    print("1. Health check:")
    r = requests.get(f"{BASE}/api/health")
    print(r.status_code, r.json()["status"])
    assert r.status_code == 200

    print("\n2. Verify Clean Aadhaar:")
    with open("sample_docs/aadhaar_clean.png", "rb") as f:
        r = requests.post(f"{BASE}/api/verify", files={"file": f})
    clean_data = r.json()
    print("Status:", r.status_code, "VID:", clean_data["verification_id"], "Score:", clean_data["risk_score"], clean_data["risk_level"])
    print("QR analysis:", clean_data.get("qr_analysis", {}).get("qr_detected"), clean_data.get("qr_analysis", {}).get("qr_readable"))
    print("Redacted URL:", clean_data.get("forensics", {}).get("redacted_preview_url"))
    print("Mistakes count:", len(clean_data.get("mistakes_and_issues", [])))
    assert clean_data["risk_score"] <= 29
    assert clean_data.get("qr_analysis", {}).get("qr_detected") is True
    assert clean_data.get("qr_analysis", {}).get("qr_readable") is True

    print("\n3. Verify Tampered Aadhaar:")
    with open("sample_docs/aadhaar_edited.png", "rb") as f:
        r = requests.post(f"{BASE}/api/verify", files={"file": f})
    tamp_data = r.json()
    vid = tamp_data["verification_id"]
    print("Status:", r.status_code, "VID:", vid, "Score:", tamp_data["risk_score"], tamp_data["risk_level"])
    print("Tampered mistakes:", len(tamp_data.get("mistakes_and_issues", [])))
    assert tamp_data["risk_score"] >= 60
    assert len(tamp_data.get("mistakes_and_issues", [])) > 0

    print("\n4. Get Evidence Breakdown:")
    r = requests.get(f"{BASE}/api/verification/{vid}/evidence")
    ev_data = r.json()
    print("Status:", r.status_code, "Evidence count:", len(ev_data["evidence"]))
    for e in ev_data["evidence"]:
        print(f"  - {e['category']} ({e['risk_delta']:+d} pts): {e['description']}")

    print("\n5. Test Copilot Chat (Technical vs Simple):")
    # Technical mode
    r_tech = requests.post(f"{BASE}/api/copilot/chat", json={
        "query": "Why is this document suspicious?",
        "mode": "technical",
        "verification_id": vid,
        "verification_data": tamp_data
    })
    print("Technical Copilot Response length:", len(r_tech.json()["response"]))
    # Simple mode
    r_simp = requests.post(f"{BASE}/api/copilot/chat", json={
        "query": "Explain the result simply.",
        "mode": "simple",
        "verification_id": vid,
        "verification_data": tamp_data
    })
    print("Simple Copilot Response length:", len(r_simp.json()["response"]))

    print("\n6. Reference Stats:")
    r = requests.get(f"{BASE}/api/reference/stats")
    ref_data = r.json()
    print("Status:", r.status_code, "Total Records:", ref_data["total_records"], "States:", ref_data["total_states"])

    print("\n7. History & Audit Trail:")
    r_hist = requests.get(f"{BASE}/api/history")
    print("History count:", r_hist.json()["count"])
    r_audit = requests.get(f"{BASE}/api/audit/logs")
    print("Audit records count:", r_audit.json()["total_audit_records"])

    print("\n8. Download PDF Report:")
    r_rep = requests.get(f"{BASE}/api/reports/{vid}")
    print("Status:", r_rep.status_code, "Report size:", len(r_rep.content), "bytes")
    assert r_rep.status_code == 200 and len(r_rep.content) > 1000

    print("\n9. Accessibility AI Analyzer:")
    r_acc = requests.post(f"{BASE}/api/accessibility/analyze", json={"user_need": "dyslexia"})
    print("Status:", r_acc.status_code, "Font:", r_acc.json()["config"]["fontFamily"])

    print("\nALL 9 ENDPOINT INTEGRATION TESTS PASSED SUCCESSFULLY!")

if __name__ == "__main__":
    test_all()
