from setta.utils.constants import C


def tp(x):
    return f"{C.TEMPLATE_PREFIX}{x}"


def remove_tp(x):
    return x.lstrip(C.TEMPLATE_PREFIX)


def parse_template_var(template_str: str) -> tuple[str, str | None]:
    suffixes = {
        f"{tp(C.TEMPLATE_VAR_IMPORT_PATH_SUFFIX)}": C.TEMPLATE_VAR_IMPORT_PATH_SUFFIX,
        f"{tp(C.TEMPLATE_VAR_VERSION_SUFFIX)}": C.TEMPLATE_VAR_VERSION_SUFFIX,
    }

    for suffix, type_name in suffixes.items():
        if template_str.endswith(suffix):
            base_str = remove_tp(template_str[: -len(suffix)])
            return base_str, type_name

    return template_str, None
