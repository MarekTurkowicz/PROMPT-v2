from app.adapter.spi.nonrelational.models._schema import CollectionSpec
from app.adapter.spi.nonrelational.models.activity_logs import ACTIVITY_LOGS
from app.adapter.spi.nonrelational.models.comments import COMMENTS
from app.adapter.spi.nonrelational.models.counters import COUNTERS
from app.adapter.spi.nonrelational.models.expenses import EXPENSES
from app.adapter.spi.nonrelational.models.fundings import FUNDINGS
from app.adapter.spi.nonrelational.models.groups import GROUPS
from app.adapter.spi.nonrelational.models.members import MEMBERS
from app.adapter.spi.nonrelational.models.notifications import NOTIFICATIONS
from app.adapter.spi.nonrelational.models.organizations import ORGANIZATIONS
from app.adapter.spi.nonrelational.models.projects import PROJECTS
from app.adapter.spi.nonrelational.models.tasks import TASKS
from app.adapter.spi.nonrelational.models.time_entries import TIME_ENTRIES

COLLECTIONS: tuple[CollectionSpec, ...] = (
    ORGANIZATIONS,
    GROUPS,
    MEMBERS,
    PROJECTS,
    FUNDINGS,
    TASKS,
    TIME_ENTRIES,
    COMMENTS,
    EXPENSES,
    ACTIVITY_LOGS,
    NOTIFICATIONS,
    COUNTERS,
)
