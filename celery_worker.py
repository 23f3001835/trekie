from app import create_app, mail
from celery import Celery
from celery.schedules import crontab
from app.tasks import send_daily_reminders, send_monthly_report, export_user_csv

flask_app = create_app()

celery = Celery(
    flask_app.import_name,
    broker=flask_app.config["broker_url"],
    backend=flask_app.config["result_backend"]
)

celery.conf.update(flask_app.config)

class ContextTask(celery.Task):
    def __call__(self, *args, **kwargs):
        with flask_app.app_context():
            return self.run(*args, **kwargs)

celery.Task = ContextTask

# Register tasks
daily_reminder_task  = send_daily_reminders(mail, celery)
monthly_report_task  = send_monthly_report(mail, celery)
csv_export_task      = export_user_csv(mail, celery)

# Beat schedule
celery.conf.beat_schedule = {
    'daily-reminder': {
        'task': 'tasks.send_daily_reminders',
        'schedule': crontab(hour=8, minute=0),  # runs every day at 8am
    },
    'monthly-report': {
        'task': 'tasks.send_monthly_report',
        'schedule': crontab(hour=7, minute=0, day_of_month=1),  # runs 1st of every month
    },
}

celery.conf.timezone = 'Asia/Kolkata'

# python -c "from celery_worker import daily_reminder_task; daily_reminder_task.delay()"
# python -c "from celery_worker import monthly_report_task; monthly_report_task.delay()"
