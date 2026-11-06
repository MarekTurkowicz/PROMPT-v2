from typing import Protocol


class BaseMapper[Model, Entity](Protocol):
    @staticmethod
    def to_model(entity: Entity) -> Model:
        pass

    @staticmethod
    def to_entity(model: Model) -> Entity:
        pass
