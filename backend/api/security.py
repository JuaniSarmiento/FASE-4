"""
Security utilities for JWT authentication and password hashing

Provides:
- Password hashing with bcrypt (via passlib)
- JWT token creation and verification
- Token payload extraction
- Security configuration from environment variables
"""
import os
from datetime import datetime, timedelta
from typing import Optional, Dict, Any

from jose import JWTError, jwt
from passlib.context import CryptContext
import logging

logger = logging.getLogger(__name__)

# Password hashing configuration
# Note: Using bcrypt 4.x for passlib compatibility (bcrypt 5.x breaks passlib)
pwd_context = CryptContext(schemes=["bcrypt"], deprecated="auto")

# JWT configuration from environment (REQUERIDO - sin default inseguro)
# FIXED (2025-11-21): Eliminado default inseguro para JWT_SECRET_KEY
SECRET_KEY = os.getenv("JWT_SECRET_KEY")

if not SECRET_KEY:
    raise RuntimeError(
        "SECURITY ERROR: JWT_SECRET_KEY environment variable is REQUIRED.\n"
        "Generate a secure random key with:\n"
        "  python -c 'import secrets; print(secrets.token_urlsafe(32))'\n"
        "Then set it in your .env file:\n"
        "  JWT_SECRET_KEY=<generated_key>"
    )

# Validar longitud mínima (prevenir claves débiles)
if len(SECRET_KEY) < 32:
    raise RuntimeError(
        f"SECURITY ERROR: JWT_SECRET_KEY must be at least 32 characters long.\n"
        f"Current length: {len(SECRET_KEY)} characters.\n"
        f"Generate a new one with:\n"
        f"  python -c 'import secrets; print(secrets.token_urlsafe(32))'"
    )

ALGORITHM = os.getenv("JWT_ALGORITHM", "HS256")
ACCESS_TOKEN_EXPIRE_MINUTES = int(os.getenv("JWT_ACCESS_TOKEN_EXPIRE_MINUTES", "30"))
REFRESH_TOKEN_EXPIRE_DAYS = int(os.getenv("JWT_REFRESH_TOKEN_EXPIRE_DAYS", "7"))


# === Password Hashing Functions ===

def hash_password(password: str) -> str:
    """
    Hash a password using bcrypt

    Bcrypt has a maximum password length of 72 bytes. Passwords longer than
    72 bytes are automatically truncated to prevent errors while maintaining
    security (since 72 bytes provides sufficient entropy).

    Args:
        password: Plain text password

    Returns:
        Hashed password string

    Example:
        >>> hashed = hash_password("my_secure_password")
        >>> print(hashed)
        $2b$12$...
    """
    # Bcrypt limitation: passwords longer than 72 bytes must be truncated
    # This is a bcrypt limitation, not a security issue
    # 72 bytes provides sufficient entropy for password security
    password_bytes = password.encode('utf-8')[:72]
    return pwd_context.hash(password_bytes.decode('utf-8'))


def verify_password(plain_password: str, hashed_password: str) -> bool:
    """
    Verify a password against a hashed password

    Applies the same 72-byte truncation as hash_password to ensure
    passwords longer than 72 bytes are verified correctly.

    Args:
        plain_password: Plain text password from user
        hashed_password: Hashed password from database

    Returns:
        True if password matches, False otherwise

    Example:
        >>> hashed = hash_password("my_password")
        >>> verify_password("my_password", hashed)
        True
        >>> verify_password("wrong_password", hashed)
        False
    """
    try:
        # Apply same 72-byte truncation as hash_password
        password_bytes = plain_password.encode('utf-8')[:72]
        return pwd_context.verify(password_bytes.decode('utf-8'), hashed_password)
    except Exception as e:
        logger.error(f"Password verification error: {str(e)}", exc_info=True)
        return False


# === JWT Token Functions ===

def create_access_token(
    data: Dict[str, Any],
    expires_delta: Optional[timedelta] = None
) -> str:
    """
    Create a JWT access token

    Args:
        data: Payload data to encode in token (typically {"sub": user_id})
        expires_delta: Optional custom expiration time

    Returns:
        JWT token string

    Example:
        >>> token = create_access_token({"sub": "user_123"})
        >>> print(token)
        eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9...
    """
    to_encode = data.copy()

    # Set expiration
    if expires_delta:
        expire = datetime.utcnow() + expires_delta
    else:
        expire = datetime.utcnow() + timedelta(minutes=ACCESS_TOKEN_EXPIRE_MINUTES)

    to_encode.update({"exp": expire, "type": "access"})

    # Create token
    encoded_jwt = jwt.encode(to_encode, SECRET_KEY, algorithm=ALGORITHM)

    logger.debug(
        "Access token created",
        extra={
            "sub": data.get("sub"),
            "expires_at": expire.isoformat(),
        }
    )

    return encoded_jwt


def create_refresh_token(
    data: Dict[str, Any],
    expires_delta: Optional[timedelta] = None
) -> str:
    """
    Create a JWT refresh token (longer expiration)

    Args:
        data: Payload data to encode in token (typically {"sub": user_id})
        expires_delta: Optional custom expiration time

    Returns:
        JWT refresh token string

    Example:
        >>> refresh_token = create_refresh_token({"sub": "user_123"})
    """
    to_encode = data.copy()

    # Set expiration (longer than access token)
    if expires_delta:
        expire = datetime.utcnow() + expires_delta
    else:
        expire = datetime.utcnow() + timedelta(days=REFRESH_TOKEN_EXPIRE_DAYS)

    to_encode.update({"exp": expire, "type": "refresh"})

    # Create token
    encoded_jwt = jwt.encode(to_encode, SECRET_KEY, algorithm=ALGORITHM)

    logger.debug(
        "Refresh token created",
        extra={
            "sub": data.get("sub"),
            "expires_at": expire.isoformat(),
        }
    )

    return encoded_jwt


