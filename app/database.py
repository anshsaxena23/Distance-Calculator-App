import os
from sqlalchemy import Column, Integer, String, DateTime, ForeignKey,Boolean,create_engine,func
from sqlalchemy.orm import sessionmaker
from sqlalchemy.ext.declarative import declarative_base
from sqlalchemy.orm import relationship

# --- 1. Database Configuration (Matches Docker Compose) ---
# NOTE: The host MUST be 'db' as defined in the docker-compose.yml service name.
DB_HOST = os.getenv("DB_HOST", "db")
DB_USER = os.getenv("DB_USER", "myuser")
DB_PASSWORD = os.getenv("DB_PASSWORD", "mypassword")
DB_NAME = os.getenv("DB_NAME", "mydatabase")
DB_PORT = os.getenv("DB_PORT", "5432")

# Construct the database URL
SQLALCHEMY_DATABASE_URL = (
    f"postgresql://{DB_USER}:{DB_PASSWORD}@{DB_HOST}:{DB_PORT}/{DB_NAME}"
)

# --- 2. Database Engine and Session ---
# Create the SQLAlchemy Engine
engine = create_engine(SQLALCHEMY_DATABASE_URL)

# Create a configured "Session" class
SessionLocal = sessionmaker(autocommit=False, autoflush=False, bind=engine)

# Base class for the models
Base = declarative_base()

# --- 3. Database Models ---
class User_Table_Model(Base):
    __tablename__ = "Users"
    
    user_id = Column(Integer, primary_key=True, index=True)
    username = Column(String, index=True)
    password = Column(String)

class Log(Base):
    __tablename__ = "Logs"
    logID = Column(Integer, primary_key=True, index=True)
    LogMessage = Column(String)

class LoginHistory(Base):
    __tablename__ = "login_history"
    id = Column(Integer, primary_key=True, index=True)
    user_id = Column(Integer)
    access_code = Column(String)
    login_time = Column(DateTime, default=func.now())
    is_active = Column(Boolean, default=True)

class SearchHistory(Base):
    __tablename__ = "search_history"
    id = Column(Integer, primary_key=True, index=True)
    user_id = Column(Integer)
    Place1 = Column(String)
    Place2 = Column(String)
    Kilometers = Column(String)
    Miles = Column(String)
    searched_at = Column(DateTime, default=func.now())

# Function to create tables in the database (call this once)
def create_db_tables():
    Base.metadata.create_all(bind=engine)
    print("Database tables created/checked.")

# --- 4. Dependency to get a database session ---
def get_db():
    db = SessionLocal()
    try:
        yield db
    finally:
        db.close()