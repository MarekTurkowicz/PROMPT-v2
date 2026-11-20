from enum import StrEnum


class ExpenseType(StrEnum):
    TRAVEL = "travel"
    COURSES = "courses"
    EXTERNAL_SERVICES = "external_services"
    EQUIPMENT = "equipment"
    OTHER = "other"
