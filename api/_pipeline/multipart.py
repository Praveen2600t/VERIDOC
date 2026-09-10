"""
multipart.py — Zero-dependency multipart/form-data parser using Python standard library.
"""

import io
from email.parser import BytesParser
from email import policy
from typing import Dict, Any, Tuple, Optional


def parse_multipart_request(
    headers: Dict[str, str],
    body_bytes: bytes
) -> Tuple[Dict[str, str], Optional[bytes], Optional[str]]:
    """
    Parses multipart/form-data payload into fields dict, file bytes, and filename.
    Returns:
    (fields_dict, file_bytes, filename)
    """
    content_type = headers.get("Content-Type") or headers.get("content-type") or ""
    
    # If JSON payload
    if "application/json" in content_type:
        import json
        try:
            data = json.loads(body_bytes.decode("utf-8"))
            return data, None, None
        except Exception:
            return {}, None, None
            
    header_bytes = f"Content-Type: {content_type}\r\n\r\n".encode("utf-8")
    msg = BytesParser(policy=policy.default).parsebytes(header_bytes + body_bytes)
    
    fields: Dict[str, str] = {}
    file_bytes: Optional[bytes] = None
    filename: Optional[str] = None
    
    if msg.is_multipart():
        for part in msg.iter_parts():
            name = part.get_param("name", header="content-disposition")
            fn = part.get_filename()
            if fn:
                filename = fn
                file_bytes = part.get_payload(decode=True)
            elif name:
                content = part.get_content()
                if isinstance(content, str):
                    fields[name] = content.strip()
                elif isinstance(content, bytes):
                    fields[name] = content.decode("utf-8", errors="ignore").strip()
    else:
        # Check standard urlencoded form
        from urllib.parse import parse_qs
        qs = parse_qs(body_bytes.decode("utf-8", errors="ignore"))
        for k, v in qs.items():
            fields[k] = v[0] if v else ""
            
    return fields, file_bytes, filename
