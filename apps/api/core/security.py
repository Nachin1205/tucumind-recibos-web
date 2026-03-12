from datetime import datetime, timedelta, timezone
import jwt
import bcrypt
from fastapi import Depends, HTTPException, status
from fastapi.security import OAuth2PasswordBearer
from pydantic import ValidationError
from typing import Optional

from .config import get_settings

settings = get_settings()

oauth2_scheme = OAuth2PasswordBearer(tokenUrl="api/v1/auth/login")

def verify_password(plain_password: str, hashed_password: str) -> bool:
    try:
        h = hashed_password.strip()
        with open("auth_debug.log", "a") as f:
            f.write(f"Attempt: user={settings.ADMIN_USER} pass={plain_password} hash={h}\n")
        
        result = bcrypt.checkpw(plain_password.encode('utf-8'), h.encode('utf-8'))
        
        with open("auth_debug.log", "a") as f:
            f.write(f"Result: {result}\n")
            
        return result
    except Exception as e:
        with open("auth_debug.log", "a") as f:
            f.write(f"AUTH ERROR: {str(e)}\n")
        return False

def get_password_hash(password: str) -> str:
    return bcrypt.hashpw(password.encode('utf-8'), bcrypt.gensalt()).decode()

def create_access_token(data: dict, expires_delta: Optional[timedelta] = None) -> str:
    to_encode = data.copy()
    if expires_delta:
        expire = datetime.now(timezone.utc) + expires_delta
    else:
        expire = datetime.now(timezone.utc) + timedelta(minutes=15)
    to_encode.update({"exp": expire})
    encoded_jwt = jwt.encode(to_encode, settings.SECRET_KEY, algorithm="HS256")
    return encoded_jwt

def get_current_user(token: str = Depends(oauth2_scheme)) -> str:
    credentials_exception = HTTPException(
        status_code=status.HTTP_401_UNAUTHORIZED,
        detail="Could not validate credentials",
        headers={"WWW-Authenticate": "Bearer"},
    )
    try:
        payload = jwt.decode(token, settings.SECRET_KEY, algorithms=["HS256"])
        username: str = payload.get("sub") # type: ignore
        if username is None:
            raise credentials_exception
    except (jwt.PyJWTError, ValidationError):
        raise credentials_exception
        
    if username != settings.ADMIN_USER:
        raise credentials_exception
        
    return username
