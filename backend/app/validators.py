import re

PHONE_REGEX = re.compile(r"^\d{10}$")


def validate_phone_optional(v):
    """Validates an optional phone number: if one is provided, it must be
    exactly 10 digits (standard Indian mobile format). Empty/None values
    pass through unchanged - phone stays optional everywhere this is used,
    this only closes the gap where a phone number could be submitted with
    the wrong number of digits, letters, or symbols.
    """
    if v is None or v == "":
        return v
    if not PHONE_REGEX.match(v):
        raise ValueError("phone number must be exactly 10 digits")
    return v
