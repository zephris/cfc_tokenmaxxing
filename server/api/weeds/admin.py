from django.contrib import admin

from .models import WeedSighting


@admin.register(WeedSighting)
class WeedSightingAdmin(admin.ModelAdmin):
    list_display = (
        "id",
        "top_scientific_name",
        "confirmed_species",
        "top_confidence",
        "bushland_area",
        "identified_at",
    )
    list_filter = ("abundance", "confirmed_species")
    search_fields = ("top_scientific_name", "top_common_name", "confirmed_species")
    readonly_fields = ("identified_at", "updated_at")
