from typing import Protocol, TypeVar

T = TypeVar("T")


class BasePort(Protocol[T]):
    def get_by_id(self, obj_id: int) -> T | None:
        pass

    def get_all(self) -> list[T]:
        pass

    def create_obj(self, obj: T) -> T:
        pass

    def update_obj(self, obj: T) -> T:
        pass

    def delete_by_id(self, obj_id: int) -> bool:
        pass
