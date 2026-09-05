from django.db import migrations, models


EVENT_IMAGE_PATHS = {
    20567: "/Images/events/SeedGenEvent.jpg",
    20583: "/Images/events/6.-Grass-Trees-in-Full-Bloom-768x500.jpg",
}


def populate_event_images(apps, _schema_editor):
    event_model = apps.get_model("events", "Event")
    for source_id, image_path in EVENT_IMAGE_PATHS.items():
        event_model.objects.filter(source_id=source_id).update(image_path=image_path)


class Migration(migrations.Migration):
    dependencies = [
        ("events", "0001_initial"),
    ]

    operations = [
        migrations.AddField(
            model_name="event",
            name="image_path",
            field=models.CharField(blank=True, max_length=255),
        ),
        migrations.RunPython(populate_event_images, migrations.RunPython.noop),
    ]
