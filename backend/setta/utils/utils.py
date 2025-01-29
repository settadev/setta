import json
import os
import re
from json import JSONDecodeError
from pathlib import Path


def get_absolute_path(src_path, file_path):
    return (Path(src_path).parent / file_path).resolve()


def is_dev_mode():
    return os.environ.get("SETTA_DEV_MODE")


# https://gist.github.com/bgusach/a967e0587d6e01e889fd1d776c5f3729
def multireplace(string, replacements):
    """
    Given a string and a replacement map, it returns the replaced string.

    :param str string: string to execute replacements on
    :param dict replacements: replacement dictionary {value to find: value to replace}
    :rtype: str

    """
    if not replacements:
        # Edge case that'd produce a funny regex and cause a KeyError
        return string

    # Place longer ones first to keep shorter substrings from matching where the longer ones should take place
    # For instance given the replacements {'ab': 'AB', 'abc': 'ABC'} against the string 'hey abc', it should produce
    # 'hey ABC' and not 'hey ABc'
    rep_sorted = sorted(replacements, key=len, reverse=True)
    rep_escaped = map(re.escape, rep_sorted)

    # Create a big OR regex that matches any of the substrings to replace
    pattern = re.compile("|".join(rep_escaped))

    # For each match, look up the new string in the replacements, being the key the normalized old string
    return pattern.sub(lambda match: replacements[match.group(0)], string)


class QuoteInsensitiveDict(dict):
    def __getitem__(self, key):
        return super().__getitem__(self.normalize_key(key))

    def __setitem__(self, key, value):
        super().__setitem__(self.normalize_key(key), value)

    def __contains__(self, key):
        return super().__contains__(self.normalize_key(key))

    def normalize_key(self, key):
        # Remove outer quotes if present
        key = key.strip("'\"")
        # Replace all quote characters with a standard one
        key = re.sub(r"['\"]", '"', key)
        return key


def nested_access(input_dict, access_string):
    # Split by array/dict access while preserving quotes
    keys = re.findall(r"\[([^\]]+)\]|([^[]+)", access_string)
    # Flatten tuples and handle quotes
    keys = [k[0] if k[0] else k[1] for k in keys]
    # Remove quotes from string keys and convert numeric keys to integers
    keys = [int(k) if k.isdigit() else k.strip("\"'") for k in keys]

    # Start with the input dictionary
    result = input_dict

    # Traverse the nested structure
    for idx, key in enumerate(keys):
        if idx == len(keys) - 1:
            break
        result = result[key]

    return result, key


def recursive_dict_merge(dict1, dict2, strict_top_level_keys=False):
    """
    Recursively merge two dictionaries. For conflicting keys:
    - If both values are dictionaries: merge recursively
    - If both values are lists: concatenate them
    - Otherwise: value from dict2 takes precedence

    Args:
        dict1 (dict): First dictionary
        dict2 (dict): Second dictionary
        strict_top_level_keys (bool): If True, only keep top-level keys from dict1

    Returns:
        dict: Merged dictionary

    Examples:
        >>> d1 = {'a': 1, 'b': {'c': 2, 'd': [1, 2]}}
        >>> d2 = {'b': {'c': 4, 'd': [3, 4]}, 'f': 6}
        >>> recursive_dict_merge(d1, d2)
        {'a': 1, 'b': {'c': 4, 'd': [1, 2, 3, 4]}, 'f': 6}
        >>> recursive_dict_merge(d1, d2, strict_top_level_keys=True)
        {'a': 1, 'b': {'c': 4, 'd': [1, 2, 3, 4]}}
    """
    if strict_top_level_keys:
        # Only process keys that exist in dict1
        dict2 = {k: v for k, v in dict2.items() if k in dict1}

    merged = dict1.copy()

    for key, value in dict2.items():
        if key in merged:
            if isinstance(merged[key], dict) and isinstance(value, dict):
                # If both values are dictionaries, merge them recursively
                merged[key] = recursive_dict_merge(merged[key], value)
            elif isinstance(merged[key], list) and isinstance(value, list):
                # If both values are lists, concatenate them
                merged[key] = merged[key] + value
            else:
                # Otherwise, value from dict2 takes precedence
                merged[key] = value
        else:
            merged[key] = value

    return merged


