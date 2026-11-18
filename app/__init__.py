from os import path

from flask import Flask
from flask_jwt_extended import JWTManager
from flask_sqlalchemy import SQLAlchemy
from werkzeug.security import generate_password_hash
from flask import render_template
from datetime import timedelta
from flask_mail import Mail
from flask_caching import Cache

db = SQLAlchemy()
jwt = JWTManager()
mail  = Mail()
cache = Cache()

def create_app():
    app = Flask(__name__)

    app.config["SECRET_KEY"] = "secretkey"
    app.config["JWT_SECRET_KEY"] = "jwtsecretkey"
    app.config["SQLALCHEMY_DATABASE_URI"] = "sqlite:///database.db"
    app.config["JWT_ACCESS_TOKEN_EXPIRES"] = timedelta(hours=12)
    app.config['MAIL_SERVER']   = 'smtp.gmail.com'
    app.config['MAIL_PORT']     = 587
    app.config['MAIL_USE_TLS']  = True
    app.config['MAIL_USERNAME'] = 'aashishkcodes@gmail.com'
    app.config['MAIL_PASSWORD'] = 'geqcgqunsodjbszm'
    app.config['MAIL_DEFAULT_SENDER'] = 'aashishkcodes@gmail.com'
    app.config['CACHE_TYPE']      = 'redis'
    app.config['CACHE_REDIS_URL'] = 'redis://localhost:6379/0'
    app.config["broker_url"] = "redis://localhost:6379/0"
    app.config["result_backend"] = "redis://localhost:6379/0"


    db.init_app(app)
    jwt.init_app(app)
    mail.init_app(app)
    cache.init_app(app)

    from .models import Booking, Staff, Trek, User

    with app.app_context():
        db.create_all()
        if not User.query.filter_by(role="admin").first():
            adminpassword = generate_password_hash("admin123")
            admin = User(
                name="admin",
                email="aashishkcodes@gmail.com",
                password_hash=adminpassword,
                phone="999999999",
                role="admin",
                status="active",
            )
            db.session.add(admin)
            db.session.commit()

    from .routes.admin import adminbp
    from .routes.auth import authbp
    from .routes.staff import staffbp
    from .routes.user import userbp
    from .routes.views import viewsbp

    app.register_blueprint(adminbp, url_prefix="/api/admin")
    app.register_blueprint(userbp, url_prefix="/api/user")
    app.register_blueprint(authbp, url_prefix="/api/auth")
    app.register_blueprint(staffbp, url_prefix="/api/staff")
    app.register_blueprint(viewsbp)

    @app.route('/')
    def index():
        return render_template('index.html')

    return app
