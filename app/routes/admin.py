from datetime import datetime
from app import cache
from flask import Blueprint, jsonify, request
from flask_jwt_extended import get_jwt_identity, jwt_required, get_jwt


from .. import db
from ..models import Booking, Staff, Trek, User

adminbp = Blueprint("admin", __name__)

########################################################################################################
###########################         ADMIN_DASHBOARD            #########################################
########################################################################################################


@adminbp.route("/stats", methods=["GET"])
@jwt_required()
@cache.cached(timeout=60, key_prefix="admin_stats")
def stats():
    claims = get_jwt()
    if claims["role"] != "admin":
        return jsonify({"message": "Unauthorized"}), 403

    total_users = User.query.filter_by(role="trekker").count()
    total_bookings = Booking.query.count()
    total_treks = Trek.query.count()
    total_staff = Staff.query.count()
    recent_bookings = Booking.query.order_by(Booking.booking_date.desc()).limit(5).all()

    return jsonify(
        {
            "total_users": total_users,
            "total_bookings": total_bookings,
            "total_staff": total_staff,
            "total_treks": total_treks,
            "recent_bookings": [booking.to_dict() for booking in recent_bookings],
        }
    ), 200
    # ,status="active" for active users




@adminbp.route("/showallbookings", methods=["GET"])
@jwt_required()
def showallbookings():
    claims = get_jwt()
    if claims["role"] != "admin":
        return jsonify({"message": "Unauthorized"}), 403

    all_bookings = Booking.query.order_by(Booking.booking_date.desc()).all()
    return jsonify(
        {"all_bookings": [booking.to_dict() for booking in all_bookings]}
    ), 200


########################################################################################################
###########################         ADMIN_TREK            ##############################################
########################################################################################################


@adminbp.route("/showtreks", methods=["GET"])
@jwt_required()
def showtreks():
    claims = get_jwt()
    if claims["role"] != "admin":
        return jsonify({"message": "Unauthorized"}), 403

    search = request.args.get("search")

    if search:
        all_treks = Trek.query.filter(Trek.name.ilike(f"%{search}%")).all()
    else:
        all_treks = Trek.query.all()

    return jsonify({"treks": [trek.to_dict() for trek in all_treks]}), 200



@adminbp.route("/managetrek/<int:trek_id>", methods=["GET"])
@jwt_required()
def get_trek(trek_id):
    claims = get_jwt()
    if claims["role"] != "admin":
        return jsonify({"message": "Unauthorized"}), 403

    trek = Trek.query.get_or_404(trek_id)

    available_staff = Staff.query.filter_by(is_available=True).all()

    return jsonify(
        {
            "trek": trek.to_dict(),
            "staff": [staff.to_dict() for staff in available_staff],
        }
    ), 200



@adminbp.route("/createtrek", methods=["GET"])
@jwt_required()
def create_trek_data():
    claims = get_jwt()
    if claims["role"] != "admin":
        return jsonify({"message": "Unauthorized"}), 403


    available_staff = Staff.query.filter_by(is_available=True).all()

    return jsonify({"staff": [staff.to_dict() for staff in available_staff]}), 200



@adminbp.route("/createtrek", methods=["POST"])
@jwt_required()
def create():
    claims = get_jwt()
    if claims["role"] != "admin":
        return jsonify({"message": "Unauthorized"}), 403

    data = request.get_json()

    if (
        not data.get("name")
        or not data.get("location")
        or not data.get("difficulty")
        or not data.get("status")
        or not data.get("start_date")
        or not data.get("duration_days")
        or not data.get("total_slots")
    ):
        return jsonify({"message": "All required fields must be provided"}), 400

    if int(data["duration_days"]) < 1:
        return jsonify({"message": "Duration days must be at least 1"}), 400

    total_slots = int(data["total_slots"])
    if total_slots < 1:
        return jsonify({"message": "Total slots must be at least 1"}), 400

    new_trek = Trek(
        start_date=datetime.strptime(data["start_date"], "%Y-%m-%d").date(),
        name=data["name"],
        location=data["location"],
        difficulty=data["difficulty"],
        status=data["status"],
        image_url=data.get("image_url"),
        total_slots=total_slots,
        available_slots=total_slots,
        duration_days=int(data["duration_days"]),
        assigned_staff_id=data.get("assigned_staff_id"),
    )

    db.session.add(new_trek)
    db.session.commit()
    cache.clear()
    return jsonify(
        {
            "message": "Trek created successfully",
        }
    ), 201


