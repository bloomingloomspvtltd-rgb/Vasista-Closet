from bson import ObjectId


def to_object_id(value: str) -> ObjectId:
    try:
        return ObjectId(value)
    except Exception as exc:
        raise ValueError("Invalid id") from exc


def serialize_doc(doc: dict) -> dict:
    if not doc:
        return doc
    serialized = dict(doc)
    if "_id" in serialized:
        serialized["id"] = str(serialized.pop("_id"))
    return serialized
