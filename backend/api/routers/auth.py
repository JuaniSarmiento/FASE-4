"""
Authentication router for user registration, login, and token management

Endpoints:
- POST /auth/register - Register new user
- POST /auth/login - Login with email/password
- POST /auth/refresh - Refresh access token
- GET /auth/me - Get current user info
- POST /auth/change-password - Change user password

SECURITY: All auth endpoints have rate limiting to prevent brute-force attacks.
"""
import logging
import os
from fastapi import APIRouter, Depends, HTTPException, status, Request
from sqlalchemy.exc import IntegrityError

from ..deps import get_user_repository, get_current_user
from ..middleware.rate_limiter import limiter, get_rate_limit
from ..schemas.auth import (
    UserRegister,
    UserLogin,
    RefreshTokenRequest,
    ChangePasswordRequest,
    TokenResponse,
    UserResponse,
    UserWithTokenResponse,
    MessageResponse,
)
from ..schemas.common import APIResponse
from ..security import (
    hash_password,
    verify_password,
    create_token_pair,
    refresh_access_token,
)
from ...database.repositories import UserRepository

logger = logging.getLogger(__name__)

router = APIRouter(prefix="/auth", tags=["Authentication"])


# =============================================================================
# Registration Endpoint
# =============================================================================


@router.post(
    "/register",
    response_model=APIResponse[UserWithTokenResponse],
    status_code=status.HTTP_201_CREATED,
    summary="Register New User",
    description="""
    Register a new user account.

    **Requirements:**
    - Email must be unique
    - Username must be unique
    - Password must be at least 8 characters with uppercase, lowercase, and digit

    **Returns:**
    - User data
    - Access token (expires in 30 minutes)
    - Refresh token (expires in 7 days)

    **Rate Limit:** 3 requests per minute per IP (anti-abuse)

    **Example:**
    ```json
    {
      "email": "john.doe@example.com",
      "username": "john_doe",
      "password": "SecurePassword123!",
      "full_name": "John Doe",
      "student_id": "student_001"
    }
    ```
    """,
)
@limiter.limit(get_rate_limit("auth_register"))
async def register(
    request: Request,
    user_data: UserRegister,
    user_repo: UserRepository = Depends(get_user_repository),
) -> APIResponse[UserWithTokenResponse]:
    """
    Register a new user account

    Creates a new user with hashed password and generates JWT tokens.
    """
    # Check if email already exists
    existing_user = user_repo.get_by_email(user_data.email)
    if existing_user:
        logger.warning(
            "Registration failed: email already exists",
            extra={"email": user_data.email}
        )
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail="Email already registered",
        )

    # Check if username already exists
    existing_username = user_repo.get_by_username(user_data.username)
    if existing_username:
        logger.warning(
            "Registration failed: username already exists",
            extra={"username": user_data.username}
        )
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail="Username already taken",
        )

    # Hash password
    hashed_password = hash_password(user_data.password)

    # Create user
    try:
        user = user_repo.create(
            email=user_data.email,
            username=user_data.username,
            hashed_password=hashed_password,
            full_name=user_data.full_name,
            student_id=user_data.student_id,
            roles=["student"],  # Default role
        )
    except IntegrityError as e:
        logger.error(
            "Database integrity error during registration",
            exc_info=True,
            extra={"email": user_data.email, "username": user_data.username}
        )
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail="User registration failed due to database constraint",
        )

    # Create token pair
    tokens = create_token_pair(user.id, {"email": user.email, "roles": user.roles})

    # Build response
    user_response = UserResponse(
        id=user.id,
        email=user.email,
        username=user.username,
        full_name=user.full_name,
        student_id=user.student_id,
        roles=user.roles,
        is_active=user.is_active,
        is_verified=user.is_verified,
        created_at=user.created_at.isoformat(),
    )

    token_response = TokenResponse(
        access_token=tokens["access_token"],
        refresh_token=tokens["refresh_token"],
        token_type=tokens["token_type"],
        expires_in=int(os.getenv("JWT_ACCESS_TOKEN_EXPIRE_MINUTES", "30")) * 60,
    )

    logger.info(
        "User registered successfully",
        extra={
            "user_id": user.id,
            "email": user.email,
            "username": user.username,
        }
    )

    return APIResponse(
        success=True,
        data=UserWithTokenResponse(user=user_response, tokens=token_response),
        message=f"User registered successfully: {user.username}",
    )


