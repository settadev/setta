import ast
import re


def make_parseable(code: str, var_name: str) -> str:
    """
    Make minimal modifications to a potentially incomplete Python variable declaration
    to make it parseable by ast.parse.

    Args:
        code (str): The potentially incomplete Python code

    Returns:
        str: Modified code that can be parsed by ast.parse
    """
    # No need to extract var_name as it's passed in
    if is_parseable(code):
        return code

    code = code.strip()

    # Strategy 1: Try removing the last character if it's a bracket or operator
    if code[-1] in "([{=+-*/,":
        modified = code[:-1]
        if is_parseable(modified):
            return modified

    # Strategy 2: Try balancing parentheses/brackets/braces
    opening = "([{"
    closing = ")]}"
    brackets_map = dict(zip(opening, closing))
    stack = []

    for char in code:
        if char in opening:
            stack.append(char)
        elif char in closing:
            if not stack or brackets_map[stack[-1]] != char:
                # Mismatched bracket - remove this character
                modified = code.replace(char, "", 1)
                if is_parseable(modified):
                    return modified
            else:
                stack.pop()

    # Add missing closing brackets
    while stack:
        code += brackets_map[stack.pop()]
        if is_parseable(code):
            return code

    # Strategy 3: Handle incomplete string literals
    if re.search(r'[\'"]', code):
        # Remove incomplete string if quote is the last character
        if code[-1] in "\"'":
            modified = code[:-1]
            if is_parseable(modified):
                return modified
        # Try to close the string
        for quote in ['"', "'"]:
            modified = code + quote
            if is_parseable(modified):
                return modified

    # Strategy 4: Remove trailing operators
    operators = ["+", "-", "*", "/", "=", "&", "|", "^", "%"]
    for op in operators:
        if code.rstrip().endswith(op):
            modified = code.rstrip()[:-1]
            if is_parseable(modified):
                return modified

    # If nothing else works, try removing characters from the end until it parses
    while len(code) > 0:
        if is_parseable(code):
            return code
        code = code[:-1]

    # this means it failed
    return None


def is_parseable(code: str) -> bool:
    """
    Check if the given code can be parsed by ast.parse

    Args:
        code (str): Python code to check

    Returns:
        bool: True if code can be parsed, False otherwise
    """
    try:
        ast.parse(code)
        return True
    except SyntaxError:
        return False
