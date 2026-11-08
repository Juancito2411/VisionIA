import os
from pathlib import Path
from sqlalchemy import create_engine
from sqlalchemy.orm import declarative_base, sessionmaker

BASE_DIR = Path(__file__).resolve().parents[1]
DB_URL = os.getenv('DATABASE_URL', f"sqlite:///{BASE_DIR / 'vision_ai.db'}")
connect_args = {'check_same_thread': False} if DB_URL.startswith('sqlite') else {}
engine = create_engine(DB_URL, connect_args=connect_args, future=True)
SessionLocal = sessionmaker(bind=engine, autoflush=False, autocommit=False, future=True)
Base = declarative_base()
