from fastapi import APIRouter, Depends, HTTPException, status, Request
from fastapi.security import OAuth2PasswordRequestForm
from sqlalchemy.orm import Session
from app.database import get_db
from app.models.user import User
from app.schemas.auth import Token, UserProfile
from app.auth_utils import verify_password, create_access_token, get_current_user
from app.crud import user as user_crud
from app.rate_limit import enforce_login_rate_limit
from app.audit import log_event

router = APIRouter(prefix="/api", tags=["Authentication"])


@router.post("/login", response_model=Token)
def login(
    request: Request,
    form_data: OAuth2PasswordRequestForm = Depends(),
    db: Session = Depends(get_db),
    _rate_limit: None = Depends(enforce_login_rate_limit),
):
    # Same generic error message for "no such user" and "wrong password" so a
    # bad actor can't use the response to enumerate valid usernames.
    generic_error = HTTPException(
        status_code=status.HTTP_401_UNAUTHORIZED,
        detail="Incorrect username or password",
    )

    user = user_crud.get_user_by_username(db, form_data.username)
    if not user:
        log_event(db, action="login_failed", actor_username=form_data.username, detail="no such user", request=request)
        raise generic_error

    if not user.is_active:
        log_event(db, action="login_failed", actor_user=user, detail="account deactivated", request=request)
        raise HTTPException(
            status_code=status.HTTP_403_FORBIDDEN,
            detail="This account has been deactivated. Contact an administrator.",
        )

    if user_crud.is_locked(user):
        log_event(db, action="login_failed", actor_user=user, detail="account locked", request=request)
        raise HTTPException(
            status_code=status.HTTP_423_LOCKED,
            detail="Too many failed attempts. This account is temporarily locked - try again in a few minutes.",
        )

    if not verify_password(form_data.password, user.password_hash):
        user_crud.record_failed_login(db, user)
        log_event(db, action="login_failed", actor_user=user, detail="wrong password", request=request)
        raise generic_error

    user_crud.reset_failed_login(db, user)
    log_event(db, action="login_success", actor_user=user, request=request)
    access_token = create_access_token(data={"sub": user.username, "role": user.role})
    return {"access_token": access_token, "token_type": "bearer"}


@router.get("/profile", response_model=UserProfile)
def read_profile(current_user: User = Depends(get_current_user)):
    return current_user


@router.post("/logout")
def logout(
    request: Request,
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user),
):
    log_event(db, action="logout", actor_user=current_user, request=request)
    return {"message": "Logged out. Please delete the token on the client side."}
