import urllib.request
import json
import os

def upload(filepath):
    boundary = '----WebKitFormBoundary7MA4YWxkTrZu0gW'
    filename = os.path.basename(filepath)
    with open(filepath, 'rb') as f:
        data = f.read()
    
    body = (
        f'--{boundary}\r\n'
        f'Content-Disposition: form-data; name="doc_type"\r\n\r\n'
        f'auto\r\n'
        f'--{boundary}\r\n'
        f'Content-Disposition: form-data; name="file"; filename="{filename}"\r\n'
        f'Content-Type: image/png\r\n\r\n'
    ).encode('utf-8') + data + f'\r\n\r\n--{boundary}--\r\n'.encode('utf-8')
    
    req = urllib.request.Request('http://localhost:8000/api/analyze', data=body, headers={
        'Content-Type': f'multipart/form-data; boundary={boundary}'
    }, method='POST')
    
    resp = urllib.request.urlopen(req)
    return json.loads(resp.read().decode())

try:
    clean_res = upload('sample_docs/aadhaar_clean.png')
    print("CLEAN DOC RESULT:")
    print("Risk Level:", clean_res['risk_level'], f"({clean_res['overall_risk_score']}%)")
    print("Checksum Valid:", clean_res['breakdown']['checksum_validation']['is_valid'])
    print("Bounding Boxes:", len(clean_res['bounding_boxes']))

    print("\n-----------------------------------\n")

    edited_res = upload('sample_docs/aadhaar_edited.png')
    print("EDITED DOC RESULT:")
    print("Risk Level:", edited_res['risk_level'], f"({edited_res['overall_risk_score']}%)")
    print("Checksum Valid:", edited_res['breakdown']['checksum_validation']['is_valid'])
    print("Bounding Boxes:", len(edited_res['bounding_boxes']))
    if edited_res['bounding_boxes']:
        print("Bounding Box details:", edited_res['bounding_boxes'][0])

except Exception as e:
    print("Error:", e)
