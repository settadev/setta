import ast
from dataclasses import dataclass
from typing import List, Set

from setta.code_gen.python.position_line_col import position_to_line_col


@dataclass
class ScopeRange:
    start_line: int
    start_col: int
    end_line: int
    end_col: int
    variable_names: Set[str]


class ScopeVisitor(ast.NodeVisitor):
    def __init__(self):
        self.scopes: List[ScopeRange] = []
        self._current_scope_vars: Set[str] = set()

    def visit_Name(self, node: ast.Name):
        if isinstance(node.ctx, ast.Store):
            self._current_scope_vars.add(node.id)
        self.generic_visit(node)

    def _visit_scope_node(self, node: ast.AST):
        # Save previous scope variables
        prev_vars = self._current_scope_vars.copy()
        self._current_scope_vars = set()

        # Visit the node's children
        self.generic_visit(node)

        # Create scope range
        scope = ScopeRange(
            start_line=node.lineno,
            start_col=node.col_offset,
            end_line=node.end_lineno,
            end_col=node.end_col_offset,
            variable_names=self._current_scope_vars,
        )
        self.scopes.append(scope)

        # Restore previous scope variables
        self._current_scope_vars = prev_vars

    def visit_FunctionDef(self, node: ast.FunctionDef):
        self._visit_scope_node(node)

    def visit_ClassDef(self, node: ast.ClassDef):
        # Save previous scope variables
        prev_vars = self._current_scope_vars.copy()
        self._current_scope_vars = set()

        # Visit the node's children
        self.generic_visit(node)

        # Class variables are accessible in methods, so we need to add them to method scopes
        class_vars = self._current_scope_vars.copy()
        for child in node.body:
            if isinstance(child, ast.FunctionDef):
                scope = next(
                    (s for s in self.scopes if s.start_line == child.lineno), None
                )
                if scope:
                    scope.variable_names.update(class_vars)

        # Create scope range for the class itself
        scope = ScopeRange(
            start_line=node.lineno,
            start_col=node.col_offset,
            end_line=node.end_lineno,
            end_col=node.end_col_offset,
            variable_names=self._current_scope_vars,
        )
        self.scopes.append(scope)

        # Restore previous scope variables
        self._current_scope_vars = prev_vars

    def visit_Module(self, node: ast.Module):
        # Module node is special - it represents the entire file
        self._current_scope_vars = set()

        # Visit all children
        self.generic_visit(node)

        # For Module, use first/last line of content
        first_line = float("inf")
        last_line = 0
        first_col = float("inf")
        last_col = 0

        for child in ast.walk(node):
            if hasattr(child, "lineno"):
                first_line = min(first_line, child.lineno)
                first_col = min(first_col, child.col_offset)
            if hasattr(child, "end_lineno"):
                last_line = max(last_line, child.end_lineno)
                last_col = max(last_col, child.end_col_offset)

        # Handle empty files
        if first_line == float("inf"):
            first_line = 1
            first_col = 0
            last_line = 1
            last_col = 0

        scope = ScopeRange(
            start_line=first_line,
            start_col=first_col,
            end_line=last_line,
            end_col=last_col,
            variable_names=self._current_scope_vars,
        )
        self.scopes.append(scope)


def are_positions_in_scope_with_variable(
    code: str, positions: list[tuple[int, int]], variable_name: str
) -> list[bool]:
    """
    Check if multiple positions in the code are in the same scope as a specific variable.

    This function analyzes Python code to determine whether each given position (line, column)
    falls within a scope where a specified variable is defined. A scope can be a module,
    function, or class definition.

    Args:
        code (str): The Python source code to analyze
        positions (list[tuple[int, int]]): List of (line, column) tuples representing
            positions to check. Line and column numbers are 1-based.
        variable_name (str): Name of the variable to check for in the scope

    Returns:
        list[bool]: List of boolean values corresponding to each position in the input,
            where True indicates the position is in a scope where the variable is defined,
            and False indicates it is not.

    Raises:
        SyntaxError: If the provided code contains syntax errors (handled internally
            by returning all False values)

    Example:
        >>> code = '''
        def func():
            x = 1
            return x
        '''
        >>> positions = [(2, 0), (3, 4), (4, 0)]
        >>> are_positions_in_scope_with_variable(code, positions, 'x')
        [True, True, False]
    """
    try:
        tree = ast.parse(code)
    except SyntaxError:
        return [False] * len(positions)  # Return correct number of Falses

    visitor = ScopeVisitor()
    visitor.visit(tree)

    output = []

    line_col_positions = []
    for x in positions:
        line, col = position_to_line_col(code, x)
        line_col_positions.append((line + 1, col))

    for line, col in line_col_positions:
        in_scope = False
        # Check each scope
        for scope in visitor.scopes:
            # Check if position is within this scope
            if (
                scope.start_line <= line <= scope.end_line
                and (scope.start_line != line or scope.start_col <= col)
                and (scope.end_line != line or col <= scope.end_col)
            ):
                # Check if variable is defined in this scope
                if variable_name in scope.variable_names:
                    in_scope = True
                    break

        output.append(in_scope)

    return output
