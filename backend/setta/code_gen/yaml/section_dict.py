import yaml


def section_dict_to_yaml(exporter_objs, codeInfo, sectionVariant):
    pinned = exporter_objs["pinned"].prettyOutput
    unpinned = exporter_objs["unpinned"].prettyOutput
    pinnedStr = raw_dump(pinned)
    unpinnedStr = raw_dump(unpinned)

    yamlValue = ""
    if sectionVariant["selectedItem"]:
        selectedItemName = codeInfo[sectionVariant["selectedItem"]]["name"]
        yamlValue += f"{selectedItemName}\n---\n"

    if len(pinned) > 0:
        yamlValue += f"{pinnedStr}\n---\n"
    elif yamlValue != "":
        yamlValue += "\n---\n"
    if len(unpinned) > 0:
        yamlValue += unpinnedStr

    return yamlValue


def param_sweep_dict_to_yaml(exporter_obj):
    return "\n---\n".join(raw_dump(x) for x in exporter_obj.prettyOutput)


def run_group_dict_to_yaml(exporter_obj):
    if len(exporter_obj.prettyOutput) == 0:
        return "{}"
    return yaml.dump(
        exporter_obj.prettyOutput,
        Dumper=RunGroupDumper,
        explicit_end=False,
        sort_keys=False,
    )


# Register representer for dict that skips empty ones
def represent_dict_skip_empty(dumper, data):
    if not data:  # if dictionary is empty
        return dumper.represent_scalar("tag:yaml.org,2002:null", "")
    return dumper.represent_dict(data)


class RunGroupDumper(yaml.Dumper):
    pass


RunGroupDumper.add_representer(dict, represent_dict_skip_empty)


def raw_dump(input_data, indent=0):
    output = ""

    # Handle list of dictionaries or other lists
    if isinstance(input_data, list):
        for item in input_data:
            output += " " * indent + "-"
            if isinstance(item, (dict, list)):
                output += " " + raw_dump(item, indent + 2)[indent + 2 :]
            else:
                output += " " + str(item) + "\n"
    # Handle single dictionary
    elif isinstance(input_data, dict):
        for k, v in input_data.items():
            # Add indentation
            output += " " * indent

            # If value is a dictionary, recursively process it
            if isinstance(v, dict):
                output += f"{k}:\n"
                output += raw_dump(v, indent + 2)
            else:
                # Check if value is a list
                if isinstance(v, list):
                    output += f"{k}:\n"
                    output += raw_dump(v, indent + 2)
                # Check if value contains newlines
                else:
                    str_value = str(v)
                    if "\n" in str_value:
                        # Use literal block style
                        output += f"{k}: |\n"
                        # Indent each line of the value
                        for line in str_value.splitlines():
                            output += " " * (indent + 2) + line + "\n"
                    else:
                        # Single line value
                        output += f"{k}: {str_value}\n"

    return output
