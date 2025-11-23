from flask import Blueprint, request, jsonify, session, render_template
from backend.db import connessione
from backend.decorators import login_required, role_required

admin_aziendale_bp = Blueprint('admin_aziendale', __name__)

# DASHBOARDS
@admin_aziendale_bp.route("/dashboard_adminaziendale", methods=["GET"])
@login_required
@role_required("AA")
def dashboard_adminaziendale():
    return render_template("dashboard_adminaziendale.html")

# rotta per la dashboard del capocantiere
@admin_aziendale_bp.route("/dashboard_capocantiere", methods=["GET"])
@login_required
@role_required("CC")
def dashboard_capocantiere():
    return render_template("dashboard_capocantiere.html")

# rotta per la dashboard dell'operaio
@admin_aziendale_bp.route("/dashboard_operaio", methods=["GET"])
@login_required
@role_required("OP")
def dashboard_operaio():
    return render_template("dashboard_operaio.html")