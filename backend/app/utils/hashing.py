import hashlib
from typing import Union

def compute_sha256(data: Union[bytes, str]) -> str:
    """
    Computes a cryptographic SHA-256 hash for raw bytes or string data.
    """
    if isinstance(data, str):
        data = data.encode("utf-8")
    return hashlib.sha256(data).hexdigest()

def compute_file_sha256(file_path: str) -> str:
    """
    Computes SHA-256 hash of a file by streaming chunks.
    """
    sha256_hash = hashlib.sha256()
    with open(file_path, "rb") as f:
        for byte_block in iter(lambda: f.read(65536), b""):
            sha256_hash.update(byte_block)
    return sha256_hash.hexdigest()