########################################################################################################
###########################         MANAGE TREK            #############################################
########################################################################################################


@adminbp.route("/managetrek/<int:trek_id>", methods=["PUT"])
@jwt_required()
def managetrek(trek_id):
    claims = get_jwt()
    if claims["role"] != "admin":
        return jsonify({"message": "Unauthorized"}), 403

    data = request.get_json()
    if (
        not data.get("name")
        or not data.get("location")
        or not data.get("difficulty")
        or not data.get("status")
        or not data.get("start_date")
        or not data.get("duration_days")
        or not data.get("total_slots")
    ):
        return jsonify({"message": "All required fields must be provided"}), 400

    new_total_slots = int(data["total_slots"])
    if new_total_slots < 1:
        return jsonify({"message": "Total slots must be at least 1"}), 400

    trek = Trek.query.get_or_404(trek_id)
    # returns 404 if id doesnt exist

    booked_slots = trek.total_slots - trek.available_slots

    if new_total_slots < booked_slots:
        return jsonify({"message": "Total slots cannot be less that Booked slots"}), 400

    if int(data["duration_days"]) < 1:
        return jsonify({"message": "Duration days must be at least 1"}), 400

    trek.start_date = datetime.strptime(data["start_date"], "%Y-%m-%d").date()
    trek.name = data["name"]
    trek.location = data["location"]
    trek.difficulty = data["difficulty"]
    trek.status = data["status"]
    trek.image_url = data.get("image_url")
    trek.total_slots = new_total_slots
    trek.available_slots = new_total_slots - booked_slots
    trek.duration_days = int(data["duration_days"])
    trek.assigned_staff_id = data.get("assigned_staff_id")

    db.session.commit()
    cache.clear()
    return jsonify({"message": "Trek updated successfully"}), 200


@adminbp.route("/deletetrek/<int:trek_id>", methods=["DELETE"])
@jwt_required()
def deletetrek(trek_id):
    claims = get_jwt()
    if claims["role"] != "admin":
        return jsonify({"message": "Unauthorized"}), 403

    deletedtrek = Trek.query.get_or_404(trek_id)

    active_bookings = Booking.query.filter_by(
        trek_id=trek_id,
        status="Booked"
    ).count()

    if active_bookings > 0:
        return jsonify({"message": "Cannot delete a trek with active bookings"}), 400

    Booking.query.filter_by(trek_id=trek_id).delete()

    db.session.delete(deletedtrek)
    db.session.commit()
    cache.clear()

    return jsonify({"message": "Trek deleted successfully"}), 200


########################################################################################################
###########################         ADMIN_STAFF            #############################################
########################################################################################################


@adminbp.route("/createstaff", methods=["POST"])
@jwt_required()
def createstaff():
    claims = get_jwt()
    if claims["role"] != "admin":
        return jsonify({"message": "Unauthorized"}), 403

    data = request.get_json()

    if (not data.get("name")
        or not data.get("email")
        or not data.get("phone")
        or not data.get("password")):
            return jsonify({"message": "All required fields must be provided"}), 400

    if User.query.filter_by(email=data["email"]).first():
        return jsonify({"message": "Email already exists"}), 400

    if not data["phone"].isdigit() or len(data["phone"]) != 10:
        return jsonify({"message": "Phone must be 10 digits"}), 400

    from werkzeug.security import generate_password_hash

    new_user = User(
        name=data["name"],
        email=data["email"],
        phone=data["phone"],
        password_hash=generate_password_hash(data["password"]),
        role="staff",
        status="active",
    )
    db.session.add(new_user)
    db.session.flush()  # gets new_user.id without full commit

    new_staff = Staff(
        user_id=new_user.id,
        specialization=data.get("specialization"),
        experience=data.get("experience"),
        is_available=True,
    )
    db.session.add(new_staff)
    db.session.commit()

    return jsonify({"message": "Staff created successfully"}), 201


@adminbp.route("/showstaff", methods=["GET"])
@jwt_required()
def showstaff():
    claims = get_jwt()
    if claims["role"] != "admin":
        return jsonify({"message": "Unauthorized"}), 403

    search = request.args.get("search")

    if search:
        staff_members = (
            Staff.query.join(User)
            .filter(User.name.ilike(f"%{search}%"))
            .all()
        )
    else:
        staff_members = Staff.query.all()

    return jsonify({"staff": [s.to_dict() for s in staff_members]}), 200


