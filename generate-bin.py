
# Generates data/resume.bin → list of encrypted payloads (NO KEYs inside)

import json
import os
import base64
from cryptography.hazmat.primitives import hashes
from cryptography.hazmat.primitives.kdf.pbkdf2 import PBKDF2HMAC
from cryptography.hazmat.primitives.ciphers.aead import AESGCM

# ===================================================================
# CONFIG: Your private CV files and their secret KEYs
# ===================================================================

PRIVATE_DIR = "data/private"

# Load your private CV JSON files
cv_files = {
    "00000000-0000-0000-0000-000000000000": f"{PRIVATE_DIR}/academic_ca.json",
}

# ===================================================================
# ENCRYPT EACH CV WITH ITS KEY AS PASSWORD
# ===================================================================

payloads = []

for credential, file_path in cv_files.items():
    # 1. Load the CV JSON
    if not os.path.exists(file_path):
        print(f"Warning: {file_path} not found — skipping")
        continue
    cv_data = json.loads(open(file_path, "r", encoding="utf-8").read())

    # 2. Encrypt with KEY as password
    plaintext = json.dumps(cv_data).encode("utf-8")

    salt = os.urandom(16)
    iv = os.urandom(12)

    kdf = PBKDF2HMAC(
        algorithm=hashes.SHA256(),
        length=32,
        salt=salt,
        iterations=600000,
    )
    key = kdf.derive(credential.encode("utf-8"))
    aesgcm = AESGCM(key)

    ciphertext = aesgcm.encrypt(iv, plaintext, None)
    payload_b64 = base64.b64encode(salt + iv + ciphertext).decode("utf-8")

    # 3. Store only the encrypted blob
    payloads.append({"payload": payload_b64})

# ===================================================================
# WRITE resume.bin → ONLY encrypted payloads
# ===================================================================

os.makedirs("data", exist_ok=True)
output_path = "data/resume.bin"

with open(output_path, "w", encoding="utf-8") as f:
    json.dump(payloads, f, indent=2)

# ===================================================================
# SUCCESS + SECRET LINKS
# ===================================================================

print(f"\nSuccess: {output_path} created with {len(payloads)} encrypted CV(s)")
print("No KEYs are stored in the file — 100% confidential\n")

print("Share these links (keep the KEYs secret):")
for credential in cv_files:
    print(f"  https://saeedey.github.io/#{credential}")
print("\nPublic link: https://saeedey.github.io/")