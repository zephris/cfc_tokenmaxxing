from django.contrib import admin

from .models import Event


@admin.register(Event)
class EventAdmin(admin.ModelAdmin):
    list_display = ("title", "starts_at", "venue", "source_updated_at")
    search_fields = ("title", "venue", "address")
