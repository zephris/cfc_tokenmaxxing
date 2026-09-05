from django.contrib import admin

from .models import BushlandArea


@admin.register(BushlandArea)
class BushlandAreaAdmin(admin.ModelAdmin):
    list_display = ("site_number", "name", "source_object_id", "source_updated_at")
    search_fields = ("name", "site_number")
