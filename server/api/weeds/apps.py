from django.apps import AppConfig


class WeedsConfig(AppConfig):
    default_auto_field = "django.db.models.BigAutoField"
    name = "api.weeds"

    def ready(self):
        from .models import WeedSighting

        if not hasattr(WeedSighting, "ticket_id"):
            WeedSighting.ticket_id = property(
                lambda sighting: (
                    f"TKT-{sighting.identified_at.strftime('%Y%m%d')}-{sighting.pk:04d}"
                    if sighting.pk and sighting.identified_at
                    else ""
                )
            )
