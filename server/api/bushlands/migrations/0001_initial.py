from django.db import migrations, models


class Migration(migrations.Migration):
    initial = True

    dependencies = []

    operations = [
        migrations.CreateModel(
            name="BushlandArea",
            fields=[
                ("id", models.BigAutoField(auto_created=True, primary_key=True, serialize=False, verbose_name="ID")),
                ("source_object_id", models.PositiveIntegerField(unique=True)),
                ("site_number", models.PositiveIntegerField(db_index=True)),
                ("name", models.CharField(max_length=255)),
                ("modifier", models.CharField(blank=True, max_length=255)),
                ("description", models.TextField(blank=True)),
                ("geometry", models.JSONField()),
                ("bbox_west", models.FloatField(db_index=True)),
                ("bbox_south", models.FloatField(db_index=True)),
                ("bbox_east", models.FloatField(db_index=True)),
                ("bbox_north", models.FloatField(db_index=True)),
                ("source_url", models.URLField(max_length=500)),
                ("source_updated_at", models.DateTimeField(auto_now=True)),
            ],
            options={"db_table": "bushland", "ordering": ["site_number", "source_object_id"]},
        ),
    ]