# =============================================================================
# Login Endpoint
# =============================================================================


@router.post(
    "/login",
    response_model=APIResponse[UserWithTokenResponse],
    summary="Login",
    description="""
    Login with email and password.

    **Authentication:**
    - Email (case-insensitive)
    - Password

    **Returns:**
    - User data
    - Access token (expires in 30 minutes)
    - Refresh token (expires in 7 days)

    **Rate Limit:** 5 requests per minute per IP (anti-brute-force)

    **Example:**
    ```json
    {
      "email": "john.doe@example.com",
      "password": "SecurePassword123!"
    }
    ```
    """,
)
@limiter.limit(get_rate_limit("auth_login"))
async def login(
    request: Request,
    credentials: UserLogin,
    user_repo: UserRepository = Depends(get_user_repository),
) -> APIResponse[UserWithTokenResponse]:
    """
    Login with email and password

    Validates credentials and generates JWT tokens.
    """
    # Find user by email
    user = user_repo.get_by_email(credentials.email)
    if not user:
        logger.warning(
            "Login failed: user not found",
            extra={"email": credentials.email}
        )
        raise HTTPException(
            status_code=status.HTTP_401_UNAUTHORIZED,
            detail="Invalid email or password",
        )

    # Verify password
    if not verify_password(credentials.password, user.hashed_password):
        logger.warning(
            "Login failed: invalid password",
            extra={"user_id": user.id, "email": user.email}
        )
        raise HTTPException(
            status_code=status.HTTP_401_UNAUTHORIZED,
            detail="Invalid email or password",
        )

    # Check if user is active
    if not user.is_active:
        logger.warning(
            "Login failed: user is inactive",
            extra={"user_id": user.id, "email": user.email}
        )
        raise HTTPException(
            status_code=status.HTTP_403_FORBIDDEN,
            detail="User account is inactive",
        )

    # Update last login
    user_repo.update_last_login(user.id)

    # Create token pair
    tokens = create_token_pair(user.id, {"email": user.email, "roles": user.roles})

    # Build response
    user_response = UserResponse(
        id=user.id,
        email=user.email,
        username=user.username,
        full_name=user.full_name,
        student_id=user.student_id,
        roles=user.roles,
        is_active=user.is_active,
        is_verified=user.is_verified,
        created_at=user.created_at.isoformat(),
    )

    token_response = TokenResponse(
        access_token=tokens["access_token"],
        refresh_token=tokens["refresh_token"],
        token_type=tokens["token_type"],
        expires_in=int(os.getenv("JWT_ACCESS_TOKEN_EXPIRE_MINUTES", "30")) * 60,
    )

    logger.info(
        "User logged in successfully",
        extra={
            "user_id": user.id,
            "email": user.email,
            "login_count": user.login_count,
        }
    )

    return APIResponse(
        success=True,
        data=UserWithTokenResponse(user=user_response, tokens=token_response),
        message="Login successful",
    )


# =============================================================================
# Refresh Token Endpoint
# =============================================================================


