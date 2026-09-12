import asyncio

from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware

from app.api.v1.api_router import api_router
from app.core.config import settings
from app.core.database import Base, engine
from app.core.redis import init_redis, close_redis
from app.seed import seed_data

app = FastAPI(
    title=settings.PROJECT_NAME,
    version=settings.VERSION,
    openapi_url=f"{settings.API_V1_STR}/openapi.json",
    docs_url=f"{settings.API_V1_STR}/docs",
    redoc_url=f"{settings.API_V1_STR}/redoc",
)

# CORS configuration
app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

app.include_router(api_router, prefix=settings.API_V1_STR)


@app.on_event("startup")
async def startup_event():
    # Initialize Redis connection pool
    try:
        await init_redis()
        print("Connected to Redis successfully.", flush=True)
    except Exception as e:
        print(f"Could not connect to Redis: {e}", flush=True)

    # Wait for DB to be ready with retry loop
    connected = False
    for i in range(15):
        try:
            async with engine.begin() as conn:
                await conn.run_sync(Base.metadata.create_all)
            connected = True
            break
        except Exception:
            print(f"Waiting for database to accept connections... ({i + 1}/15)", flush=True)
            await asyncio.sleep(2)

    if not connected:
        raise RuntimeError("Could not connect to database after 15 attempts. Exiting.")

    # Auto-seed if empty
    try:
        await seed_data()
    except Exception as e:
        print(f"Startup seed notice: {e}", flush=True)

    print("StockFlow Server & Financial ERP Database Ready.", flush=True)


@app.on_event("shutdown")
async def shutdown_event():
    await close_redis()
    print("Redis connection closed.")


@app.get("/")
async def root():
    return {
        "app": settings.PROJECT_NAME,
        "version": settings.VERSION,
        "status": "online",
        "docs": f"{settings.API_V1_STR}/docs",
    }
