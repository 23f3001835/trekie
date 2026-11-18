from flask import Blueprint, render_template

viewsbp = Blueprint("views", __name__)

@viewsbp.route("/")
def index():
    return render_template("index.html")