def verify_token(token: str, token_type: str = "access") -> Optional[Dict[str, Any]]:
    """
    Verify and decode a JWT token

    Args:
        token: JWT token string
        token_type: Expected token type ("access" or "refresh")

    Returns:
        Decoded payload dict if valid, None if invalid

    Example:
        >>> token = create_access_token({"sub": "user_123"})
        >>> payload = verify_token(token)
        >>> print(payload["sub"])
        user_123
    """
    try:
        # Decode token
        payload = jwt.decode(token, SECRET_KEY, algorithms=[ALGORITHM])

        # Verify token type
        if payload.get("type") != token_type:
            logger.warning(
                f"Token type mismatch: expected {token_type}, got {payload.get('type')}"
            )
            return None

        return payload

    except JWTError as e:
        logger.warning(f"JWT verification failed: {str(e)}")
        return None
    except Exception as e:
        logger.error(f"Token verification error: {str(e)}", exc_info=True)
        return None


def get_user_id_from_token(token: str) -> Optional[str]:
    """
    Extract user ID from JWT token

    Args:
        token: JWT access token string

    Returns:
        User ID string if valid, None if invalid

    Example:
        >>> token = create_access_token({"sub": "user_123"})
        >>> user_id = get_user_id_from_token(token)
        >>> print(user_id)
        user_123
    """
    payload = verify_token(token, token_type="access")
    if payload:
        return payload.get("sub")
    return None


def create_token_pair(user_id: str, additional_claims: Optional[Dict[str, Any]] = None) -> Dict[str, str]:
    """
    Create both access and refresh tokens for a user

    Args:
        user_id: User ID
        additional_claims: Optional additional claims to include in tokens

    Returns:
        Dict with "access_token" and "refresh_token" keys

    Example:
        >>> tokens = create_token_pair("user_123", {"roles": ["student"]})
        >>> print(tokens.keys())
        dict_keys(['access_token', 'refresh_token', 'token_type'])
    """
    # Base payload
    payload = {"sub": user_id}

    # Add additional claims if provided
    if additional_claims:
        payload.update(additional_claims)

    # Create tokens
    access_token = create_access_token(payload)
    refresh_token = create_refresh_token({"sub": user_id})  # Refresh token only needs user_id

    logger.info(
        "Token pair created",
        extra={"user_id": user_id}
    )

    return {
        "access_token": access_token,
        "refresh_token": refresh_token,
        "token_type": "bearer"
    }


def refresh_access_token(refresh_token: str) -> Optional[str]:
    """
    Generate a new access token from a refresh token

    Args:
        refresh_token: Valid refresh token

    Returns:
        New access token if refresh token is valid, None otherwise

    Example:
        >>> tokens = create_token_pair("user_123")
        >>> new_access_token = refresh_access_token(tokens["refresh_token"])
    """
    # Verify refresh token
    payload = verify_token(refresh_token, token_type="refresh")
    if not payload:
        return None

    user_id = payload.get("sub")
    if not user_id:
        return None

    # Create new access token
    new_access_token = create_access_token({"sub": user_id})

    logger.info(
        "Access token refreshed",
        extra={"user_id": user_id}
    )

    return new_access_token


# === Security Configuration Validation ===

def validate_security_config() -> bool:
    """
    Validate security configuration

    Checks:
    - SECRET_KEY is not default in production
    - Token expiration times are reasonable

    Returns:
        True if configuration is valid, False otherwise
    """
    is_production = os.getenv("ENVIRONMENT", "development") == "production"

    if is_production:
        # Check SECRET_KEY is not default
        if SECRET_KEY == "development_secret_key_change_in_production":
            logger.error(
                "SECURITY ERROR: Using default SECRET_KEY in production! "
                "Set JWT_SECRET_KEY environment variable."
            )
            return False

        # Warn if SECRET_KEY is too short
        if len(SECRET_KEY) < 32:
            logger.warning(
                f"SECRET_KEY is too short ({len(SECRET_KEY)} chars). "
                "Recommended: at least 32 characters for production."
            )

    # Check token expiration times are reasonable
    if ACCESS_TOKEN_EXPIRE_MINUTES > 1440:  # 24 hours
        logger.warning(
            f"Access token expiration is very long: {ACCESS_TOKEN_EXPIRE_MINUTES} minutes. "
            "Recommended: 15-60 minutes for security."
        )

    if REFRESH_TOKEN_EXPIRE_DAYS > 90:
        logger.warning(
            f"Refresh token expiration is very long: {REFRESH_TOKEN_EXPIRE_DAYS} days. "
            "Recommended: 7-30 days for security."
        )

    logger.info(
        "Security configuration validated",
        extra={
            "environment": os.getenv("ENVIRONMENT", "development"),
            "access_token_expire_minutes": ACCESS_TOKEN_EXPIRE_MINUTES,
            "refresh_token_expire_days": REFRESH_TOKEN_EXPIRE_DAYS,
        }
    )

    return True


# Run validation on module import
validate_security_config()
