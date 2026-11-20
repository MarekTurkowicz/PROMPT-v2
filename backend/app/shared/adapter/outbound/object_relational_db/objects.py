from collections.abc import Sequence
from dataclasses import dataclass
from enum import StrEnum


def quote_literal(value: str) -> str:
    """CREATE TYPE ... AS ENUM takes no query parameters, so the values are quoted here."""
    return "'" + value.replace("'", "''") + "'"


@dataclass(frozen=True, slots=True)
class EnumType:
    name: str
    values: tuple[str, ...]

    @classmethod
    def from_enum(cls, name: str, enum: type[StrEnum]) -> EnumType:
        return cls(name=name, values=tuple(member.value for member in enum))

    def create_sql(self) -> str:
        values = ", ".join(quote_literal(value) for value in self.values)
        return f"CREATE TYPE {self.name} AS ENUM ({values});"


def value_rule(value_object: type, expr: str = "VALUE", numeric: bool = False) -> str:
    """The value object's rule as SQL; numeric adds the NaN check, since 'NaN' > 0 is true in PostgreSQL."""
    rules = []
    if (minimum := getattr(value_object, "MIN", None)) is not None:
        rules.append(f"{expr} >= {minimum}")
    if (maximum := getattr(value_object, "MAX", None)) is not None:
        rules.append(f"{expr} <= {maximum}")
    if (greater_than := getattr(value_object, "GREATER_THAN", None)) is not None:
        rules.append(f"{expr} > {greater_than}")
    if numeric:
        rules.append(f"{expr} <> 'NaN'")
    if (min_length := getattr(value_object, "MIN_LENGTH", None)) is not None:
        rules.append(f"length({expr}) >= {min_length}")
    if (pattern := getattr(value_object, "PATTERN", None)) is not None:
        rules.append(f"{expr} ~ {quote_literal(f'^{pattern}$')}")
    if getattr(value_object, "LOWERCASE", False):
        rules.append(f"{expr} = lower({expr})")
    if not rules:
        raise ValueError(f"{value_object.__name__} has no rule for the database")
    return " AND ".join(rules)


@dataclass(frozen=True, slots=True)
class Domain:
    """Fields of a composite type cannot be NOT NULL or have a CHECK, and a NULL field skips its own
    domain's CHECK, so a domain wraps each composite type and repeats the field rules."""

    name: str
    base: str
    check: str
    depends_on: tuple[str, ...] = ()

    @classmethod
    def from_value_object(cls, name: str, base: str, value_object: type) -> Domain:
        return cls(name=name, base=base, check=value_rule(value_object, numeric=base.startswith("numeric")))

    def create_sql(self) -> str:
        return f"CREATE DOMAIN {self.name} AS {self.base} CHECK ({self.check});"


@dataclass(frozen=True, slots=True)
class Statement:
    """Any other object: composite type, function, trigger, partial unique index."""

    name: str
    sql: str
    depends_on: tuple[str, ...] = ()

    def create_sql(self) -> str:
        return self.sql.strip().rstrip(";") + ";"


@dataclass(frozen=True, slots=True)
class Table(Statement):
    pass


SchemaObject = EnumType | Domain | Statement


def missing_dependencies(objects: Sequence[SchemaObject]) -> list[tuple[str, str]]:
    created: set[str] = set()
    missing: list[tuple[str, str]] = []
    for obj in objects:
        missing.extend((obj.name, dep) for dep in getattr(obj, "depends_on", ()) if dep not in created)
        created.add(obj.name)
    return missing
