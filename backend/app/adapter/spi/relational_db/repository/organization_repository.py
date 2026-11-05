from app.adapter.spi.relational_db.organization import Organization
from app.ports.spi.db.base_port import BasePort


class OrganizationRepository(BasePort[Organization]):
    def get_by_id(self, obj_id: int) -> Organization | None:
        try:
            return Organization.objects.get(id=obj_id)
        except Organization.DoesNotExist:
            return None

    def get_all(self) -> list[Organization]:
        return list(Organization.objects.all())

    def create_obj(self, obj: Organization) -> Organization:
        obj.pk = None
        obj.save(force_insert=True)
        return obj

    def update_obj(self, obj: Organization) -> Organization:
        obj.save()
        return obj

    def delete_by_id(self, obj_id: int) -> bool:
        deleted_count, _ = Organization.objects.filter(id=obj_id).delete()
        return deleted_count > 0
