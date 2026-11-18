import csv
import io
from datetime import date, datetime, timedelta

from flask_mail import Message

from app import db
from app.models import Booking, Trek, User


########################################################################################################
###########################         DAILY REMINDER             #########################################
########################################################################################################

def send_daily_reminders(mail, celery):
    @celery.task(name='tasks.send_daily_reminders')
    def _send_daily_reminders():
        today = date.today()
        reminder_date = today + timedelta(days=3)

        # find all bookings where trek starts in 3 days
        upcoming = (
            Booking.query
            .join(Trek, Booking.trek_id == Trek.id)
            .filter(
                Trek.start_date == reminder_date,
                Booking.status == 'Booked'
            )
            .all()
        )

        for booking in upcoming:
            user = booking.user
            trek = booking.trek

            if not user or not trek:
                continue

            msg = Message(
                subject=f"Reminder: Your trek '{trek.name}' starts in 3 days!",
                recipients=[user.email],
                html=f"""
                <h2>Hi {user.name}! </h2>
                <p>This is a reminder that your upcoming trek is just around the corner.</p>
                <table>
                  <tr><td><strong>Trek:</strong></td><td>{trek.name}</td></tr>
                  <tr><td><strong>Location:</strong></td><td>{trek.location}</td></tr>
                  <tr><td><strong>Difficulty:</strong></td><td>{trek.difficulty}</td></tr>
                  <tr><td><strong>Start Date:</strong></td><td>{trek.start_date}</td></tr>
                  <tr><td><strong>Duration:</strong></td><td>{trek.duration_days} days</td></tr>
                </table>
                <br>
                <p><strong>Instructions:</strong></p>
                <ul>
                  <li>Carry enough water and snacks</li>
                  <li>Wear appropriate trekking gear</li>
                  <li>Reach the starting point 30 minutes early</li>
                  <li>Carry a valid ID proof</li>
                </ul>
                <p>Happy Trekking!</p>
                <p>— Team Trekie</p>
                """
            )
            mail.send(msg)

        return f"Sent {len(upcoming)} reminders"

    return _send_daily_reminders


########################################################################################################
###########################         MONTHLY REPORT             #########################################
########################################################################################################

def send_monthly_report(mail, celery):
    @celery.task(name='tasks.send_monthly_report')
    def _send_monthly_report():
        today= date.today()
        # first day of current month
        first_day  = today.replace(day=1)
        # first day of next month
        if today.month == 12:
            last_day = today.replace(year=today.year+1, month=1, day=1)
        else:
            last_day = today.replace(month=today.month+1, day=1)

        # treks that started this month
        treks_this_month = Trek.query.filter(
            Trek.start_date >= first_day,
            Trek.start_date < last_day
        ).all()

        # bookings made this month
        bookings_this_month = Booking.query.filter(
            Booking.booking_date >= datetime.combine(first_day, datetime.min.time()),
            Booking.booking_date < datetime.combine(last_day, datetime.min.time()),
            Booking.status != 'Cancelled'
        ).all()

        # most popular trek
        trek_counts = {}
        for b in bookings_this_month:
            trek_counts[b.trek_id] = trek_counts.get(b.trek_id, 0) + 1

        popular_trek_name = '—'
        if trek_counts:
            popular_id = max(trek_counts, key=trek_counts.get)
            popular_trek = Trek.query.get(popular_id)
            popular_trek_name = popular_trek.name if popular_trek else '—'

        # get admin email
        admin = User.query.filter_by(role='admin').first()
        if not admin:
            return "No admin found"

        month_name = first_day.strftime('%B %Y')

        html = f"""
        <html>
        <body style="font-family:Arial,sans-serif;max-width:600px;margin:auto;padding:20px">
          <h1 style="color:#1B3A6B">Trekie - Monthly Activity Report</h1>
          <h2 style="color:#3AACB8">{month_name}</h2>
          <hr/>

          <h3>Summary</h3>
          <table style="width:100%;border-collapse:collapse">
            <tr style="background:#f0f4f8">
              <td style="padding:10px;border:1px solid #ddd"><strong>Treks Conducted</strong></td>
              <td style="padding:10px;border:1px solid #ddd">{len(treks_this_month)}</td>
            </tr>
            <tr>
              <td style="padding:10px;border:1px solid #ddd"><strong>Total Participants</strong></td>
              <td style="padding:10px;border:1px solid #ddd">{len(bookings_this_month)}</td>
            </tr>
            <tr style="background:#f0f4f8">
              <td style="padding:10px;border:1px solid #ddd"><strong>Most Popular Trek</strong></td>
              <td style="padding:10px;border:1px solid #ddd">{popular_trek_name}</td>
            </tr>
          </table>

          <h3 style="margin-top:30px">Treks This Month</h3>
          <table style="width:100%;border-collapse:collapse">
            <thead>
              <tr style="background:#1B3A6B;color:white">
                <th style="padding:8px;text-align:left">Trek Name</th>
                <th style="padding:8px;text-align:left">Location</th>
                <th style="padding:8px;text-align:left">Difficulty</th>
                <th style="padding:8px;text-align:left">Status</th>
              </tr>
            </thead>
            <tbody>
              {''.join(f"""
              <tr style="border-bottom:1px solid #ddd">
                <td style="padding:8px">{t.name}</td>
                <td style="padding:8px">{t.location}</td>
                <td style="padding:8px">{t.difficulty}</td>
                <td style="padding:8px">{t.status}</td>
              </tr>
              """ for t in treks_this_month) or '<tr><td colspan="4" style="padding:8px;color:#999">No treks this month</td></tr>'}
            </tbody>
          </table>

          <hr style="margin-top:30px"/>
          <p style="color:#999;font-size:12px">Generated automatically by Trekie on {today}</p>
        </body>
        </html>
        """

        msg = Message(
            subject=f"Trekie Monthly Report — {month_name}",
            recipients=[admin.email],
            html=html
        )
        mail.send(msg)
        return f"Monthly report sent to {admin.email}"

    return _send_monthly_report


########################################################################################################
###########################         CSV EXPORT                 #########################################
########################################################################################################

def export_user_csv(mail, celery):
    @celery.task(name='tasks.export_user_csv')
    def _export_user_csv(user_id):
        user = User.query.get(user_id)
        if not user:
            return "User not found"

        bookings = Booking.query.filter_by(user_id=user_id).all()

        # write CSV to memory
        output = io.StringIO()
        writer = csv.writer(output)
        writer.writerow(['User ID', 'Trek Name', 'Location', 'Booking Status', 'Booking Date', 'Start Date', 'Duration (days)'])

        for b in bookings:
            trek = b.trek
            writer.writerow([
                user_id,
                trek.name        if trek else '—',
                trek.location    if trek else '—',
                b.status,
                b.booking_date.strftime('%Y-%m-%d') if b.booking_date else '—',
                trek.start_date  if trek else '—',
                trek.duration_days if trek else '—',
            ])

        csv_data = output.getvalue()
        output.close()

        msg = Message(
            subject="Trekie — Your Booking History Export",
            recipients=[user.email],
            html=f"""
            <h2>Hi {user.name}!</h2>
            <p>Your booking history export is ready.</p>
            """
        )
        msg.attach(
            filename=f"trekie_history_{user_id}.csv",
            content_type="text/csv",
            data=csv_data.encode("utf-8")
        )

        mail.send(msg)
        return f"CSV exported and sent to {user.email}"

    return _export_user_csv
