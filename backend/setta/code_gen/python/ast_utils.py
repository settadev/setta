import ast
import builtins
from typing import Set


def not_in_root_imports(import_path, root_imports):
    return not any(
        import_path.startswith(root + ".") or import_path == root
        for root in root_imports
    )


def is_instance_attribute(node: ast.AST) -> bool:
    """
    Determines if an attribute access chain involves an instance parameter (self/cls/etc).
    Checks if any part of the attribute chain starts with the first parameter of a method.
    """
    if not isinstance(node, ast.Attribute):
        return False

    # Walk up the AST to find the enclosing function
    current = node
    while current and not isinstance(current, ast.FunctionDef):
        current = getattr(current, "parent", None)

    if not current:  # Not in a function
        return False

    # Check if the function is a method (has at least one argument)
    if not current.args.args:
        return False

    # Get the instance parameter name (traditionally 'self' but could be anything)
    instance_param = current.args.args[0].arg

    # Build the complete attribute chain
    base = node
    while isinstance(base, ast.Attribute):
        base = base.value

    # Check if the chain starts with the instance parameter
    return isinstance(base, ast.Name) and base.id == instance_param


def find_missing_imports(code: str) -> Set[str]:
    """
    Analyzes Python code and returns a set of missing imports.
    If a module is explicitly imported (directly or with alias), its submodules are not considered missing.

    Args:
        code (str): String containing Python code to analyze

    Returns:
        Set[str]: Set of import statements that are missing

    Example:
        >>> code = "import torch; x = torch.nn.CrossEntropyLoss()"
        >>> find_missing_imports(code)
        set()  # torch.nn is not considered missing since torch is imported
    """
    # Get set of built-in names
    builtin_names = set(dir(builtins))

    # Track existing imports, defined names, and missing imports
    existing_imports = set()
    root_imports = set()  # Track the root modules that are explicitly imported
    defined_names = set()
    missing_imports = set()

    # Parse the code into an AST
    try:
        tree = ast.parse(code)
    except SyntaxError as e:
        raise ValueError(f"Invalid Python code: {str(e)}")

    # Add parent references to make context checking easier
    for parent in ast.walk(tree):
        for child in ast.iter_child_nodes(parent):
            child.parent = parent

    # First pass: collect existing imports and defined names
    for node in ast.walk(tree):
        if isinstance(node, ast.Import):
            for name in node.names:
                if name.asname:  # Alias
                    existing_imports.add(name.asname)
                    root_imports.add(name.asname)  # Add alias as root
                else:
                    existing_imports.add(name.name)  # Original name
                    root_imports.add(name.name.split(".")[0])  # Add root module
        elif isinstance(node, ast.ImportFrom):
            if node.module:
                for name in node.names:
                    if name.asname:  # Alias
                        existing_imports.add(name.asname)
                        root_imports.add(name.asname)
                    else:
                        existing_imports.add(name.name)
                        root_imports.add(name.name.split(".")[0])  # Add root module
        elif isinstance(node, ast.FunctionDef):
            defined_names.add(node.name)
        elif isinstance(node, ast.ClassDef):
            defined_names.add(node.name)
        elif isinstance(node, ast.Name) and isinstance(node.ctx, ast.Store):
            defined_names.add(node.id)
        elif isinstance(node, ast.arg):
            defined_names.add(node.arg)

    # Second pass: find potential missing imports
    for node in ast.walk(tree):
        if isinstance(node, ast.Name):
            # Skip if it's a built-in, already imported, or locally defined
            if (
                node.id not in builtin_names
                and node.id not in existing_imports
                and node.id not in defined_names
                and isinstance(node.ctx, ast.Load)
                and not_in_root_imports(node.id, root_imports)
            ):
                missing_imports.add(node.id)
        elif isinstance(node, ast.Attribute):
            # Build the full attribute chain
            attr_chain = []
            current = node
            while isinstance(current, ast.Attribute):
                attr_chain.append(current.attr)
                current = current.value

            if isinstance(current, ast.Name):
                attr_chain.append(current.id)

                # Skip instance attributes (where chain starts with self/cls)
                if is_instance_attribute(node):
                    continue

                # Skip if the root is a local name
                if attr_chain[-1] in defined_names:
                    continue

                # Reverse to get correct order
                attr_chain.reverse()

                # Generate all possible import paths
                for i in range(1, len(attr_chain)):
                    import_path = ".".join(attr_chain[:i])
                    if (
                        import_path not in existing_imports
                        and import_path not in builtin_names
                        and import_path not in defined_names
                        and not_in_root_imports(import_path, root_imports)
                    ):
                        missing_imports.add(import_path)

    return missing_imports


def find_top_level_symbols(source: str) -> Set[str]:
    """Find all top-level symbol names that could cause naming conflicts."""
    root = ast.parse(source)
    symbols = set()

    # Only look at top-level nodes
    for node in root.body:
        # Get top-level assignments
        if isinstance(node, ast.Assign):
            for target in node.targets:
                if isinstance(target, ast.Name):
                    symbols.add(target.id)

        # Get function and class names
        elif isinstance(node, (ast.FunctionDef, ast.AsyncFunctionDef, ast.ClassDef)):
            symbols.add(node.name)

        # Get import aliases and imported names
        elif isinstance(node, ast.Import):
            for alias in node.names:
                symbols.add(alias.asname if alias.asname else alias.name.split(".")[0])

        elif isinstance(node, ast.ImportFrom):
            for alias in node.names:
                symbols.add(alias.asname if alias.asname else alias.name)

    return symbols
