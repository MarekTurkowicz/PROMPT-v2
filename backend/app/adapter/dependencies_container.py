from typing import Any, Dict


class DependenciesContainer:
    _dependencies: Dict[str, Any]

    def __init__(self) -> None:
        self.build()

    def build(self) -> None:
        pass


# def build_production_dependencies_container() -> Dict[str, Any]: pass
