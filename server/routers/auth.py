from fastapi import APIRouter, HTTPException, status
from pydantic import BaseModel
from typing import Optional, Dict, Any
from server.core.security import (
    verify_password,
    get_password_hash,
    create_access_token,
    create_refresh_token,
    decode_token,
    require_auth
)
from server.config import REFRESH_TOKEN_SECRET

router = APIRouter(prefix="/api/auth", tags=["Authentication"])

# In-memory mock user store / demo admin fallback when direct DB connection is not configured
MOCK_USERS: Dict[str, Dict[str, Any]] = {
    "admin@marketmind.ai": {
        "id": "usr-admin-001",
        "name": "MarketMind Admin",
        "email": "admin@marketmind.ai",
        "password": get_password_hash("Admin@123"),
        "roleId": 4,
        "role": "Admin",
        "isActive": True,
        "isPending": False
    },
    "owner@marketmind.ai": {
        "id": "usr-owner-001",
        "name": "Store Owner",
        "email": "owner@marketmind.ai",
        "password": get_password_hash("Owner@123"),
        "roleId": 1,
        "role": "Owner",
        "isActive": True,
        "isPending": False
    }
}

class RegisterRequest(BaseModel):
    name: str
    email: str
    password: str
    roleId: Optional[int] = 3

class LoginRequest(BaseModel):
    email: str
    password: str

class RefreshRequest(BaseModel):
    refreshToken: str

@router.post("/register", status_code=status.HTTP_201_CREATED)
def register(body: RegisterRequest):
    email = body.email.lower().strip()
    if email in MOCK_USERS:
        raise HTTPException(status_code=409, detail="Email already registered.")

    new_user = {
        "id": f"usr-{len(MOCK_USERS) + 1:03d}",
        "name": body.name.strip(),
        "email": email,
        "password": get_password_hash(body.password),
        "roleId": body.roleId,
        "role": "Sales Executive" if body.roleId == 3 else "User",
        "isActive": True,
        "isPending": False
    }
    MOCK_USERS[email] = new_user

    return {
        "success": True,
        "message": "User registered successfully.",
        "user": {
            "id": new_user["id"],
            "name": new_user["name"],
            "email": new_user["email"],
            "roleId": new_user["roleId"]
        }
    }

@router.post("/login")
def login(body: LoginRequest):
    email = body.email.lower().strip()
    user = MOCK_USERS.get(email)

    if not user or not verify_password(body.password, user["password"]):
        raise HTTPException(status_code=401, detail="Invalid email or password.")

    if not user.get("isActive", True):
        raise HTTPException(status_code=403, detail="Your account has been disabled.")

    token_data = {"id": user["id"], "email": user["email"], "roleId": user["roleId"]}
    access_token = create_access_token(token_data)
    refresh_token = create_refresh_token({"id": user["id"]})

    return {
        "success": True,
        "message": "Login successful.",
        "accessToken": access_token,
        "refreshToken": refresh_token,
        "user": {
            "id": user["id"],
            "name": user["name"],
            "email": user["email"],
            "roleId": user["roleId"]
        }
    }

@router.post("/refresh")
def refresh(body: RefreshRequest):
    try:
        decoded = decode_token(body.refreshToken, secret=REFRESH_TOKEN_SECRET)
    except Exception:
        raise HTTPException(status_code=403, detail="Invalid refresh token.")

    user_id = decoded.get("id")
    user = next((u for u in MOCK_USERS.values() if u["id"] == user_id), None)
    if not user:
        raise HTTPException(status_code=403, detail="Invalid refresh token.")

    token_data = {"id": user["id"], "email": user["email"], "roleId": user["roleId"]}
    new_access_token = create_access_token(token_data)

    return {
        "success": True,
        "accessToken": new_access_token
    }

@router.get("/me")
def get_me(user: Dict[str, Any] = require_auth):
    return {
        "success": True,
        "user": user
    }

@router.post("/logout")
def logout(user: Dict[str, Any] = require_auth):
    return {
        "success": True,
        "message": "Logged out successfully."
    }
