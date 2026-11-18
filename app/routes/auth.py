from flask import Blueprint, jsonify, request
from flask_jwt_extended import create_access_token
from werkzeug.security import check_password_hash, generate_password_hash

from app import db
from app.models import User

authbp = Blueprint("auth", __name__)


@authbp.route("/signup", methods=["POST"])
def signup():
    data = request.get_json()

    name = data.get("name")
    email = data.get("email")
    password = data.get("password")
    phone = data.get("phone")

    # checking all fields exis
    if not name or not email or not password or not phone:
        return jsonify({"message": "All fields are required"}), 400

    # validating phone
    if not phone.isdigit():
        return jsonify({"message": "Phone number must contain only digits"}), 400
    if len(phone) != 10:
        return jsonify({"message": "Phone number must be 10 digits"}), 400

    # validating email
    if User.query.filter_by(email=email).first():
        return jsonify({"message": "Email already exists"}), 400

    # create user
    hashed_password = generate_password_hash(password)
    new_user = User(
        name=name,
        email=email,
        password_hash=hashed_password,
        phone=phone,
        role="trekker",
        status="active",
    )
    db.session.add(new_user)
    db.session.commit()

    access_token = create_access_token(
        identity=str(new_user.id),
        additional_claims={
            "role": new_user.role
        }
    )

    return jsonify(
        {
            "message": "User created successfully",
            "access_token": access_token,
            "role": "trekker",
        }
    ), 201


@authbp.route("/login", methods=["POST"])
def login():
    data = request.get_json()

    email = data.get("email")
    password = data.get("password")

    # check all fields exist
    if not email or not password:
        return jsonify({"message": "All fields are required"}), 400

    # find user
    user = User.query.filter_by(email=email).first()
    if not user:
        return jsonify({"message": "Invalid email or password"}), 401

    # check blacklist
    if user.status == "blacklisted":
        return jsonify({"message": "Your account has been blacklisted"}), 403

    # check password
    if not check_password_hash(user.password_hash, password):
        return jsonify({"message": "Invalid email or password"}), 401

    # create token
    access_token = create_access_token(
        identity=str(user.id),
        additional_claims={
            "role": user.role
        }
    )
    return jsonify(
        {
            "message": "Login successful",
            "access_token": access_token,
            "role": user.role,
            "id": user.id,
            "name": user.name,
        }
    ), 200
