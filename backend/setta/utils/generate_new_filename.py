import glob
import os
import random
import re
import string

from setta.utils.generate_memorable_string import generate_memorable_string


def generate_new_filename(input_pattern: str) -> str:
    """
    Generate a new filename based on the input pattern, adding a random memorable suffix.
    Supports complex glob patterns including nested directories and multiple wildcards.
    Replaces pattern characters with random valid values:
    - [0-9] is replaced with a random digit
    - [a-z] is replaced with a random lowercase letter
    - ? is replaced with a random letter

    Args:
        input_pattern: Input filename or glob pattern (e.g., "file.json", "*file*.json",
                      "dir/*/*.json", "report_??_*.json", "data[0-9].json")

    Returns:
        New filepath (as string) with a unique memorable suffix. For glob patterns with no matches,
        generates a sensible filename following the pattern's structure.
    """
    # Split into directory and filename parts
    directory = os.path.dirname(input_pattern)
    filename = os.path.basename(input_pattern)

    # If there are matching files, use the first match as template without any cleaning
    matching_files = glob.glob(input_pattern)
    if matching_files:
        template_name = sorted(matching_files, key=len)[0]
        directory = os.path.dirname(template_name)
        filename = os.path.basename(template_name)
        base_path, extension = os.path.splitext(filename)
    else:
        # Only clean the pattern if no existing files match
        base_path, extension = os.path.splitext(filename)

        # Clean the base path of glob patterns
        cleaned_base = base_path

        # Helper function to replace each match with a random choice
        def random_replacement(pattern, choices):
            def replace_func(match):
                return random.choice(choices)

            return re.sub(pattern, replace_func, cleaned_base)

        # Replace [0-9] with random digit
        cleaned_base = random_replacement(r"\[\d+\-\d+\]", string.digits)

        # Replace [a-z] with random lowercase letter
        cleaned_base = random_replacement(r"\[a-z\]", string.ascii_lowercase)

        # Replace ? with random letter (upper or lowercase)
        cleaned_base = random_replacement(r"\?", string.ascii_letters)

        # Remove * wildcards entirely since they represent variable length matches
        cleaned_base = re.sub(r"\*+", "", cleaned_base)

        # If we've cleaned away everything, use a default name
        if not cleaned_base or cleaned_base.isspace():
            cleaned_base = "file"

        base_path = cleaned_base

    # Keep trying new suffixes until we find a filename that doesn't exist
    while True:
        suffix = generate_memorable_string()
        new_filename = f"{base_path}_{suffix}{extension}"

        # Reconstruct full path if there was a directory
        if directory:
            new_filename = os.path.join(directory, new_filename)

        if not os.path.exists(new_filename):
            return new_filename
