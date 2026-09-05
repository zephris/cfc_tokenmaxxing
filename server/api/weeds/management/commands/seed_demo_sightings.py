from datetime import datetime
from zoneinfo import ZoneInfo

from django.core.management.base import BaseCommand
from django.db import transaction

from api.bushlands.models import BushlandArea
from api.weeds.models import WeedSighting

PERTH_TIMEZONE = ZoneInfo("Australia/Perth")
PLACEHOLDER_SIGHTINGS = (
    ("2026-05-08", "Bridal creeper", "Asparagus asparagoides"),
    ("2026-06-19", "Blackberry", "Rubus fruticosus"),
    ("2026-07-11", "Boneseed", "Chrysanthemoides monilifera"),
    ("2026-08-03", "Watsonia", "Watsonia meriana"),
    ("2026-08-30", "Arum lily", "Zantedeschia aethiopica"),
)
DEMO_NOTE_PREFIX = "Demo placeholder sighting"


class Command(BaseCommand):
    help = "Create five dated placeholder weed sightings for every bushland area."

    def handle(self, *args, **options):
        bushlands = list(BushlandArea.objects.all())
        created = 0
        updated = 0

        with transaction.atomic():
            for bushland in bushlands:
                expected_notes = {
                    f"{DEMO_NOTE_PREFIX} {index}/5"
                    for index in range(1, len(PLACEHOLDER_SIGHTINGS) + 1)
                }
                WeedSighting.objects.filter(
                    bushland_area=bushland,
                    notes__startswith=DEMO_NOTE_PREFIX,
                ).exclude(notes__in=expected_notes).delete()

                for index, (date_value, common_name, scientific_name) in enumerate(
                    PLACEHOLDER_SIGHTINGS, start=1
                ):
                    note = f"{DEMO_NOTE_PREFIX} {index}/5"
                    observed_on = datetime.strptime(date_value, "%Y-%m-%d").date()
                    identified_at = datetime(
                        observed_on.year,
                        observed_on.month,
                        observed_on.day,
                        10 + index,
                        15,
                        tzinfo=PERTH_TIMEZONE,
                    )
                    _, was_created = WeedSighting.objects.update_or_create(
                        bushland_area=bushland,
                        notes=note,
                        defaults={
                            "model_id": "demo-placeholder",
                            "model_top_id": f"demo-{index}",
                            "top_scientific_name": scientific_name,
                            "top_common_name": common_name,
                            "top_confidence": 0.75,
                            "confirmed_species": common_name,
                            "observed_on": observed_on,
                            "abundance": WeedSighting.Abundance.PATCH,
                            "identified_at": identified_at,
                        },
                    )
                    if was_created:
                        created += 1
                    else:
                        updated += 1

        self.stdout.write(
            self.style.SUCCESS(
                f"Seeded {created + updated} placeholder sightings across "
                f"{len(bushlands)} bushland areas ({created} created, {updated} updated)."
            )
        )
