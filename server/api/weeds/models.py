from django.conf import settings
from django.db import models
from django.db.models import Q


class WeedSighting(models.Model):
    class Abundance(models.TextChoices):
        SINGLE = "single", "Single plant"
        PATCH = "patch", "Small patch"
        WIDESPREAD = "widespread", "Widespread"

    image_reference = models.CharField(max_length=500, blank=True)
    model_id = models.CharField(max_length=100)
    model_top_id = models.CharField(max_length=100, blank=True)
    candidates = models.JSONField(default=list)
    top_scientific_name = models.CharField(max_length=255, blank=True)
    top_common_name = models.CharField(max_length=255, blank=True)
    top_confidence = models.FloatField(null=True, blank=True)
    weedscan_profile = models.JSONField(default=dict, blank=True)
    wikipedia_url = models.URLField(max_length=500, blank=True)
    confirmed_species = models.CharField(max_length=255, blank=True)
    bushland_area = models.ForeignKey(
        "bushlands.BushlandArea",
        null=True,
        blank=True,
        on_delete=models.SET_NULL,
        related_name="weed_sightings",
    )
    reported_by = models.ForeignKey(
        settings.AUTH_USER_MODEL,
        null=True,
        blank=True,
        on_delete=models.SET_NULL,
        related_name="weed_sightings",
    )
    observed_on = models.DateField(null=True, blank=True)
    abundance = models.CharField(max_length=20, choices=Abundance.choices, blank=True)
    latitude = models.FloatField(null=True, blank=True)
    longitude = models.FloatField(null=True, blank=True)
    notes = models.TextField(max_length=500, blank=True)
    identified_at = models.DateTimeField(auto_now_add=True)
    updated_at = models.DateTimeField(auto_now=True)

    class Meta:
        db_table = "weed_sighting"
        ordering = ["-identified_at"]
        indexes = [
            models.Index(fields=["bushland_area", "-identified_at"]),
            models.Index(fields=["reported_by", "-identified_at"]),
            models.Index(fields=["confirmed_species"]),
        ]
        constraints = [
            models.CheckConstraint(
                condition=Q(top_confidence__isnull=True)
                | (Q(top_confidence__gte=0) & Q(top_confidence__lte=1)),
                name="weed_sighting_confidence_in_range",
            ),
            models.CheckConstraint(
                condition=Q(latitude__isnull=True) | (Q(latitude__gte=-90) & Q(latitude__lte=90)),
                name="weed_sighting_latitude_in_range",
            ),
            models.CheckConstraint(
                condition=Q(longitude__isnull=True) | (Q(longitude__gte=-180) & Q(longitude__lte=180)),
                name="weed_sighting_longitude_in_range",
            ),
        ]

    def __str__(self):
        return self.confirmed_species or self.top_scientific_name or f"Sighting {self.pk}"
