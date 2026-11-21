from rest_framework import authentication
from rest_framework.request import Request


class SessionAuthentication(authentication.SessionAuthentication):
    # Without a WWW-Authenticate header DRF answers NotAuthenticated with 403 instead of 401.
    def authenticate_header(self, request: Request) -> str:
        return "Session"
