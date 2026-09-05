from django.db import models


class Event(models.Model):
    source_id = models.PositiveIntegerField(unique=True)
    title = models.CharField(max_length=255)
    starts_at = models.DateTimeField(db_index=True)
    ends_at = models.DateTimeField(db_index=True)
    venue = models.CharField(max_length=255, blank=True)
    address = models.CharField(max_length=500, blank=True)
    summary = models.TextField(blank=True)
    cost = models.CharField(max_length=100, blank=True)
    latitude = models.FloatField(null=True, blank=True)
    longitude = models.FloatField(null=True, blank=True)
    source_url = models.URLField(max_length=500)
    source_updated_at = models.DateTimeField(auto_now=True)

    class Meta:
        db_table = "event"
        ordering = ["starts_at", "source_id"]

    def __str__(self):
        return self.title
