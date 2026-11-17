from collections.abc import Iterable, Sequence
from dataclasses import dataclass
from enum import StrEnum


def quote_literal(value: str) -> str:
    return "'" + value.replace("'", "''") + "'"


@dataclass(frozen=True, slots=True)
class EnumType:
    name: str
    values: tuple[str, ...]

    @classmethod
    def from_enum(cls, name: str, enum: type[StrEnum]) -> EnumType:
        """Values come from the domain enum, so the list is not typed twice."""
        return cls(name=name, values=tuple(member.value for member in enum))

    def create_sql(self) -> str:
        values = ", ".join(quote_literal(value) for value in self.values)
        return f"CREATE TYPE {self.name} AS ENUM ({values});"


@dataclass(frozen=True, slots=True)
class Domain:
    name: str
    base: str
    check: str
    depends_on: tuple[str, ...] = ()

    def create_sql(self) -> str:
        return f"CREATE DOMAIN {self.name} AS {self.base} CHECK ({self.check});"


@dataclass(frozen=True, slots=True)
class Table:
    name: str
    sql: str
    depends_on: tuple[str, ...] = ()

    def create_sql(self) -> str:
        return self.sql.strip().rstrip(";") + ";"


SchemaObject = EnumType | Domain | Table


def render(objects: Iterable[SchemaObject]) -> str:
    return "\n\n".join(obj.create_sql() for obj in objects)


def missing_dependencies(objects: Sequence[SchemaObject]) -> list[tuple[str, str]]:
    """Pairs (object, dependency) where the dependency is not created earlier in the sequence."""
    created: set[str] = set()
    missing: list[tuple[str, str]] = []
    for obj in objects:
        missing.extend((obj.name, dep) for dep in getattr(obj, "depends_on", ()) if dep not in created)
        created.add(obj.name)
    return missing
