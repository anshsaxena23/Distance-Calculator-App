from fastapi import FastAPI, Depends, HTTPException, status
from sqlalchemy.orm import Session
from app.database import SessionLocal,SearchHistory, User_Table_Model,LoginHistory, create_db_tables, get_db
from app.calculate_distance import HandleDistanceCalcRequest
from app.Classes import User, DistanceCalcRequest, LoginResponse, SearchHistoryResponse
# from .utils import verify_password, generate_access_code, get_password_hash
from app.utils import verify_password, generate_access_code, get_password_hash, verify_access_token, verify_access_token2, oauth2_scheme
from fastapi.middleware.cors import CORSMiddleware
from app.loggingconfig import setup_logger

logger = setup_logger(__name__, level="DEBUG")
app = FastAPI()

origins = [
    # Allow access from your React development server
    "http://localhost:3000",
    "http://127.0.0.1:3000",
    
    # Add other necessary origins if running in production or different ports
]

app.add_middleware(
    CORSMiddleware,
    allow_origins=origins,          # List of allowed origins
    allow_credentials=True,         # Allows cookies/auth headers
    allow_methods=["*"],            # Allows all methods (GET, POST, OPTIONS, etc.)
    allow_headers=["*"],            # Allows all headers
)

create_db_tables()
@app.post("/api/finddistances")
def findDistances(
    distanceCalcRequest: DistanceCalcRequest, 
    # Inject the dependency. If successful, it returns the user_id, 
    # which we capture here as 'user_id'
    user_id: int = Depends(verify_access_token2),
    db: Session = Depends(get_db)
):
    logger.info(f"Distance calculation request received from User ID: {user_id}")
    resp = HandleDistanceCalcRequest(distanceCalcRequest, user_id, db)

    if resp['error']:
        logger.warning(resp['ErrorMessage'])
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail=resp['ErrorMessage']
        )

    return resp

@app.get("/api/history", response_model=SearchHistoryResponse)
def historical_queries(
    # Inject the dependency. If successful, it returns the user_id, 
    # which we capture here as 'user_id'
    user_id: int = Depends(verify_access_token2),
    db: Session = Depends(get_db)
):
    logger.info(f"History Retreival request received from User ID: {user_id}")
    # return HandleDistanceCalcRequest(distanceCalcRequest, user_id, db)
    db_queries = db.query(SearchHistory).filter(SearchHistory.user_id == user_id).all()

    return {"data": db_queries}

@app.post("/api/signup", status_code=status.HTTP_201_CREATED)
def signup(user: User, db: Session = Depends(get_db)):
    logger.info(f"Attempting Signup for user: {user.username}")
    db_item = db.query(User_Table_Model).filter(User_Table_Model.username == user.username).first()
    if db_item:
        logger.warning(f"User with User Name '{user.username}' already exists.")
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail=f"User with User Name '{user.username}' already exists."
        )

    # Create a new SQLAlchemy model instance
    db_user = User_Table_Model(username=user.username, password=get_password_hash(user.password))
    # Add the object to the session
    db.add(db_user)
    # Commit the transaction to the database
    db.commit()
    logger.info(f"User Created Successfully : {user.username}")

    return {
        "error":False, "Message":"User Created Successfully."
    }

@app.post("/api/login", response_model=LoginResponse)
def login_user(request: User, db: Session = Depends(get_db)):
    """
    Handles user login, verifies credentials, updates login history, 
    and returns a unique access code.
    """
    logger.info(f"Attempting login for user: {request.username}")
    # 1. Fetch User by Username
    # This queries the users table: SELECT * FROM users WHERE username = :username LIMIT 1;
    user = db.query(User_Table_Model).filter(User_Table_Model.username == request.username).first()
    # 2. Check if User Exists
    if not user:
        # Avoid giving away which part failed (user or password) for security
        logger.warning(f"Login failed: User {request.username} not found.")
        raise HTTPException(
            status_code=status.HTTP_401_UNAUTHORIZED,
            detail="Invalid credentials"
        )

    # 3. Verify Password
    # This compares the plaintext password with the hashed password from the database
    if not verify_password(request.password, user.password):
        logger.warning(f"Login failed: User {request.username} Incorrect Password.")
        raise HTTPException(
            status_code=status.HTTP_401_UNAUTHORIZED,
            detail="Invalid credentials"
        )
    
    # 3.1. Invalidate all existing active tokens for this user
    # SELECT * FROM login_history WHERE user_id = :user_id AND is_active = TRUE;
    db.query(LoginHistory).filter(
        LoginHistory.user_id == user.user_id, 
        LoginHistory.is_active == True
    ).update({LoginHistory.is_active: False}, synchronize_session=False)
        
    # --- Login Successful from this point onward ---
    logger.info(f"User {user.username} Login Success - Invalidating all other login requests.")

    # 4. Generate Access Code and Record History
    new_access_code = generate_access_code()
    # Create a new LoginHistory record
    login_entry = LoginHistory(
        user_id=user.user_id,
        access_code=new_access_code,
        # login_time defaults to func.now() in the model
    )
    logger.info(f"User {user.username} Login Success - Auth Code created.")
    
    # Add to session, commit to database
    db.add(login_entry)
    db.commit()
    db.refresh(login_entry) # Refresh to get the actual login_time from the database
    logger.info(f"User {user.username} successfully logged in.")
    
    # 5. Return the Access Code and Login Time
    return LoginResponse(
        access_code=new_access_code,
        logged_in_at=login_entry.login_time,
        user_id=str(user.user_id)
    )

@app.get("/api/users/me")
def read_users_me(user_id: int = Depends(verify_access_token)):
    """
    Endpoint that requires a valid and active access token in the header.
    
    The 'user_id' parameter receives the value returned by the dependency 
    (the ID of the logged-in user).
    """
    
    return {"message": "You are authorized!", "user_id": user_id}

# --- Logout API ---
@app.post("/api/logout")
def logout_user(
    # Get the token string directly from the header via the OAuth2 scheme
    access_code: str = Depends(oauth2_scheme), 
    db: Session = Depends(get_db)
):
    """
    Invalidates the active access token provided in the header by setting 
    is_active to False in the login_history table.
    """
    
    # 1. Find the active token record associated with the provided access_code
    token_record = db.query(LoginHistory).filter(
        LoginHistory.access_code == access_code,
        LoginHistory.is_active == True # Crucial: only log out if it's currently active
    ).first()

    # 2. Check if the token is valid/active
    if not token_record:
        # If the token is already inactive or invalid, we can just confirm the logout state
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail="Token is already inactive or invalid."
        )

    # 3. Update the Token Status
    # Set the is_active column to False
    token_record.is_active = False
    
    # Commit the change to the database
    db.commit()
    
    # 4. Return success response
    return {"message": "Successfully logged out. Access token has been invalidated."}

# @app.post("/logout")
# def logout_user():