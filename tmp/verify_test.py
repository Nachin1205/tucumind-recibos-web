import bcrypt
import os

# Original logic from core/security.py
def verify_password(plain_password: str, hashed_password: str) -> bool:
    try:
        h = hashed_password.strip()
        result = bcrypt.checkpw(plain_password.encode('utf-8'), h.encode('utf-8'))
        return result
    except Exception as e:
        print(f"AUTH ERROR: {e}")
        return False

# Test with the hash I put in .env
test_hash = "$2b$12$BaghuSXMeKFgDsNMDTlQMu9IrmAvLKSad/U6h.ap92OmD4S2hZalm"
password = "admin123"

print(f"Testing hash: {test_hash}")
print(f"Testing password: {password}")
print(f"Result: {verify_password(password, test_hash)}")
