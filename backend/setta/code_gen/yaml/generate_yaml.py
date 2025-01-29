import yaml


def generate_yaml(e):
    transformed_dict = {}
    for key, value in e.items():
        if "value" in value and isinstance(value["value"], dict):
            # Handle nested structure for keys like 'dataset' and 'algorithm'
            callable_value = value["value"]["callable"]
            params = value["value"].get("params", [])
            param_dict = {}
            for param in params:
                param_value = e[param]["value"]
                # Resolve references to other keys (like 'n_samples' for 'p0')
                if param_value in e:
                    param_value = e[param_value]["value"]
                param_dict[e[param]["name"]] = param_value
            transformed_dict[key] = {callable_value: param_dict}
        elif not value["is_global"]:
            # Directly use top-level keys and values
            transformed_dict[key] = value["value"]

    return yaml.safe_dump(transformed_dict)
