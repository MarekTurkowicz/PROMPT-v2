from app.domain.exceptions import DuplicateError, ValidationError, check_error_codes


def test_to_dict_exposes_detail_extra_and_err_code() -> None:
    error = ValidationError("name must not be empty.", extra={"field": "name"})

    assert error.to_dict() == {
        "detail": "name must not be empty.",
        "extra": {"field": "name"},
        "err_code": "ERR_0002",
    }


def test_subclass_has_default_detail_and_own_err_code() -> None:
    error = DuplicateError()

    assert error.detail == "value is already taken"
    assert error.err_code == "ERR_0013"
    assert error.extra == {}
    assert isinstance(error, ValidationError)


def test_error_codes_are_unique_and_complete() -> None:
    check_error_codes()
