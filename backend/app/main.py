import asyncio
from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware
from app.core.config import settings
from app.core.database import engine, Base
from app.api.v1.api_router import api_router
from app.seed import seed_data

app = FastAPI(
    title=settings.PROJECT_NAME,
    version=settings.VERSION,
    openapi_url=f'{settings.API_V1_STR}/openapi.json',
    docs_url=f'{settings.API_V1_STR}/docs',
    redoc_url=f'{settings.API_V1_STR}/redoc',
)

# CORS configuration
app.add_middleware(
    CORSMiddleware,
    allow_origins=['*'],
    allow_credentials=True,
    allow_methods=['*'],
    allow_headers=['*'],
)

app.include_router(api_router, prefix=settings.API_V1_STR)

@app.on_event('startup')
async def startup_event():
    # Wait for DB to be ready with retry loop
    connected = False
    for i in range(15):
        try:
            async with engine.begin() as conn:
                await conn.run_sync(Base.metadata.create_all)
            connected = True
            break
        except Exception as e:
            print(f"Waiting for database to accept connections... ({i+1}/15)")
            await asyncio.sleep(2)
            
    if not connected:
        raise RuntimeError("Could not connect to database after 15 attempts. Exiting.")

    # Auto-seed if empty
    try:
        await seed_data()
    except Exception as e:
        print(f"Startup seed notice: {e}")
        
    print('StockFlow Server & Financial ERP Database Ready.')

@app.get('/')
async def root():
    return {
        'app': settings.PROJECT_NAME,
        'version': settings.VERSION,
        'status': 'online',
        'docs': f'{settings.API_V1_STR}/docs'
    }
