from setta.utils.constants import C


def tp(x):
    return f"{C.TEMPLATE_PREFIX}{x}"


def remove_tp(x):
    return x.lstrip(C.TEMPLATE_PREFIX)


def needs_yaml(script):
    return tp("SETTA_YAML_FILE") in script
