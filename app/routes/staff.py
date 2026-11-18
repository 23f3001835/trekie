from flask import Blueprint, request, jsonify
from flask_jwt_extended import get_jwt_identity, jwt_required, get_jwt
from app import db
from app.models import User, Booking, Trek, Staff

staffbp = Blueprint("staff", __name__)



########################################################################################################
###########################         STAFF DASHBOARD            #########################################
########################################################################################################


@staffbp.route("/dashboard", methods=["GET"])
@jwt_required()
def dashboard():
    claims = get_jwt()
    if claims["role"] != "staff":
        return jsonify({"message": "Unauthorized"}), 403
    staff_user_id = int(get_jwt_identity())

    assigned_treks = Trek.query.filter_by(
        assigned_staff_id=staff_user_id
    ).all()

    ongoing_treks = Trek.query.filter_by(
        assigned_staff_id=staff_user_id,
        status="Open"
    ).count()

    return jsonify({
        "assigned_treks": len(assigned_treks),
        "ongoing_treks": ongoing_treks,
        "treks": [trek.to_dict() for trek in assigned_treks]
    }), 200


########################################################################################################
###########################         STAFF TREKS            #############################################
########################################################################################################


@staffbp.route("/mytreks", methods=["GET"])
@jwt_required()
def mytreks():
    claims = get_jwt()
    if claims["role"] != "staff":
        return jsonify({"message": "Unauthorized"}), 403
    staff_user_id = int(get_jwt_identity())

    treks = Trek.query.filter_by(
        assigned_staff_id=staff_user_id,
        status="Open"
    ).all()

    return jsonify({"treks": [trek.to_dict() for trek in treks]}), 200


@staffbp.route("/mytreks/<int:trek_id>", methods=["GET"])
@jwt_required()
def get_trek(trek_id):
    claims = get_jwt()
    if claims["role"] != "staff":
        return jsonify({"message": "Unauthorized"}), 403
    staff_user_id = int(get_jwt_identity())

    trek = Trek.query.get_or_404(trek_id)

    if trek.assigned_staff_id != staff_user_id:
        return jsonify({"message": "Unauthorized — this trek is not assigned to you"}), 403

    if trek.status == "Completed":
        return jsonify({"message": "This trek is already completed"}), 403

    participants = (
        Booking.query
        .filter_by(trek_id=trek_id, status="Booked")
        .join(User, Booking.user_id == User.id)
        .all()
    )

    participants_list = [
        {
            "name": booking.user.name,
            "email": booking.user.email,
            "phone": booking.user.phone,
            "booking_date": booking.booking_date.isoformat(),
        }
        for booking in participants
    ]

    return jsonify({
        "trek": trek.to_dict(),
        "participants": participants_list
    }), 200


########################################################################################################
###########################         STAFF UPDATE TREK STATUS    ########################################
########################################################################################################


@staffbp.route("/mytreks/<int:trek_id>/updatestatus", methods=["PATCH"])
@jwt_required()
def updatestatus(trek_id):
    claims = get_jwt()
    if claims["role"] != "staff":
        return jsonify({"message": "Unauthorized"}), 403
    staff_user_id = int(get_jwt_identity())

    trek = Trek.query.get_or_404(trek_id)

    if trek.assigned_staff_id != staff_user_id:
        return jsonify({"message": "Unauthorized — this trek is not assigned to you"}), 403

    if trek.status == "Completed":
        return jsonify({"message": "Cannot update a Completed trek"}), 400

    if trek.status == "Closed":
        return jsonify({"message": "Cannot reopen a Closed trek"}), 400

    data = request.get_json()
    new_status = data.get("status")

    if new_status not in ["Open", "Closed"]:
        return jsonify({"message": "Invalid status — only Open or Closed allowed"}), 400

    trek.status = new_status
    db.session.commit()

    return jsonify({"message": f"Trek status updated to {new_status}"}), 200


########################################################################################################
###########################         STAFF COMPLETE TREK        #########################################
########################################################################################################


@staffbp.route("/mytreks/<int:trek_id>/complete", methods=["PATCH"])
@jwt_required()
def completetrek(trek_id):
    claims = get_jwt()
    if claims["role"] != "staff":
        return jsonify({"message": "Unauthorized"}), 403
    staff_user_id = int(get_jwt_identity())

    trek = Trek.query.get_or_404(trek_id)

    if trek.assigned_staff_id != staff_user_id:
        return jsonify({"message": "Unauthorized — this trek is not assigned to you"}), 403

    if trek.status == "Completed":
        return jsonify({"message": "Trek is already Completed"}), 400

    trek.status = "Completed"

    active_bookings = Booking.query.filter_by(
        trek_id=trek_id,
        status="Booked"
    ).all()

    for booking in active_bookings:
        booking.status = "Completed"

    db.session.commit()

    return jsonify({
        "message": "Trek marked as Completed",
        "bookings_completed": len(active_bookings)
    }), 200


########################################################################################################
###########################         STAFF PROFILE VIEWER       #########################################
########################################################################################################

@staffbp.route("/profile", methods=["GET"])
@jwt_required()
def profile():
    claims = get_jwt()
    if claims["role"] != "staff":
        return jsonify({"message": "Unauthorized"}), 403

    user = User.query.get_or_404(int(get_jwt_identity()))

    staff = Staff.query.filter_by(user_id=user.id).first()

    return jsonify({
        "name": user.name,
        "email": user.email,
        "phone": user.phone,
        "specialization": staff.specialization if staff else None,
        "experience": staff.experience if staff else None,
        "is_available": staff.is_available if staff else True
    }), 200