@adminbp.route("/editstaff/<int:user_id>", methods=["PUT"])
@jwt_required()
def editstaff(user_id):
    claims = get_jwt()
    if claims["role"] != "admin":
        return jsonify({"message": "Unauthorized"}), 403

    data = request.get_json()

    user = User.query.get_or_404(user_id)

    if user.role != "staff":
        return jsonify({"message": "User is not a staff member"}), 400

    if not data.get("name") or not data.get("email") or not data.get("phone"):
        return jsonify({"message": "Name, email and phone are required"}), 400

    if not data["phone"].isdigit() or len(data["phone"]) != 10:
        return jsonify({"message": "Phone must be 10 digits"}), 400

    existing = User.query.filter_by(email=data["email"]).first()
    if existing and existing.id != user_id:
        return jsonify({"message": "Email already in use by another user"}), 400

    user.name = data["name"]
    user.email = data["email"]
    user.phone = data["phone"]

    staff = Staff.query.filter_by(user_id=user_id).first()
    if staff:
        staff.specialization = data.get("specialization")
        staff.experience = data.get("experience")
        staff.is_available = data.get("is_available", staff.is_available)

    db.session.commit()
    return jsonify({"message": "Staff updated successfully"}), 200


@adminbp.route("/blackliststaff/<int:user_id>", methods=["PATCH"])
@jwt_required()
def blackliststaff(user_id):
    claims = get_jwt()
    if claims["role"] != "admin":
        return jsonify({"message": "Unauthorized"}), 403

    user = User.query.get_or_404(user_id)

    if user.role != "staff":
        return jsonify({"message": "User is not a staff member"}), 400

    if user.status == "blacklisted":
        return jsonify({"message": "Staff is already blacklisted"}), 400

    user.status = "blacklisted"
    db.session.commit()
    return jsonify({"message": "Staff blacklisted successfully"}), 200


@adminbp.route("/whiteliststaff/<int:user_id>", methods=["PATCH"])
@jwt_required()
def whiteliststaff(user_id):
    claims = get_jwt()
    if claims["role"] != "admin":
        return jsonify({"message": "Unauthorized"}), 403

    user = User.query.get_or_404(user_id)

    if user.role != "staff":
        return jsonify({"message": "User is not a staff member"}), 400

    if user.status == "active":
        return jsonify({"message": "Staff is already active"}), 400

    user.status = "active"
    db.session.commit()
    return jsonify({"message": "Staff whitelisted successfully"}), 200



########################################################################################################
###########################         ADMIN_USERS            #############################################
########################################################################################################


@adminbp.route("/showusers", methods=["GET"])
@jwt_required()
def showusers():
    claims = get_jwt()
    if claims["role"] != "admin":
        return jsonify({"message": "Unauthorized"}), 403

    search = request.args.get("search")

    if search:
        users = User.query.filter(
            User.role == "trekker",
            User.name.ilike(f"%{search}%")
        ).all()
    else:
        users = User.query.filter_by(role="trekker").all()

    return jsonify({"users": [u.to_dict() for u in users]}), 200


@adminbp.route("/blacklistuser/<int:user_id>", methods=["PATCH"])
@jwt_required()
def blacklistuser(user_id):
    claims = get_jwt()
    if claims["role"] != "admin":
        return jsonify({"message": "Unauthorized"}), 403

    user = User.query.get_or_404(user_id)

    if user.role != "trekker":
        return jsonify({"message": "User is not a trekker"}), 400

    if user.status == "blacklisted":
        return jsonify({"message": "User is already blacklisted"}), 400

    user.status = "blacklisted"
    db.session.commit()
    return jsonify({"message": "User blacklisted successfully"}), 200


@adminbp.route("/whitelistuser/<int:user_id>", methods=["PATCH"])
@jwt_required()
def whitelistuser(user_id):
    claims = get_jwt()
    if claims["role"] != "admin":
        return jsonify({"message": "Unauthorized"}), 403

    user = User.query.get_or_404(user_id)

    if user.role != "trekker":
        return jsonify({"message": "User is not a trekker"}), 400

    if user.status == "active":
        return jsonify({"message": "User is already active"}), 400

    user.status = "active"
    db.session.commit()
    return jsonify({"message": "User whitelisted successfully"}), 200
