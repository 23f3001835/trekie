from flask import Blueprint, request, jsonify, render_template
from flask_jwt_extended import get_jwt_identity, jwt_required, get_jwt
from app import db
from app.models import User, Booking, Trek
from app import cache


userbp = Blueprint("user", __name__)


########################################################################################################
###########################         SERVE INDEX            #############################################
########################################################################################################


@userbp.route("/")
def index():
    return render_template("index.html")


########################################################################################################
###########################         USER PROFILE            ############################################
########################################################################################################


@userbp.route("/profile", methods=["GET"])
@jwt_required()
def get_profile():
    claims = get_jwt()
    if claims["role"] != "trekker":
        return jsonify({"message": "Unauthorized"}), 403

    user = User.query.get_or_404(int(get_jwt_identity()))
    return jsonify({
        "name": user.name,
        "email": user.email,
        "phone": user.phone
    }), 200


@userbp.route("/profile", methods=["PUT"])
@jwt_required()
def edit_profile():
    claims = get_jwt()
    if claims["role"] != "trekker":
        return jsonify({"message": "Unauthorized"}), 403

    user = User.query.get_or_404(int(get_jwt_identity()))
    data = request.get_json()

    if not data.get("name") or not data.get("phone"):
        return jsonify({"message": "Name and phone are required"}), 400

    if not data["phone"].isdigit() or len(data["phone"]) != 10:
        return jsonify({"message": "Phone must be 10 digits"}), 400

    user.name = data["name"]
    user.phone = data["phone"]
    db.session.commit()

    return jsonify({"message": "Profile updated successfully"}), 200


########################################################################################################
###########################         BROWSE TREKS            ############################################
########################################################################################################


@userbp.route("/treks", methods=["GET"])
@cache.cached(timeout=300, query_string=True)
def get_treks():
    search = request.args.get("search", "")
    difficulty = request.args.get("difficulty", "")
    sort = request.args.get("sort", "")

    query = Trek.query.filter_by(status="Open")

    if search:
        query = query.filter(Trek.name.ilike(f"%{search}%"))

    if difficulty:
        query = query.filter_by(difficulty=difficulty)

    if sort == "asc":
        query = query.order_by(Trek.duration_days.asc())
    elif sort == "desc":
        query = query.order_by(Trek.duration_days.desc())

    treks = query.all()
    return jsonify({"treks": [trek.to_dict() for trek in treks]}), 200


@userbp.route("/treks/<int:trek_id>", methods=["GET"])
def get_trek(trek_id):
    trek = Trek.query.get_or_404(trek_id)
    return jsonify({"trek": trek.to_dict()}), 200


########################################################################################################
###########################         BOOKING            #################################################
########################################################################################################


@userbp.route("/book/<int:trek_id>", methods=["POST"])
@jwt_required()
def book(trek_id):
    claims = get_jwt()
    if claims["role"] != "trekker":
        return jsonify({"message": "Unauthorized"}), 403

    user_id = int(get_jwt_identity())

    user = User.query.get_or_404(user_id)
    if user.status == "blacklisted":
        return jsonify({"message": "Your account is blacklisted"}), 403

    trek = Trek.query.get_or_404(trek_id)

    if trek.status != "Open":
        return jsonify({"message": "This trek is not open for booking"}), 400

    if trek.available_slots < 1:
        return jsonify({"message": "No slots available for this trek"}), 400

    existing_booking = Booking.query.filter_by(
        user_id=user_id,
        trek_id=trek_id,
        status="Booked"
    ).first()

    if existing_booking:
        return jsonify({"message": "You have already booked this trek"}), 400

    new_booking = Booking(
        user_id=user_id,
        trek_id=trek_id,
        status="Booked"
    )

    trek.available_slots -= 1
    db.session.add(new_booking)
    db.session.commit()
    cache.clear()

    return jsonify({"message": "Trek booked successfully"}), 201


@userbp.route("/cancelbooking/<int:booking_id>", methods=["PATCH"])
@jwt_required()
def cancelbooking(booking_id):
    claims = get_jwt()
    if claims["role"] != "trekker":
        return jsonify({"message": "Unauthorized"}), 403

    user_id = int(get_jwt_identity())
    booking = Booking.query.get_or_404(booking_id)

    if booking.user_id != user_id:
        return jsonify({"message": "Unauthorized — this is not your booking"}), 403

    if booking.status != "Booked":
        return jsonify({"message": "Only active bookings can be cancelled"}), 400

    if booking.trek.status != "Open":
        return jsonify({"message": "Cannot cancel booking for a Closed trek"}), 400

    booking.status = "Cancelled"
    booking.trek.available_slots += 1
    db.session.commit()
    cache.clear()

    return jsonify({"message": "Booking cancelled successfully"}), 200


########################################################################################################
###########################         BOOKING HISTORY            #########################################
########################################################################################################


@userbp.route("/mybookings", methods=["GET"])
@jwt_required()
def mybookings():
    claims = get_jwt()
    if claims["role"] != "trekker":
        return jsonify({"message": "Unauthorized"}), 403

    user_id = int(get_jwt_identity())

    bookings = Booking.query.filter_by(user_id=user_id)\
        .order_by(Booking.booking_date.desc()).all()

    return jsonify({"bookings": [b.to_dict() for b in bookings]}), 200


@userbp.route("/history", methods=["GET"])
@jwt_required()
def history():
    claims = get_jwt()
    if claims["role"] != "trekker":
        return jsonify({"message": "Unauthorized"}), 403

    user_id = int(get_jwt_identity())

    bookings = Booking.query.filter_by(user_id=user_id)\
        .order_by(Booking.booking_date.desc()).all()

    return jsonify({"history": [b.to_dict() for b in bookings]}), 200


########################################################################################################
###########################         CSV EXPORT STUB            #########################################
########################################################################################################


@userbp.route("/exportcsv", methods=["POST"])
@jwt_required()
def exportcsv():
    claims = get_jwt()
    if claims["role"] != "trekker":
        return jsonify({"message": "Unauthorized"}), 403

    from celery_worker import csv_export_task
    csv_export_task.delay(int(get_jwt_identity()))

    return jsonify({
        "message": "Export started. You will receive an email shortly."
    }), 200
