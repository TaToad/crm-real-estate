from django.db.models.signals import post_save, post_delete
from django.dispatch import receiver

from apps.companies.models import Company
from apps.contacts.models import Contact
from apps.deals.models import Deal
from apps.leads.models import Lead
from apps.tasks.models import Task

from .middleware import get_current_user
from .models import Activity


def _log(object_type, object_id, action, comment='', meta=None):
    Activity.objects.create(
        object_type=object_type,
        object_id=object_id,
        action=action,
        user=get_current_user(),
        comment=comment,
        meta=meta or {},
    )


# === Company ===
@receiver(post_save, sender=Company)
def company_saved(sender, instance, created, **kwargs):
    _log(
        'Company', instance.id,
        'created' if created else 'updated',
        comment=instance.name,
    )


@receiver(post_delete, sender=Company)
def company_deleted(sender, instance, **kwargs):
    _log('Company', instance.id, 'deleted', comment=instance.name)


# === Contact ===
@receiver(post_save, sender=Contact)
def contact_saved(sender, instance, created, **kwargs):
    _log(
        'Contact', instance.id,
        'created' if created else 'updated',
        comment=instance.full_name,
    )


@receiver(post_delete, sender=Contact)
def contact_deleted(sender, instance, **kwargs):
    _log('Contact', instance.id, 'deleted', comment=instance.full_name)


# === Deal ===
@receiver(post_save, sender=Deal)
def deal_saved(sender, instance, created, **kwargs):
    _log(
        'Deal', instance.id,
        'created' if created else 'updated',
        comment=f"{instance.title} — {instance.amount} {instance.currency}",
        meta={'stage': instance.stage},
    )


@receiver(post_delete, sender=Deal)
def deal_deleted(sender, instance, **kwargs):
    _log('Deal', instance.id, 'deleted', comment=instance.title)


# === Lead ===
@receiver(post_save, sender=Lead)
def lead_saved(sender, instance, created, **kwargs):
    _log(
        'Lead', instance.id,
        'created' if created else 'updated',
        comment=f"{instance.title} [{instance.status}]",
    )


@receiver(post_delete, sender=Lead)
def lead_deleted(sender, instance, **kwargs):
    _log('Lead', instance.id, 'deleted', comment=instance.title)


# === Task ===
@receiver(post_save, sender=Task)
def task_saved(sender, instance, created, **kwargs):
    _log(
        'Task', instance.id,
        'created' if created else 'updated',
        comment=f"{instance.title} [{instance.status}]",
    )


@receiver(post_delete, sender=Task)
def task_deleted(sender, instance, **kwargs):
    _log('Task', instance.id, 'deleted', comment=instance.title)