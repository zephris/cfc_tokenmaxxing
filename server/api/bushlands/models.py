from django.db import models


class BushlandArea(models.Model):
    source_object_id = models.PositiveIntegerField(unique=True)
    site_number = models.PositiveIntegerField(db_index=True)
    name = models.CharField(max_length=255)
    modifier = models.CharField(max_length=255, blank=True)
    description = models.TextField(blank=True)
    geometry = models.JSONField()
    bbox_west = models.FloatField(db_index=True)
    bbox_south = models.FloatField(db_index=True)
    bbox_east = models.FloatField(db_index=True)
    bbox_north = models.FloatField(db_index=True)
    source_url = models.URLField(max_length=500)
    source_updated_at = models.DateTimeField(auto_now=True)

    class Meta:
        db_table = "bushland"
        ordering = ["site_number", "source_object_id"]

    def __str__(self):
        return f"{self.site_number} - {self.name}"
