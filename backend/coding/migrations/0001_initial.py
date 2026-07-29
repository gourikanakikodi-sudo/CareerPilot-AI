from django.conf import settings
from django.db import migrations, models
import django.db.models.deletion


class Migration(migrations.Migration):

    initial = True

    dependencies = [
        migrations.swappable_dependency(settings.AUTH_USER_MODEL),
    ]

    operations = [
        migrations.CreateModel(
            name='CodingProblem',
            fields=[
                ('id', models.BigAutoField(auto_created=True, primary_key=True, serialize=False, verbose_name='ID')),
                ('title', models.CharField(max_length=180)),
                ('slug', models.SlugField(unique=True)),
                ('company', models.CharField(blank=True, default='', max_length=120)),
                ('difficulty', models.CharField(choices=[('easy', 'Easy'), ('medium', 'Medium'), ('hard', 'Hard')], default='easy', max_length=20)),
                ('prompt', models.TextField()),
                ('starter_code', models.JSONField(blank=True, default=dict)),
                ('visible_tests', models.JSONField(blank=True, default=list)),
                ('hidden_tests', models.JSONField(blank=True, default=list)),
                ('solution', models.TextField(blank=True, default='')),
                ('tags', models.JSONField(blank=True, default=list)),
                ('created_at', models.DateTimeField(auto_now_add=True)),
            ],
        ),
        migrations.CreateModel(
            name='CodingSubmission',
            fields=[
                ('id', models.BigAutoField(auto_created=True, primary_key=True, serialize=False, verbose_name='ID')),
                ('language', models.CharField(max_length=40)),
                ('code', models.TextField()),
                ('status', models.CharField(choices=[('accepted', 'Accepted'), ('wrong_answer', 'Wrong Answer'), ('runtime_error', 'Runtime Error'), ('unsupported', 'Unsupported')], max_length=40)),
                ('passed_tests', models.PositiveIntegerField(default=0)),
                ('total_tests', models.PositiveIntegerField(default=0)),
                ('execution_ms', models.PositiveIntegerField(default=0)),
                ('memory_kb', models.PositiveIntegerField(default=0)),
                ('feedback', models.JSONField(blank=True, default=dict)),
                ('bookmarked', models.BooleanField(default=False)),
                ('created_at', models.DateTimeField(auto_now_add=True)),
                ('problem', models.ForeignKey(on_delete=django.db.models.deletion.CASCADE, related_name='submissions', to='coding.codingproblem')),
                ('user', models.ForeignKey(on_delete=django.db.models.deletion.CASCADE, related_name='coding_submissions', to=settings.AUTH_USER_MODEL)),
            ],
        ),
    ]
