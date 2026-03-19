# Visista Backend

Python FastAPI backend with MongoDB.

## Setup
1. Create a virtual environment.
2. Install deps:
   - `pip install -r requirements.txt`
3. Copy `.env.example` to `.env` and adjust values.
4. Run:
   - `uvicorn app.main:app --reload`

## Auth
- `POST /auth/login` with JSON `{ "email": "...", "password": "..." }`
- Use returned token as `Authorization: Bearer <token>` for all API requests.

## Endpoints
- `GET /health`

- `GET /products`
- `POST /products`
- `GET /products/{id}`
- `PUT /products/{id}`
- `DELETE /products/{id}`

- `GET /customers`
- `POST /customers`
- `GET /customers/{id}`
- `PUT /customers/{id}`
- `DELETE /customers/{id}`

- `GET /orders`
- `POST /orders`
- `GET /orders/{id}`
- `PUT /orders/{id}`
- `DELETE /orders/{id}`

- `GET /discounts`
- `POST /discounts`
- `GET /discounts/{id}`
- `PUT /discounts/{id}`
- `DELETE /discounts/{id}`

- `GET /categories`
- `POST /categories`
- `GET /categories/{id}`
- `PUT /categories/{id}`
- `DELETE /categories/{id}`
