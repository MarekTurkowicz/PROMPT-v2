from app.shared.core.domain.error_kind import ErrorKind
from rest_framework import status

ERROR_KIND_TO_HTTP_STATUS_MAP = {
    ErrorKind.INVALID: status.HTTP_400_BAD_REQUEST,
    ErrorKind.NOT_AUTHORIZED: status.HTTP_401_UNAUTHORIZED,
    ErrorKind.FORBIDDEN: status.HTTP_403_FORBIDDEN,
    ErrorKind.NOT_FOUND: status.HTTP_404_NOT_FOUND,
    ErrorKind.CONFLICT: status.HTTP_409_CONFLICT,
}
