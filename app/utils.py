from uuid import uuid4
# Import SQLAlchemy models and get_db dependency
from app.database import get_db, LoginHistory 
from fastapi import Depends, HTTPException, status
from fastapi.security import OAuth2PasswordBearer
from sqlalchemy.orm import Session
from datetime import datetime
from fastapi import Depends, HTTPException, status, Header

# --- Hashing Utility (using passlib) ---
from passlib.context import CryptContext

TOKEN_LIFESPAN_SECONDS = 86400 # 24 hours

pwd_context = CryptContext(schemes=["argon2"], deprecated="auto")
# --- 1. Define OAuth2 Scheme ---
oauth2_scheme = OAuth2PasswordBearer(tokenUrl="login/")

def get_password_hash(password: str) -> str:
    """
    Generates a secure hash using the Argon2 context.
    """
    # The .hash() method automatically uses the 'argon2' scheme defined above.
    return pwd_context.hash(password)

def verify_password(plain_password: str, hashed_password: str) -> bool:
    """
    Verifies a plaintext password against a stored Argon2 hash.
    """
    return pwd_context.verify(plain_password, hashed_password)

def generate_access_code():
    return str(uuid4())

def verify_access_token2(
    access_code: str = Depends(oauth2_scheme),
    # Retrieve user ID from the 'X-User-ID' header
    user_id: str = Header(..., alias="X-User-ID", description="The ID of the user performing the request."),
    db: Session = Depends(get_db)
) -> int:
    """
    Dependency function to check if an access code is valid, active, 
    belongs to the provided user_id, and has not expired.
    Returns the user ID (integer) if valid.
    """
    
    try:
        user_id_int = int(user_id)
    except ValueError:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail="Invalid format for X-User-ID header."
        )

    # 1. Check for token, user_id, and active status simultaneously
    token_record = db.query(LoginHistory).filter(
        LoginHistory.user_id == user_id_int,
        LoginHistory.access_code == access_code,
        LoginHistory.is_active == True
    ).first()

    if not token_record:
        raise HTTPException(
            status_code=status.HTTP_401_UNAUTHORIZED,
            detail="Invalid user ID, invalid token, or inactive session.",
            headers={"WWW-Authenticate": "Bearer"},
        )
        
    # 2. Check for Token Expiration
    if (datetime.now() - token_record.login_time).total_seconds() > TOKEN_LIFESPAN_SECONDS:
        # Mark token as inactive and raise error
        token_record.is_active = False
        db.commit() 
        
        raise HTTPException(
            status_code=status.HTTP_401_UNAUTHORIZED,
            detail="Access Token Has Expired. Please Login Again.",
            headers={"WWW-Authenticate": "Bearer"}
        )
    
    # 3. Success
    return token_record.user_id

def verify_access_token(
    # FastAPI automatically extracts the token string from the 'Authorization: Bearer <token>' header
    user_id: str,
    access_code: str = Depends(oauth2_scheme),
    db: Session = Depends(get_db)
):
    """
    Dependency function to check if an access code is valid and active.
    Returns the user ID if valid.
    """
    
    # 2. Query the LoginHistory table
    # SELECT * FROM login_history WHERE access_code = :code AND is_active = TRUE;
    token_record = db.query(LoginHistory).filter(
        LoginHistory.user_id == user_id,
        LoginHistory.access_code == access_code,
        LoginHistory.is_active == True
    ).first()

    # 3. Handle Token Status
    if not token_record:
        # If the token is not found or is inactive (is_active=False)
        raise HTTPException(
            status_code=status.HTTP_401_UNAUTHORIZED,
            detail="Invalid or inactive access token",
            headers={"WWW-Authenticate": "Bearer"},
        )
        
    if (datetime.now() - token_record.login_time).total_seconds() > 86400: 
        raise HTTPException(status_code=status.HTTP_401_UNAUTHORIZED,
            detail="Access Token Has Expired. Please Login Again.",
            headers={"WWW-Authenticate": "Bearer"}
            )
    
    # Return the associated user ID or the token record itself for use in the endpoint
    return token_record.user_id