def try_json(x):
    try:
        return json.loads(x)
    except (JSONDecodeError, TypeError):
        return x


def replace_null_keys_with_none(data):
    """
    Recursively replaces "null" keys with None in a dictionary.

    Args:
        data: Input dictionary

    Returns:
        Modified dictionary with "null" keys replaced by None
    """
    if isinstance(data, dict):
        new_dict = {}
        for key, value in data.items():
            # Replace "null" key with None
            new_key = None if key == "null" else key

            # Recursively process value if it's a dictionary
            if isinstance(value, dict):
                value = replace_null_keys_with_none(value)
            elif isinstance(value, list):
                # Process dictionaries within lists
                value = [
                    replace_null_keys_with_none(item)
                    if isinstance(item, dict)
                    else item
                    for item in value
                ]

            new_dict[new_key] = value
        return new_dict
    return data


def filter_dict(x, keep_keys=None, default_vals=None):
    if not isinstance(x, dict):
        return x

    return {
        k: filter_dict(v, None, default_vals.get(k) if default_vals else None)
        for k, v in x.items()
        if (keep_keys is None or k in keep_keys)
        and (
            (default_vals is None) or (k not in default_vals) or (v != default_vals[k])
        )
    }


def replace_at_positions(input_string, replacements, return_positions=False):
    """
    Replace substrings at specific positions in the input string.

    Args:
        input_string (str): The original string to modify
        replacements (list): List of tuples (position, old_value, new_value)
        return_positions (bool): Whether to return new positions of replacements

    Returns:
        Union[str, Tuple[str, List[Tuple[int, str]]]]:
            If return_positions is False: Modified string with all replacements applied
            If return_positions is True: Tuple of (modified string, list of (old_position, position, new_value))

    Raises:
        ValueError: If any replacement would result in an invalid operation
    """
    # Sort replacements by position in descending order to avoid position shifts
    replacements = sorted(replacements, reverse=True, key=lambda x: x[0])

    # Convert string to list for easier manipulation
    result = list(input_string)

    # Track new positions if requested
    new_positions = []

    for pos, old, new in replacements:
        # Verify the position is valid
        if pos < 0 or pos >= len(input_string):
            raise ValueError(f"Position {pos} is out of bounds")

        # Verify the old value matches at the specified position
        if not input_string.startswith(old, pos):
            raise ValueError(
                f"Expected '{old}' at position {pos}, but found '{input_string[pos:pos+len(old)]}'"
            )

        # Calculate the shift this replacement will cause
        current_shift = len(new) - len(old)

        # Replace the characters
        result[pos : pos + len(old)] = list(new)

        # If tracking new positions, add the current replacement's new position
        if return_positions:
            new_positions.append((pos, pos, new))
            # Update all previous entries' positions to account for this shift
            for i in range(len(new_positions) - 1):
                old_pos_i, pos_i, val_i = new_positions[i]
                new_positions[i] = (old_pos_i, pos_i + current_shift, val_i)

    # Join the result list back into a string
    final_string = "".join(result)

    # Return based on whether return_positions is requested
    if return_positions:
        return final_string, new_positions
    return final_string


def save_json_to_file(path, data):
    with open(path, "w") as f:
        json.dump(data, f, indent=2)


def prune_dict(id_to_children: dict, keep_ids: list) -> dict:
    """
    Prunes a dictionary to keep only specified IDs and their descendants.

    Args:
        id_to_children: Dictionary mapping IDs to lists of child IDs
        keep_ids: List of IDs to keep along with their descendants

    Returns:
        New dictionary containing only the specified IDs and their descendants
    """
    # First find all descendants of the keep_ids
    to_keep = set()

    def collect_descendants(current_id):
        if current_id not in to_keep:  # Avoid cycles
            to_keep.add(current_id)
            for child_id in id_to_children.get(current_id, []):
                collect_descendants(child_id)

    # Collect all descendants
    for id in keep_ids:
        collect_descendants(id)

    # Create new dict with only the ids we want to keep
    return {id: children for id, children in id_to_children.items() if id in to_keep}
