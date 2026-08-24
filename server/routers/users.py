from fastapi import APIRouter, HTTPException, status, Query, Request
from pydantic import BaseModel
from typing import Optional, Dict, Any, List
from server.routers.auth import MOCK_USERS

router = APIRouter(prefix="/api/users", tags=["Users"])

ROLE_LABELS = {
    1: "Owner",
    2: "Store Manager",
    3: "Sales Executive",
    4: "Admin"
}

def map_user(u: Dict[str, Any]) -> Dict[str, Any]:
    role_id = u.get("roleId", 3)
    role_name = u.get("role") or ROLE_LABELS.get(role_id, "Sales Executive")
    is_active = u.get("isActive", True)
    is_pending = u.get("isPending", False)

    status_str = "Pending" if is_pending else ("Active" if is_active else "Inactive")
    return {
        "id": u.get("id"),
        "name": u.get("name"),
        "email": u.get("email"),
        "roleId": role_id,
        "role": role_name,
        "status": status_str,
        "lastLogin": u.get("lastLogin", "2026-04-28 18:30:00")
    }

class UserCreateRequest(BaseModel):
    name: str
    email: str
    role: Optional[str] = "Sales Executive"
    roleId: Optional[int] = None
    status: Optional[str] = "Active"
    password: Optional[str] = "Password1!"

class UserUpdateRequest(BaseModel):
    name: Optional[str] = None
    email: Optional[str] = None
    role: Optional[str] = None
    roleId: Optional[int] = None
    status: Optional[str] = None

class StatusUpdateRequest(BaseModel):
    isActive: Optional[bool] = None

@router.get("")
@router.get("/")
def get_users(
    page: int = Query(1, ge=1),
    limit: int = Query(20, ge=1, le=100),
    search: Optional[str] = Query(None),
    role: Optional[str] = Query(None)
):
    users_list = [u for u in MOCK_USERS.values() if not u.get("isDeleted", False)]

    if search:
        s = search.lower().strip()
        users_list = [
            u for u in users_list
            if s in u.get("name", "").lower() or s in u.get("email", "").lower()
        ]

    if role:
        role_map = {
            "1": "Owner", "Owner": "Owner", "Business Owner": "Owner",
            "2": "Store Manager", "Store Manager": "Store Manager",
            "3": "Sales Executive", "Sales Executive": "Sales Executive",
            "4": "Admin", "Admin": "Admin", "System Admin": "Admin"
        }
        target_role = role_map.get(role, role)
        users_list = [
            u for u in users_list
            if u.get("role") == target_role or ROLE_LABELS.get(u.get("roleId")) == target_role
        ]

    users_list.sort(key=lambda u: u.get("name", "").lower())
    total = len(users_list)
    start_idx = (page - 1) * limit
    paginated = users_list[start_idx:start_idx + limit]

    return {
        "success": True,
        "data": [map_user(u) for u in paginated],
        "pagination": {
            "total": total,
            "page": page,
            "limit": limit,
            "totalPages": (total + limit - 1) // limit if limit else 1
        }
    }

@router.get("/{user_id}")
def get_user_by_id(user_id: str):
    user = next((u for u in MOCK_USERS.values() if u.get("id") == user_id and not u.get("isDeleted", False)), None)
    if not user:
        raise HTTPException(status_code=404, detail="User not found.")
    return {
        "success": True,
        "data": map_user(user)
    }

@router.post("", status_code=status.HTTP_201_CREATED)
@router.post("/", status_code=status.HTTP_201_CREATED)
def create_user(body: UserCreateRequest):
    email = body.email.strip().lower()
    if email in MOCK_USERS and not MOCK_USERS[email].get("isDeleted", False):
        raise HTTPException(status_code=409, detail="Email address is already in use by another user.")

    role_id = body.roleId
    if not role_id:
        role_map = {"Owner": 1, "Business Owner": 1, "Store Manager": 2, "Sales Executive": 3, "Admin": 4}
        role_id = role_map.get(body.role, 3)

    is_active = (body.status != "Inactive")
    is_pending = (body.status == "Pending")

    new_id = f"usr-{len(MOCK_USERS) + 1:03d}"
    user_record = {
        "id": new_id,
        "name": body.name.strip(),
        "email": email,
        "password": body.password,
        "roleId": role_id,
        "role": ROLE_LABELS.get(role_id, body.role or "Sales Executive"),
        "isActive": is_active,
        "isPending": is_pending,
        "isDeleted": False
    }
    MOCK_USERS[email] = user_record

    return {
        "success": True,
        "message": f'User "{user_record["name"]}" created successfully.',
        "data": map_user(user_record)
    }

@router.put("/{user_id}")
@router.patch("/{user_id}")
def update_user(user_id: str, body: UserUpdateRequest):
    user = next((u for u in MOCK_USERS.values() if u.get("id") == user_id and not u.get("isDeleted", False)), None)
    if not user:
        raise HTTPException(status_code=404, detail="User not found.")

    if body.name is not None:
        user["name"] = body.name.strip()
    if body.roleId is not None:
        user["roleId"] = body.roleId
        user["role"] = ROLE_LABELS.get(body.roleId, user.get("role"))
    elif body.role is not None:
        role_map = {"Owner": 1, "Business Owner": 1, "Store Manager": 2, "Sales Executive": 3, "Admin": 4}
        user["roleId"] = role_map.get(body.role, user.get("roleId", 3))
        user["role"] = body.role

    if body.status is not None:
        if body.status == "Active":
            user["isActive"] = True
            user["isPending"] = False
        elif body.status == "Inactive":
            user["isActive"] = False
            user["isPending"] = False
        elif body.status == "Pending":
            user["isActive"] = False
            user["isPending"] = True

    return {
        "success": True,
        "message": "User updated successfully.",
        "data": map_user(user)
    }

@router.patch("/{user_id}/status")
def update_user_status(user_id: str, body: Optional[StatusUpdateRequest] = None):
    user = next((u for u in MOCK_USERS.values() if u.get("id") == user_id), None)
    if not user:
        raise HTTPException(status_code=404, detail="User not found.")

    if body and body.isActive is not None:
        next_active = body.isActive
    else:
        next_active = not user.get("isActive", True)

    user["isActive"] = next_active
    user["isPending"] = False

    return {
        "success": True,
        "message": f'User {"activated" if next_active else "deactivated"} successfully.',
        "data": map_user(user)
    }

@router.delete("/{user_id}")
def delete_user(user_id: str):
    user = next((u for u in MOCK_USERS.values() if u.get("id") == user_id), None)
    if not user:
        raise HTTPException(status_code=404, detail="User not found.")

    user["isActive"] = False
    user["isDeleted"] = True

    return {
        "success": True,
        "message": "User deleted successfully.",
        "data": map_user(user)
    }
