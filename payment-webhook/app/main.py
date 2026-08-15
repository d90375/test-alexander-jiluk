from datetime import datetime, timedelta, timezone

from fastapi import Depends, FastAPI, HTTPException
from pydantic import BaseModel
from sqlalchemy.dialects.postgresql import insert
from sqlalchemy.orm import Session

from app.db import get_session
from app.models import Payment, Subscription, User

app = FastAPI(title="payment-webhook")


class PaymentWebhook(BaseModel):
    payment_id: str
    user_id: int
    amount: int
    status: str


@app.post("/webhook/payment")
def handle_payment_webhook(
    data: PaymentWebhook, session: Session = Depends(get_session)
):
    user = session.get(User, data.user_id)
    if user is None:
        raise HTTPException(status_code=404, detail="user not found")

    result = session.execute(
        insert(Payment)
        .values(
            payment_id=data.payment_id,
            user_id=data.user_id,
            amount=data.amount,
            status=data.status,
        )
        .on_conflict_do_nothing(index_elements=["payment_id"])
    )

    if result.rowcount == 0:
        session.rollback()
        return {"ok": True}

    if data.status == "CONFIRMED":
        expires_at = datetime.now(timezone.utc) + timedelta(days=30)
        session.execute(
            insert(Subscription)
            .values(user_id=data.user_id, status="active", expires_at=expires_at)
            .on_conflict_do_update(
                index_elements=["user_id"],
                set_={"status": "active", "expires_at": expires_at},
            )
        )

    session.commit()
    return {"ok": True}
