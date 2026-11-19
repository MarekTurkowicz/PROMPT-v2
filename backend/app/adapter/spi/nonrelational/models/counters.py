from app.adapter.spi.nonrelational.models._schema import LONG, STRING, CollectionSpec, obj

COUNTERS = CollectionSpec(
    name="counters",
    schema=obj({"_id": STRING, "seq": LONG}),
)
