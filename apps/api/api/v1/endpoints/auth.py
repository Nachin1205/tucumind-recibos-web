from datetime import timedelta
from fastapi import APIRouter, Depends, HTTPException, status
from fastapi.security import OAuth2PasswordRequestForm
from core.security import verify_password, create_access_token, get_current_user
from core.config import get_settings
from schemas.auth import Token, UserResponse

router = APIRouter()
settings = get_settings()

@router.post("/login", response_model=Token)
async def login_for_access_token(form_data: OAuth2PasswordRequestForm = Depends()):
    if form_data.username != settings.ADMIN_USER or not verify_password(form_data.password, settings.ADMIN_PASSWORD_HASH):
        raise HTTPException(
            status_code=status.HTTP_401_UNAUTHORIZED,
            detail="Incorrect username or password",
            headers={"WWW-Authenticate": "Bearer"},
        )
        
    access_token_expires = timedelta(minutes=settings.ACCESS_TOKEN_EXPIRE_MINUTES)
    access_token = create_access_token(
        data={"sub": form_data.username}, expires_delta=access_token_expires
    )
    return {"access_token": access_token, "token_type": "bearer"}

@router.get("/me", response_model=UserResponse)
async def read_users_me(current_user: str = Depends(get_current_user)):
    return {"username": current_user}