@router.post(
    "/refresh",
    response_model=APIResponse[TokenResponse],
    summary="Refresh Access Token",
    description="""
    Generate a new access token using a valid refresh token.

    **Use case:**
    When the access token expires (after 30 minutes), use this endpoint to get a new one
    without requiring the user to login again.

    **Rate Limit:** 10 requests per minute per IP

    **Example:**
    ```json
    {
      "refresh_token": "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9..."
    }
    ```
    """,
)
@limiter.limit(get_rate_limit("auth_refresh"))
async def refresh_token(
    http_request: Request,
    request: RefreshTokenRequest,
) -> APIResponse[TokenResponse]:
    """
    Refresh access token using refresh token

    Generates a new access token from a valid refresh token.
    """
    # Generate new access token
    new_access_token = refresh_access_token(request.refresh_token)

    if not new_access_token:
        logger.warning("Token refresh failed: invalid or expired refresh token")
        raise HTTPException(
            status_code=status.HTTP_401_UNAUTHORIZED,
            detail="Invalid or expired refresh token",
        )

    logger.info("Access token refreshed successfully")

    return APIResponse(
        success=True,
        data=TokenResponse(
            access_token=new_access_token,
            refresh_token=request.refresh_token,  # Same refresh token
            token_type="bearer",
            expires_in=int(os.getenv("JWT_ACCESS_TOKEN_EXPIRE_MINUTES", "30")) * 60,
        ),
        message="Access token refreshed successfully",
    )


# =============================================================================
# Get Current User Endpoint
# =============================================================================


@router.get(
    "/me",
    response_model=APIResponse[UserResponse],
    summary="Get Current User",
    description="""
    Get information about the currently authenticated user.

    **Authentication required:**
    - Bearer token in Authorization header

    **Example:**
    ```
    Authorization: Bearer eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9...
    ```
    """,
)
async def get_me(
    current_user: dict = Depends(get_current_user),
) -> APIResponse[UserResponse]:
    """
    Get current authenticated user information

    Returns user data from JWT token.
    """
    user_response = UserResponse(
        id=current_user["user_id"],
        email=current_user["email"],
        username=current_user["username"],
        full_name=current_user.get("full_name"),
        student_id=current_user.get("student_id"),
        roles=current_user["roles"],
        is_active=current_user["is_active"],
        is_verified=current_user["is_verified"],
        created_at="",  # Not available from token
    )

    return APIResponse(
        success=True,
        data=user_response,
        message="Current user retrieved successfully",
    )


# =============================================================================
# Change Password Endpoint
# =============================================================================


@router.post(
    "/change-password",
    response_model=APIResponse[MessageResponse],
    summary="Change Password",
    description="""
    Change the password for the currently authenticated user.

    **Authentication required:**
    - Bearer token in Authorization header

    **Requirements:**
    - Current password must be correct
    - New password must be at least 8 characters with uppercase, lowercase, and digit
    - New password must be different from current password

    **Rate Limit:** 3 requests per minute per IP (anti-brute-force)

    **Example:**
    ```json
    {
      "current_password": "OldPassword123!",
      "new_password": "NewSecurePassword456!"
    }
    ```
    """,
)
@limiter.limit(get_rate_limit("auth_password"))
async def change_password(
    http_request: Request,
    request: ChangePasswordRequest,
    current_user: dict = Depends(get_current_user),
    user_repo: UserRepository = Depends(get_user_repository),
) -> APIResponse[MessageResponse]:
    """
    Change user password

    Requires current password verification.
    """
    user_id = current_user["user_id"]

    # Get user from database
    user = user_repo.get_by_id(user_id)
    if not user:
        logger.error(
            "Password change failed: user not found",
            extra={"user_id": user_id}
        )
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="User not found",
        )

    # Verify current password
    if not verify_password(request.current_password, user.hashed_password):
        logger.warning(
            "Password change failed: incorrect current password",
            extra={"user_id": user_id, "email": user.email}
        )
        raise HTTPException(
            status_code=status.HTTP_401_UNAUTHORIZED,
            detail="Current password is incorrect",
        )

    # Check if new password is different from current
    if verify_password(request.new_password, user.hashed_password):
        logger.warning(
            "Password change failed: new password same as current",
            extra={"user_id": user_id}
        )
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail="New password must be different from current password",
        )

    # Hash new password
    new_hashed_password = hash_password(request.new_password)

    # Update password
    user_repo.update_password(user_id, new_hashed_password)

    logger.info(
        "Password changed successfully",
        extra={"user_id": user_id, "email": user.email}
    )

    return APIResponse(
        success=True,
        data=MessageResponse(message="Password changed successfully"),
        message="Password changed successfully",
    )
