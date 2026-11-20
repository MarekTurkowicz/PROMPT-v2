from app.shared.adapter.outbound.object_relational_db.objects import Domain
from app.shared.core.domain.constraints.position import Position

POSITION = Domain.from_value_object("position_d", "smallint", Position)
