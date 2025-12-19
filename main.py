from fastapi import FastAPI, Request
from fastapi.staticfiles import StaticFiles
from fastapi.templating import Jinja2Templates
from fastapi.middleware.cors import CORSMiddleware
import uvicorn
from app.api.auth import router as auth_router
from app.api.roles import router as roles_router
from app.api.categories import router as categories_router
from app.api.farms import router as farms_router
from app.api.products import router as products_router
from app.api.cart import router as cart_router
from app.api.orders import router as orders_router
from app.api.order_items import router as order_items_router
from app.api.reviews import router as reviews_router
from app.api.subscriptions import router as subscriptions_router
from app.api.web import router as web_router
from app.api.admin import router as admin_router


app = FastAPI(title="Прямо с грядки", version="1.0")

app.add_middleware(
    CORSMiddleware,
    allow_origins=["http://127.0.0.1:8000", "http://localhost:8000", "http://127.0.0.1:8002", "http://localhost:8002"],  # Указываем конкретные домены
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

app.mount("/static", StaticFiles(directory="app/static"), "static")
templates = Jinja2Templates(directory="app/templates")

app.include_router(auth_router)
app.include_router(roles_router)
app.include_router(categories_router)
app.include_router(farms_router)
app.include_router(products_router)
app.include_router(cart_router)
app.include_router(orders_router)
app.include_router(order_items_router)
app.include_router(reviews_router)
app.include_router(subscriptions_router)
app.include_router(web_router)
app.include_router(admin_router)

@app.get("/")
async def root(request: Request):
    return templates.TemplateResponse(name="index.html", context={"request": request})

if __name__ == "__main__":
    uvicorn.run(app=app, host="127.0.0.1", port=8002)