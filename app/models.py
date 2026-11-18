from datetime import datetime

from app import db


class User(db.Model):
    id = db.Column(db.Integer, primary_key=True)
    name = db.Column(db.String(100), nullable=False)
    email = db.Column(db.String(120), nullable=False, unique=True)
    password_hash = db.Column(db.String(256), nullable=False)
    phone = db.Column(db.String(15), nullable=False)
    role = db.Column(
        db.Enum("admin", "trekker", "staff"), default="trekker", nullable=False
    )
    status = db.Column(
        db.Enum("active", "blacklisted"), default="active", nullable=False
    )

    def to_dict(self):
        return {
            "id": self.id,
            "name": self.name,
            "email": self.email,
            "phone": self.phone,
            "role": self.role,
            "status": self.status,
        }


class Staff(db.Model):
    id = db.Column(db.Integer, primary_key=True)
    user_id = db.Column(
        db.Integer, db.ForeignKey("user.id"), unique=True, nullable=False
    )
    specialization = db.Column(db.String(100), nullable=True)
    experience = db.Column(db.String(100), nullable=True)
    is_available = db.Column(db.Boolean, default=True, nullable=False)

    user = db.relationship("User", backref="staff_profile")

    def to_dict(self):
        return {
            "id": self.id,
            "user_id": self.user_id,
            "specialization": self.specialization,
            "experience": self.experience,
            "is_available": self.is_available,
            "user_name": self.user.name if self.user else None,
            "user_email": self.user.email if self.user else None,
            "user_status": self.user.status if self.user else None,
            "user_phone": self.user.phone if self.user else None,
            "user_role": self.user.role if self.user else None,
        }


class Trek(db.Model):
    id = db.Column(db.Integer, primary_key=True)
    name = db.Column(db.String(100), nullable=False)
    location = db.Column(db.String(100), nullable=False)
    difficulty = db.Column(db.Enum("Easy", "Moderate", "Hard"), nullable=False)
    status = db.Column(
        db.Enum("Open", "Closed", "Completed"), nullable=False, default="Open"
    )
    duration_days = db.Column(db.Integer, nullable=False)
    total_slots = db.Column(db.Integer, nullable=False)
    available_slots = db.Column(db.Integer, nullable=False)
    assigned_staff_id = db.Column(db.Integer, db.ForeignKey("user.id"), nullable=True)
    start_date = db.Column(db.Date, nullable=False)
    image_url = db.Column(db.Text, nullable=True)

    assigned_staff = db.relationship(
        "User", foreign_keys=[assigned_staff_id], backref="assigned_treks"
    )

    def to_dict(self):
        return {
            "id": self.id,
            "name": self.name,
            "location": self.location,
            "difficulty": self.difficulty,
            "status": self.status,
            "duration_days": self.duration_days,
            "total_slots": self.total_slots,
            "available_slots": self.available_slots,
            "assigned_staff_id": self.assigned_staff_id,
            "start_date": self.start_date.isoformat(),
            "image_url": self.image_url,
            "assigned_staff_name": self.assigned_staff.name
            if self.assigned_staff
            else None,
        }


class Booking(db.Model):
    id = db.Column(db.Integer, primary_key=True)
    user_id = db.Column(db.Integer, db.ForeignKey("user.id"), nullable=False)
    trek_id = db.Column(db.Integer, db.ForeignKey("trek.id"), nullable=False)
    booking_date = db.Column(db.DateTime, default=datetime.utcnow, nullable=False)
    status = db.Column(
        db.Enum("Booked", "Cancelled", "Completed"), nullable=False, default="Booked"
    )

    user = db.relationship("User", foreign_keys=[user_id], backref="bookings")
    trek = db.relationship("Trek", foreign_keys=[trek_id], backref="trek_bookings")

    def to_dict(self):
        return {
            "id": self.id,
            "user_id": self.user_id,
            "trek_id": self.trek_id,
            "status": self.status,
            "booking_date": self.booking_date.isoformat(),
            "trek_name": self.trek.name if self.trek else None,
            "start_date": self.trek.start_date.isoformat() if self.trek else None,
            "duration_days": self.trek.duration_days if self.trek else None,
            "location": self.trek.location if self.trek else None,
            "difficulty": self.trek.difficulty if self.trek else None,
            "assigned_staff_name": self.trek.assigned_staff.name
                if self.trek and self.trek.assigned_staff
                else None,
            "user_name": self.user.name if self.user else None,
        }
